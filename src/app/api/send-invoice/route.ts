import { NextResponse } from "next/server";
import { Resend } from "resend";

type SendInvoiceRequest = {
  to?: unknown;
  subject?: unknown;
  message?: unknown;
  filename?: unknown;
  pdfBase64?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;

  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "E-posti saatmine pole veel serveris seadistatud." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as SendInvoiceRequest;
  const to = asString(body.to);
  const subject = asString(body.subject) || "Arve";
  const message = asString(body.message) || "Tere, manusena on lisatud arve.";
  const filename = asString(body.filename) || "arve.pdf";
  const pdfBase64 = asString(body.pdfBase64);

  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "Saaja e-posti aadress puudub või on vigane." }, { status: 400 });
  }

  if (!pdfBase64) {
    return NextResponse.json({ error: "PDF manus puudub." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html: `<p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>`,
    attachments: [
      {
        filename,
        content: pdfBase64
      }
    ]
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
