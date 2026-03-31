using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

QuestPDF.Settings.License = LicenseType.Community;

var repoRoot = ResolveRepoRoot();
var dataPath = Path.Combine(repoRoot, "data", "sample.invoice.json");
var outputPath = args.Length > 0
    ? Path.GetFullPath(args[0])
    : Path.Combine(repoRoot, "output", "questpdf", "invoice.questpdf.pdf");
var jsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true
};

Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);

var json = await File.ReadAllTextAsync(dataPath);
var data = JsonSerializer.Deserialize<InvoiceData>(json, jsonOptions) ?? throw new InvalidOperationException("Unable to parse invoice data.");

var document = new InvoiceDocument(data);
document.GeneratePdf(outputPath);

Console.WriteLine($"QuestPDF output written to {outputPath}");

static string ResolveRepoRoot()
{
    var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

    while (directory is not null)
    {
        if (File.Exists(Path.Combine(directory.FullName, "data", "sample.invoice.json")))
            return directory.FullName;

        directory = directory.Parent;
    }

    throw new DirectoryNotFoundException("Could not locate repository root.");
}

sealed class InvoiceDocument(InvoiceData data) : IDocument
{
    private static class Palette
    {
        public const string Accent = "#1E3FAF";
        public const string TextDark = "#1F2937";
        public const string TextMuted = "#6B7280";
        public const string Border = "#D9DEE7";
        public const string BorderSoft = "#EEF2F7";
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(28, Unit.Millimetre);
            page.DefaultTextStyle(x => x.FontSize(10.5f).FontColor(Palette.TextDark));
            page.Content().Element(ComposeInvoicePage);
        });

        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(28, Unit.Millimetre);
            page.DefaultTextStyle(x => x.FontSize(10).FontColor(Palette.TextMuted));
            page.Content().PaddingTop(8, Unit.Millimetre).Text(data.Compliance.ExportNote);
        });

        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(28, Unit.Millimetre);
            page.DefaultTextStyle(x => x.FontSize(10).FontColor(Palette.TextMuted));
            page.Content().PaddingTop(20, Unit.Millimetre).AlignCenter().Text(data.Compliance.GeneratedNote);
        });
    }

    private void ComposeInvoicePage(IContainer container)
    {
        container.Column(column =>
        {
            column.Spacing(18);

            column.Item().Row(row =>
            {
                row.RelativeItem().Text(data.Invoice.TypeLabel).FontSize(36).Bold().FontColor(Palette.Accent);

                row.ConstantItem(200).Column(meta =>
                {
                    MetaRow(meta, "Invoice No", data.Invoice.InvoiceNumber);
                    MetaRow(meta, "Date", FormatDate(data.Invoice.IssueDate));
                    MetaRow(meta, "Due Date", data.Invoice.DueDateLabel);
                });
            });

            column.Item().Row(row =>
            {
                row.RelativeItem().Element(PanelContainer).Column(left =>
                {
                    left.Item().Text("FROM").FontColor(Palette.Accent).FontSize(12.5f).Bold();
                    left.Item().PaddingTop(8).Text(data.Seller.Name).FontSize(11.5f).Bold();
                    foreach (var line in data.Seller.AddressLines)
                        left.Item().Text(line);
                    left.Item().Text(data.Seller.Email);
                    left.Item().Text(data.Seller.Phone);
                    left.Item().Text($"PAN: {data.Seller.Pan}");
                });

                row.Spacing(16);

                row.RelativeItem().Element(PanelContainer).Column(right =>
                {
                    right.Item().Text("BILL TO").FontColor(Palette.Accent).FontSize(12.5f).Bold();
                    right.Item().PaddingTop(8).Text(data.Buyer.Company).FontSize(11.5f).Bold();
                    right.Item().Text(data.Buyer.Attention);
                    foreach (var line in data.Buyer.AddressLines)
                        right.Item().Text(line);
                    right.Item().Text(data.Buyer.Email);
                });
            });

            column.Item().Element(ComposeItemsTable);

            column.Item().AlignRight().Width(240).Column(summary =>
            {
                summary.Item().Row(row =>
                {
                    row.RelativeItem().Text("Subtotal").FontColor(Palette.TextMuted).Bold();
                    row.AutoItem().Text(Money(data.Summary.Subtotal)).Bold();
                });

                summary.Item().PaddingTop(8).Background(Palette.Accent).Padding(12).CornerRadius(8).Row(row =>
                {
                    row.RelativeItem().Text("TOTAL").FontSize(13).Bold().FontColor(Colors.White);
                    row.AutoItem().Text(Money(data.Summary.Total)).FontSize(13).Bold().FontColor(Colors.White);
                });

                summary.Item().PaddingTop(10).Text($"Amount in Words: {data.Summary.AmountInWords}").FontColor(Palette.TextMuted);
            });

            column.Item().Element(PanelContainer).Column(bank =>
            {
                bank.Item().AlignCenter().Text("BANK DETAILS FOR PAYMENT").FontColor(Palette.Accent).FontSize(12.5f).Bold();
                bank.Item().PaddingTop(12).Row(row =>
                {
                    row.RelativeItem().Column(left =>
                    {
                        Detail(left, "Account Holder", data.BankDetails.AccountHolder);
                        Detail(left, "Account Number", data.BankDetails.AccountNumber);
                        Detail(left, "Bank Name", data.BankDetails.BankName);
                    });

                    row.Spacing(16);

                    row.RelativeItem().Column(right =>
                    {
                        Detail(right, "IFSC Code", data.BankDetails.IfscCode);
                        Detail(right, "SWIFT Code", data.BankDetails.SwiftCode);
                        Detail(right, "UPI ID", data.BankDetails.UpiId);
                    });
                });
            });

            column.Item().Element(PanelContainer).Column(terms =>
            {
                terms.Item().Text("PAYMENT TERMS").FontColor(Palette.Accent).FontSize(12.5f).Bold();
                terms.Item().PaddingTop(10).Column(list =>
                {
                    foreach (var term in data.PaymentTerms)
                    {
                        list.Item().Text($"• {term}");
                    }
                });
            });

            column.Item().Element(PanelContainer).Column(notes =>
            {
                notes.Item().Text("NOTES").FontColor(Palette.Accent).FontSize(12.5f).Bold();
                notes.Item().PaddingTop(10).Column(list =>
                {
                    foreach (var note in data.Notes)
                    {
                        list.Item().Text($"• {note}");
                    }
                });
            });
        });
    }

    private void ComposeItemsTable(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(4.5f);
                columns.ConstantColumn(42);
                columns.ConstantColumn(90);
                columns.ConstantColumn(98);
            });

            table.Header(header =>
            {
                HeaderCell(header, "DESCRIPTION");
                HeaderCell(header, "QTY", "center");
                HeaderCell(header, "RATE", "right");
                HeaderCell(header, "AMOUNT", "right");
            });

            foreach (var item in data.Items)
            {
                table.Cell().Element(BodyCell).Column(cell =>
                {
                    cell.Item().Text(item.Title).Bold();
                    cell.Item().PaddingTop(4).Text(item.Subtitle).FontSize(9.5f).FontColor(Palette.TextMuted);
                });

                table.Cell().Element(BodyCell).AlignCenter().Text(item.Qty.ToString(CultureInfo.InvariantCulture));
                table.Cell().Element(BodyCell).AlignRight().Text(Money(item.Rate));
                table.Cell().Element(BodyCell).AlignRight().Text(Money(item.Amount));
            }
        });
    }

    private static IContainer PanelContainer(IContainer container)
    {
        return container.Border(1).BorderColor(Palette.Border).CornerRadius(8).Padding(14);
    }

    private static IContainer BodyCell(IContainer container)
    {
        return container.BorderBottom(1).BorderColor(Palette.BorderSoft).PaddingVertical(12).PaddingHorizontal(12);
    }

    private static void HeaderCell(TableCellDescriptor descriptor, string text, string align = "left")
    {
        var container = descriptor.Cell().Background(Palette.Accent).PaddingVertical(10).PaddingHorizontal(12);

        container = align switch
        {
            "center" => container.AlignCenter(),
            "right" => container.AlignRight(),
            _ => container
        };

        container.Text(text).FontSize(8.5f).Bold().FontColor(Colors.White);
    }

    private static void MetaRow(ColumnDescriptor column, string label, string value)
    {
        column.Item().BorderBottom(1).BorderColor(Palette.Border).PaddingBottom(8).PaddingTop(4).Row(row =>
        {
            row.RelativeItem().Text(label).FontSize(8.5f).Bold().FontColor(Palette.TextMuted);
            row.AutoItem().Text(value).Bold();
        });
    }

    private static void Detail(ColumnDescriptor column, string label, string value)
    {
        column.Item().PaddingBottom(10).Column(detail =>
        {
            detail.Item().Text(label).FontSize(8.5f).Bold().FontColor(Palette.TextMuted);
            detail.Item().PaddingTop(4).Text(value).Bold();
        });
    }

    private static string FormatDate(string value)
    {
        return DateOnly.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture)
            .ToString("dd MMM yyyy", CultureInfo.InvariantCulture);
    }

    private string Money(string value)
    {
        return $"{data.Invoice.Currency} {decimal.Parse(value, CultureInfo.InvariantCulture):0.00}";
    }
}

sealed record InvoiceData(
    InvoiceSection Invoice,
    SellerSection Seller,
    BuyerSection Buyer,
    IReadOnlyList<ItemSection> Items,
    SummarySection Summary,
    BankDetailsSection BankDetails,
    IReadOnlyList<string> PaymentTerms,
    IReadOnlyList<string> Notes,
    ComplianceSection Compliance
);

sealed record InvoiceSection(
    string TypeLabel,
    string InvoiceNumber,
    string IssueDate,
    string DueDateLabel,
    string Currency
);

sealed record SellerSection(
    string Name,
    IReadOnlyList<string> AddressLines,
    string Email,
    string Phone,
    string Pan
);

sealed record BuyerSection(
    string Company,
    string Attention,
    IReadOnlyList<string> AddressLines,
    string Email
);

sealed record ItemSection(
    string Title,
    string Subtitle,
    int Qty,
    string Rate,
    string Amount
);

sealed record SummarySection(
    string Subtotal,
    string Total,
    string AmountInWords
);

sealed record BankDetailsSection(
    string AccountHolder,
    string AccountNumber,
    string BankName,
    string IfscCode,
    string SwiftCode,
    string UpiId
);

sealed record ComplianceSection(
    string ExportNote,
    string GeneratedNote
);
