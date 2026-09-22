/**
 * Server-only helpers that let Genelo AI read public documents (PDF, HTML)
 * and search the public web for sources such as university almanacs,
 * NECTA results/circulars, government and institutional PDFs.
 */

const UA = "Mozilla/5.0 (compatible; GeneloAI/1.0; +https://geneloai.lovable.app)";
const SEARCH_UA = "Mozilla/5.0";

const MAX_CHARS = 18000;

function clamp(text: string) {
  const t = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > MAX_CHARS ? `${t.slice(0, MAX_CHARS)}\n\n…[truncated]` : t;
}

function htmlToText(html: string) {
  return clamp(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/[ \t]{2,}/g, " "),
  );
}

async function pdfToText(buf: ArrayBuffer) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text: clamp(String(text)), totalPages };
}

export async function fetchDocument(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false as const, error: "Invalid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    return { ok: false as const, error: "Only http(s) URLs are supported." };
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  )
    return { ok: false as const, error: "Blocked host." };

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": UA, Accept: "*/*" },
      redirect: "follow",
    });
    if (!res.ok)
      return { ok: false as const, error: `Fetch failed with status ${res.status}.` };
    const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
    if (ctype.includes("pdf") || url.pathname.toLowerCase().endsWith(".pdf")) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 25_000_000)
        return { ok: false as const, error: "PDF too large to read." };
      const { text, totalPages } = await pdfToText(buf);
      if (!text) return { ok: false as const, error: "PDF has no extractable text (likely scanned images)." };
      return { ok: true as const, url: url.toString(), kind: "pdf" as const, totalPages, text };
    }
    if (ctype.includes("json") || ctype.includes("text/plain")) {
      return { ok: true as const, url: url.toString(), kind: "text" as const, text: clamp(await res.text()) };
    }
    const html = await res.text();
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim();
    return { ok: true as const, url: url.toString(), kind: "html" as const, title, text: htmlToText(html) };
  } catch (e) {
    return { ok: false as const, error: `Could not fetch: ${(e as Error).message}` };
  }
}

type Hit = { title: string; url: string; snippet: string; source?: string };

const strip = (x: string) =>
  x
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ---------------- Providers (keyed APIs first, then keyless) -------------- */

async function braveSearch(q: string): Promise<Hit[]> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`,
    { headers: { Accept: "application/json", "X-Subscription-Token": key } },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as any;
  return (j.web?.results ?? []).map((r: any) => ({
    title: strip(r.title ?? ""),
    url: r.url as string,
    snippet: strip(r.description ?? "").slice(0, 320),
    source: "Brave",
  }));
}

async function tavilySearch(q: string): Promise<Hit[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query: q, max_results: 10, search_depth: "advanced" }),
  });
  if (!res.ok) return [];
  const j = (await res.json()) as any;
  return (j.results ?? []).map((r: any) => ({
    title: strip(r.title ?? ""),
    url: r.url as string,
    snippet: strip(r.content ?? "").slice(0, 320),
    source: "Tavily",
  }));
}

async function serperSearch(q: string): Promise<Hit[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: 10 }),
  });
  if (!res.ok) return [];
  const j = (await res.json()) as any;
  return (j.organic ?? []).map((r: any) => ({
    title: strip(r.title ?? ""),
    url: r.link as string,
    snippet: strip(r.snippet ?? "").slice(0, 320),
    source: "Google (Serper)",
  }));
}

async function googleCseSearch(q: string): Promise<Hit[]> {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!key || !cx) return [];
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&num=10&q=${encodeURIComponent(q)}`,
  );
  if (!res.ok) return [];
  const j = (await res.json()) as any;
  return (j.items ?? []).map((r: any) => ({
    title: strip(r.title ?? ""),
    url: r.link as string,
    snippet: strip(r.snippet ?? "").slice(0, 320),
    source: "Google",
  }));
}

