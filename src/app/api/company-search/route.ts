import { NextResponse } from "next/server";

export type CompanySearchResult = {
  companyId: string;
  regCode: string;
  name: string;
  status: string;
  address: string;
  zipCode: string;
  url: string;
};

type RawCompany = {
  company_id?: unknown;
  reg_code?: unknown;
  name?: unknown;
  status?: unknown;
  legal_address?: unknown;
  zip_code?: unknown;
  url?: unknown;
};

function asText(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function pickRows(payload: unknown): RawCompany[] {
  if (Array.isArray(payload)) {
    return payload as RawCompany[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [record.data, record.results, record.companies, record.items, record.ettevotjad];
  const match = candidates.find(Array.isArray);

  return match ? (match as RawCompany[]) : [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const upstream = new URL("https://ariregister.rik.ee/est/api/autocomplete");
  upstream.searchParams.set("q", query);

  try {
    const response = await fetch(upstream, {
      headers: {
        accept: "application/json"
      },
      next: {
        revalidate: 60 * 60
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Äriregistri otsing ei vastanud edukalt.", results: [] },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as unknown;
    const results: CompanySearchResult[] = pickRows(payload).map((item) => ({
      companyId: asText(item.company_id),
      regCode: asText(item.reg_code),
      name: asText(item.name),
      status: asText(item.status),
      address: asText(item.legal_address),
      zipCode: asText(item.zip_code),
      url: asText(item.url)
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Äriregistri otsingut ei saanud hetkel teha.", results: [] },
      { status: 502 }
    );
  }
}
