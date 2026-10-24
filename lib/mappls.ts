/* Loader for the Mappls (MapmyIndia) web map SDK.
   The map is an extra: if the SDK cannot load, callers show a message and the form keeps working. */

export const MAPPLS_KEY = process.env.NEXT_PUBLIC_MAPPLS_MAP_KEY ?? "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Mappls = any;

declare global {
  interface Window {
    mappls?: Mappls;
  }
}

let loading: Promise<Mappls> | null = null;

export function loadMappls(timeoutMs = 10000): Promise<Mappls> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (!MAPPLS_KEY) return Promise.reject(new Error("no-key"));
  if (window.mappls?.Map) return Promise.resolve(window.mappls);
  if (loading) return loading;

  loading = new Promise<Mappls>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://apis.mappls.com/advancedmaps/api/${MAPPLS_KEY}/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    const timer = window.setTimeout(() => {
      loading = null;
      reject(new Error("timeout"));
    }, timeoutMs);
    script.onload = () => {
      // The SDK sets window.mappls shortly after the script runs.
      const started = Date.now();
      const poll = () => {
        if (window.mappls?.Map) {
          window.clearTimeout(timer);
          resolve(window.mappls);
        } else if (Date.now() - started > timeoutMs) {
          loading = null;
          reject(new Error("no-sdk"));
        } else {
          window.setTimeout(poll, 100);
        }
      };
      poll();
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      loading = null;
      reject(new Error("load-error"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Call a method if it exists, ignoring SDK differences. */
export function safe(fn: () => void) {
  try {
    fn();
  } catch (error) {
    console.warn("[map]", error);
  }
}
