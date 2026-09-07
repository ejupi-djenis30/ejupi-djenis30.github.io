# Ejupi Labs open-source index

This repository publishes the root site at
[ejupi-djenis30.github.io](https://ejupi-djenis30.github.io/).

It has four jobs:

- provide one clear editorial archive for the maintained public products;
- publish the origin-level `robots.txt` and sitemap used by every project page;
- publish the origin-level `.well-known/security.txt` vulnerability-reporting policy;
- return a deliberate, useful 404 page instead of GitHub’s default response.

The site is static, uses no executable browser JavaScript and has no analytics,
remote fonts or personal data collection. Project links use their canonical
GitHub Pages paths; JDoor is published only at
[ejupi-djenis30.github.io/JDoor/](https://ejupi-djenis30.github.io/JDoor/).
The user Pages origin does not declare a `CNAME` or any custom subdomain.

## Local verification

```bash
npm ci
npm run check
npm run test:e2e
```

The browser suite checks the complete archive, the canonical Ejupi Labs
wordmark, responsive containment, crawler and security-policy assets, keyboard
navigation and the 404 contract.

Each project record links directly to its product, source and CI workflow so a
reader can inspect the implementation and the latest automated checks. CI links
are evidence entry points, not a claim that every platform or workflow passes.

## Main portfolio

The company portfolio and engineering case studies live at
[ejupilabs.com](https://ejupilabs.com/).

Released under the [MIT License](LICENSE).
