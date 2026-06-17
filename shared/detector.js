import { SOCIAL_HOSTNAMES } from "./constants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function normalize(input) {
  return (input ?? "").toString().trim();
}

function tryParseUrl(text) {
  const t = normalize(text);
  if (!t) return null;

  try {
    if (/^https?:\/\//i.test(t)) return new URL(t);
    if (/^www\./i.test(t)) return new URL(`https://${t}`);
    if (/^[a-z0-9-]+\.[a-z]{2,}(\/|$)/i.test(t)) return new URL(`https://${t}`);
    return null;
  } catch {
    return null;
  }
}

export function detect(text) {
  const content = normalize(text);
  if (!content) {
    return { contentType: "text", suggestedCategoryId: "general", suggestedLabel: "" };
  }

  if (EMAIL_RE.test(content)) {
    const user = content.split("@")[0] || "";
    const suggestedLabel = user && user.length <= 24 ? `${user}@…` : "Email";
    return { contentType: "email", suggestedCategoryId: "email", suggestedLabel };
  }

  const url = tryParseUrl(content);
  if (url) {
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    const isSocial = SOCIAL_HOSTNAMES.has(hostname);
    const suggestedLabel = hostname.split(".")[0]?.slice(0, 1).toUpperCase() + hostname.split(".")[0]?.slice(1) || "Link";
    return {
      contentType: "link",
      suggestedCategoryId: isSocial ? "socials" : "general",
      suggestedLabel
    };
  }

  return { contentType: "text", suggestedCategoryId: "general", suggestedLabel: "" };
}