/** Keyless: DuckDuckGo Lite (POST). Works when the host is not challenged. */
async function ddgLite(q: string): Promise<Hit[]> {
  const res = await fetch("https://lite.duckduckgo.com/lite/", {
    method: "POST",
    headers: {
      "User-Agent": SEARCH_UA,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "text/html",
    },
    body: new URLSearchParams({ q }).toString(),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const out: Hit[] = [];
  const rows = html.split(/class=['"]result-link['"]/i);
  for (let i = 1; i < rows.length && out.length < 10; i++) {
    const href = /href="([^"]+)"[^>]*$/.exec(rows[i - 1].trimEnd())?.[1];
    const title = strip(/^>([\s\S]*?)<\/a>/.exec(rows[i])?.[1] ?? "");
    const snippet = strip(
      /class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/i.exec(rows[i])?.[1] ?? "",
    ).slice(0, 320);
    if (!href || !/^https?:\/\//.test(href)) continue;
    if (out.some((r) => r.url === href)) continue;
    out.push({ title: title || href, url: href, snippet, source: "DuckDuckGo" });
  }
  return out;
}

/** Keyless: DuckDuckGo Instant Answer API — abstracts and related topics. */
async function ddgInstant(q: string): Promise<Hit[]> {
  const res = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,
    { headers: { "User-Agent": SEARCH_UA, Accept: "application/json" } },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as any;
  const out: Hit[] = [];
  if (j.AbstractURL && j.AbstractText)
    out.push({
      title: j.Heading || q,
      url: j.AbstractURL,
      snippet: String(j.AbstractText).slice(0, 320),
      source: j.AbstractSource || "DuckDuckGo",
    });
  for (const t of j.RelatedTopics ?? []) {
    const item = t.FirstURL ? t : t.Topics?.[0];
    if (!item?.FirstURL) continue;
    out.push({
      title: strip(item.Text ?? item.FirstURL).slice(0, 120),
      url: item.FirstURL,
      snippet: strip(item.Text ?? "").slice(0, 320),
      source: "DuckDuckGo",
    });
    if (out.length >= 8) break;
  }
  return out;
}

/** Keyless: Wikipedia full-text search — always reachable, great for facts. */
async function wikipediaSearch(q: string): Promise<Hit[]> {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=6&format=json&origin=*&srsearch=${encodeURIComponent(q)}`,
    { headers: { "User-Agent": UA, Accept: "application/json" } },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as any;
  return (j.query?.search ?? []).map((r: any) => ({
    title: r.title as string,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(r.title).replace(/ /g, "_"))}`,
    snippet: strip(r.snippet ?? "").slice(0, 320),
    source: "Wikipedia",
  }));
}

export async function searchWeb(query: string, opts?: { pdfOnly?: boolean }) {
  const q = opts?.pdfOnly ? `${query} filetype:pdf` : query;

  const providers: Array<() => Promise<Hit[]>> = [
    () => braveSearch(q),
    () => tavilySearch(q),
    () => serperSearch(q),
    () => googleCseSearch(q),
    () => ddgLite(q),
    () => ddgInstant(q),
    () => wikipediaSearch(q),
  ];

  const results: Hit[] = [];
  const seen = new Set<string>();
  const tried: string[] = [];

  for (const run of providers) {
    let hits: Hit[] = [];
    try {
      hits = await run();
    } catch {
      hits = [];
    }
    for (const h of hits) {
      if (!h.url || seen.has(h.url)) continue;
      seen.add(h.url);
      results.push(h);
    }
    if (hits[0]?.source) tried.push(hits[0].source);
    if (results.length >= 8) break;
  }

  if (!results.length)
    return {
      ok: false as const,
      error:
        "Web search is unavailable right now (no search provider responded). Answer from your own knowledge and say the live web could not be reached.",
    };
  return { ok: true as const, query: q, engines: tried, results: results.slice(0, 12) };
}

/* ------------------------------------------------------------------ *
 * Image search (public web) — used to show real matching pictures.
 * ------------------------------------------------------------------ */
