# Ejupi Labs open-source index

This repository publishes the root site at
[ejupi-djenis30.github.io](https://ejupi-djenis30.github.io/).

It has four jobs:

- provide one clear editorial archive for the maintained public products;
- host a script-free engineering note when a project needs additional context;
- publish the origin-level `robots.txt` and sitemap used by every project page;
- return a deliberate, useful 404 page instead of GitHub’s default response.

The site is static, script-free and uses no analytics, remote fonts or personal
data collection.

## Local verification

```bash
npm ci
npm run check
npm run test:e2e
```

The browser suite checks the complete archive, the canonical Ejupi Labs
wordmark, responsive containment, crawler assets, keyboard navigation and the
404 contract.

## Main portfolio

The company portfolio and engineering case studies live at
[ejupilabs.com](https://ejupilabs.com/).

Released under the [MIT License](LICENSE).
