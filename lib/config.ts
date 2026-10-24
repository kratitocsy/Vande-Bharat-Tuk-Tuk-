export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://indo-tuk-tuk.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "Indo Tuk Tuk";

// Contact: Mahi
export const CONTACT_NAME = "Mahi";
export const PHONE_DISPLAY = "98934 13847";
export const PHONE_E164 = "+919893413847";
export const PHONE_DIGITS = "919893413847";
export const PHONE_HREF = `tel:${PHONE_E164}`;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vwyxrlfbpsimshvdnfid.supabase.co";
// Publishable (public) key. Row-level security keeps the data safe, so this is fine in the browser.
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_LHiIdV8LAG969Nzi_iYJmA_Xbp4YRqT";

export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return local.length === 10 ? `${local.slice(0, 5)} ${local.slice(5)}` : `+${digits}`;
}
