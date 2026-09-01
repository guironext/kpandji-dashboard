import { createHmac, timingSafeEqual } from "crypto";

function shareSecret() {
  return (
    process.env.SAV_RAPPORT_SHARE_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    "kpandji-sav-rapport-share"
  );
}

/** Signed token so a client can open one TERMINE rapport without an account. */
export function signSavRapportToken(voitureSAVId: string): string {
  const idPart = Buffer.from(voitureSAVId, "utf8").toString("base64url");
  const sig = createHmac("sha256", shareSecret())
    .update(voitureSAVId)
    .digest("base64url");
  return `${idPart}.${sig}`;
}

export function verifySavRapportToken(token: string): string | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const [idPart, sig] = token.split(".");
  if (!idPart || !sig) return null;
  let id: string;
  try {
    id = Buffer.from(idPart, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!id || id.length > 80) return null;
  const expected = createHmac("sha256", shareSecret())
    .update(id)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
