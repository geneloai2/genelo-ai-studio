// Rich markdown renderer with VS Code–style syntax highlighting,
// per-code-block copy button, and favicon icons on reference links.
import { useMemo, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { Check, Copy } from "lucide-react";

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function faviconFor(href: string) {
  try {
    const u = new URL(href);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

function renderInline(s: string) {
  let t = escape(s);
  t = t.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">$1</code>',
  );
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Links — handled by a wrapper component when standalone in a list (refs),
  // here we just render as plain anchor tags.
  t = t.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a class="text-genelo underline decoration-dotted underline-offset-2 hover:opacity-80" href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  return t;
}

type Block =
  | { kind: "html"; html: string }
  | { kind: "code"; lang: string; code: string }
  | { kind: "refs"; items: { label: string; href: string }[] };

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return escape(code);
    }
  }, [code, lang]);

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-white/60">
          {lang || "code"}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code
          className={`hljs language-${lang || "plaintext"}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}

function References({ items }: { items: { label: string; href: string }[] }) {
  return (
    <div className="my-4 rounded-xl border border-genelo/30 bg-genelo/5 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-genelo">
        📚 References
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            {faviconFor(it.href) && (
              <img
                src={faviconFor(it.href)}
                alt=""
                className="h-4 w-4 flex-shrink-0 rounded-sm"
                loading="lazy"
              />
            )}
            <a
              href={it.href}
              target="_blank"
              rel="noreferrer"
              className="text-genelo underline decoration-dotted underline-offset-2 hover:opacity-80"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split("\n");
  let i = 0;
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const html = buffer.map(renderLine).join("\n");
    blocks.push({ kind: "html", html });
    buffer = [];
  };

  function renderLine(line: string): string {
    if (/^### /.test(line))
      return `<h3 class="mt-4 text-base font-semibold">${renderInline(line.slice(4))}</h3>`;
    if (/^## /.test(line))
      return `<h2 class="mt-4 text-lg font-semibold">${renderInline(line.slice(3))}</h2>`;
    if (/^# /.test(line))
      return `<h1 class="mt-4 text-xl font-bold">${renderInline(line.slice(2))}</h1>`;
    if (line.trim() === "") return "";
    return `<p class="my-2 leading-relaxed">${renderInline(line)}</p>`;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = line.match(/^```(\w+)?/);
    if (fence) {
      flushBuffer();
      const lang = fence[1] ?? "";
      i++;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ kind: "code", lang, code: buf.join("\n") });
      continue;
    }

    // References section header — treat the next list of links as refs
    if (/^#{1,6}\s+(?:📚\s*)?references?\b/i.test(line)) {
      flushBuffer();
      i++;
      const items: { label: string; href: string }[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const m = l.match(/^[-*]\s*\[([^\]]+)\]\(([^)]+)\)/);
        if (m) {
          items.push({ label: m[1], href: m[2] });
          i++;
          continue;
        }
        if (l.trim() === "") {
          i++;
          continue;
        }
        break;
      }
      if (items.length > 0) {
        blocks.push({ kind: "refs", items });
      }
      continue;
    }

    // Standalone image: ![alt](url)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      flushBuffer();
      const alt = escape(imgMatch[1]);
      const src = imgMatch[2];
      blocks.push({
        kind: "html",
        html: `<figure class="my-3"><img src="${src}" alt="${alt}" loading="lazy" class="max-h-80 w-auto rounded-xl border border-genelo/30 shadow-md object-cover" />${alt ? `<figcaption class="mt-1.5 text-xs italic text-muted-foreground">${alt}</figcaption>` : ""}</figure>`,
      });
      i++;
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      flushBuffer();
      blocks.push({
        kind: "html",
        html: `<ul class="my-2 list-disc pl-5 space-y-1">${items.join("")}</ul>`,
      });
      continue;
    }

    buffer.push(line);
    i++;
  }
  flushBuffer();
  return blocks;
}

export function Markdown({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  return (
    <div className="text-sm">
      {blocks.map((b, i) => {
        if (b.kind === "code") return <CodeBlock key={i} lang={b.lang} code={b.code} />;
        if (b.kind === "refs") return <References key={i} items={b.items} />;
        return <div key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
      })}
    </div>
  );
}
