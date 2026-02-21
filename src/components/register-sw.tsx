"use client";

import { useEffect } from "react";

/**
 * Registers the custom service worker at /sw.js (e.g. 5gvci.com script).
 * next-pwa is configured to output its generated worker to pwa-sw.js so it doesn't overwrite this.
 */
export function RegisterSw() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      })
      .catch(() => {});
  }, []);
  return null;
}
