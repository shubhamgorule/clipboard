export const BUILTIN_CATEGORIES = [
  { id: "general", name: "General", builtin: true, order: 0 },
  { id: "email", name: "Email ID", builtin: true, order: 1 },
  { id: "socials", name: "Socials", builtin: true, order: 2 }
];

export const DEFAULT_SETTINGS = {
  smartRouting: true,
  tabAssist: true,
  searchScope: "category" // 'category' | 'all'
};

export const SOCIAL_HOSTNAMES = new Set([
  "x.com",
  "twitter.com",
  "instagram.com",
  "linkedin.com",
  "github.com",
  "facebook.com",
  "threads.net",
  "tiktok.com",
  "youtube.com"
]);

