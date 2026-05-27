"use client";

import {
  Building2,
  CalendarDays,
  Download,
  Mail,
  Plus,
  Printer,
  Search,
  Trash2
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";

const VAT_RATE = 0.24;

type Company = {
  name: string;
  regCode: string;
  address: string;
  bankAccount?: string;
  email?: string;
  status?: string;
};

type CompanySearchResult = Company & {
  companyId: string;
  zipCode: string;
  url: string;
};

type InvoiceRow = {
  description: string;
  qty: number;
  unit: string;
  price: number;
  vat: boolean;
};

const emptyCompany: Company = {
  name: "",
  regCode: "",
  address: ""
};

const defaultRows: InvoiceRow[] = [
  {
    description: "Teenuse kirjeldus",
    qty: 1,
    unit: "tk",
    price: 100,
    vat: true
  }
];

function eur(value: number) {
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR"
  }).format(Number.isFinite(value) ? value : 0);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIso(value: string, days: number) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      {label}
      <input
        className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-mint focus:ring-2 focus:ring-mint/20"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CompanyAutocomplete({
  title,
  value,
  onChange
}: {
  title: string;
  value: Company;
  onChange: (company: Company) => void;
}) {
  const [query, setQuery] = useState(value.name);
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value.name);
  }, [value.name]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/company-search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { results?: CompanySearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function selectCompany(company: CompanySearchResult) {
    onChange({
      name: company.name,
      regCode: company.regCode,
      address: [company.address, company.zipCode].filter(Boolean).join(", "),
      status: company.status
    });
    setQuery(company.name);
    setOpen(false);
  }

  return (
    <section className="rounded-lg border border-line/80 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-mint/10">
          <Building2 className="h-4 w-4 text-mint" />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>

      <div className="relative">
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Otsi Äriregistrist
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-mint focus:ring-2 focus:ring-mint/20"
              value={query}
              placeholder="Ettevõtte nimi või registrikood"
              onBlur={() => window.setTimeout(() => setOpen(false), 150)}
              onChange={(event) => {
                setQuery(event.target.value);
                onChange({ ...value, name: event.target.value });
              }}
              onFocus={() => setOpen(results.length > 0)}
            />
          </span>
        </label>

        {open && (
          <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-md border border-line bg-white shadow-panel">
            {loading && <div className="px-3 py-2 text-sm text-ink/60">Otsin...</div>}
            {!loading && results.length === 0 && (
              <div className="px-3 py-2 text-sm text-ink/60">Tulemusi ei leitud</div>
            )}
            {!loading &&
              results.map((company) => (
                <button
                  className="grid w-full gap-0.5 border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-mint/10"
                  key={`${company.regCode}-${company.companyId}`}
                  type="button"
                  onMouseDown={() => selectCompany(company)}
                >
                  <span className="text-sm font-semibold">{company.name}</span>
                  <span className="text-xs text-ink/60">
                    {company.regCode}
                    {company.status ? ` · ${company.status}` : ""}
                  </span>
                  {company.address && <span className="text-xs text-ink/70">{company.address}</span>}
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        <Field
          label="Nimi"
          value={value.name}
          onChange={(next) => onChange({ ...value, name: next })}
        />
        <Field
          label="Registrikood"
          value={value.regCode}
          onChange={(next) => onChange({ ...value, regCode: next })}
        />
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Aadress
          <textarea
            className="min-h-20 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-mint focus:ring-2 focus:ring-mint/20"
            value={value.address}
            onChange={(event) => onChange({ ...value, address: event.target.value })}
          />
        </label>
        {title === "Arve koostaja" && (
          <Field
            label="Konto nr / IBAN"
            value={value.bankAccount ?? ""}
            placeholder="EE..."
            onChange={(next) => onChange({ ...value, bankAccount: next })}
          />
        )}
        {title === "Arve saaja" && (
          <Field
            label="E-post"
            value={value.email ?? ""}
            placeholder="saaja@ettevote.ee"
            type="email"
            onChange={(next) => onChange({ ...value, email: next })}
          />
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const invoiceRef = useRef<HTMLElement>(null);
  const [seller, setSeller] = useState<Company>(emptyCompany);
  const [buyer, setBuyer] = useState<Company>(emptyCompany);
  const [invoiceNo, setInvoiceNo] = useState("2026-001");
  const [date, setDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(addDaysToIso(todayIso(), 14));
  const [rows, setRows] = useState<InvoiceRow[]>(defaultRows);
  const [note, setNote] = useState("Täname õigeaegselt tasutud arve eest.");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [bccEmail, setBccEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  const totals = useMemo(() => {
    return rows.reduce(
      (sum, row) => {
        const net = Number(row.qty || 0) * Number(row.price || 0);
        const vat = row.vat ? net * VAT_RATE : 0;

        return {
          net: sum.net + net,
          vat: sum.vat + vat,
          total: sum.total + net + vat
        };
      },
      { net: 0, vat: 0, total: 0 }
    );
  }, [rows]);

  function updateRow(index: number, patch: Partial<InvoiceRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        description: "",
        qty: 1,
        unit: "tk",
        price: 0,
        vat: true
      }
    ]);
  }

  function removeRow(index: number) {
    setRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)));
  }

  function updateInvoiceDate(nextDate: string) {
    setDate(nextDate);
    setDueDate(addDaysToIso(nextDate, 14));
  }

  async function buildPdf() {
    if (!invoiceRef.current) {
      throw new Error("Arve eelvaadet ei leitud.");
    }

    document.body.classList.add("exporting-pdf");

    try {
      await new Promise((resolve) => window.requestAnimationFrame(resolve));

      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imageWidth = pageWidth - margin * 2;
      const naturalImageHeight = (canvas.height * imageWidth) / canvas.width;
      const imageHeight = rows.length <= 4 ? Math.min(naturalImageHeight, pageHeight - margin * 2) : naturalImageHeight;
      const imageData = canvas.toDataURL("image/png");

      let position = margin;
      let remainingHeight = imageHeight;

      pdf.addImage(imageData, "PNG", margin, position, imageWidth, imageHeight);
      remainingHeight -= pageHeight - margin * 2;

      while (remainingHeight > 0) {
        position = remainingHeight - imageHeight + margin;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", margin, position, imageWidth, imageHeight);
        remainingHeight -= pageHeight - margin * 2;
      }

      return pdf;
    } finally {
      document.body.classList.remove("exporting-pdf");
    }
  }

  async function savePdf() {
    if (exportingPdf) {
      return;
    }

    setExportingPdf(true);

    try {
      const pdf = await buildPdf();
      pdf.save(`arve-${invoiceNo || "uus"}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }

  async function sendInvoiceEmail() {
    if (sendingEmail) {
      return;
    }

    if (!buyer.email) {
      setEmailStatus("Lisa arve saaja e-posti aadress.");
      return;
    }

    setSendingEmail(true);
    setEmailStatus("");

    try {
      const pdf = await buildPdf();
      const pdfBase64 = pdf.output("datauristring").split(",")[1];
      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: buyer.email,
          subject: `Arve ${invoiceNo}`,
          bcc: bccEmail,
          message: `Tere\n\nManuses on arve ${invoiceNo}.\n\n${note}`,
          filename: `arve-${invoiceNo || "uus"}.pdf`,
          pdfBase64
        })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "E-kirja saatmine ebaõnnestus.");
      }

      setEmailStatus("Arve saadeti e-postiga.");
    } catch (error) {
      setEmailStatus(error instanceof Error ? error.message : "E-kirja saatmine ebaõnnestus.");
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <main className="print-shell mx-auto grid max-w-7xl gap-6 px-4 py-5 md:px-6 lg:grid-cols-[430px_minmax(0,1fr)]">
      <aside className="no-print grid content-start gap-4">
        <div className="rounded-lg border border-line/80 bg-white/85 p-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase text-mint">Arvegeneraator</p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold">Koosta arve</h1>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white shadow-sm hover:bg-ink/90"
                type="button"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Prindi
              </button>
            </div>
          </div>
        </div>

        <section className="rounded-lg border border-line/80 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-coral/10">
              <CalendarDays className="h-4 w-4 text-coral" />
            </span>
            <h2 className="text-base font-semibold">Arve andmed</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Field label="Arve nr" value={invoiceNo} onChange={setInvoiceNo} />
            <Field label="Arve kuupäev" type="date" value={date} onChange={updateInvoiceDate} />
            <Field label="Maksetähtaeg" type="date" value={dueDate} onChange={setDueDate} />
          </div>
        </section>

        <CompanyAutocomplete title="Arve koostaja" value={seller} onChange={setSeller} />
        <CompanyAutocomplete title="Arve saaja" value={buyer} onChange={setBuyer} />

        <section className="rounded-lg border border-line/80 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Read</h2>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold hover:bg-mint/10"
              type="button"
              onClick={addRow}
            >
              <Plus className="h-4 w-4" />
              Lisa
            </button>
          </div>

          <div className="grid gap-4">
            {rows.map((row, index) => (
              <div className="rounded-md border border-line/80 bg-paper/45 p-3" key={index}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Rida {index + 1}</span>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink/70 hover:bg-coral/10 hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    disabled={rows.length === 1}
                    aria-label="Eemalda rida"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3">
                  <Field
                    label="Kirjeldus"
                    value={row.description}
                    onChange={(next) => updateRow(index, { description: next })}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Field
                      label="Kogus"
                      type="number"
                      value={row.qty}
                      onChange={(next) => updateRow(index, { qty: Number(next) })}
                    />
                    <Field label="Ühik" value={row.unit} onChange={(next) => updateRow(index, { unit: next })} />
                    <Field
                      label="Hind"
                      type="number"
                      value={row.price}
                      onChange={(next) => updateRow(index, { price: Number(next) })}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      className="h-4 w-4 accent-mint"
                      type="checkbox"
                      checked={row.vat}
                      onChange={(event) => updateRow(index, { vat: event.target.checked })}
                    />
                    Lisa KM 24%
                  </label>
                </div>
              </div>
            ))}
          </div>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-ink">
            Märkus
            <textarea
              className="min-h-24 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-mint focus:ring-2 focus:ring-mint/20"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <Field
            label="Pimekoopia e-post"
            value={bccEmail}
            placeholder="raamatupidamine@ettevote.ee"
            type="email"
            onChange={setBccEmail}
          />
        </section>
      </aside>

      <section
        id="invoice"
        ref={invoiceRef}
        className="overflow-hidden rounded-lg border border-line bg-white shadow-panel"
      >
        <div className="h-2 bg-gradient-to-r from-mint via-ink to-coral" />

        <div className="invoice-body p-6 md:p-10">
          <div className="invoice-header flex flex-wrap items-start justify-between gap-6 pb-9">
            <div className="max-w-sm">
              <p className="text-xs font-semibold uppercase text-mint">Arve</p>
              <h2 className="mt-3 text-5xl font-bold leading-none text-ink">ARVE</h2>
              <p className="mt-3 text-sm text-ink/60">Nr {invoiceNo}</p>
            </div>
            <div className="min-w-56 rounded-lg border border-line bg-paper p-4 text-sm">
              <div className="flex justify-between gap-6 border-b border-line pb-2">
                <span className="text-ink/55">Kuupäev</span>
                <span className="font-medium">{date}</span>
              </div>
              <div className="flex justify-between gap-6 pt-2">
                <span className="text-ink/55">Maksetähtaeg</span>
                <span className="font-medium">{dueDate}</span>
              </div>
            </div>
          </div>

          <div className="invoice-party-grid grid gap-4 text-sm md:grid-cols-2">
            <div className="invoice-party-card rounded-lg border border-line bg-white p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase text-ink/45">Arve koostaja</h3>
              <p className="text-base font-semibold">{seller.name || "-"}</p>
              <p className="mt-2 text-ink/70">Registrikood: {seller.regCode || "-"}</p>
              <p className="mt-2 whitespace-pre-line text-ink/65">{seller.address || "-"}</p>
              <p className="mt-2 text-ink/70">Konto nr: {seller.bankAccount || "-"}</p>
            </div>
            <div className="invoice-party-card rounded-lg border border-line bg-ink p-5 text-white">
              <h3 className="mb-4 text-xs font-semibold uppercase text-white/55">Arve saaja</h3>
              <p className="text-base font-semibold">{buyer.name || "-"}</p>
              <p className="mt-2 text-white/75">Registrikood: {buyer.regCode || "-"}</p>
              <p className="mt-2 whitespace-pre-line text-white/70">{buyer.address || "-"}</p>
            </div>
          </div>

          <div className="invoice-table-wrap overflow-x-auto py-9">
            <table className="invoice-table w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-line bg-paper text-xs uppercase text-ink/55">
                  <th className="p-4 text-left font-semibold">Kirjeldus</th>
                  <th className="p-4 text-right font-semibold">Kogus</th>
                  <th className="p-4 text-left font-semibold">Ühik</th>
                  <th className="p-4 text-right font-semibold">Ühikuhind</th>
                  <th className="p-4 text-right font-semibold">KM</th>
                  <th className="p-4 text-right font-semibold">Summa</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const lineNet = Number(row.qty || 0) * Number(row.price || 0);
                  const lineVat = row.vat ? lineNet * VAT_RATE : 0;

                  return (
                    <tr className="border-b border-line" key={index}>
                      <td className="p-4 font-medium">{row.description || "-"}</td>
                      <td className="p-4 text-right text-ink/75">{row.qty}</td>
                      <td className="p-4 text-ink/75">{row.unit || "-"}</td>
                      <td className="p-4 text-right text-ink/75">{eur(row.price)}</td>
                      <td className="p-4 text-right text-ink/75">{row.vat ? eur(lineVat) : "0,00 €"}</td>
                      <td className="p-4 text-right font-semibold">{eur(lineNet + lineVat)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="invoice-summary w-full max-w-sm rounded-lg border border-line bg-paper p-5 text-sm">
              <div className="flex justify-between gap-4">
                <span>Summa KM-ta</span>
                <span>{eur(totals.net)}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span>KM 24%</span>
                <span>{eur(totals.vat)}</span>
              </div>
              <div className="mt-4 flex justify-between gap-4 border-t border-line pt-4 text-2xl font-bold">
                <span>Kokku</span>
                <span>{eur(totals.total)}</span>
              </div>
            </div>
          </div>

          {note && (
            <div className="invoice-note mt-8 rounded-lg border border-line/80 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-ink/45">Märkus</p>
              <p className="mt-2 whitespace-pre-line text-sm text-ink/65">{note}</p>
            </div>
          )}

        <div className="no-print mt-8 flex justify-end">
          <div className="grid gap-2 sm:flex sm:items-center sm:justify-end">
            {emailStatus && <p className="text-sm text-ink/65">{emailStatus}</p>}
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={sendingEmail}
              onClick={sendInvoiceEmail}
            >
              <Mail className="h-4 w-4" />
              {sendingEmail ? "Saadan..." : "Saada e-postiga"}
            </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-mint/90"
            type="button"
            disabled={exportingPdf}
            onClick={savePdf}
          >
            <Download className="h-4 w-4" />
            {exportingPdf ? "Salvestan..." : "Salvesta PDF"}
          </button>
          </div>
        </div>
        </div>
      </section>
    </main>
  );
}
