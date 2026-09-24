// Full-screen image viewer with download/save and "use in chat" actions.
import { useEffect } from "react";
import { Download, ExternalLink, MessageSquarePlus, X } from "lucide-react";
import { toast } from "sonner";

async function toBlob(src: string): Promise<Blob | null> {
  try {
    const r = await fetch(src, { mode: "cors" });
    if (!r.ok) return null;
    return await r.blob();
  } catch {
    return null;
  }
}

function blobToDataUrl(b: Blob) {
  return new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(b);
  });
}

export async function saveImage(src: string, alt = "genelo-image") {
  const blob = await toBlob(src);
  if (!blob) {
    window.open(src, "_blank", "noopener");
    toast.message("Opened the picture — long-press it to save.");
    return;
  }
  const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const name = `${alt.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 40) || "genelo-image"}.${ext}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  toast.success(`Saved ${name}`);
}

export async function imageAsDataUrl(src: string) {
  if (src.startsWith("data:")) return src;
  const blob = await toBlob(src);
  return blob ? await blobToDataUrl(blob) : src;
}

export function ImageViewer({
  src,
  alt,
  onClose,
  onAttach,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
  onAttach?: (src: string, alt: string) => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const btn =
    "inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-2 text-xs font-semibold text-foreground shadow hover:bg-background";
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Picture viewer"
    >
      <div className="flex items-center justify-between gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        <p className="line-clamp-1 text-xs text-muted-foreground">{alt}</p>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-muted" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto px-2">
        <img
          src={src}
          alt={alt}
          className="max-h-full w-full max-w-5xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 p-4" onClick={(e) => e.stopPropagation()}>
        <button className={btn} onClick={() => saveImage(src, alt)}>
          <Download className="h-4 w-4" /> Save
        </button>
        {onAttach && (
          <button
            className={btn}
            onClick={() => {
              onAttach(src, alt || "picture");
              onClose();
            }}
          >
            <MessageSquarePlus className="h-4 w-4" /> Add to chat
          </button>
        )}
        <a className={btn} href={src} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4" /> Open
        </a>
      </div>
    </div>
  );
}
