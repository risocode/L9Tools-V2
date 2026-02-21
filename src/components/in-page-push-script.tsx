"use client";

import { useEffect } from "react";

/** In-Page Push (nap5k) – injects script once on mount, zone 10637976 */
export function InPagePushScript() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = document.querySelector('script[src="https://nap5k.com/tag.min.js"]');
    if (existing) return;
    const script = document.createElement("script");
    script.dataset.zone = "10637976";
    script.src = "https://nap5k.com/tag.min.js";
    script.async = true;
    (document.head || document.body).appendChild(script);
  }, []);
  return null;
}
