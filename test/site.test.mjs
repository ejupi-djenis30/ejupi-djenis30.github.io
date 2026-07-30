import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const siteRoot = new URL("../site/", import.meta.url);

test("the product archive contains exactly seven canonical destinations", async () => {
  const html = await readFile(new URL("index.html", siteRoot), "utf8");
  const links = [...html.matchAll(/<a\s+data-product-link\b[^>]*\bhref="([^"]+)"/g)]
    .map(([, url]) => url);
  assert.deepEqual(links, [
    "https://ejupi-djenis30.github.io/careeros-local/",
    "https://ejupi-djenis30.github.io/eliza-lab/",
    "https://ejupi-djenis30.github.io/DjenisAiAgent/",
    "https://ejupi-djenis30.github.io/Dig/",
    "https://ejupi-djenis30.github.io/IntegraDraw/",
    "https://ejupi-djenis30.github.io/vector-placement-operations/",
    "https://ejupi-djenis30.github.io/JDoor/",
  ]);
  assert.equal(new Set(links).size, 7);
  assert.match(html, /<h3>CareerOS Local<\/h3>/);
  assert.match(html, /aria-label="CareerOS Local technologies"/);
  assert.match(html, />Djenis<wbr \/>AiAgent<\/h3>/);
  assert.doesNotMatch(html, />Djenis(?:\s+AI|AI)</);
  assert.equal(
    links.filter((url) => url === "https://ejupi-djenis30.github.io/JDoor/").length,
    1,
  );
  assert.doesNotMatch(html, /\/jdoor\//);
});

test("the public archive uses the canonical full Ejupi Labs wordmark", async () => {
  const [index, wordmark] = await Promise.all([
    readFile(new URL("index.html", siteRoot), "utf8"),
    readFile(new URL("brand/ejupi-labs-primary-carbon.svg", siteRoot)),
  ]);
  assert.match(index, /src="\.\/brand\/ejupi-labs-primary-carbon\.svg"/);
  assert.equal(
    createHash("sha256").update(wordmark).digest("hex"),
    "02e2b85c994f2d6080a906dd0411728a7da271206e5694198a99ccd30c995c2c",
  );
});

test("the crawler and vulnerability-reporting policies apply to the Pages origin", async () => {
  const [robots, securityTxt, pagesWorkflow] = await Promise.all([
    readFile(new URL("robots.txt", siteRoot), "utf8"),
    readFile(new URL(".well-known/security.txt", siteRoot), "utf8"),
    readFile(new URL("../.github/workflows/pages.yml", siteRoot), "utf8"),
  ]);
  assert.equal(
    robots,
    "User-agent: *\nAllow: /\nSitemap: https://ejupi-djenis30.github.io/sitemap.xml\n",
  );
  assert.equal(
    securityTxt,
    [
      "Contact: mailto:info@ejupilabs.com",
      "Expires: 2027-07-29T23:59:59Z",
      "Preferred-Languages: en",
      "Canonical: https://ejupi-djenis30.github.io/.well-known/security.txt",
      "Policy: https://github.com/ejupi-djenis30/ejupi-djenis30.github.io/security/policy",
      "",
    ].join("\n"),
  );
  assert.match(pagesWorkflow, /include-hidden-files:\s+true/u);
});

test("the former ELIZA project path forwards to its renamed GitHub Page", async () => {
  const [html, sitemap] = await Promise.all([
    readFile(new URL("PsychologistRustBot/index.html", siteRoot), "utf8"),
    readFile(new URL("sitemap.xml", siteRoot), "utf8"),
  ]);
  assert.match(
    html,
    /http-equiv="refresh" content="0; url=https:\/\/ejupi-djenis30\.github\.io\/eliza-lab\/"/u,
  );
  assert.match(
    html,
    /rel="canonical" href="https:\/\/ejupi-djenis30\.github\.io\/eliza-lab\/"/u,
  );
  assert.match(html, /<a class="button button-dark" href="https:\/\/ejupi-djenis30\.github\.io\/eliza-lab\/">/u);
  assert.match(html, /<h1>ELIZA Lab has moved\.<\/h1>/u);
  assert.doesNotMatch(sitemap, /PsychologistRustBot/u);
});

test("the public archive has no executable JavaScript or remote font dependency", async () => {
  const [html, styles] = await Promise.all([
    readFile(new URL("index.html", siteRoot), "utf8"),
    readFile(new URL("styles.css", siteRoot), "utf8"),
  ]);
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(styles, /@import|https?:\/\/[^)'"]+\.(?:css|woff2?)/i);
});

test("JDoor has one canonical project Page and no custom-domain configuration", async () => {
  const [html, sitemap, entries] = await Promise.all([
    readFile(new URL("index.html", siteRoot), "utf8"),
    readFile(new URL("sitemap.xml", siteRoot), "utf8"),
    readdir(siteRoot),
  ]);
  assert.equal(
    (html.match(/https:\/\/ejupi-djenis30\.github\.io\/JDoor\//gu) ?? []).length,
    1,
  );
  assert.equal(
    (sitemap.match(/<loc>https:\/\/ejupi-djenis30\.github\.io\/JDoor\/<\/loc>/gu) ?? []).length,
    1,
  );
  assert.doesNotMatch(html, /\/jdoor\//);
  assert.doesNotMatch(sitemap, /\/jdoor\//);
  assert.doesNotMatch(html, /jdoor\.ejupilabs\.com/i);
  assert.equal(entries.includes("jdoor"), false);
  assert.equal(entries.includes("CNAME"), false);
});
