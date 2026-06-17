export const ITEM_CATEGORIES = ["Mail", "General", "Socials"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SOCIAL_HOSTS = [
  "twitter.com",
  "x.com",
  "instagram.com",
  "facebook.com",
  "fb.com",
  "linkedin.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "reddit.com",
  "pinterest.com",
  "threads.net",
  "snapchat.com",
  "discord.com",
  "discord.gg",
  "t.me",
  "telegram.me",
  "wa.me",
  "whatsapp.com",
  "bsky.app",
  "twitch.tv",
  "vimeo.com"
];

function hostFromText(text) {
  const trimmed = text.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isSocialHost(host) {
  if (!host) return false;
  return SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function looksLikeUrl(text) {
  return /^(https?:\/\/|www\.)\S+/i.test(text) || /^[a-z0-9-]+(\.[a-z0-9-]+)+\/\S*/i.test(text);
}

function looksLikeEmail(text) {
  if (EMAIL_RE.test(text)) return true;
  if (!text.includes("@") || text.includes(" ")) return false;
  const [local, domain] = text.split("@");
  return Boolean(local && domain);
}

/** Infer Mail | General | Socials from snippet text (supports partial input while typing). */
export function detectCategory(text) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "General";

  if (looksLikeEmail(trimmed)) return "Mail";

  if (looksLikeUrl(trimmed)) {
    return isSocialHost(hostFromText(trimmed)) ? "Socials" : "General";
  }

  return "General";
}
