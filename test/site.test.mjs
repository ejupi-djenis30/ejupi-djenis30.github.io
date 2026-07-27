import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const siteRoot = new URL("../site/", import.meta.url);

test("the project index contains exactly seven unique destinations", async () => {
  const html = await readFile(new URL("index.html", siteRoot), "utf8");
  const links = [...html.matchAll(/<a href="(https:\/\/ejupi-djenis30\.github\.io\/[^"]+\/)">/g)]
    .map(([, url]) => url);
  assert.equal(links.length, 7);
  const destinations = new Set(links);
  assert.equal(destinations.size, 7);
  assert.ok(destinations.has("https://ejupi-djenis30.github.io/jdoor/"));
});

test("the crawler policy applies to the entire GitHub Pages origin", async () => {
  const robots = await readFile(new URL("robots.txt", siteRoot), "utf8");
  assert.equal(
    robots,
    "User-agent: *\nAllow: /\nSitemap: https://ejupi-djenis30.github.io/sitemap.xml\n",
  );
});

test("the public page has no executable JavaScript or remote font dependency", async () => {
  const [html, jdoorPage, styles] = await Promise.all([
    readFile(new URL("index.html", siteRoot), "utf8"),
    readFile(new URL("jdoor/index.html", siteRoot), "utf8"),
    readFile(new URL("styles.css", siteRoot), "utf8"),
  ]);
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(jdoorPage, /<(?:script|iframe|form|input|button)\b/i);
  assert.doesNotMatch(styles, /@import|https?:\/\/[^)'"]+\.(?:css|woff2?)/i);
});

test("the JDoor page is a non-executable product tour with a gated release", async () => {
  const html = await readFile(new URL("jdoor/index.html", siteRoot), "utf8");
  assert.match(
    html,
    /rel="canonical" href="https:\/\/ejupi-djenis30\.github\.io\/jdoor\/"/i,
  );
  assert.match(html, /No remote-control session runs from this page\./);
  assert.match(html, /Download — in preparation/);
  assert.match(html, /href="https:\/\/github\.com\/NobodyToListen\/JDoor"/);
  assert.match(
    html,
    /href="https:\/\/blog\.ejupilabs\.com\/case-studies\/jdoor-security-lab\/"/,
  );
  assert.doesNotMatch(
    html,
    /<a\b[^>]*(?:\bdownload\b|href="[^"]+\.(?:exe|jar|msi|zip)(?:[?#][^"]*)?")/i,
  );
});
