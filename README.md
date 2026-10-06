# DPUse App

<!-- OPENING_START -->

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml/badge.svg)](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml)

The DPUse browser application.

[Report a Vulnerability](https://github.com/dpuse/dpuse-app/security/advisories/new) · [Open an Issue](https://github.com/dpuse/dpuse-app/issues)

## About DPUse

[DPUse](https://www.dpuse.app) (Data Positioning & Use) is an in-browser application that positions your data for use through three core activities: sourcing, contextualising, and publishing.

**Sourcing** uses a library of [Connectors](https://www.dpuse.app/connectors) to establish [Connections](https://www.dpuse.app) to applications, databases, file stores, and curated datasets; these connections are subsequently used to configure structured [Data Views](https://www.dpuse.app) from the underlying sources.

**Contextualising** extracts chronological events from those [Data Views](https://www.dpuse.app) and maps them into comprehensive [Context Models](https://www.dpuse.app). This gives the DPUse Engine the structural framework needed to generate deterministic transactions, facts, or observations.

**Publishing** uses a library of [Presenters](https://www.dpuse.app) to render standard [Presentations](https://www.dpuse.app) immediately using the contextualised data; additionally, [Cookbooks](https://www.dpuse.app) of [Recipes](https://www.dpuse.app) let you build Data Apps using your preferred tools.

In addition, DPUse provides [Tools](https://www.dpuse.app) used by the application, and you can use them to construct connectors and presenters.

<!-- OPENING_END -->

## Browser Support

| Browser       | Minimum | Set by                                 |
| :------------ | ------: | :------------------------------------- |
| Chrome / Edge |     123 | `field-sizing: content`                |
| Safari / iOS  |      26 | Trusted Types, `field-sizing: content` |
| Firefox       |     148 | Trusted Types                          |

[Trusted Types](https://caniuse.com/trusted-types) is a hard requirement, not a progressive enhancement. The CSP in `public/_headers` sets `require-trusted-types-for 'script'`, and `src/main.ts` installs the `default` policy that permits the blob URLs Vite's `?worker&inline` uses. That code reads the `trustedTypes` global directly, so a browser without the API throws `ReferenceError` during bootstrap and the user gets the fatal-error banner instead of the app. Chrome and Edge have had it since 83; Safari 26 and Firefox 148 are the releases that complete the picture.

[`field-sizing: content`](https://caniuse.com/mdn-css_properties_field-sizing) (`src/components/ui/text/TextArea.vue`) only degrades — the textarea stops growing with its content — but it is what raises the Chrome floor from 83 to 123.

Everything else in use sits below these versions: container queries, `dvh`/`dvw` units, `<dialog>` with `showModal()`, `:has()`, `color-mix()` and `Intl.Segmenter` (Firefox 125, the highest of them). `browserslist` in `package.json` is the single source for the floor. Everything else derives from it: `build.target` in `vite.config.ts`, the `compat/compat` ESLint rule that fails the lint on a newer API, and — via `browserslist-useragent-regexp` — the user-agent check and the message `src/main.ts` shows a browser that is too old to boot. Change `browserslist` and all three follow on the next build; only the table above has to be edited by hand.

_Keep the table above in step with `browserslist`; nothing else needs touching._

## Domain Security

Infrastructure hosted on Cloudflare. Primary domain `dpuse.app`. Subdomains: `api.dpuse.app`, `auth.dpuse.app`, `engine-eu.dpuse.app`, `my.dpuse.app`, `sample-data-eu.dpuse.app`, `www.dpuse.app`.

| Category                 | Trusted Source                                             | Scope                                                                            |
| :----------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------- |
| Threat / Reputation      | https://transparencyreport.google.com/safe-browsing/search | Malware, phishing, unsafe site listings.                                         |
| TLS / SSL                | https://www.ssllabs.com/ssltest                            | Certificate validity, protocol support, ciphers.                                 |
| HTTP Security Headers    | https://securityheaders.com/                               | CSP, HSTS, cookie flags, browser headers.                                        |
|                          | https://csp-evaluator.withgoogle.com                       | CSP policy strength and bypass risks.                                            |
|                          | https://www.immuniweb.com/websec                           | CSP, headers, and outdated library detection. **TODO: Required business email.** |
|                          | https://developer.mozilla.org/                             | Reference for header and cookie semantics.                                       |
| DNS / DNSSEC             | https://dnsviz.net                                         | DNSSEC validation, DNS misconfiguration.                                         |
| Certificate Transparency | https://crt.sh                                             | Unauthorized or unexpected certificate issuance.                                 |

_Email security (SPF/DKIM/DMARC) is not tracked here, as no `dpuse.app` subdomain currently sends mail._ **TODO: Need to check auth.dpuse.app (Hanko) does not require this.**

<!-- USAGE_START -->

## Usage

You may view or clone this repository for your own purposes.

```bash
git clone https://github.com/dpuse/dpuse-app.git
cd dpuse-app
npm install
```

_Requires [Node.js](https://nodejs.org/) 24 or later, [npm](https://www.npmjs.com/) 12 or later, and [TypeScript](https://www.typescriptlang.org/) 6.0.3 or later._

This repository is managed using the common set of actions provided by [@dpuse/dpuse-development](https://github.com/dpuse/dpuse-development). See the `scripts` block in [package.json](https://github.com/dpuse/dpuse-app/blob/main/package.json) for details.

<!-- USAGE_END -->

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
    - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
    - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
    - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
    - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Issues

- Zoom rotation issue on iOS Safari. Zoom or double click, reset, then rotate device, reset values will be lost. Only way to correct is to close and restart the app.

<!-- DEPENDENCY_LICENSES_START -->

## Dependency Licenses

License data is updated each time `npm run document` is run, using [license-checker](https://github.com/RSeidelsohn/license-checker-rseidelsohn). The following table lists every package whose code, styles or assets are included in this project's build, as recorded by the build itself. Modules loaded at run time are not included; each documents its own. These dependencies have been checked and confirmed to use Apache-2.0, ISC, MIT, or OFL-1.1, all of which allow commercial use. All are used unmodified, so any licence conditions that apply only to modified versions are not triggered. Developers cloning this repository should independently verify development dependencies.

| Dependency                                                             | Version | License(s)              | Document                                                                      |
| :--------------------------------------------------------------------- | :-----: | :---------------------- | :---------------------------------------------------------------------------- |
| [@ag-ui/core](https://github.com/ag-ui-protocol/ag-ui)                 |  1.0.0  | MIT                     | [LICENSE](licenses/downloads/@ag-ui/core@1.0.0-LICENSE.txt)                   |
| [@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)           | 1.0.116 | MIT                     | [LICENSE](licenses/downloads/@dpuse/dpuse-shared@1.0.116-LICENSE.txt)         |
| [@fontsource-variable/inter](https://github.com/fontsource/font-files) |  5.3.0  | OFL-1.1                 | [LICENSE](licenses/downloads/@fontsource-variable/inter@5.3.0-LICENSE.txt)    |
| [@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)     |  0.6.1  | MIT                     | [LICENSE](licenses/downloads/@formkit/drag-and-drop@0.6.1-LICENSE.txt)        |
| [@lucide/vue](https://github.com/lucide-icons/lucide)                  | 1.52.0  | ISC                     | [LICENSE](licenses/downloads/@lucide/vue@1.52.0-LICENSE.txt)                  |
| [@tanstack/ai](https://github.com/TanStack/ai)                         | 0.65.0  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai@0.65.0-LICENSE.txt)                 |
| [@tanstack/ai-client](https://github.com/TanStack/ai)                  | 0.37.0  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai-client@0.37.0-LICENSE.txt)          |
| [@tanstack/store](https://github.com/TanStack/store)                   | 0.11.2  | MIT                     | [LICENSE](licenses/downloads/@tanstack/store@0.11.2-LICENSE.txt)              |
| [@tanstack/table-core](https://github.com/TanStack/table)              |  9.2.6  | MIT                     | [LICENSE](licenses/downloads/@tanstack/table-core@9.2.6-LICENSE.txt)          |
| [@tanstack/virtual-core](https://github.com/TanStack/virtual)          | 3.17.11 | MIT                     | [LICENSE](licenses/downloads/@tanstack/virtual-core@3.17.11-LICENSE.txt)      |
| [@tanstack/vue-table](https://github.com/TanStack/table)               |  9.2.6  | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-table@9.2.6-LICENSE.txt)           |
| [@tanstack/vue-virtual](https://github.com/TanStack/virtual)           | 3.13.39 | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-virtual@3.13.39-LICENSE.txt)       |
| [@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)    |  3.1.0  | MIT                     | [LICENSE](licenses/downloads/@teamhanko/hanko-frontend-sdk@3.1.0-LICENSE.txt) |
| [@vue/reactivity](https://github.com/vuejs/core)                       | 3.5.43  | MIT                     | [LICENSE](licenses/downloads/@vue/reactivity@3.5.43-LICENSE.txt)              |
| [@vue/runtime-core](https://github.com/vuejs/core)                     | 3.5.43  | MIT                     | [LICENSE](licenses/downloads/@vue/runtime-core@3.5.43-LICENSE.txt)            |
| [@vue/runtime-dom](https://github.com/vuejs/core)                      | 3.5.43  | MIT                     | [LICENSE](licenses/downloads/@vue/runtime-dom@3.5.43-LICENSE.txt)             |
| [@vue/shared](https://github.com/vuejs/core)                           | 3.5.43  | MIT                     | [LICENSE](licenses/downloads/@vue/shared@3.5.43-LICENSE.txt)                  |
| [@vueuse/core](https://github.com/vueuse/vueuse)                       | 15.0.0  | MIT                     | [LICENSE](licenses/downloads/@vueuse/core@15.0.0-LICENSE.txt)                 |
| [@vueuse/shared](https://github.com/vueuse/vueuse)                     | 15.0.0  | MIT                     | [LICENSE](licenses/downloads/@vueuse/shared@15.0.0-LICENSE.txt)               |
| [dompurify](https://github.com/cure53/DOMPurify)                       | 3.4.16  | (MPL-2.0 OR Apache-2.0) | [LICENSE](licenses/downloads/dompurify@3.4.16-LICENSE.txt)                    |
| [fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)      |  3.1.1  | MIT                     | [LICENSE](licenses/downloads/fast-json-patch@3.1.1-LICENSE.txt)               |
| [partial-json](https://github.com/promplate/partial-json-parser-js)    |  0.1.7  | MIT                     | [LICENSE](licenses/downloads/partial-json@0.1.7-LICENSE.txt)                  |
| [squire-rte](https://github.com/neilj/Squire)                          |  2.4.9  | MIT                     | [LICENSE](licenses/downloads/squire-rte@2.4.9-LICENSE.txt)                    |
| [valibot](https://github.com/open-circle/valibot)                      |  1.5.0  | MIT                     | [LICENSE](licenses/downloads/valibot@1.5.0-LICENSE.txt)                       |
| [vue-router](https://github.com/vuejs/router)                          |  5.3.1  | MIT                     | [LICENSE](licenses/downloads/vue-router@5.3.1-LICENSE.txt)                    |
| [web-vitals](https://github.com/GoogleChrome/web-vitals)               |  6.2.3  | Apache-2.0              | [LICENSE](licenses/downloads/web-vitals@6.2.3-LICENSE.txt)                    |

### Dependency Tree

The dependency tree below shows how each package in the table above is reached — direct and transitive — along with its installed version, release date, and update status. A package that does not ship itself, such as one whose parts are bundled separately, is left out and what ships beneath it is shown in its place. Packages flagged ❗ have a newer version available; ⚠️ indicates a package that hasn't been updated in the last 6 months or longer. Neither flag necessarily indicates a problem: we let new releases stabilise before upgrading, and some packages are mature and stable (have limited or no dependencies), so they require no active development.

- **[@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)** 1.0.116 — this month: 2026-10-06
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — this month: 2026-09-09
- **[@fontsource-variable/inter](https://github.com/fontsource/font-files)** 5.3.0 — 2 mths ago: 2026-07-19
- **[@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)** 0.6.1 — 3 mths ago: 2026-06-15
- **[@tanstack/ai-client](https://github.com/TanStack/ai)** 0.37.0 — this month: 2026-10-06
    - **[@tanstack/ai](https://github.com/TanStack/ai)** 0.65.0 — this month: 2026-10-06
- **[@tanstack/ai](https://github.com/TanStack/ai)** 0.65.0 — this month: 2026-10-06
    - **[@ag-ui/core](https://github.com/ag-ui-protocol/ag-ui)** 1.0.0 — this month: 2026-09-17 → latest: 1.0.2 — this month: 2026-10-05 ❗
    - **[fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)** 3.1.1 — 54 mths ago: 2022-03-24 ⚠️
    - **[partial-json](https://github.com/promplate/partial-json-parser-js)** 0.1.7 — 28 mths ago: 2024-05-14 ⚠️
- **[@tanstack/vue-table](https://github.com/TanStack/table)** 9.2.6 — this month: 2026-10-04
    - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — this month: 2026-09-29
    - **[@tanstack/table-core](https://github.com/TanStack/table)** 9.2.6 — this month: 2026-10-04
        - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — this month: 2026-09-29
- **[@tanstack/vue-virtual](https://github.com/TanStack/virtual)** 3.13.39 — this month: 2026-09-14
    - **[@tanstack/virtual-core](https://github.com/TanStack/virtual)** 3.17.11 — this month: 2026-09-14
- **[@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)** 3.1.0 — this month: 2026-10-01
- **[@vueuse/core](https://github.com/vueuse/vueuse)** 15.0.0 — this month: 2026-09-16
    - **[@vueuse/shared](https://github.com/vueuse/vueuse)** 15.0.0 — this month: 2026-09-16
- **[dompurify](https://github.com/cure53/DOMPurify)** 3.4.16 — this month: 2026-09-23
- **[squire-rte](https://github.com/neilj/Squire)** 2.4.9 — this month: 2026-09-15
- **[vue-router](https://github.com/vuejs/router)** 5.3.1 — 1 mth ago: 2026-09-02
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
- **[@vue/runtime-dom](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
    - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
    - **[@vue/runtime-core](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
        - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
- **[web-vitals](https://github.com/GoogleChrome/web-vitals)** 6.2.3 — this month: 2026-10-05
- **[@lucide/vue](https://github.com/lucide-icons/lucide)** 1.52.0 — this month: 2026-10-04

<!-- DEPENDENCY_LICENSES_END -->

<!-- BUNDLE_START -->

## Bundle Analysis

This report is updated with each release, from the bundle the release builds, using [Sonda](https://sonda.dev/), which analyses final source maps to reveal the actual effects of tree-shaking and minification rather than relying on pre-build estimates.

_Note: Sonda's Vite reports currently exclude CSS files, since Vite does not generate source maps for CSS._

| Chunk/Module/File                                                            | Composition                                  |
| :--------------------------------------------------------------------------- | :------------------------------------------- |
| **dist/client/assets/ChatPanel-DA6c02qO.js**                                 | 196.9 kB · gzip 53.3 kB · 22.8% of the build |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client                                  | `█████████░░░░░░░░░░░` 43.0% · 84.6 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai                                         | `████████░░░░░░░░░░░░` 38.4% · 75.7 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `██░░░░░░░░░░░░░░░░░░` 10.0% · 19.7 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;fast-json-patch                                      | `█░░░░░░░░░░░░░░░░░░░` 5.1% · 10.1 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json                                         | `░░░░░░░░░░░░░░░░░░░░` 1.8% · 3.6 kB         |
| &nbsp;&nbsp;&nbsp;&nbsp;@ag-ui/core → dist/version-CTNE2I0_.mjs              | `░░░░░░░░░░░░░░░░░░░░` 0.6% · 1.1 kB         |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `░░░░░░░░░░░░░░░░░░░░` 0.4% · 830 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 0.6% · 1.3 kB         |
| **dist/client/assets/ContextDescriptorsPanel-lE19EUvP.js**                   | 64.3 kB · gzip 20.1 kB · 7.5% of the build   |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs                         | `██████████████████░░` 91.1% · 58.6 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `█░░░░░░░░░░░░░░░░░░░` 6.1% · 4.0 kB         |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `░░░░░░░░░░░░░░░░░░░░` 1.2% · 802 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 1.5% · 1010 B         |
| **dist/client/assets/runtime-core.esm-bundler-BaJsNFUd.js**                  | 63.3 kB · gzip 24.4 kB · 7.3% of the build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → dist/runtime-core.esm-bundler.js | `██████████████░░░░░░` 67.7% · 42.8 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js     | `█████░░░░░░░░░░░░░░░` 26.5% · 16.8 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js             | `█░░░░░░░░░░░░░░░░░░░` 5.8% · 3.7 kB         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 0.0% · 0 B            |
| **dist/client/assets/index-BrWYzzaR.js**                                     | 62.9 kB · gzip 21.9 kB · 7.3% of the build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `███████████░░░░░░░░░` 55.1% · 34.6 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → dist/runtime-dom.esm-bundler.js   | `█████░░░░░░░░░░░░░░░` 24.9% · 15.7 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `░░░░░░░░░░░░░░░░░░░░` 1.5% · 948 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 18.6% · 11.7 kB       |
| **dist/client/assets/ExploreDataPanel-mNz2IQ-E.js**                          | 58.2 kB · gzip 15.8 kB · 6.7% of the build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop                               | `██████████░░░░░░░░░░` 50.6% · 29.5 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `█████████░░░░░░░░░░░` 44.6% · 26.0 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `█░░░░░░░░░░░░░░░░░░░` 3.5% · 2.0 kB         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 1.2% · 742 B          |
| **dist/client/assets/Table-ChdqsBBr.js**                                     | 52.1 kB · gzip 13.7 kB · 6.0% of the build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core                                 | `███████████████░░░░░` 75.3% · 39.2 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `███░░░░░░░░░░░░░░░░░` 17.4% · 9.1 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table                                  | `█░░░░░░░░░░░░░░░░░░░` 4.6% · 2.4 kB         |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js                    | `░░░░░░░░░░░░░░░░░░░░` 1.3% · 676 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/settings-2.mjs          | `░░░░░░░░░░░░░░░░░░░░` 0.4% · 212 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 1.0% · 551 B          |
| **dist/client/assets/ContextModelList-CD-DdNG4.js**                          | 45.1 kB · gzip 11.1 kB · 5.2% of the build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `███████████████████░` 94.1% · 42.4 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `░░░░░░░░░░░░░░░░░░░░` 2.1% · 957 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█░░░░░░░░░░░░░░░░░░░` 3.9% · 1.7 kB         |
| **dist/client/assets/useMarkedTool-BsKN3QNT.js**                             | 28.1 kB · gzip 11.1 kB · 3.3% of the build   |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs                       | `███████████████████░` 97.2% · 27.3 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useMarkedTool.ts                               | `░░░░░░░░░░░░░░░░░░░░` 1.7% · 491 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 1.1% · 324 B          |
| **dist/client/assets/sdk.modern-BA6sl1Hr.js**                                | 27.5 kB · gzip 8.1 kB · 3.2% of the build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → dist/sdk.modern.js   | `████████████████████` 100.0% · 27.5 kB      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 0.0% · 1 B            |
| **dist/client/assets/useDataWindow-Qv0YIQPm.js**                             | 25.2 kB · gzip 7.7 kB · 2.9% of the build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core                               | `██████████████████░░` 90.4% · 22.7 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts                               | `██░░░░░░░░░░░░░░░░░░` 7.5% · 1.9 kB         |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js            | `░░░░░░░░░░░░░░░░░░░░` 1.5% · 378 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 0.6% · 151 B          |
| **dist/client/assets/ActionWrapper-CSy4evZQ.js**                             | 22.3 kB · gzip 8.9 kB · 2.6% of the build    |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router                                           | `███████████████████░` 96.9% · 21.6 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ActionWrapper.vue                              | `░░░░░░░░░░░░░░░░░░░░` 1.6% · 368 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 1.5% · 336 B          |
| **dist/client/assets/dist-1fS7wwTN.js**                                      | 17.4 kB · gzip 6.8 kB · 2.0% of the build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/core → dist/index.js                         | `███████████████░░░░░` 74.2% · 12.9 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/shared → dist/index.js                       | `█████░░░░░░░░░░░░░░░` 24.8% · 4.3 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 1.1% · 191 B          |
| **dist/client/assets/locale-DVh8tOlR.js**                                    | 13.2 kB · gzip 5.2 kB · 1.5% of the build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared.es.js        | `█████████████████░░░` 85.7% · 11.3 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → locale.ts                                      | `█░░░░░░░░░░░░░░░░░░░` 3.8% · 511 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 10.6% · 1.4 kB        |
| **dist/client/assets/SessionAuthPanel-C2PEpfJV.js**                          | 12.4 kB · gzip 4.9 kB · 1.4% of the build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `██████████████████░░` 92.1% · 11.4 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs      | `█░░░░░░░░░░░░░░░░░░░` 3.1% · 398 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█░░░░░░░░░░░░░░░░░░░` 4.7% · 597 B          |
| **dist/client/assets/AssistantLayout-bmFQOcYI.js**                           | 9.5 kB · gzip 3.8 kB · 1.1% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `████████████████░░░░` 78.8% · 7.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `█░░░░░░░░░░░░░░░░░░░` 3.9% · 377 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███░░░░░░░░░░░░░░░░░` 17.3% · 1.7 kB        |
| **dist/client/assets/DataViewList-CKfKk-7O.js**                              | 9.3 kB · gzip 3.5 kB · 1.1% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `████████████████░░░░` 81.5% · 7.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 18.5% · 1.7 kB        |
| **dist/client/assets/performanceTracking-C4nmT0r-.js**                       | 8.6 kB · gzip 3.2 kB · 1.0% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.js                      | `███████████████████░` 97.2% · 8.4 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts                         | `░░░░░░░░░░░░░░░░░░░░` 2.2% · 195 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 0.5% · 48 B           |
| **dist/client/assets/LibraryPanel-CaPx__rT.js**                              | 8.3 kB · gzip 3.3 kB · 1.0% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `█████████████████░░░` 84.3% · 7.0 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███░░░░░░░░░░░░░░░░░` 15.7% · 1.3 kB        |
| **dist/client/assets/SessionMenu-NhGwztnf.js**                               | 6.9 kB · gzip 2.7 kB · 0.8% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue                                | `█████████████░░░░░░░` 63.7% · 4.4 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `██████░░░░░░░░░░░░░░` 27.7% · 1.9 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 8.6% · 606 B          |
| **dist/client/assets/SetupLayout-gjK1db1z.js**                               | 6.8 kB · gzip 2.3 kB · 0.8% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `██████████████████░░` 90.2% · 6.2 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 9.8% · 690 B          |
| **dist/client/assets/ConfigCard-BwWazSvp.js**                                | 6.5 kB · gzip 2.4 kB · 0.8% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `████████████████░░░░` 79.1% · 5.2 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `███░░░░░░░░░░░░░░░░░` 16.2% · 1.1 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█░░░░░░░░░░░░░░░░░░░` 4.7% · 315 B          |
| **dist/client/assets/SelectItemPanel-BDEpOHzr.js**                           | 6.4 kB · gzip 2.8 kB · 0.7% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `█████████████████░░░` 85.0% · 5.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███░░░░░░░░░░░░░░░░░` 15.0% · 984 B         |
| **dist/client/assets/GridDetailPanel-DTGjLWgQ.js**                           | 5.8 kB · gzip 2.4 kB · 0.7% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `██████████████████░░` 90.7% · 5.2 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 9.3% · 548 B          |
| **dist/client/assets/ConnectionPanel-Cxjb15Us.js**                           | 5.7 kB · gzip 2.2 kB · 0.7% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `████████████████░░░░` 80.5% · 4.6 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 19.5% · 1.1 kB        |
| **dist/client/assets/DataViewsLayout-BuIx-okI.js**                           | 5.6 kB · gzip 2.2 kB · 0.6% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `█████████████░░░░░░░` 64.3% · 3.6 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████░░░░░░░░░░░░░` 35.7% · 2.0 kB        |
| **dist/client/assets/SessionAccountPanel-ShNivkHT.js**                       | 5.5 kB · gzip 2.0 kB · 0.6% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAccountPanel.vue                        | `████████████░░░░░░░░` 59.3% · 3.2 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs      | `███░░░░░░░░░░░░░░░░░` 16.8% · 939 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████░░░░░░░░░░░░░░░` 24.0% · 1.3 kB        |
| **dist/client/assets/ScrollArea-BE6vtJzq.js**                                | 5.0 kB · gzip 1.9 kB · 0.6% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `██████████████████░░` 90.2% · 4.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 9.8% · 499 B          |
| **dist/client/assets/errors-CY4aAASr.js**                                    | 4.7 kB · gzip 2.2 kB · 0.5% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `█████████████░░░░░░░` 62.8% · 3.0 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████░░░░░░░░░░░░░` 37.2% · 1.8 kB        |
| **dist/client/assets/PaneSplitter-D1dyU4fU.js**                              | 4.4 kB · gzip 1.9 kB · 0.5% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue                               | `████████████████░░░░` 78.3% · 3.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 21.7% · 980 B         |
| **dist/client/assets/SelectConnectionList-Bgs2DfoA.js**                      | 4.3 kB · gzip 1.8 kB · 0.5% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `████████████████░░░░` 78.2% · 3.3 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 21.8% · 947 B         |
| **dist/client/assets/PluginList-Bc6qQJHC.js**                                | 4.0 kB · gzip 1.6 kB · 0.5% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginList.vue                                 | `██████████░░░░░░░░░░` 47.8% · 1.9 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████████░░░░░░░░░░` 52.2% · 2.1 kB        |
| **dist/client/assets/useStudioOptions-EmDH9Cju.js**                          | 3.6 kB · gzip 1.3 kB · 0.4% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts                            | `███████████████████░` 97.1% · 3.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█░░░░░░░░░░░░░░░░░░░` 2.9% · 107 B          |
| **dist/client/assets/dataViews-DPn3TTil.js**                                 | 3.6 kB · gzip 1.2 kB · 0.4% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViews.ts                                   | `██████████████████░░` 91.2% · 3.3 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 8.8% · 320 B          |
| **dist/client/assets/StudioHomePanel-Mk43sQpp.js**                           | 3.4 kB · gzip 1.1 kB · 0.4% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHomePanel.vue                            | `███████░░░░░░░░░░░░░` 32.8% · 1.1 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████████████░░░░░░░` 67.2% · 2.3 kB        |
| **dist/client/assets/PluginPanel-CkBd-7N2.js**                               | 3.4 kB · gzip 1.5 kB · 0.4% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPanel.vue                                | `███████████░░░░░░░░░` 53.7% · 1.8 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `██████░░░░░░░░░░░░░░` 30.6% · 1.0 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███░░░░░░░░░░░░░░░░░` 15.7% · 552 B         |
| **dist/client/assets/ScrollRow-Bv2Ldn9Y.js**                                 | 3.3 kB · gzip 1.6 kB · 0.4% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollRow.vue                                  | `█████████████████░░░` 82.8% · 2.7 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███░░░░░░░░░░░░░░░░░` 17.2% · 576 B         |
| **dist/client/assets/OptionBar-Cq_YHBX4.js**                                 | 3.2 kB · gzip 1.5 kB · 0.4% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `█████████████████░░░` 86.1% · 2.8 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███░░░░░░░░░░░░░░░░░` 13.9% · 459 B         |
| **dist/client/assets/PresentationsLayout-R5Me2TMM.js**                       | 3.2 kB · gzip 1.6 kB · 0.4% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PresentationsLayout.vue                        | `███████████████░░░░░` 77.0% · 2.4 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████░░░░░░░░░░░░░░░` 23.0% · 741 B         |
| **dist/client/assets/createLucideIcon-Cl6DWzJb.js**                          | 2.5 kB · gzip 1.2 kB · 0.3% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue                                          | `███████████████████░` 97.4% · 2.4 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█░░░░░░░░░░░░░░░░░░░` 2.6% · 66 B           |
| **dist/client/assets/EventQueriesLayout-DZSNoo_M.js**                        | 2.2 kB · gzip 1.1 kB · 0.3% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueriesLayout.vue                         | `███████████████░░░░░` 74.1% · 1.6 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████░░░░░░░░░░░░░░░` 25.9% · 584 B         |
| **dist/client/assets/GitHubLogo-Dp5nxvZU.js**                                | 2.1 kB · gzip 1.1 kB · 0.2% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GitHubLogo.vue                                 | `██████████████████░░` 89.9% · 1.9 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 10.1% · 212 B         |
| **dist/client/assets/TextInput-DFKA8NQ5.js**                                 | 2.0 kB · gzip 1.1 kB · 0.2% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextInput.vue                                  | `███████████████░░░░░` 72.5% · 1.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████░░░░░░░░░░░░░░░` 27.5% · 571 B         |
| **dist/client/assets/configMonitor-B2EO6Tg\_.js**                            | 1.9 kB · gzip 894 B · 0.2% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts                               | `██████████████████░░` 88.9% · 1.7 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 11.1% · 219 B         |
| **dist/client/assets/StudioDocumentPanel-goOX4zrh.js**                       | 1.9 kB · gzip 1005 B · 0.2% of the build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `████████████████░░░░` 79.6% · 1.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 20.4% · 389 B         |
| **dist/client/assets/PluginConnectorPanel-CWdhgIyp.js**                      | 1.7 kB · gzip 889 B · 0.2% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginConnectorPanel.vue                       | `██████████████░░░░░░` 71.6% · 1.3 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████░░░░░░░░░░░░░░` 28.4% · 507 B         |
| **dist/client/assets/ContextEntityDiagramPanel-BKwFrjBv.js**                 | 1.7 kB · gzip 624 B · 0.2% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextEntityDiagramPanel.vue                  | `████████████████░░░░` 81.9% · 1.4 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 18.1% · 313 B         |
| **dist/client/assets/monitorSocket-B8ujI19O.js**                             | 1.6 kB · gzip 859 B · 0.2% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → monitorSocket.ts                               | `██████████████████░░` 92.5% · 1.5 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 7.5% · 126 B          |
| **dist/client/assets/EmptyPlaceholder-Dnygp0o8.js**                          | 1.6 kB · gzip 834 B · 0.2% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue                           | `████████░░░░░░░░░░░░` 41.8% · 674 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████████░░░░░░░░` 58.2% · 938 B         |
| **dist/client/assets/action-36s1Q_w1.js**                                    | 1.4 kB · gzip 498 B · 0.2% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → action.ts                                      | `████████████████████` 100.0% · 1.4 kB       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `░░░░░░░░░░░░░░░░░░░░` 0.0% · 0 B            |
| **dist/client/assets/ItemButton-DDwv1o10.js**                                | 1.4 kB · gzip 600 B · 0.2% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ItemButton.vue                                 | `████████████████░░░░` 82.1% · 1.1 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 17.9% · 254 B         |
| **dist/client/assets/Breadcrumbs-Du5vLvXJ.js**                               | 1.3 kB · gzip 765 B · 0.2% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Breadcrumbs.vue                                | `█████████████░░░░░░░` 65.9% · 897 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████░░░░░░░░░░░░░` 34.1% · 464 B         |
| **dist/client/assets/StudioLayout-CjGRbgvA.js**                              | 1.3 kB · gzip 748 B · 0.1% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `██████████████░░░░░░` 68.9% · 886 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████░░░░░░░░░░░░░░` 31.1% · 399 B         |
| **dist/client/assets/ManagePersonalDetailsPanel-Cd2Qoyfg.js**                | 1.2 kB · gzip 329 B · 0.1% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue                 | `██████████████████░░` 90.4% · 1.1 kB        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 9.6% · 122 B          |
| **dist/client/assets/ContextDiagramPanel-CjbAutWN.js**                       | 1.1 kB · gzip 654 B · 0.1% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDiagramPanel.vue                        | `███████████░░░░░░░░░` 57.2% · 617 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████████░░░░░░░░░░░` 42.8% · 461 B         |
| **dist/client/assets/useEngine-NZXaO3HI.js**                                 | 1.0 kB · gzip 562 B · 0.1% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useEngine.ts                                   | `█████████████████░░░` 87.1% · 922 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███░░░░░░░░░░░░░░░░░` 12.9% · 136 B         |
| **dist/client/assets/eventTracking-CW5Ulqe7.js**                             | 1.0 kB · gzip 587 B · 0.1% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → eventTracking.ts                               | `██████████████████░░` 88.4% · 933 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██░░░░░░░░░░░░░░░░░░` 11.6% · 122 B         |
| **dist/client/assets/SelectPlaceholder-Cgqk6wly.js**                         | 1000 B · gzip 603 B · 0.1% of the build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `█████████████░░░░░░░` 66.8% · 668 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████░░░░░░░░░░░░░` 33.2% · 332 B         |
| **dist/client/assets/useApi-BPuI6ZR9-BDNL8IOL.js**                           | 985 B · gzip 537 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/useApi-BPuI6ZR9.js                 | `███████████████████░` 94.0% · 926 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█░░░░░░░░░░░░░░░░░░░` 6.0% · 59 B           |
| **dist/client/assets/DataAppsLayout-B5UNcrq\_.js**                           | 906 B · gzip 549 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataAppsLayout.vue                             | `███████████░░░░░░░░░` 53.1% · 481 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████████░░░░░░░░░░░` 46.9% · 425 B         |
| **dist/client/assets/ContextDimensionDiagramPanel-DpEUQklW.js**              | 824 B · gzip 453 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionDiagramPanel.vue               | `███████████░░░░░░░░░` 56.7% · 467 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████████░░░░░░░░░░░` 43.3% · 357 B         |
| **dist/client/assets/SetupHomePanel-CahPGOYw.js**                            | 740 B · gzip 496 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupHomePanel.vue                             | `██████████░░░░░░░░░░` 49.9% · 369 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████████░░░░░░░░░░` 50.1% · 371 B         |
| **dist/client/assets/Tag-8EW1J3ip.js**                                       | 708 B · gzip 408 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue                                        | `████████████████░░░░` 78.5% · 556 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 21.5% · 152 B         |
| **dist/client/assets/Separator-Bq4gE0Ox.js**                                 | 557 B · gzip 328 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Separator.vue                                  | `████████░░░░░░░░░░░░` 39.3% · 219 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████████░░░░░░░░` 60.7% · 338 B         |
| **dist/client/assets/ManagePreferencesPanel-D4OTO4OR.js**                    | 528 B · gzip 357 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue                     | `████████░░░░░░░░░░░░` 41.9% · 221 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████████░░░░░░░░` 58.1% · 307 B         |
| **dist/client/assets/AuditContentPanel-VuYfS8qZ.js**                         | 525 B · gzip 374 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AuditContentPanel.vue                          | `██████████░░░░░░░░░░` 50.1% · 263 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████████░░░░░░░░░░` 49.9% · 262 B         |
| **dist/client/assets/StudioDocumentSection-COSmmlsc.js**                     | 505 B · gzip 340 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDocumentSection.vue                      | `██████░░░░░░░░░░░░░░` 30.7% · 155 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████████████░░░░░░` 69.3% · 350 B         |
| **dist/client/assets/useSetupSelection-CBFBuzxX.js**                         | 489 B · gzip 329 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupSelection.ts                           | `███████████████░░░░░` 76.7% · 375 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████░░░░░░░░░░░░░░░` 23.3% · 114 B         |
| **dist/client/assets/accountMonitor-DAv8dfNj.js**                            | 476 B · gzip 338 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts                              | `████████████████░░░░` 78.6% · 374 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████░░░░░░░░░░░░░░░░` 21.4% · 102 B         |
| **dist/client/assets/PluginPresenterPanel-D2YE-6Nw.js**                      | 458 B · gzip 262 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPresenterPanel.vue                       | `█████████░░░░░░░░░░░` 46.7% · 214 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████████░░░░░░░░░` 53.3% · 244 B         |
| **dist/client/assets/PluginCookbookPanel-BwKX8fLI.js**                       | 457 B · gzip 264 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginCookbookPanel.vue                        | `█████████░░░░░░░░░░░` 46.8% · 214 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████████░░░░░░░░░` 53.2% · 243 B         |
| **dist/client/assets/PluginToolPanel-Be2n0_U1.js**                           | 453 B · gzip 261 B · 0.1% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginToolPanel.vue                            | `█████████░░░░░░░░░░░` 47.2% · 214 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████████░░░░░░░░░` 52.8% · 239 B         |
| **dist/client/assets/useSetupRoute-DFgchkr1.js**                             | 365 B · gzip 271 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupRoute.ts                               | `██████████████░░░░░░` 68.2% · 249 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████░░░░░░░░░░░░░░` 31.8% · 116 B         |
| **dist/client/assets/house-B_d0g3hS.js**                                     | 318 B · gzip 241 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/house.mjs               | `█████████████████░░░` 84.0% · 267 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███░░░░░░░░░░░░░░░░░` 16.0% · 51 B          |
| **dist/client/assets/ManageSubscriptionPanel-B7HNfvsK.js**                   | 303 B · gzip 249 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue                    | `████████████░░░░░░░░` 62.0% · 188 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████░░░░░░░░░░░░` 38.0% · 115 B         |
| **dist/client/assets/ManageDataServiceTokensPanel-Cr-nHZc5.js**              | 300 B · gzip 246 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue               | `████████████░░░░░░░░` 61.7% · 185 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████░░░░░░░░░░░░` 38.3% · 115 B         |
| **dist/client/assets/GenerateTokenPanel-BX4FM4m1.js**                        | 289 B · gzip 239 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue                         | `████████████░░░░░░░░` 60.2% · 174 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████░░░░░░░░░░░░` 39.8% · 115 B         |
| **dist/client/assets/ManageSessionsPanel-HLUhNUKs.js**                       | 289 B · gzip 239 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue                        | `████████████░░░░░░░░` 60.2% · 174 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████░░░░░░░░░░░░` 39.8% · 115 B         |
| **dist/client/assets/ReviewActivityPanel-amn8BQvv.js**                       | 289 B · gzip 239 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue                        | `████████████░░░░░░░░` 60.2% · 174 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████░░░░░░░░░░░░` 39.8% · 115 B         |
| **dist/client/assets/DeleteAccountPanel-C3IIdLlm.js**                        | 288 B · gzip 238 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue                         | `████████████░░░░░░░░` 60.1% · 173 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████░░░░░░░░░░░░` 39.9% · 115 B         |
| **dist/client/assets/ManageAccessPanel-2usDUkwc.js**                         | 287 B · gzip 238 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue                          | `████████████░░░░░░░░` 59.9% · 172 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████░░░░░░░░░░░░` 40.1% · 115 B         |
| **dist/client/assets/configCard-Cjo0mFWC.js**                                | 245 B · gzip 208 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configCard.ts                                  | `████████████░░░░░░░░` 59.6% · 146 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `████████░░░░░░░░░░░░` 40.4% · 99 B          |
| **dist/client/assets/search-CWoTWsu\_.js**                                   | 194 B · gzip 182 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs              | `███████████████░░░░░` 73.7% · 143 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████░░░░░░░░░░░░░░░` 26.3% · 51 B          |
| **dist/client/assets/useConfigsReady-TOTL8kpw.js**                           | 189 B · gzip 167 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src                                                  | `███████████░░░░░░░░░` 54.5% · 103 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `█████████░░░░░░░░░░░` 45.5% · 86 B          |
| **dist/client/assets/arrow-left-CXg51yIp.js**                                | 185 B · gzip 177 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs          | `██████████████░░░░░░` 72.4% · 134 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████░░░░░░░░░░░░░░` 27.6% · 51 B          |
| **dist/client/assets/x-d2-AkLXL.js**                                         | 174 B · gzip 166 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/x.mjs                   | `██████████████░░░░░░` 70.7% · 123 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████░░░░░░░░░░░░░░` 29.3% · 51 B          |
| **dist/client/assets/plus-Cz_e8naS.js**                                      | 173 B · gzip 165 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs                | `██████████████░░░░░░` 70.5% · 122 B         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `██████░░░░░░░░░░░░░░` 29.5% · 51 B          |
| **dist/client/assets/chevron-left-B9_cLrGu.js**                              | 150 B · gzip 159 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs        | `█████████████░░░░░░░` 66.0% · 99 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████░░░░░░░░░░░░░` 34.0% · 51 B          |
| **dist/client/assets/chevron-right-Df7Y2Njj.js**                             | 150 B · gzip 156 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs       | `█████████████░░░░░░░` 66.0% · 99 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████░░░░░░░░░░░░░` 34.0% · 51 B          |
| **dist/client/assets/chevron-down-DFo6vNR9.js**                              | 148 B · gzip 154 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-down.mjs        | `█████████████░░░░░░░` 65.5% · 97 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████░░░░░░░░░░░░░` 34.5% · 51 B          |
| **dist/client/assets/check-1jYqLY6W.js**                                     | 144 B · gzip 156 B · 0.0% of the build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/check.mjs               | `█████████████░░░░░░░` 64.6% · 93 B          |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                  | `███████░░░░░░░░░░░░░` 35.4% · 51 B          |

Bars show each row's share of its output file.

(bundler output, whitespace & JSON) = bytes Sonda can't trace to a source file: whitespace (indentation and line breaks), code the bundler generates (region comments, the combined import/export lines, its small runtime helper and wrappers), and imported JSON such as `config.json`, which the bundler doesn't map. The JSON and the generated code are real bytes that ship; the whitespace mostly disappears once compressed.

<!-- BUNDLE_END -->

<!-- QUALITY_SECURITY_START -->

## Quality & Security

This section is updated each time `npm run document` is run. Settings come from the repository's workflow files and GitHub. Test coverage and the Fallow score are measured at the same time.

### Testing

| Check                | Status | What it does                                                                                                                                                                       |
| :------------------- | :----- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests           | ✅ On  | [Vitest](https://vitest.dev) runs the unit tests. Part of the [CI workflow](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml) on every push and pull request to `main`. |
| Property-based tests | ❌ Off | [fast-check](https://fast-check.dev) runs many random inputs per test to find edge cases, alongside the unit tests.                                                                |

### Code Quality

| Check         | Status | What it does                                                                                                                                                                                                 |
| :------------ | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code analysis | ❌ Off | [SonarCloud](https://sonarcloud.io) checks every push for bugs, code smells and vulnerabilities.                                                                                                             |
| Linting       | ✅ On  | [ESLint](https://eslint.org) checks the code for errors and style problems. Part of the [CI workflow](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml) on every push and pull request to `main`. |

### Security Analysis

| Check           | Status | What it does                                                                                                                                                                                                                                                                                                                                                 |
| :-------------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Push protection | ❌ Off | [GitHub push protection](https://docs.github.com/en/code-security/secret-scanning/push-protection-for-repositories-and-organizations) blocks pushes that contain credentials.                                                                                                                                                                                |
| Static analysis | ✅ On  | [![CodeQL](https://github.com/dpuse/dpuse-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/dpuse/dpuse-app/security/code-scanning) [CodeQL](https://codeql.github.com) scans GitHub Actions and JavaScript/TypeScript for security vulnerabilities, using the extended security queries, on every push and pull request to `main` and weekly. |
| Secret scanning | ❌ Off | [GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning) detects credentials, such as API keys and tokens, committed to the repository.                                                                                                                                                                                            |

### Dependencies

| Check               | Status | What it does                                                                                                                                                                                                                                                                                                     |
| :------------------ | :----- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vulnerability audit | ✅ On  | [npm audit](https://docs.npmjs.com/cli/commands/npm-audit) fails when a shipped dependency has any known vulnerability, or a development dependency has a high or critical one. Part of the [CI workflow](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml) on every push and pull request to `main`. |
| Supply chain risk   | ✅ On  | [Socket](https://socket.dev) flags malicious packages, typosquatting and suspicious behaviour that may not yet have a CVE.                                                                                                                                                                                       |
| Security alerts     | ✅ On  | [Dependabot](https://docs.github.com/en/code-security/dependabot) alerts when a dependency has a known vulnerability, using the GitHub Advisory Database.                                                                                                                                                        |
| Security updates    | ❌ Off | [Dependabot](https://docs.github.com/en/code-security/dependabot) opens pull requests that update vulnerable dependencies. These are handled manually.                                                                                                                                                           |
| Version updates     | ❌ Off | [Dependabot](https://docs.github.com/en/code-security/dependabot) opens pull requests for new dependency versions. These are handled manually.                                                                                                                                                                   |

### OpenSSF 🚧

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/dpuse/dpuse-app/badge)](https://scorecard.dev/viewer/?uri=github.com/dpuse/dpuse-app)

This project is working towards the [OpenSSF Best Practices](https://www.bestpractices.dev) Passing badge, a self-certification covering security policy, vulnerability reporting, build processes, code quality, and more. Currently the [OpenSSF Scorecard](https://scorecard.dev) provides an independent automated assessment of the project's security practices and is an ongoing area of improvement.

### Reporting Vulnerabilities

Please do not open public GitHub issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for how to report one privately, the full disclosure policy, and expected response times.

<!-- QUALITY_SECURITY_END -->

<!-- CONTRIBUTING_LICENSE_START -->

## Contributing

This repository is maintained solely by its owner and does not, at present, accept external contributions into the canonical repo. Its source is published openly under the MIT License — every DPUse project is fully open source except DPUse Engine, which remains closed and proprietary.

For security vulnerabilities, see [Reporting Vulnerabilities](#reporting-vulnerabilities). For bugs, inconsistencies, or other feedback, [open a GitHub issue](https://github.com/dpuse/dpuse-app/issues) — feedback is read, but responses and fixes are at the maintainer's discretion.

## License

This project is licensed under the MIT License, permitting free use, modification, and distribution.

[MIT](./LICENSE) © 2026 Jonathan Terrell

<!-- CONTRIBUTING_LICENSE_END -->