export async function searchImages(query: string, limit = 8) {
  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      { headers: { "User-Agent": SEARCH_UA, Accept: "text/html" } },
    );
    const html = await tokenRes.text();
    const vqd =
      /vqd=["']?([-\w]+)["']?/.exec(html)?.[1] ?? /vqd=([\d-]+)&/.exec(html)?.[1];
    if (!vqd) return { ok: false as const, error: "Image search is unavailable right now." };

    const res = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`,
      {
        headers: {
          "User-Agent": SEARCH_UA,
          Accept: "application/json",
          Referer: "https://duckduckgo.com/",
        },
      },
    );
    if (!res.ok) return { ok: false as const, error: `Image search failed (${res.status}).` };
    const json = (await res.json()) as { results?: any[] };
    const images = (json.results ?? [])
      .filter((r) => typeof r.image === "string" && /^https?:\/\//.test(r.image))
      .slice(0, Math.min(Math.max(limit, 1), 12))
      .map((r) => ({
        title: String(r.title ?? "").slice(0, 160),
        image: r.image as string,
        thumbnail: (r.thumbnail as string) ?? (r.image as string),
        source: (r.url as string) ?? "",
        width: r.width,
        height: r.height,
      }));
    if (!images.length) return { ok: false as const, error: "No matching pictures found." };
    return { ok: true as const, query, images };
  } catch (e) {
    return { ok: false as const, error: `Image search error: ${(e as Error).message}` };
  }
}

/* ------------------------------------------------------------------ *
 * Person / name lookup — tries many angles until something matches.
 * ------------------------------------------------------------------ */
const PHONE_RE =
  /(?:\+|00)?(?:255|254|256|1|44|91|27|260|265)?[\s-]?\(?\d{2,4}\)?[\s-]?\d{3}[\s-]?\d{3,4}/g;

function extractContacts(text: string) {
  const phones = new Set<string>();
  for (const raw of text.match(PHONE_RE) ?? []) {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length >= 9 && digits.replace(/\D/g, "").length <= 15)
      phones.add(digits);
  }
  const whatsapp = new Set<string>();
  for (const m of text.matchAll(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?(\+?\d{8,15})/gi))
    whatsapp.add(m[1]);
  const emails = new Set(
    (text.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? []).map((e) => e.toLowerCase()),
  );
  return {
    phones: [...phones].slice(0, 8),
    whatsapp: [...whatsapp].slice(0, 5),
    emails: [...emails].slice(0, 8),
  };
}

export async function findPerson(name: string, hint?: string) {
  const base = hint ? `${name} ${hint}` : name;
  const queries = [
    `"${name}"${hint ? ` ${hint}` : ""}`,
    `${base} linkedin OR facebook OR instagram OR twitter`,
    `${base} contact phone OR whatsapp OR email`,
    `${base} profile biography about`,
    `${base} site:linkedin.com OR site:facebook.com OR site:instagram.com`,
  ];
  const searches = await Promise.all(queries.map((q) => searchWeb(q)));
  const seen = new Set<string>();
  const results: { title: string; url: string; snippet: string }[] = [];
  for (const s of searches) {
    if (!s.ok) continue;
    for (const r of s.results) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      results.push(r);
    }
  }
  if (!results.length)
    return { ok: false as const, error: `No public trace found for "${name}". Ask the user for a hint (city, company, school, username).` };

  // Read the 3 strongest pages for contacts.
  const pages = await Promise.all(results.slice(0, 3).map((r) => fetchDocument(r.url)));
  const blob = [
    ...results.map((r) => `${r.title} ${r.snippet} ${r.url}`),
    ...pages.map((p) => (p.ok ? p.text : "")),
  ].join("\n");
  const contacts = extractContacts(blob);
  const images = await searchImages(`${base} photo`, 6);

  return {
    ok: true as const,
    name,
    queriesTried: queries,
    results: results.slice(0, 12),
    contacts,
    whatsappLinks: contacts.whatsapp.map((p) => `https://wa.me/${p.replace(/\D/g, "")}`),
    pictures: images.ok ? images.images : [],
    note: "Verify identity before trusting a match; several people can share a name.",
  };
}
