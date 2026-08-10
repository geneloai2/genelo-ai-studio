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

export async function searchWeb(query: string, opts?: { pdfOnly?: boolean }) {
  const q = opts?.pdfOnly ? `${query} filetype:pdf` : query;
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": SEARCH_UA, Accept: "*/*" } },
    );
    if (!res.ok) return { ok: false as const, error: `Search failed (${res.status}).` };

    const html = await res.text();
    const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const results: { title: string; url: string; snippet: string }[] = [];
    const blocks = html.split(/class="result__a"/i).slice(1);
    for (const block of blocks) {
      if (results.length >= 8) break;
      const hrefM = /href="([^"]+)"/i.exec(block);
      if (!hrefM) continue;
      let href = hrefM[1].replace(/&amp;/g, "&");
      const uddg = /uddg=([^&]+)/.exec(href);
      if (uddg) href = decodeURIComponent(uddg[1]);
      if (href.startsWith("//")) href = `https:${href}`;
      if (!/^https?:\/\//.test(href)) continue;
      const title = strip(/>([\s\S]*?)<\/a>/i.exec(block)?.[1] ?? "");
      const snip = strip(
        /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i.exec(block)?.[1] ?? "",
      );
      results.push({ title, url: href, snippet: snip.slice(0, 300) });
    }

    if (!results.length) return { ok: false as const, error: "No results found." };
    return { ok: true as const, query: q, results };
  } catch (e) {
    return { ok: false as const, error: `Search error: ${(e as Error).message}` };
  }
}
