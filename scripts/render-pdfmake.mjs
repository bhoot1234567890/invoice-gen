import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";

import {
  formatDate,
  formatMoney,
  loadInvoiceData,
  outputPath,
  resolvePdfMakeFonts
} from "./lib/invoice-data.mjs";

const require = createRequire(import.meta.url);
const PdfPrinter = require("pdfmake/js/Printer.js").default;

const data = await loadInvoiceData();
const fonts = resolvePdfMakeFonts();
const destination = outputPath("pdfmake", "invoice.pdfmake.pdf");

const palette = {
  accent: "#1E3FAF",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  border: "#D9DEE7",
  borderSoft: "#EEF2F7",
  white: "#FFFFFF"
};

const urlResolver = {
  resolve() {},
  async resolved() {}
};

const printer = new PdfPrinter(
  {
    InvoiceSans: fonts
  },
  null,
  urlResolver
);

const panelLayout = {
  hLineColor: () => palette.border,
  vLineColor: () => palette.border,
  hLineWidth: () => 1,
  vLineWidth: () => 1,
  paddingTop: () => 0,
  paddingBottom: () => 0,
  paddingLeft: () => 0,
  paddingRight: () => 0
};

const itemsLayout = {
  hLineWidth: (index, node) => {
    if (index === 0 || index === 1) {
      return 0;
    }

    return index === node.table.body.length ? 0 : 1;
  },
  vLineWidth: () => 0,
  hLineColor: () => palette.borderSoft,
  paddingLeft: () => 12,
  paddingRight: () => 12,
  paddingTop: (index) => (index === 0 ? 10 : 12),
  paddingBottom: (index) => (index === 0 ? 10 : 12),
  fillColor: (rowIndex) => (rowIndex === 0 ? palette.accent : null)
};

function metaRow(label, value) {
  return {
    columns: [
      {
        text: label,
        style: "metaLabel"
      },
      {
        text: value,
        alignment: "right",
        bold: true
      }
    ],
    margin: [0, 0, 0, 8]
  };
}

function partyBlock(title, lines) {
  return {
    layout: panelLayout,
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              {
                text: title,
                style: "sectionLabel"
              },
              ...lines
            ],
            margin: [16, 14, 16, 14]
          }
        ]
      ]
    }
  };
}

function line(text, style) {
  return {
    text,
    style
  };
}

function detailBlock(label, value) {
  return {
    stack: [
      {
        text: label,
        style: "detailLabel"
      },
      {
        text: value,
        bold: true,
        margin: [0, 4, 0, 0]
      }
    ],
    margin: [0, 0, 0, 12]
  };
}

function panel(title, bodyContent, options = {}) {
  return {
    margin: [0, 18, 0, 0],
    layout: panelLayout,
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              {
                text: title,
                style: "sectionLabel",
                alignment: options.centerTitle ? "center" : "left"
              },
              {
                margin: [0, 10, 0, 0],
                stack: Array.isArray(bodyContent) ? bodyContent : [bodyContent]
              }
            ],
            margin: [16, 14, 16, 14]
          }
        ]
      ]
    }
  };
}

