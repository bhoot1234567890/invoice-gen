import { promises as fs } from "node:fs";

import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf
} from "@react-pdf/renderer";

import {
  formatDate,
  formatMoney,
  loadInvoiceData,
  outputPath
} from "./lib/invoice-data.mjs";

const h = React.createElement;
const data = await loadInvoiceData();
const destination = outputPath("react-pdf", "invoice.react-pdf.pdf");

const palette = {
  accent: "#1E3FAF",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  border: "#D9DEE7",
  borderSoft: "#EEF2F7",
  white: "#FFFFFF"
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingRight: 56,
    paddingBottom: 56,
    paddingLeft: 56,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: palette.textDark
  },
  title: {
    color: palette.accent,
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: -0.5
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24
  },
  metaCard: {
    width: 205
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingTop: 8,
    paddingBottom: 8
  },
  metaLabel: {
    color: palette.textMuted,
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: "uppercase"
  },
  metaValue: {
    fontWeight: 700
  },
  partyGrid: {
    flexDirection: "row",
    gap: 14,
    marginTop: 24
  },
  partyCard: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    padding: 14
  },
  sectionLabel: {
    color: palette.accent,
    fontSize: 12.5,
    fontWeight: 800,
    textTransform: "uppercase"
  },
  partyName: {
    marginTop: 8,
    fontSize: 11.5,
    fontWeight: 700
  },
  partyLine: {
    marginTop: 2
  },
  table: {
    marginTop: 24,
    borderRadius: 8,
    overflow: "hidden"
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: palette.accent
  },
  tableBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft
  },
  tableHeaderCell: {
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
    color: palette.white,
    fontSize: 8.5,
    fontWeight: 800,
    textTransform: "uppercase"
  },
  tableCell: {
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingLeft: 12
  },
  descCell: {
    width: "52%"
  },
  qtyCell: {
    width: "12%",
    textAlign: "center"
  },
  rateCell: {
    width: "18%",
    textAlign: "right"
  },
  amountCell: {
    width: "18%",
    textAlign: "right"
  },
  itemTitle: {
    fontWeight: 700
  },
  itemSubtitle: {
    marginTop: 4,
    fontSize: 9.25,
    color: palette.textMuted
  },
  summaryWrap: {
    marginTop: 18,
    alignItems: "flex-end"
  },
  summaryCard: {
    width: 240
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  summaryLabel: {
    color: palette.textMuted,
    fontWeight: 700
  },
  summaryValue: {
    fontWeight: 700
  },
  totalBar: {
    marginTop: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: palette.accent,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  totalText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: 800
  },
  amountWords: {
    marginTop: 10,
    color: palette.textMuted
  },
  panel: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    padding: 14
  },
  centered: {
    textAlign: "center"
  },
  bankGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 16
  },
  bankColumn: {
    flexGrow: 1
  },
  detailLabel: {
    color: palette.textMuted,
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: "uppercase"
  },
  detailValue: {
    marginTop: 4,
    fontWeight: 700
  },
  detailBlock: {
    marginBottom: 10
  },
  bulletList: {
    marginTop: 10
  },
  bulletItem: {
    marginTop: 4
  },
  secondaryPage: {
    paddingTop: 70,
    paddingRight: 56,
    paddingBottom: 56,
    paddingLeft: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: palette.textMuted
  },
  centeredSecondaryPage: {
    justifyContent: "flex-start",
    alignItems: "center"
  }
});

function MetaRow({ label, value }) {
  return h(
    View,
    { style: styles.metaRow },
    h(Text, { style: styles.metaLabel }, label),
    h(Text, { style: styles.metaValue }, value)
  );
}

function PartyCard({ label, primary, secondary, addressLines, email, extras = [] }) {
  return h(
    View,
    { style: styles.partyCard },
    h(Text, { style: styles.sectionLabel }, label),
    h(Text, { style: styles.partyName }, primary),
    ...(secondary ? [h(Text, { key: "secondary", style: styles.partyLine }, secondary)] : []),
    ...addressLines.map((line, index) =>
      h(Text, { key: `${label}-line-${index}`, style: styles.partyLine }, line)
    ),
    h(Text, { style: styles.partyLine }, email),
    ...extras.map((line, index) =>
      h(Text, { key: `${label}-extra-${index}`, style: styles.partyLine }, line)
    )
  );
}

function DetailBlock({ label, value }) {
  return h(
    View,
    { style: styles.detailBlock },
    h(Text, { style: styles.detailLabel }, label),
    h(Text, { style: styles.detailValue }, value)
  );
}

function BulletList({ items }) {
  return h(
    View,
    { style: styles.bulletList },
    ...items.map((item, index) =>
      h(Text, { key: `bullet-${index}`, style: styles.bulletItem }, `• ${item}`)
    )
  );
}

