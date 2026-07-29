import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
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
  assert.match(html, /href="\.\/jdoor\/">Read the engineering note/);
});

test("the public pages use the canonical full Ejupi Labs wordmark", async () => {
  const [index, jdoor, wordmark] = await Promise.all([
    readFile(new URL("index.html", siteRoot), "utf8"),
    readFile(new URL("jdoor/index.html", siteRoot), "utf8"),
    readFile(new URL("brand/ejupi-labs-primary-carbon.svg", siteRoot)),
  ]);
  assert.match(index, /src="\.\/brand\/ejupi-labs-primary-carbon\.svg"/);
  assert.match(jdoor, /src="\/brand\/ejupi-labs-primary-carbon\.svg"/);
  assert.equal(
    createHash("sha256").update(wordmark).digest("hex"),
    "02e2b85c994f2d6080a906dd0411728a7da271206e5694198a99ccd30c995c2c",
  );
});

test("the crawler policy applies to the entire GitHub Pages origin", async () => {
  const robots = await readFile(new URL("robots.txt", siteRoot), "utf8");
  assert.equal(
    robots,
    "User-agent: *\nAllow: /\nSitemap: https://ejupi-djenis30.github.io/sitemap.xml\n",
  );
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

test("the public pages have no executable JavaScript or remote font dependency", async () => {
  const [html, jdoorPage, styles] = await Promise.all([
    readFile(new URL("index.html", siteRoot), "utf8"),
    readFile(new URL("jdoor/index.html", siteRoot), "utf8"),
    readFile(new URL("styles.css", siteRoot), "utf8"),
  ]);
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(jdoorPage, /<(?:iframe|form|input|button)\b/i);
  const scripts = [...jdoorPage.matchAll(/<script\b([^>]*)>/gi)];
  assert.equal(scripts.length, 1);
  assert.match(scripts[0][1], /type="application\/ld\+json"/i);
  assert.doesNotMatch(styles, /@import|https?:\/\/[^)'"]+\.(?:css|woff2?)/i);
});

test("the JDoor page is a complementary engineering record with precise distribution status", async () => {
  const html = await readFile(new URL("jdoor/index.html", siteRoot), "utf8");
  assert.match(
    html,
    /rel="canonical" href="https:\/\/ejupi-djenis30\.github\.io\/jdoor\/"/i,
  );
  assert.match(html, /JDoor Assist \/ Engineering record/);
  assert.match(html, /Working source\. Deliberate limits\./);
  assert.match(html, /No v1\.0\.0 tag, GitHub release\s+or signed installer is published/);
  assert.match(html, /Distribution<\/dt><dd>Manual/);
  assert.doesNotMatch(html, /PRE-RELEASE|Download — in preparation/i);
  assert.match(
    html,
    /content="https:\/\/ejupi-djenis30\.github\.io\/jdoor-social-preview\.png"/,
  );
  assert.doesNotMatch(
    html,
    /(?:property="og:image"|name="twitter:image")\s+content="https:\/\/ejupi-djenis30\.github\.io\/social-preview\.png"/,
  );
  assert.match(html, /href="https:\/\/ejupi-djenis30\.github\.io\/JDoor\/"/);
  assert.doesNotMatch(html, /jdoor\.ejupilabs\.com/iu);
  assert.doesNotMatch(html, />\s*NobodyToListen\s*</u);
  assert.match(html, /href="https:\/\/github\.com\/NobodyToListen\/JDoor"/);
  assert.match(
    html,
    /href="https:\/\/blog\.ejupilabs\.com\/case-studies\/jdoor-security-lab\/"/,
  );
  assert.doesNotMatch(
    html,
    /<a\b[^>]*(?:\bdownload\b|href="[^"]+\.(?:exe|jar|msi|zip)(?:[?#][^"]*)?")/i,
  );
  for (const choice of [
    "Java 21 + Swing",
    "Direct trusted LAN",
    "Ephemeral TLS + exact pin + code",
    "Bounded protocol + view-only start",
  ]) {
    assert.match(html, new RegExp(choice.replaceAll("+", "\\+")));
  }
  assert.equal((html.match(/class="fit-column fit-column--(?:yes|no)"/g) ?? []).length, 2);
  assert.equal((html.match(/<article role="row">/g) ?? []).length, 4);

  const structuredData = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1],
  );
  assert.equal(structuredData["@type"], "TechArticle");
  assert.equal(structuredData.datePublished, "2026-07-27");
  assert.equal(structuredData.dateModified, "2026-07-28");
  assert.equal(structuredData.about.softwareVersion, "1.0.0");
  assert.equal(structuredData.about.codeRepository, "https://github.com/NobodyToListen/JDoor");
  assert.equal(structuredData.about.url, "https://ejupi-djenis30.github.io/JDoor/");
  assert.equal(structuredData.contributor.name, "Project collaborator");
});
