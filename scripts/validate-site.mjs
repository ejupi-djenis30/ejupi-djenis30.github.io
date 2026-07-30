import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";

const SITE_URL = "https://ejupi-djenis30.github.io/";
const JDOOR_PRODUCT_URL = `${SITE_URL}JDoor/`;
const SECURITY_TXT_URL = `${SITE_URL}.well-known/security.txt`;
const SECURITY_POLICY_URL =
  "https://github.com/ejupi-djenis30/ejupi-djenis30.github.io/security/policy";
const PROJECT_URLS = [
  `${SITE_URL}careeros-local/`,
  `${SITE_URL}eliza-lab/`,
  `${SITE_URL}DjenisAiAgent/`,
  `${SITE_URL}Dig/`,
  `${SITE_URL}IntegraDraw/`,
  `${SITE_URL}vector-placement-operations/`,
  JDOOR_PRODUCT_URL,
];
const SITEMAP_URLS = [
  SITE_URL,
  ...PROJECT_URLS.filter((url) => url.startsWith(SITE_URL)),
];
const CANONICAL_WORDMARK_SHA256 = "02e2b85c994f2d6080a906dd0411728a7da271206e5694198a99ccd30c995c2c";
const siteRoot = new URL("../site/", import.meta.url);
const repositoryRoot = new URL("../", siteRoot);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function absoluteDocumentUrls(source) {
  return [...source.matchAll(/\b(?:href|content)="(https:\/\/[^"]+)"/gu)]
    .map(([, destination]) => new URL(destination));
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

const [
  html,
  legacyElizaRedirect,
  notFound,
  styles,
  robots,
  sitemap,
  securityTxt,
  favicon,
  wordmark,
  socialPreview,
  socialPreviewSource,
  packageText,
  pagesWorkflow,
] = await Promise.all([
  readFile(new URL("index.html", siteRoot), "utf8"),
  readFile(new URL("PsychologistRustBot/index.html", siteRoot), "utf8"),
  readFile(new URL("404.html", siteRoot), "utf8"),
  readFile(new URL("styles.css", siteRoot), "utf8"),
  readFile(new URL("robots.txt", siteRoot), "utf8"),
  readFile(new URL("sitemap.xml", siteRoot), "utf8"),
  readFile(new URL(".well-known/security.txt", siteRoot), "utf8"),
  readFile(new URL("favicon.svg", siteRoot), "utf8"),
  readFile(new URL("brand/ejupi-labs-primary-carbon.svg", siteRoot)),
  readFile(new URL("social-preview.png", siteRoot)),
  readFile(new URL("social-preview.svg", siteRoot), "utf8"),
  readFile(new URL("package.json", repositoryRoot), "utf8"),
  readFile(new URL(".github/workflows/pages.yml", repositoryRoot), "utf8"),
]);
const packageJson = JSON.parse(packageText);

for (const token of [
  'lang="en"',
  '<main id="main" tabindex="-1">',
  "<h1",
  "Skip to the product archive",
  `rel="canonical" href="${SITE_URL}"`,
  `property="og:url" content="${SITE_URL}"`,
  'property="og:locale" content="en_CH"',
  'property="og:image:alt"',
  "base-uri 'none'",
  "Maintained product archive · script-free, no tracking or remote fonts.",
  'src="./brand/ejupi-labs-primary-carbon.svg"',
]) {
  assert(html.includes(token), `index.html is missing ${token}`);
}

const projectLinks = [...html.matchAll(/<a\s+data-product-link\b[^>]*\bhref="([^"]+)"/g)]
  .map(([, url]) => url);
assert(
  projectLinks.length === PROJECT_URLS.length,
  `The public archive must contain ${PROJECT_URLS.length} product links.`,
);
assert(new Set(projectLinks).size === projectLinks.length, "Product links must be unique.");
assert(
  projectLinks.every((url, index) => url === PROJECT_URLS[index]),
  "Product links must follow the canonical portfolio order.",
);
for (const url of PROJECT_URLS) {
  assert(projectLinks.includes(url), `The public archive is missing ${url}`);
}
for (const url of SITEMAP_URLS) {
  assert(sitemap.includes(`<loc>${url}</loc>`), `The sitemap is missing ${url}`);
}
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/gu)]
  .map(([, url]) => url);
