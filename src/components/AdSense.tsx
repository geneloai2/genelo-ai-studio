import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseUnitProps = {
  slot?: string;
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Controlled AdSense ad unit.
 * Only renders when a valid `slot` is provided (e.g. via VITE_ADSENSE_SLOT_ID).
 * Place this ONLY on content-rich pages (About, Blog, Docs, Contact).
 * Never place it on the chat screen or empty states.
 */
export function AdSenseUnit({
  slot,
  format = "auto",
  className = "",
  style,
}: AdSenseUnitProps) {
  const ref = useRef<HTMLModElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !slot || !ref.current) return;

    // Load the AdSense script once, only when an ad unit is actually rendered.
    if (!document.querySelector('script[data-adsbygoogle="true"]')) {
      const script = document.createElement("script");
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1979381023727069";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.adsbygoogle = "true";
      document.head.appendChild(script);
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense push failed", e);
    }
  }, [mounted, slot]);

  if (!mounted || !slot) return null;

  return (
    <div className={`ad-wrapper my-6 min-h-[90px] ${className}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client="ca-pub-1979381023727069"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
