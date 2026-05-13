// Lightweight markdown renderer (no extra deps): handles fenced code, inline code, bold, headings, lists, links.
import { useMemo } from "react";

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderInline(s: string) {
  let t = escape(s);
  t = t.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-genelo underline" href="$2" target="_blank" rel="noreferrer">$1</a>');
  return t;
}

export function Markdown({ content }: { content: string }) {
  const html = useMemo(() => {
    const parts: string[] = [];
    const lines = content.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const fence = line.match(/^```(\w+)?/);
      if (fence) {
        const lang = fence[1] ?? "";
        i++;
        const buf: string[] = [];
        while (i < lines.length && !lines[i].startsWith("```")) {
          buf.push(lines[i]);
          i++;
        }
        i++;
        parts.push(
          `<pre class="my-3 overflow-x-auto rounded-lg bg-foreground/95 p-4 text-[13px] text-background"><code data-lang="${escape(lang)}">${escape(buf.join("\n"))}</code></pre>`,
        );
        continue;
      }
      if (/^### /.test(line)) {
        parts.push(`<h3 class="mt-4 text-base font-semibold">${renderInline(line.slice(4))}</h3>`);
      } else if (/^## /.test(line)) {
        parts.push(`<h2 class="mt-4 text-lg font-semibold">${renderInline(line.slice(3))}</h2>`);
      } else if (/^# /.test(line)) {
        parts.push(`<h1 class="mt-4 text-xl font-bold">${renderInline(line.slice(2))}</h1>`);
      } else if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
          items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
          i++;
        }
        parts.push(`<ul class="my-2 list-disc pl-5 space-y-1">${items.join("")}</ul>`);
        continue;
      } else if (line.trim() === "") {
        parts.push("");
      } else {
        parts.push(`<p class="my-2 leading-relaxed">${renderInline(line)}</p>`);
      }
      i++;
    }
    return parts.join("\n");
  }, [content]);

  return <div className="text-sm" dangerouslySetInnerHTML={{ __html: html }} />;
}
