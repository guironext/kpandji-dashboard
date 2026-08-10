type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
  /** Next may omit this in some runtimes (e.g. client / RSC). */
  config?: Readonly<{ path?: string }>;
};

const DEFAULT_IMAGE_PATH = "/_next/image";

function getOptimizerBasePath(
  config: LoaderArgs["config"]
): string {
  if (config == null || typeof config !== "object") {
    return DEFAULT_IMAGE_PATH;
  }
  const p = (config as { path?: unknown }).path;
  return typeof p === "string" && p.length > 0 ? p : DEFAULT_IMAGE_PATH;
}

/**
 * Serve as-is (no /_next/image): blob/data, Vercel Blob HTTPS, and same-origin
 * paths (/public, /_next/static/media, etc.). Skips the optimizer so local files
 * are not broken when the image route or .next cache misbehaves in dev.
 */
function shouldServeDirectly(src: string): boolean {
  if (!src || typeof src !== "string") return false;
  if (src.startsWith("blob:") || src.startsWith("data:")) return true;
  if (
    src.includes("blob.vercel-storage.com") ||
    src.includes("public.blob.vercel-storage.com")
  ) {
    return true;
  }
  if (src.startsWith("/") && !src.startsWith("//")) {
    if (src.startsWith("/api/")) return false;
    return true;
  }
  return false;
}

/**
 * Custom loader: bypass /_next/image for blobs, local / paths, and Vercel Blob HTTPS
 * (timeout issues). Remote http(s) hosts still use the optimizer when needed.
 */
export default function imageLoader(param: LoaderArgs | undefined): string {
  if (param == null || typeof param !== "object") {
    return `${DEFAULT_IMAGE_PATH}?url=&w=1&q=75`;
  }

  const { src, width, quality, config } = param;

  if (typeof src === "string" && shouldServeDirectly(src)) {
    const safeW =
      typeof width === "number" && Number.isFinite(width) ? Math.round(width) : 1;
    // Next.js requires loader output to include width (next-image-missing-loader-width).
    // Same-origin /public paths: append a benign query; the file server still serves the asset.
    if (src.startsWith("/") && !src.startsWith("//")) {
      const sep = src.includes("?") ? "&" : "?";
      return `${src}${sep}w=${safeW}`;
    }
    return src;
  }

  const q = quality ?? 75;
  const basePath = getOptimizerBasePath(config);
  const safeSrc = typeof src === "string" ? src : "";
  const safeW =
    typeof width === "number" && Number.isFinite(width) ? width : 1;

  return `${basePath}?url=${encodeURIComponent(safeSrc)}&w=${safeW}&q=${q}`;
}