const document = h(
  Document,
  null,
  h(
    Page,
    { size: "A4", style: styles.page },
    h(
      View,
      { style: styles.headerRow },
      h(Text, { style: styles.title }, data.invoice.typeLabel),
      h(
        View,
        { style: styles.metaCard },
        h(MetaRow, { label: "Invoice No", value: data.invoice.invoiceNumber }),
        h(MetaRow, { label: "Date", value: formatDate(data.invoice.issueDate) }),
        h(MetaRow, { label: "Due Date", value: data.invoice.dueDateLabel })
      )
    ),
    h(
      View,
      { style: styles.partyGrid },
      h(PartyCard, {
        label: "From",
        primary: data.seller.name,
        addressLines: data.seller.addressLines,
        email: data.seller.email,
        extras: [data.seller.phone, `PAN: ${data.seller.pan}`].filter(Boolean)
      }),
      h(PartyCard, {
        label: "Bill To",
        primary: data.buyer.company,
        secondary: data.buyer.attention,
        addressLines: data.buyer.addressLines,
        email: data.buyer.email
      })
    ),
    h(
      View,
      { style: styles.table },
      h(
        View,
        { style: styles.tableHeaderRow },
        h(View, { style: [styles.descCell, styles.tableCell] }, h(Text, { style: styles.tableHeaderCell }, "Description")),
        h(View, { style: [styles.qtyCell, styles.tableCell] }, h(Text, { style: [styles.tableHeaderCell, { textAlign: "center" }] }, "Qty")),
        h(View, { style: [styles.rateCell, styles.tableCell] }, h(Text, { style: [styles.tableHeaderCell, { textAlign: "right" }] }, "Rate")),
        h(View, { style: [styles.amountCell, styles.tableCell] }, h(Text, { style: [styles.tableHeaderCell, { textAlign: "right" }] }, "Amount"))
      ),
      ...data.items.map((item, index) =>
        h(
          View,
          { key: `item-row-${index}`, style: styles.tableBodyRow },
          h(
            View,
            { style: [styles.descCell, styles.tableCell] },
            h(Text, { style: styles.itemTitle }, item.title),
            h(Text, { style: styles.itemSubtitle }, item.subtitle)
          ),
          h(View, { style: [styles.qtyCell, styles.tableCell] }, h(Text, null, String(item.qty))),
          h(View, { style: [styles.rateCell, styles.tableCell] }, h(Text, null, formatMoney(item.rate, data.invoice.currency))),
          h(View, { style: [styles.amountCell, styles.tableCell] }, h(Text, null, formatMoney(item.amount, data.invoice.currency)))
        )
      )
    ),
    h(
      View,
      { style: styles.summaryWrap },
      h(
        View,
        { style: styles.summaryCard },
        h(
          View,
          { style: styles.summaryRow },
          h(Text, { style: styles.summaryLabel }, "Subtotal"),
          h(Text, { style: styles.summaryValue }, formatMoney(data.summary.subtotal, data.invoice.currency))
        ),
        h(
          View,
          { style: styles.totalBar },
          h(Text, { style: styles.totalText }, "TOTAL"),
          h(Text, { style: styles.totalText }, formatMoney(data.summary.total, data.invoice.currency))
        ),
        h(Text, { style: styles.amountWords }, `Amount in Words: ${data.summary.amountInWords}`)
      )
    ),
    h(
      View,
      { style: styles.panel },
      h(Text, { style: [styles.sectionLabel, styles.centered] }, "Bank Details For Payment"),
      h(
        View,
        { style: styles.bankGrid },
        h(
          View,
          { style: styles.bankColumn },
          h(DetailBlock, { label: "Account Holder", value: data.bankDetails.accountHolder }),
          h(DetailBlock, { label: "Account Number", value: data.bankDetails.accountNumber }),
          h(DetailBlock, { label: "Bank Name", value: data.bankDetails.bankName })
        ),
        h(
          View,
          { style: styles.bankColumn },
          h(DetailBlock, { label: "IFSC Code", value: data.bankDetails.ifscCode }),
          h(DetailBlock, { label: "SWIFT Code", value: data.bankDetails.swiftCode }),
          h(DetailBlock, { label: "UPI ID", value: data.bankDetails.upiId })
        )
      )
    ),
    h(
      View,
      { style: styles.panel },
      h(Text, { style: styles.sectionLabel }, "Payment Terms"),
      h(BulletList, { items: data.paymentTerms })
    ),
    h(
      View,
      { style: styles.panel },
      h(Text, { style: styles.sectionLabel }, "Notes"),
      h(BulletList, { items: data.notes })
    )
  ),
  h(
    Page,
    { size: "A4", style: styles.secondaryPage },
    h(Text, null, data.compliance.exportNote)
  ),
  h(
    Page,
    { size: "A4", style: [styles.secondaryPage, styles.centeredSecondaryPage] },
    h(Text, null, data.compliance.generatedNote)
  )
);

await fs.mkdir(new URL("../output/react-pdf", import.meta.url), { recursive: true });
const buffer = await pdf(document).toBuffer();
await fs.writeFile(destination, buffer);

console.log(`React-pdf PDF written to ${destination}`);
