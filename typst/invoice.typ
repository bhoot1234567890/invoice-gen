#set page(paper: "a4", margin: 28mm)
#set text(font: "Helvetica", size: 10.5pt, fill: rgb("#1F2937"))

#let data = json("../data/sample.invoice.json")
#let accent = rgb("#1E3FAF")
#let muted = rgb("#6B7280")
#let border = rgb("#D9DEE7")

#let months = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

#let format-date(value) = {
  let parts = value.split("-")
  let month = int(parts.at(1))
  [#parts.at(2) #months.at(month - 1) #parts.at(0)]
}

#let money(value) = [#data.invoice.currency #value]

#let meta-row(label, value) = grid(
  columns: (1fr, auto),
  column-gutter: 12pt,
  [#text(size: 8.5pt, fill: muted, weight: "bold")[#label]],
  [#align(right)[#strong[#value]]],
)

#let detail-block(label, value) = [
  #text(size: 8.5pt, fill: muted, weight: "bold")[#label]
  #v(4pt)
  #strong[#value]
]

#let panel(title, body, center-title: false) = block(
  stroke: 1pt + border,
  radius: 8pt,
  inset: 14pt,
)[
  #align(if center-title { center } else { left })[
    #text(fill: accent, size: 12.5pt, weight: "bold")[#title]
  ]
  #v(10pt)
  #body
]

#let party-card(title, primary, secondary: none, address-lines: (), email: "", extras: ()) = block(
  stroke: 1pt + border,
  radius: 8pt,
  inset: 14pt,
)[
  #text(fill: accent, size: 12.5pt, weight: "bold")[#title]
  #v(8pt)
  #strong[#primary]
  #if secondary != none [
    #linebreak()
    #secondary
  ]
  #for line in address-lines [
    #linebreak()
    #line
  ]
  #linebreak()
  #email
  #for extra in extras [
    #linebreak()
    #extra
  ]
]

#align(left + top)[
  #grid(
    columns: (1fr, 220pt),
    column-gutter: 24pt,
    [
      #text(fill: accent, size: 36pt, weight: "bold")[#data.invoice.typeLabel]
    ],
    [
      #meta-row("Invoice No", data.invoice.invoiceNumber)
      #v(8pt)
      #meta-row("Date", format-date(data.invoice.issueDate))
      #v(8pt)
      #meta-row("Due Date", data.invoice.dueDateLabel)
    ],
  )

  #v(24pt)

  #grid(
    columns: (1fr, 1fr),
    gutter: 16pt,
    [
      #party-card(
        "FROM",
        data.seller.name,
        address-lines: data.seller.addressLines,
        email: data.seller.email,
        extras: (data.seller.phone, "PAN: " + data.seller.pan),
      )
    ],
    [
      #party-card(
        "BILL TO",
        data.buyer.company,
        secondary: data.buyer.attention,
        address-lines: data.buyer.addressLines,
        email: data.buyer.email,
      )
    ],
  )

  #v(24pt)

  #table(
    columns: (4.5fr, 1fr, 1.6fr, 1.6fr),
    stroke: none,
    inset: 10pt,
    align: (x, _) => if x == 0 { left } else if x == 1 { center } else { right },
    fill: (_, y) => if y == 0 { accent } else { none },
    [#text(fill: white, weight: "bold", size: 8.5pt)[DESCRIPTION]],
    [#text(fill: white, weight: "bold", size: 8.5pt)[QTY]],
    [#text(fill: white, weight: "bold", size: 8.5pt)[RATE]],
    [#text(fill: white, weight: "bold", size: 8.5pt)[AMOUNT]],
    for item in data.items [
      [#item.title #linebreak() #text(fill: muted, size: 9pt)[#item.subtitle]]
      [#item.qty]
      [#money(item.rate)]
      [#money(item.amount)]
    ],
  )

  #v(18pt)

  #align(right)[
    #block(width: 240pt)[
      #grid(
        columns: (1fr, auto),
        column-gutter: 12pt,
        [#text(fill: muted, weight: "bold")[Subtotal]],
        [#strong[#money(data.summary.subtotal)]],
      )
      #v(8pt)
      #block(fill: accent, radius: 8pt, inset: 12pt)[
        #grid(
          columns: (1fr, auto),
          column-gutter: 16pt,
          [#text(fill: white, weight: "bold", size: 13pt)[TOTAL]],
          [#text(fill: white, weight: "bold", size: 13pt)[#money(data.summary.total)]],
        )
      ]
      #v(10pt)
      #text(fill: muted)[Amount in Words: #data.summary.amountInWords]
    ]
  ]

  #v(16pt)

  #panel("BANK DETAILS FOR PAYMENT", center-title: true)[
    #grid(
      columns: (1fr, 1fr),
      gutter: 16pt,
      [
        #detail-block("Account Holder", data.bankDetails.accountHolder)
        #v(10pt)
        #detail-block("Account Number", data.bankDetails.accountNumber)
        #v(10pt)
        #detail-block("Bank Name", data.bankDetails.bankName)
      ],
      [
        #detail-block("IFSC Code", data.bankDetails.ifscCode)
        #v(10pt)
        #detail-block("SWIFT Code", data.bankDetails.swiftCode)
        #v(10pt)
        #detail-block("UPI ID", data.bankDetails.upiId)
      ],
    )
  ]

  #v(16pt)

  #panel("PAYMENT TERMS")[
    #for term in data.paymentTerms [
      • #term
      #linebreak()
    ]
  ]

  #v(16pt)

  #panel("NOTES")[
    #for note in data.notes [
      • #note
      #linebreak()
    ]
  ]
]

#pagebreak()
#text(size: 10pt, fill: muted)[#data.compliance.exportNote]

#pagebreak()
#align(center + top)[
  #text(size: 10pt, fill: muted)[#data.compliance.generatedNote]
]
