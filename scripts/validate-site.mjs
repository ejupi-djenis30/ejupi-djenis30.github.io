import { readFile, readdir, stat } from "node:fs/promises";

const SITE_URL = "https://ejupi-djenis30.github.io/";
const PROJECT_URLS = [
  `${SITE_URL}careeros-local/`,
  `${SITE_URL}PsychologistRustBot/`,
  `${SITE_URL}Dig/`,
  `${SITE_URL}DjenisAiAgent/`,
  `${SITE_URL}IntegraDraw/`,
  `${SITE_URL}vector-placement-operations/`,
];
const siteRoot = new URL("../site/", import.meta.url);
const repositoryRoot = new URL("../", siteRoot);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function relativeLuminance(hexColor) {
  const channels = hexColor
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (
      channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    ));

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(foreground, background) {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((left, right) => right - left);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

const [html, notFound, styles, robots, sitemap, favicon, packageText] = await Promise.all([
  readFile(new URL("index.html", siteRoot), "utf8"),
  readFile(new URL("404.html", siteRoot), "utf8"),
  readFile(new URL("styles.css", siteRoot), "utf8"),
  readFile(new URL("robots.txt", siteRoot), "utf8"),
  readFile(new URL("sitemap.xml", siteRoot), "utf8"),
  readFile(new URL("favicon.svg", siteRoot), "utf8"),
  readFile(new URL("package.json", repositoryRoot), "utf8"),
]);
const packageJson = JSON.parse(packageText);

for (const token of [
  'lang="en"',
  '<main id="main" tabindex="-1">',
  "<h1",
  "Skip to the projects",
  `rel="canonical" href="${SITE_URL}"`,
  `property="og:url" content="${SITE_URL}"`,
  "base-uri 'none'",
  "No tracking. No remote fonts. No personal data collected.",
]) {
  assert(html.includes(token), `index.html is missing ${token}`);
}

const projectLinks = [...html.matchAll(/<a href="(https:\/\/ejupi-djenis30\.github\.io\/[^"]+\/)">/g)]
  .map(([, url]) => url);
assert(projectLinks.length === PROJECT_URLS.length, "The public index must contain six project links.");
assert(new Set(projectLinks).size === projectLinks.length, "Project links must be unique.");
for (const url of PROJECT_URLS) {
  assert(projectLinks.includes(url), `The public index is missing ${url}`);
  assert(sitemap.includes(`<loc>${url}</loc>`), `The sitemap is missing ${url}`);
}

assert(
  robots === `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`,
  "robots.txt must explicitly allow the origin and point to the sitemap.",
);
assert(
  sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')
    && sitemap.includes(`<loc>${SITE_URL}</loc>`),
  "sitemap.xml must be a stable UTF-8 sitemap for the user Pages origin.",
);
assert(/<meta name="robots" content="noindex"/.test(notFound), "404.html must stay out of search results.");
assert(/<title\b/.test(favicon) && /<desc\b/.test(favicon), "The favicon must have accessible text.");
assert(
  favicon.includes('<rect x="40" y="100" width="64" height="312"/>')
    && favicon.includes('<rect x="270" y="100" width="30" height="312"/>'),
  "The favicon must preserve the bold E and slim L construction.",
);
assert(!/<script\b/i.test(html), "The index must remain script-free.");
assert(
  !/frame-ancestors|upgrade-insecure-requests/.test(html),
  "Meta CSP must not contain header-only directives or break HTTP-based local verification.",
);
assert(!/@import|https?:\/\/[^)'"]+\.(?:css|woff2?)/i.test(styles), "The site must not load remote CSS or fonts.");
const paper = styles.match(/--paper:\s*(#[0-9a-f]{6})/i)?.[1];
const oxideDark = styles.match(/--oxide-dark:\s*(#[0-9a-f]{6})/i)?.[1];
assert(paper && oxideDark, "The paper and dark oxide color tokens must use six-digit hex values.");
assert(
  contrastRatio(oxideDark, paper) >= 4.5,
  "The dark oxide accent must meet WCAG AA contrast against the paper background.",
);
assert(
  styles.includes(".project-card:nth-child(4n + 1)")
    && styles.includes(".project-card:nth-child(4n + 4)")
    && styles.includes(".project-card:nth-child(odd)"),
  "The alternating orange and white project rhythm is missing.",
);

for (const path of [
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "playwright.config.mjs",
  "scripts/serve-site.mjs",
  "e2e/site.spec.mjs",
  ".github/workflows/ci.yml",
  ".github/workflows/pages.yml",
]) {
  await stat(new URL(path, repositoryRoot));
}

const entries = await readdir(siteRoot);
assert(entries.includes("social-preview.png"), "The shared Ejupi Labs social preview is missing.");
assert(packageJson.homepage === SITE_URL, "package.json must declare the root user Pages URL.");
assert(packageJson.license === "MIT", "package.json must declare the MIT license.");
assert(packageJson.devDependencies?.["@playwright/test"] === "1.61.1", "Playwright must be exactly pinned.");

console.log("Ejupi Labs open-source index validation passed.");
