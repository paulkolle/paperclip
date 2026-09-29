/**
 * `crypto.randomUUID` only exists in secure contexts (HTTPS or localhost).
 * A LAN/Tailnet instance served over plain http (`pnpm dev --bind lan`) has
 * no secure context, so every caller threw a TypeError — the comment composer
 * swallowed it and the send button silently did nothing.
 *
 * `crypto.getRandomValues` is available in insecure contexts, so build an
 * RFC 4122 v4 UUID from it. Imported first in `main.tsx`.
 */
if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID !== "function") {
  const cryptoObj = globalThis.crypto;
  Object.defineProperty(cryptoObj, "randomUUID", {
    configurable: true,
    writable: true,
    value: function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
      const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6]! & 0x0f) | 0x40;
      bytes[8] = (bytes[8]! & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`;
    },
  });
}

export {};