const docDefinition = {
  pageSize: "A4",
  pageMargins: [56, 64, 56, 64],
  defaultStyle: {
    font: "InvoiceSans",
    fontSize: 10.5,
    color: palette.textDark
  },
  content: [
    {
      columns: [
        {
          width: "*",
          text: data.invoice.typeLabel,
          style: "title"
        },
        {
          width: 210,
          stack: [
            metaRow("Invoice No", data.invoice.invoiceNumber),
            metaRow("Date", formatDate(data.invoice.issueDate)),
            metaRow("Due Date", data.invoice.dueDateLabel)
          ]
        }
      ],
      columnGap: 24
    },
    {
      margin: [0, 24, 0, 0],
      columns: [
        partyBlock("FROM", [
          line(data.seller.name, "partyName"),
          ...data.seller.addressLines.map((value) => line(value, "partyLine")),
          line(data.seller.email, "partyLine"),
          line(data.seller.phone, "partyLine"),
          line(`PAN: ${data.seller.pan}`, "partyLine")
        ]),
        partyBlock("BILL TO", [
          line(data.buyer.company, "partyName"),
          line(data.buyer.attention, "partyLine"),
          ...data.buyer.addressLines.map((value) => line(value, "partyLine")),
          line(data.buyer.email, "partyLine")
        ])
      ],
      columnGap: 16
    },
    {
      margin: [0, 24, 0, 0],
      layout: itemsLayout,
      table: {
        headerRows: 1,
        widths: ["*", 40, 96, 96],
        body: [
          [
            { text: "DESCRIPTION", style: "tableHeader" },
            { text: "QTY", style: "tableHeader", alignment: "center" },
            { text: "RATE", style: "tableHeader", alignment: "right" },
            { text: "AMOUNT", style: "tableHeader", alignment: "right" }
          ],
          ...data.items.map((item) => [
            {
              stack: [
                {
                  text: item.title,
                  bold: true
                },
                {
                  text: item.subtitle,
                  color: palette.textMuted,
                  fontSize: 9.5,
                  margin: [0, 4, 0, 0]
                }
              ]
            },
            {
              text: String(item.qty),
              alignment: "center"
            },
            {
              text: formatMoney(item.rate, data.invoice.currency),
              alignment: "right"
            },
            {
              text: formatMoney(item.amount, data.invoice.currency),
              alignment: "right"
            }
          ])
        ]
      }
    },
    {
      margin: [0, 18, 0, 0],
      columns: [
        { width: "*", text: "" },
        {
          width: 240,
          stack: [
            {
              columns: [
                {
                  text: "Subtotal",
                  color: palette.textMuted,
                  bold: true
                },
                {
                  text: formatMoney(data.summary.subtotal, data.invoice.currency),
                  alignment: "right",
                  bold: true
                }
              ]
            },
            {
              margin: [0, 8, 0, 0],
              table: {
                widths: ["*", "auto"],
                body: [
                  [
                    {
                      text: "TOTAL",
                      color: palette.white,
                      bold: true,
                      fontSize: 13,
                      margin: [12, 10, 12, 10],
                      fillColor: palette.accent
                    },
                    {
                      text: formatMoney(data.summary.total, data.invoice.currency),
                      color: palette.white,
                      bold: true,
                      fontSize: 13,
                      alignment: "right",
                      margin: [12, 10, 12, 10],
                      fillColor: palette.accent
                    }
                  ]
                ]
              },
              layout: {
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                paddingLeft: () => 0,
                paddingRight: () => 0,
                paddingTop: () => 0,
                paddingBottom: () => 0
              }
            },
            {
              margin: [0, 10, 0, 0],
              text: `Amount in Words: ${data.summary.amountInWords}`,
              color: palette.textMuted
            }
          ]
        }
      ]
    },
    panel(
      "BANK DETAILS FOR PAYMENT",
      [
        {
          columns: [
            {
              width: "*",
              stack: [
                detailBlock("Account Holder", data.bankDetails.accountHolder),
                detailBlock("Account Number", data.bankDetails.accountNumber),
                detailBlock("Bank Name", data.bankDetails.bankName)
              ]
            },
            {
              width: "*",
              stack: [
                detailBlock("IFSC Code", data.bankDetails.ifscCode),
                detailBlock("SWIFT Code", data.bankDetails.swiftCode),
                detailBlock("UPI ID", data.bankDetails.upiId)
              ]
            }
          ],
          columnGap: 16
        }
      ],
      { centerTitle: true }
    ),
    panel("PAYMENT TERMS", [{ ul: data.paymentTerms }]),
    panel("NOTES", [{ ul: data.notes }]),
    {
      text: data.compliance.exportNote,
      pageBreak: "before",
      color: palette.textMuted,
      fontSize: 10,
      margin: [0, 10, 0, 0]
    },
    {
      text: data.compliance.generatedNote,
      pageBreak: "before",
      color: palette.textMuted,
      fontSize: 10,
      alignment: "center",
      margin: [0, 10, 0, 0]
    }
  ],
  styles: {
    title: {
      color: palette.accent,
      fontSize: 36,
      bold: true
    },
    sectionLabel: {
      color: palette.accent,
      fontSize: 12.5,
      bold: true
    },
    metaLabel: {
      color: palette.textMuted,
      fontSize: 8.5,
      bold: true
    },
    partyName: {
      margin: [0, 8, 0, 0],
      fontSize: 11.5,
      bold: true
    },
    partyLine: {
      margin: [0, 2, 0, 0]
    },
    tableHeader: {
      color: palette.white,
      fontSize: 8.5,
      bold: true
    },
    detailLabel: {
      color: palette.textMuted,
      fontSize: 8.5,
      bold: true
    }
  }
};

await fs.mkdir(outputPath("pdfmake"), { recursive: true });

const pdfDocument = await printer.createPdfKitDocument(docDefinition);
const outputStream = createWriteStream(destination);

await new Promise((resolve, reject) => {
  pdfDocument.pipe(outputStream);
  pdfDocument.end();
  outputStream.on("finish", resolve);
  outputStream.on("error", reject);
  pdfDocument.on("error", reject);
});

console.log(`pdfmake PDF written to ${destination}`);