assert(
  sitemapUrls.length === SITEMAP_URLS.length
    && sitemapUrls.every((url, index) => url === SITEMAP_URLS[index]),
  "The sitemap must contain only the canonical origin and project Pages URLs.",
);
assert(
  projectLinks.filter((url) => url === JDOOR_PRODUCT_URL).length === 1
    && !html.includes("/jdoor/")
    && !sitemap.includes("/jdoor/"),
  "JDoor must be advertised exactly once at its case-sensitive /JDoor/ Page.",
);
assert(
  absoluteDocumentUrls(html).every(({ hostname }) => hostname !== "jdoor.ejupilabs.com"),
  "The retired JDoor custom domain must not remain in public document URLs.",
);
for (const token of [
  '<meta name="robots" content="noindex, follow"',
  'http-equiv="refresh" content="0; url=https://ejupi-djenis30.github.io/eliza-lab/"',
  'rel="canonical" href="https://ejupi-djenis30.github.io/eliza-lab/"',
  'href="https://ejupi-djenis30.github.io/eliza-lab/"',
  "ELIZA Lab has moved.",
]) {
  assert(legacyElizaRedirect.includes(token), `The ELIZA compatibility page is missing ${token}`);
}
assert(
  !sitemap.includes("PsychologistRustBot"),
  "The legacy ELIZA address must stay out of the sitemap.",
);
assert(!html.includes("index-board"), "The old diagrammatic index board must stay removed.");
assert(!/treasure hunt/i.test(html), "The old campaign slogan must stay removed.");
assert(
  !/<img\b[^>]*src="(?:\.\/|\/)favicon\.svg"/i.test(html),
  "The square favicon must not be used as the visible Ejupi Labs brand.",
);

assert(
  robots === `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`,
  "robots.txt must explicitly allow the origin and point to the sitemap.",
);
assert(
  securityTxt === [
    "Contact: mailto:info@ejupilabs.com",
    "Expires: 2027-07-29T23:59:59Z",
    "Preferred-Languages: en",
    `Canonical: ${SECURITY_TXT_URL}`,
    `Policy: ${SECURITY_POLICY_URL}`,
    "",
  ].join("\n"),
  "security.txt must publish the canonical contact, expiry, language and reporting policy.",
);
const securityTxtExpires = Date.parse(
  securityTxt.match(/^Expires:\s+(.+)$/mu)?.[1] ?? "",
);
assert(
  Number.isFinite(securityTxtExpires) && securityTxtExpires > Date.now(),
  "security.txt must have a valid future expiry.",
);
assert(
  /uses:\s+actions\/upload-pages-artifact@[^\s]+[\s\S]*?with:[\s\S]*?path:\s+site[\s\S]*?include-hidden-files:\s+true/u
    .test(pagesWorkflow),
  "The Pages artifact must include .well-known/security.txt.",
);
assert(
  sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')
    && sitemap.includes(`<loc>${SITE_URL}</loc>`),
  "sitemap.xml must be a stable UTF-8 sitemap for the user Pages origin.",
);
assert(/<meta name="robots" content="noindex"/.test(notFound), "404.html must stay out of search results.");
assert(/<title\b/.test(favicon) && /<desc\b/.test(favicon), "The favicon must have accessible text.");
assert(
  favicon.includes('<rect x="116.46218" y="109.84273" width="38.714424" height="286.30588"/>')
    && favicon.includes('<rect x="290.88461" y="109.84273" width="24.525547" height="286.30588"/>')
    && favicon.includes('<rect x="415.1474" y="356.39883" width="38.301506" height="41.334988" fill="#E97A4A"/>'),
  "The favicon must match the exact studio EL construction and Signal Oxide node geometry.",
);
assert(
  createHash("sha256").update(wordmark).digest("hex") === CANONICAL_WORDMARK_SHA256,
  "The visible brand asset must be the canonical Ejupi Labs Primary Carbon wordmark.",
);
assert(
  socialPreview.subarray(1, 4).toString("ascii") === "PNG"
    && socialPreview.readUInt32BE(16) === 1200
    && socialPreview.readUInt32BE(20) === 630,
  "The social preview must be a 1200 × 630 PNG.",
);
assert(
  socialPreviewSource.includes('href="./brand/ejupi-labs-primary-carbon.svg"'),
  "The editable shared social preview must reuse the canonical wordmark asset.",
);
assert(!/<script\b/i.test(html), "The product archive must remain script-free.");
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
for (const selector of [
  ".archive-summary",
  ".project-index",
  ".project-record > article",
  ".project-actions",
]) {
  assert(styles.includes(selector), `The editorial archive styling is missing ${selector}.`);
}

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
assert(entries.includes("social-preview.svg"), "The editable shared social preview source is missing.");
assert(entries.includes("brand"), "The canonical Ejupi Labs brand directory is missing.");
assert(entries.includes(".well-known"), "The origin security-policy directory is missing.");
assert(!entries.includes("jdoor"), "The duplicate lowercase /jdoor/ Page must not be published.");
assert(!entries.includes("CNAME"), "The user Pages origin must not declare a custom domain.");
assert(entries.includes("PsychologistRustBot"), "The legacy ELIZA compatibility directory is missing.");
assert(packageJson.homepage === SITE_URL, "package.json must declare the root user Pages URL.");
assert(packageJson.license === "MIT", "package.json must declare the MIT license.");
assert(packageJson.devDependencies?.["@playwright/test"] === "1.62.0", "Playwright must be exactly pinned.");

console.log("Ejupi Labs open-source archive validation passed.");
