import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";

const SITE_URL = "https://ejupi-djenis30.github.io/";
const JDOOR_NOTE_URL = `${SITE_URL}jdoor/`;
const JDOOR_PRODUCT_URL = `${SITE_URL}JDoor/`;
const JDOOR_SOURCE_URL = "https://github.com/NobodyToListen/JDoor";
const JDOOR_CASE_STUDY_URL = "https://blog.ejupilabs.com/case-studies/jdoor-security-lab/";
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
  JDOOR_NOTE_URL,
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
  jdoorPage,
  legacyElizaRedirect,
  notFound,
  styles,
  robots,
  sitemap,
  favicon,
  wordmark,
  socialPreview,
  socialPreviewSource,
  jdoorSocialPreview,
  jdoorSocialPreviewSource,
  packageText,
] = await Promise.all([
  readFile(new URL("index.html", siteRoot), "utf8"),
  readFile(new URL("jdoor/index.html", siteRoot), "utf8"),
  readFile(new URL("PsychologistRustBot/index.html", siteRoot), "utf8"),
  readFile(new URL("404.html", siteRoot), "utf8"),
  readFile(new URL("styles.css", siteRoot), "utf8"),
  readFile(new URL("robots.txt", siteRoot), "utf8"),
  readFile(new URL("sitemap.xml", siteRoot), "utf8"),
  readFile(new URL("favicon.svg", siteRoot), "utf8"),
  readFile(new URL("brand/ejupi-labs-primary-carbon.svg", siteRoot)),
  readFile(new URL("social-preview.png", siteRoot)),
  readFile(new URL("social-preview.svg", siteRoot), "utf8"),
  readFile(new URL("jdoor-social-preview.png", siteRoot)),
  readFile(new URL("jdoor-social-preview.svg", siteRoot), "utf8"),
  readFile(new URL("package.json", repositoryRoot), "utf8"),
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
const retiredJdoorHostname = "jdoor.ejupilabs.com";
const publicDocumentUrls = [
  ...absoluteDocumentUrls(html),
  ...absoluteDocumentUrls(jdoorPage),
];
assert(
  publicDocumentUrls.every(({ hostname }) => hostname !== retiredJdoorHostname),
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

assert(
  html.includes(`href="./jdoor/">Read the engineering note`),
  "The JDoor record must preserve the local engineering note as secondary context.",
);
assert(!html.includes("index-board"), "The old diagrammatic index board must stay removed.");
assert(!/treasure hunt/i.test(html), "The old campaign slogan must stay removed.");
assert(
  !/<img\b[^>]*src="(?:\.\/|\/)favicon\.svg"/i.test(html),
  "The square favicon must not be used as the visible Ejupi Labs brand.",
);

for (const token of [
  'lang="en"',
  '<main id="main" tabindex="-1">',
  `rel="canonical" href="${JDOOR_NOTE_URL}"`,
  'property="og:locale" content="en_CH"',
  "default-src 'none'",
  "JDoor Assist / Engineering record",
  "Working source. Deliberate limits.",
  "Versioned code is not the same as a release.",
  "No v1.0.0 tag, GitHub release",
  'id="fit"',
  'id="decisions"',
  'role="table"',
  "Choose something else",
  `href="${JDOOR_PRODUCT_URL}"`,
  `href="${JDOOR_SOURCE_URL}"`,
  `href="${JDOOR_CASE_STUDY_URL}"`,
  'href="https://github.com/NobodyToListen/JDoor/blob/main/docs/DEVELOPMENT.md"',
  'href="https://github.com/NobodyToListen/JDoor/blob/main/docs/THREAT_MODEL.md"',
  'src="/brand/ejupi-labs-primary-carbon.svg"',
  'content="https://ejupi-djenis30.github.io/jdoor-social-preview.png"',
  'content="JDoor Assist engineering record: source 1.0.0, manual distribution and explicit design trade-offs."',
]) {
  assert(jdoorPage.includes(token), `jdoor/index.html is missing ${token}`);
}
assert(
  !/<(?:iframe|form|input|button)\b/i.test(jdoorPage),
  "The JDoor engineering record must not include interactive runtime surfaces.",
);
const jdoorScripts = [...jdoorPage.matchAll(/<script\b([^>]*)>/gi)];
assert(
  jdoorScripts.length === 1 && /type="application\/ld\+json"/i.test(jdoorScripts[0][1]),
  "The JDoor record may contain only its non-executable JSON-LD script.",
);
const jdoorStructuredDataMatch = jdoorPage.match(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
);
assert(jdoorStructuredDataMatch, "The JDoor record must publish JSON-LD.");
const jdoorStructuredData = JSON.parse(jdoorStructuredDataMatch[1]);
assert(jdoorStructuredData["@type"] === "TechArticle", "JDoor JSON-LD must describe a TechArticle.");
assert(
  jdoorStructuredData.datePublished === "2026-07-27"
    && jdoorStructuredData.dateModified === "2026-07-28",
  "JDoor JSON-LD must preserve the page publication date and current editorial revision.",
);
assert(
  jdoorStructuredData.about?.softwareVersion === "1.0.0"
    && jdoorStructuredData.about?.codeRepository === JDOOR_SOURCE_URL,
  "JDoor JSON-LD must identify the verified source version and repository.",
);
assert(
  jdoorStructuredData.contributor?.name === "Project collaborator"
    && !jdoorStructuredData.contributor?.url,
  "JDoor JSON-LD must acknowledge collaboration without publishing a collaborator identity.",
);
assert(
  !/>\s*NobodyToListen\s*</u.test(jdoorPage),
  "The JDoor record must not publish a collaborator username as visible copy.",
);
assert(
  !/<a\b[^>]*(?:\bdownload\b|href="[^"]+\.(?:exe|jar|msi|zip)(?:[?#][^"]*)?")/i.test(jdoorPage),
  "The JDoor engineering record must not expose an unverified executable download.",
);
assert(!/PRE-RELEASE|Download — in preparation/i.test(jdoorPage), "Stale pre-release copy must stay removed.");
for (const claim of [
  "Java 21 + Swing",
  "Direct trusted LAN",
  "Ephemeral TLS + exact pin + code",
  "Bounded protocol + view-only start",
  "Cost accepted",
]) {
  assert(jdoorPage.includes(claim), `The concise decision record is missing ${claim}.`);
}
assert(
  !/<img\b[^>]*src="(?:\.\/|\/)favicon\.svg"/i.test(jdoorPage),
  "The square favicon must not be used as the visible Ejupi Labs brand on the JDoor note.",
);

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
  jdoorSocialPreview.subarray(1, 4).toString("ascii") === "PNG"
    && jdoorSocialPreview.readUInt32BE(16) === 1200
    && jdoorSocialPreview.readUInt32BE(20) === 630,
  "The JDoor social preview must be a dedicated 1200 × 630 PNG.",
);
for (const [name, source] of [
  ["shared", socialPreviewSource],
  ["JDoor", jdoorSocialPreviewSource],
]) {
  assert(
    source.includes('href="./brand/ejupi-labs-primary-carbon.svg"'),
    `The editable ${name} social preview must reuse the canonical wordmark asset.`,
  );
}
assert(!/<script\b/i.test(html), "The product archive must remain script-free.");
assert(
  !/frame-ancestors|upgrade-insecure-requests/.test(html)
    && !/frame-ancestors|upgrade-insecure-requests/.test(jdoorPage),
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
  ".record-panel",
  ".fit-grid",
  ".decision-table",
  ".record-links",
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
assert(entries.includes("jdoor-social-preview.png"), "The dedicated JDoor social preview is missing.");
assert(entries.includes("jdoor-social-preview.svg"), "The editable JDoor social preview source is missing.");
assert(entries.includes("brand"), "The canonical Ejupi Labs brand directory is missing.");
assert(entries.includes("jdoor"), "The JDoor engineering-note directory is missing.");
assert(entries.includes("PsychologistRustBot"), "The legacy ELIZA compatibility directory is missing.");
assert(packageJson.homepage === SITE_URL, "package.json must declare the root user Pages URL.");
assert(packageJson.license === "MIT", "package.json must declare the MIT license.");
assert(packageJson.devDependencies?.["@playwright/test"] === "1.61.1", "Playwright must be exactly pinned.");

console.log("Ejupi Labs open-source archive validation passed.");
