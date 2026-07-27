# Ejupi Labs open-source index

This repository publishes the root site at
[ejupi-djenis30.github.io](https://ejupi-djenis30.github.io/).

It has three jobs:

- provide one clear index for the maintained public projects;
- host a script-free product tour when a project cannot safely run in the browser;
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

The browser suite checks the complete index, responsive containment, crawler
assets, keyboard navigation and the 404 contract.

## Main portfolio

The company portfolio and engineering case studies live at
[ejupilabs.com](https://ejupilabs.com/).

Released under the [MIT License](LICENSE).
