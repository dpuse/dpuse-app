# DPUse App

<!-- OPENING_START -->

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml/badge.svg)](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/dpuse/dpuse-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/dpuse/dpuse-app/security/code-scanning)
![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fdpuse%2Fdpuse-app%2Fmain%2Fcode-health-reports%2Fvitest%2Fbadge.json)

The DPUse browser application.

[Report a Vulnerability](https://github.com/dpuse/dpuse-app/security/advisories/new) · [Open an Issue](https://github.com/dpuse/dpuse-app/issues)

## About DPUse

DPUse (Data Positioning & Use) is a browser-based app that helps you prepare your data for use in two main steps: Sourcing and Contextualising. Once your data is contextualised, Presentations and Cookbooks give you two ways to put it to use.

**Sourcing** uses Connectors to link to applications, databases, file stores, and curated datasets. These Connections help you set up tabular Data Views from your sources.

**Contextualising** maps events from your Data Views to detailed Context Models. These models give the DPUse Engine the structure it needs to create clear transactions, facts, or observations.

**Presentations** use ready-made Presenters to show your contextualised data in a meaningful way as soon as it's ready.

**Cookbooks** of Recipes guide you in building Data Apps, and additional Presenters, with your contextualised data using your preferred tools.

<!-- OPENING_END -->

## Browser Support

| Browser       | Minimum | Set by                                 |
| :------------ | ------: | :------------------------------------- |
| Chrome / Edge |     123 | `field-sizing: content`                |
| Safari / iOS  |      26 | Trusted Types, `field-sizing: content` |
| Firefox       |     148 | Trusted Types                          |

[Trusted Types](https://caniuse.com/trusted-types) is a hard requirement, not a progressive enhancement. The CSP in `public/_headers` sets `require-trusted-types-for 'script'`, and `src/main.ts` installs the `default` policy, which refuses every script URL. The engine starts its worker through its own `dpuse-engine` policy. That code reads the `trustedTypes` global directly, so a browser without the API throws `ReferenceError` during bootstrap and the user gets the fatal-error banner instead of the app. Chrome and Edge have had it since 83; Safari 26 and Firefox 148 are the releases that complete the picture.

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

_Requires [Node.js](https://nodejs.org/) 24 or later, [npm](https://www.npmjs.com/) 12 or later, and [TypeScript](https://www.typescriptlang.org/) 6.0.3 or a later 6.0 release. Later versions, including TypeScript 7, are not supported yet._

This repository is managed using the common set of actions provided by [@dpuse/dpuse-development](https://github.com/dpuse/dpuse-development). See the `scripts` block in [package.json](https://github.com/dpuse/dpuse-app/blob/main/package.json) for details.

### Release Status

DPUse is a new product, and this project is a release candidate: complete and in use across DPUse, but not yet at its first stable release.

Every release is listed on the [Releases](https://github.com/dpuse/dpuse-app/releases) page.

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
npm run test:e2e -- e2e/landingPage.spec.ts
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

License data is updated each time `npm run document` is run, using [CycloneDX](https://github.com/CycloneDX/cyclonedx-node-npm). The following table lists every package whose code, styles or assets are included in this project's build, as recorded by the build itself. Modules loaded at run time are not included; each documents its own. These dependencies have been checked and confirmed to use Apache-2.0, ISC, MIT, or OFL-1.1, all of which allow commercial use. All are used as published. Where the build has to adjust a dependency so it can be bundled, the adjustment only affects how its files are located and loaded, never what the code does. Developers cloning this repository should independently verify development dependencies.

| Dependency                                                             | Version | License(s)              | Document                                                                      |
| :--------------------------------------------------------------------- | :-----: | :---------------------- | :---------------------------------------------------------------------------- |
| [@ag-ui/core](https://github.com/ag-ui-protocol/ag-ui)                 |  1.0.0  | MIT                     | [LICENSE](licenses/downloads/@ag-ui/core@1.0.0-LICENSE.txt)                   |
| [@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)           | 1.0.252 | MIT                     | [LICENSE](licenses/downloads/@dpuse/dpuse-shared@1.0.252-LICENSE.txt)         |
| [@fontsource-variable/inter](https://github.com/fontsource/font-files) |  5.3.0  | OFL-1.1                 | [LICENSE](licenses/downloads/@fontsource-variable/inter@5.3.0-LICENSE.txt)    |
| [@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)     |  0.8.0  | MIT                     | [LICENSE](licenses/downloads/@formkit/drag-and-drop@0.8.0-LICENSE.txt)        |
| [@lucide/vue](https://github.com/lucide-icons/lucide)                  | 1.78.0  | ISC                     | [LICENSE](licenses/downloads/@lucide/vue@1.78.0-LICENSE.txt)                  |
| [@tanstack/ai](https://github.com/TanStack/ai)                         |  1.8.0  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai@1.8.0-LICENSE.txt)                  |
| [@tanstack/ai-client](https://github.com/TanStack/ai)                  |  1.2.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai-client@1.2.1-LICENSE.txt)           |
| [@tanstack/query-core](https://github.com/TanStack/query)              | 5.108.4 | MIT                     | [LICENSE](licenses/downloads/@tanstack/query-core@5.108.4-LICENSE.txt)        |
| [@tanstack/store](https://github.com/TanStack/store)                   | 0.11.2  | MIT                     | [LICENSE](licenses/downloads/@tanstack/store@0.11.2-LICENSE.txt)              |
| [@tanstack/table-core](https://github.com/TanStack/table)              |  9.3.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/table-core@9.3.1-LICENSE.txt)          |
| [@tanstack/virtual-core](https://github.com/TanStack/virtual)          | 3.19.13 | MIT                     | [LICENSE](licenses/downloads/@tanstack/virtual-core@3.19.13-LICENSE.txt)      |
| [@tanstack/vue-query](https://github.com/TanStack/query)               | 5.108.4 | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-query@5.108.4-LICENSE.txt)         |
| [@tanstack/vue-table](https://github.com/TanStack/table)               |  9.3.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-table@9.3.1-LICENSE.txt)           |
| [@tanstack/vue-virtual](https://github.com/TanStack/virtual)           | 3.13.54 | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-virtual@3.13.54-LICENSE.txt)       |
| [@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)    |  3.2.0  | MIT                     | [LICENSE](licenses/downloads/@teamhanko/hanko-frontend-sdk@3.2.0-LICENSE.txt) |
| [@vue/reactivity](https://github.com/vuejs/core)                       | 3.5.46  | MIT                     | [LICENSE](licenses/downloads/@vue/reactivity@3.5.46-LICENSE.txt)              |
| [@vue/runtime-core](https://github.com/vuejs/core)                     | 3.5.46  | MIT                     | [LICENSE](licenses/downloads/@vue/runtime-core@3.5.46-LICENSE.txt)            |
| [@vue/runtime-dom](https://github.com/vuejs/core)                      | 3.5.46  | MIT                     | [LICENSE](licenses/downloads/@vue/runtime-dom@3.5.46-LICENSE.txt)             |
| [@vue/shared](https://github.com/vuejs/core)                           | 3.5.46  | MIT                     | [LICENSE](licenses/downloads/@vue/shared@3.5.46-LICENSE.txt)                  |
| [@vueuse/core](https://github.com/vueuse/vueuse)                       | 15.1.0  | MIT                     | [LICENSE](licenses/downloads/@vueuse/core@15.1.0-LICENSE.txt)                 |
| [@vueuse/shared](https://github.com/vueuse/vueuse)                     | 15.1.0  | MIT                     | [LICENSE](licenses/downloads/@vueuse/shared@15.1.0-LICENSE.txt)               |
| [dompurify](https://github.com/cure53/DOMPurify)                       |  3.5.0  | (MPL-2.0 OR Apache-2.0) | [LICENSE](licenses/downloads/dompurify@3.5.0-LICENSE.txt)                     |
| [fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)      |  3.1.1  | MIT                     | [LICENSE](licenses/downloads/fast-json-patch@3.1.1-LICENSE.txt)               |
| [flag-icons](https://github.com/lipis/flag-icons)                      |  7.6.0  | MIT                     | [LICENSE](licenses/downloads/flag-icons@7.6.0-LICENSE.txt)                    |
| [partial-json](https://github.com/promplate/partial-json-parser-js)    |  0.1.7  | MIT                     | [LICENSE](licenses/downloads/partial-json@0.1.7-LICENSE.txt)                  |
| [squire-rte](https://github.com/neilj/Squire)                          | 2.4.11  | MIT                     | [LICENSE](licenses/downloads/squire-rte@2.4.11-LICENSE.txt)                   |
| [tailwindcss](https://github.com/tailwindlabs/tailwindcss)             |  4.3.5  | MIT                     | [LICENSE](licenses/downloads/tailwindcss@4.3.5-LICENSE.txt)                   |
| [tinybase](https://github.com/tinyplex/tinybase)                       | 10.1.0  | MIT                     | [LICENSE](licenses/downloads/tinybase@10.1.0-LICENSE.txt)                     |
| [valibot](https://github.com/open-circle/valibot)                      |  1.5.0  | MIT                     | [LICENSE](licenses/downloads/valibot@1.5.0-LICENSE.txt)                       |
| [vue-router](https://github.com/vuejs/router)                          |  5.5.1  | MIT                     | [LICENSE](licenses/downloads/vue-router@5.5.1-LICENSE.txt)                    |
| [web-vitals](https://github.com/GoogleChrome/web-vitals)               |  6.2.3  | Apache-2.0              | [LICENSE](licenses/downloads/web-vitals@6.2.3-LICENSE.txt)                    |

### Dependency Tree

The dependency tree below shows how each package in the table above is reached — direct and transitive — along with its installed version, release date, and update status. A package that does not ship itself, such as one whose parts are bundled separately, is left out and what ships beneath it is shown in its place. Packages flagged ❗ have a newer version available; ⚠️ indicates a package that hasn't been updated in the last 6 months or longer. Neither flag necessarily indicates a problem: we let new releases stabilise before upgrading, and some packages are mature and stable (have limited or no dependencies), so they require no active development.

- **[@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)** 1.0.252 — this month: 2026-11-22
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — 2 mths ago: 2026-09-09
- **[@fontsource-variable/inter](https://github.com/fontsource/font-files)** 5.3.0 — 4 mths ago: 2026-07-19
- **[@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)** 0.8.0 — this month: 2026-11-23
- **[@lucide/vue](https://github.com/lucide-icons/lucide)** 1.78.0 — this month: 2026-11-23
- **[@tanstack/ai-client](https://github.com/TanStack/ai)** 1.2.1 — this month: 2026-11-20
    - **[@tanstack/ai](https://github.com/TanStack/ai)** 1.8.0 — this month: 2026-11-20
    - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29 → latest: 0.11.3 — this month: 2026-11-22 ❗
- **[@tanstack/ai](https://github.com/TanStack/ai)** 1.8.0 — this month: 2026-11-20
    - **[@ag-ui/core](https://github.com/ag-ui-protocol/ag-ui)** 1.0.0 — 2 mths ago: 2026-09-17 → latest: 1.0.5 — this month: 2026-11-17 ❗
    - **[fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)** 3.1.1 — 55 mths ago: 2022-03-24 ⚠️ → latest: 3.1.2 — this month: 2026-11-21 ❗
    - **[partial-json](https://github.com/promplate/partial-json-parser-js)** 0.1.7 — 30 mths ago: 2024-05-14 ⚠️
- **[@tanstack/vue-query](https://github.com/TanStack/query)** 5.108.4 — this month: 2026-11-23
    - **[@tanstack/query-core](https://github.com/TanStack/query)** 5.108.4 — this month: 2026-11-23
- **[@tanstack/vue-table](https://github.com/TanStack/table)** 9.3.1 — 1 mth ago: 2026-10-12
    - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29 → latest: 0.11.3 — this month: 2026-11-22 ❗
    - **[@tanstack/table-core](https://github.com/TanStack/table)** 9.3.1 — 1 mth ago: 2026-10-12
        - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29 → latest: 0.11.3 — this month: 2026-11-22 ❗
- **[@tanstack/vue-virtual](https://github.com/TanStack/virtual)** 3.13.54 — this month: 2026-11-22
    - **[@tanstack/virtual-core](https://github.com/TanStack/virtual)** 3.19.13 — this month: 2026-11-22
- **[@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)** 3.2.0 — this month: 2026-11-19
- **[@vueuse/core](https://github.com/vueuse/vueuse)** 15.1.0 — this month: 2026-11-23
    - **[@vueuse/shared](https://github.com/vueuse/vueuse)** 15.1.0 — this month: 2026-11-23
- **[dompurify](https://github.com/cure53/DOMPurify)** 3.5.0 — this month: 2026-11-22
- **[flag-icons](https://github.com/lipis/flag-icons)** 7.6.0 — 1 mth ago: 2026-10-15
- **[squire-rte](https://github.com/neilj/Squire)** 2.4.11 — this month: 2026-11-10
- **[tinybase](https://github.com/tinyplex/tinybase)** 10.1.0 — this month: 2026-11-12
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — 2 mths ago: 2026-09-09
- **[vue-router](https://github.com/vuejs/router)** 5.5.1 — this month: 2026-11-13
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.46 — this month: 2026-11-20
- **[@vue/runtime-dom](https://github.com/vuejs/core)** 3.5.46 — this month: 2026-11-20
    - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.46 — this month: 2026-11-20
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.46 — this month: 2026-11-20
    - **[@vue/runtime-core](https://github.com/vuejs/core)** 3.5.46 — this month: 2026-11-20
        - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.46 — this month: 2026-11-20
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.46 — this month: 2026-11-20
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.46 — this month: 2026-11-20
- **[web-vitals](https://github.com/GoogleChrome/web-vitals)** 6.2.3 — 1 mth ago: 2026-10-05
- **[tailwindcss](https://github.com/tailwindlabs/tailwindcss)** 4.3.5 — this month: 2026-11-06

<!-- DEPENDENCY_LICENSES_END -->

<!-- BUNDLE_START -->

## Bundle Analysis

This report is updated with each release, from the bundle the release builds, using [Sonda](https://sonda.dev/), which analyses final source maps to reveal the actual effects of tree-shaking and minification rather than relying on pre-build estimates.

_Note: Sonda's Vite reports currently exclude CSS files, since Vite does not generate source maps for CSS._

| Chunk/Module/File                                                                                                                                                  | Composition                                                                                    |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **All 154 files**                                                                                                                                                  | 1.9&nbsp;MB&nbsp;·&nbsp;gzip&nbsp;869.0&nbsp;kB                                                |
| **dist/client/assets/ChatPanel-D0FeYOV0.js**                                                                                                                       | 218.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;60.2&nbsp;kB&nbsp;·&nbsp;11.1%&nbsp;of&nbsp;the&nbsp;build |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client → dist/esm/chat-client.js + 13 more                                                                                    | `████████░░░░░░░░░░░░`&nbsp;42.0%&nbsp;·&nbsp;91.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai → <abbr title="dist/esm/activities/chat/stream/processor.js">…ivities/chat/stream/processor.js</abbr> + 28 more               | `████████░░░░░░░░░░░░`&nbsp;39.3%&nbsp;·&nbsp;85.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → tanstackClientTools.ts + 16 more                                                                                                     | `█░░░░░░░░░░░░░░░░░░░`&nbsp;7.2%&nbsp;·&nbsp;15.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;fast-json-patch → module/core.mjs + 3 more                                                                                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.5%&nbsp;·&nbsp;9.8&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json → dist/index.js + 1 more                                                                                                      | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.6%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/alien.js + 1 more                                                                                                   | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.6%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@ag-ui/core → dist/version-CTNE2I0_.mjs                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/icons/gallery-vertical-end.mjs">…sm/icons/gallery-vertical-end.mjs</abbr> + 1 more                     | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.1%&nbsp;·&nbsp;298&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.0%&nbsp;·&nbsp;6.6&nbsp;kB                                       |
| **<abbr title="dist/client/assets/inter-latin-ext-opsz-normal-DpK-iCPk.woff2">…sets/inter-latin-ext-opsz-normal-DpK-iCPk.woff2</abbr>**                            | 130.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;130.3&nbsp;kB&nbsp;·&nbsp;6.6%&nbsp;of&nbsp;the&nbsp;build |
| **dist/client/assets/index-CW8VLYov.css**                                                                                                                          | 113.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;20.4&nbsp;kB&nbsp;·&nbsp;5.8%&nbsp;of&nbsp;the&nbsp;build  |
| **dist/client/assets/Table-DglKlED9.js**                                                                                                                           | 109.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;30.6&nbsp;kB&nbsp;·&nbsp;5.5%&nbsp;of&nbsp;the&nbsp;build  |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ColumnDetailPanel.vue + 17 more                                                                                                      | `████████░░░░░░░░░░░░`&nbsp;39.8%&nbsp;·&nbsp;43.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core → <abbr title="dist/features/column-pinning/columnPinningFeature.utils.js">…nPinningFeature.utils.js</abbr> + 32 more | `███████░░░░░░░░░░░░░`&nbsp;34.2%&nbsp;·&nbsp;37.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/icons/sliders-horizontal.mjs">…/esm/icons/sliders-horizontal.mjs</abbr> + 7 more                       | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.0%&nbsp;·&nbsp;2.2&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table → dist/merge-proxy.js + 2 more                                                                                         | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.9%&nbsp;·&nbsp;2.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js                                                                                                          | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;676&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.4%&nbsp;·&nbsp;23.3&nbsp;kB                                     |
| **dist/client/assets/SelectItemPanel-D_dGdtQp.js**                                                                                                                 | 96.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;29.1&nbsp;kB&nbsp;·&nbsp;4.9%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectItemPanel.vue + 9 more                                                                                                         | `██████████████░░░░░░`&nbsp;70.0%&nbsp;·&nbsp;67.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/scan-text.mjs + 11 more                                                                                       | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.6%&nbsp;·&nbsp;2.5&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;27.4%&nbsp;·&nbsp;26.5&nbsp;kB                                     |
| **dist/client/assets/index-DpOm9SIk.js**                                                                                                                           | 94.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;31.9&nbsp;kB&nbsp;·&nbsp;4.8%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs                                                                                                             | `██████░░░░░░░░░░░░░░`&nbsp;30.9%&nbsp;·&nbsp;29.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → build/modern/query.js + 14 more                                                                                     | `█████░░░░░░░░░░░░░░░`&nbsp;25.9%&nbsp;·&nbsp;24.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → App.vue + 19 more                                                                                                                    | `████░░░░░░░░░░░░░░░░`&nbsp;18.5%&nbsp;·&nbsp;17.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/queryClient.js">…ild/modern/queryClient.js</abbr> + 4 more                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.3%&nbsp;·&nbsp;3.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.4%&nbsp;·&nbsp;20.3&nbsp;kB                                     |
| **dist/client/assets/ExploreDataPanel-BoXDhPEA.js**                                                                                                                | 81.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;23.3&nbsp;kB&nbsp;·&nbsp;4.2%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → InvestigateDataPanel.vue + 4 more                                                                                                    | `████████░░░░░░░░░░░░`&nbsp;41.1%&nbsp;·&nbsp;33.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop → index.mjs + 1 more                                                                                                | `████████░░░░░░░░░░░░`&nbsp;39.3%&nbsp;·&nbsp;32.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/grip-vertical.mjs + 1 more                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;417&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.1%&nbsp;·&nbsp;15.7&nbsp;kB                                     |
| **dist/client/assets/es-d5m8M5h8.svg**                                                                                                                             | 79.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;14.5&nbsp;kB&nbsp;·&nbsp;4.0%&nbsp;of&nbsp;the&nbsp;build   |
| **<abbr title="dist/client/assets/inter-latin-opsz-normal-BwkfbSeq.woff2">…t/assets/inter-latin-opsz-normal-BwkfbSeq.woff2</abbr>**                                | 71.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;71.2&nbsp;kB&nbsp;·&nbsp;3.6%&nbsp;of&nbsp;the&nbsp;build   |
| **<abbr title="dist/client/assets/runtime-core.esm-bundler-DZVpvhbx.js">…ent/assets/runtime-core.esm-bundler-DZVpvhbx.js</abbr>**                                  | 68.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;26.5&nbsp;kB&nbsp;·&nbsp;3.5%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → <abbr title="dist/runtime-core.esm-bundler.js">…runtime-core.esm-bundler.js</abbr>                                     | `██████████████░░░░░░`&nbsp;68.1%&nbsp;·&nbsp;46.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js                                                                                           | `█████░░░░░░░░░░░░░░░`&nbsp;25.0%&nbsp;·&nbsp;17.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js                                                                                                   | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.9%&nbsp;·&nbsp;4.0&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;748&nbsp;B                                        |
| **<abbr title="dist/client/assets/StudioDescriptorsPanel-KC9lqr51.js">…lient/assets/StudioDescriptorsPanel-KC9lqr51.js</abbr>**                                    | 64.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;20.2&nbsp;kB&nbsp;·&nbsp;3.3%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs                                                                                                               | `██████████████████░░`&nbsp;89.8%&nbsp;·&nbsp;58.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextEditor.vue + 1 more                                                                                                              | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.5%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/italic.mjs + 2 more                                                                                           | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.8%&nbsp;·&nbsp;498&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.9%&nbsp;·&nbsp;2.5&nbsp;kB                                       |
| **dist/client/assets/workspaceStore-CAnHJ0o0.js**                                                                                                                  | 48.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;20.0&nbsp;kB&nbsp;·&nbsp;2.5%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;tinybase → index.js + 1 more                                                                                                               | `███████████████████░`&nbsp;94.4%&nbsp;·&nbsp;45.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → workspaceStore.ts                                                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.0%&nbsp;·&nbsp;2.4&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;306&nbsp;B                                        |
| **<abbr title="dist/client/assets/inter-cyrillic-ext-opsz-normal-CfYZpDVp.woff2">…s/inter-cyrillic-ext-opsz-normal-CfYZpDVp.woff2</abbr>**                         | 40.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;40.6&nbsp;kB&nbsp;·&nbsp;2.1%&nbsp;of&nbsp;the&nbsp;build   |
| **<abbr title="dist/client/assets/DataViewsHomePanel-DJYVE3BY.js">…st/client/assets/DataViewsHomePanel-DJYVE3BY.js</abbr>**                                        | 37.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;11.9&nbsp;kB&nbsp;·&nbsp;1.9%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewPanel.vue + 6 more                                                                                                           | `███████████░░░░░░░░░`&nbsp;56.3%&nbsp;·&nbsp;21.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.7%&nbsp;·&nbsp;16.6&nbsp;kB                                     |
| **dist/client/assets/useDataWindow-CZaiwWj3.js**                                                                                                                   | 35.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;10.7&nbsp;kB&nbsp;·&nbsp;1.8%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core → dist/esm/index.js + 4 more                                                                                        | `██████████████████░░`&nbsp;92.4%&nbsp;·&nbsp;33.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts                                                                                                                     | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.1%&nbsp;·&nbsp;2.2&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js                                                                                                  | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.0%&nbsp;·&nbsp;376&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;174&nbsp;B                                        |
| **dist/client/assets/contextModels-BZra16Fz.js**                                                                                                                   | 31.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;6.4&nbsp;kB&nbsp;·&nbsp;1.6%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → contextModels.ts                                                                                                                     | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;345&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████████████`&nbsp;98.9%&nbsp;·&nbsp;31.2&nbsp;kB                                     |
| **dist/client/assets/locale-CMizZBdu.js**                                                                                                                          | 29.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.0&nbsp;kB&nbsp;·&nbsp;1.5%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared.es.js                                                                                              | `████████████████████`&nbsp;97.8%&nbsp;·&nbsp;28.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → locale.ts                                                                                                                            | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.3%&nbsp;·&nbsp;394&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.9%&nbsp;·&nbsp;259&nbsp;B                                        |
| **<abbr title="dist/client/assets/inter-greek-opsz-normal-BM0NlUE_.woff2">…t/assets/inter-greek-opsz-normal-BM0NlUE\_.woff2</abbr>**                               | 29.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;29.5&nbsp;kB&nbsp;·&nbsp;1.5%&nbsp;of&nbsp;the&nbsp;build   |
| **<abbr title="dist/client/assets/inter-cyrillic-opsz-normal-BFQXbQ-f.woff2">…ssets/inter-cyrillic-opsz-normal-BFQXbQ-f.woff2</abbr>**                             | 28.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;29.0&nbsp;kB&nbsp;·&nbsp;1.5%&nbsp;of&nbsp;the&nbsp;build   |
| **dist/client/assets/sdk.modern-DzpqSww0.js**                                                                                                                      | 27.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.1&nbsp;kB&nbsp;·&nbsp;1.4%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → <abbr title="dist/sdk.modern.js">…t/sdk.modern.js</abbr>                                                   | `███████████████████░`&nbsp;97.0%&nbsp;·&nbsp;26.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.0%&nbsp;·&nbsp;860&nbsp;B                                        |
| **dist/client/assets/router-CQpwvfzy.js**                                                                                                                          | 27.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;10.9&nbsp;kB&nbsp;·&nbsp;1.4%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/vue-router.js                                                                                                            | `███████████░░░░░░░░░`&nbsp;54.5%&nbsp;·&nbsp;14.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → index.ts + 1 more                                                                                                                    | `█████░░░░░░░░░░░░░░░`&nbsp;23.1%&nbsp;·&nbsp;6.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;22.4%&nbsp;·&nbsp;6.0&nbsp;kB                                      |
| **<abbr title="dist/client/assets/PreviewColumnTable-DIwwXvsr.js">…st/client/assets/PreviewColumnTable-DIwwXvsr.js</abbr>**                                        | 26.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.9&nbsp;kB&nbsp;·&nbsp;1.4%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _dataFormatIcons.ts + 4 more                                                                                                         | `████████████████░░░░`&nbsp;77.8%&nbsp;·&nbsp;21.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square-dashed.mjs + 2 more                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.0%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;18.2%&nbsp;·&nbsp;4.9&nbsp;kB                                      |
| **dist/client/assets/SessionDataPanel-DI0mymMt.js**                                                                                                                | 24.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;7.6&nbsp;kB&nbsp;·&nbsp;1.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionDataPanel.vue + 1 more                                                                                                        | `█████████████░░░░░░░`&nbsp;64.7%&nbsp;·&nbsp;15.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;35.3%&nbsp;·&nbsp;8.5&nbsp;kB                                      |
| **dist/client/assets/dist-BcG1Y5HX.js**                                                                                                                            | 22.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.8&nbsp;kB&nbsp;·&nbsp;1.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/core → dist/index.js                                                                                                               | `███████████████░░░░░`&nbsp;76.1%&nbsp;·&nbsp;17.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/shared → dist/index.js                                                                                                             | `████░░░░░░░░░░░░░░░░`&nbsp;22.3%&nbsp;·&nbsp;5.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;389&nbsp;B                                        |
| **dist/client/assets/\_dataViews-BdfQWpeD.js**                                                                                                                     | 19.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;6.6&nbsp;kB&nbsp;·&nbsp;1.0%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _dataViewStore.ts + 4 more                                                                                                           | `██████████████░░░░░░`&nbsp;71.8%&nbsp;·&nbsp;13.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;28.2%&nbsp;·&nbsp;5.4&nbsp;kB                                      |
| **<abbr title="dist/client/assets/inter-greek-ext-opsz-normal-BmPQvyvo.woff2">…sets/inter-greek-ext-opsz-normal-BmPQvyvo.woff2</abbr>**                            | 17.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;17.0&nbsp;kB&nbsp;·&nbsp;0.9%&nbsp;of&nbsp;the&nbsp;build   |
| **dist/client/personPlaceholder.png**                                                                                                                              | 16.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;16.5&nbsp;kB&nbsp;·&nbsp;0.9%&nbsp;of&nbsp;the&nbsp;build   |
| **<abbr title="dist/client/assets/runtime-dom.esm-bundler-emsei7bq.js">…ient/assets/runtime-dom.esm-bundler-emsei7bq.js</abbr>**                                   | 16.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;6.9&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → <abbr title="dist/runtime-dom.esm-bundler.js">…t/runtime-dom.esm-bundler.js</abbr>                                      | `████████████████████`&nbsp;97.7%&nbsp;·&nbsp;16.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.3%&nbsp;·&nbsp;398&nbsp;B                                        |
| **dist/client/assets/DataViewsLayout-BgcXFOYe.js**                                                                                                                 | 16.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.8&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewsLayout.vue + 2 more                                                                                                         | `████████████░░░░░░░░`&nbsp;58.4%&nbsp;·&nbsp;9.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/save.mjs + 1 more                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.8%&nbsp;·&nbsp;471&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;38.8%&nbsp;·&nbsp;6.4&nbsp;kB                                      |
| **<abbr title="dist/client/assets/performanceTracking-DyBu89LP.js">…t/client/assets/performanceTracking-DyBu89LP.js</abbr>**                                       | 15.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.4&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.attribution.js                                                                                                | `███████████████████░`&nbsp;96.8%&nbsp;·&nbsp;14.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts                                                                                                               | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.8%&nbsp;·&nbsp;430&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;72&nbsp;B                                         |
| **<abbr title="dist/client/assets/inter-vietnamese-opsz-normal-Ci9T9ieq.woff2">…ets/inter-vietnamese-opsz-normal-Ci9T9ieq.woff2</abbr>**                           | 14.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;14.9&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build   |
| **dist/client/assets/SessionAuthPanel-CPU5HPPB.js**                                                                                                                | 14.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.8&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAuthPanel.vue + 6 more                                                                                                        | `██████████████░░░░░░`&nbsp;71.2%&nbsp;·&nbsp;10.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs                                                                                            | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.8%&nbsp;·&nbsp;274&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;27.0%&nbsp;·&nbsp;3.9&nbsp;kB                                      |
| **dist/client/assets/ContextModelList-CBKISo9q.js**                                                                                                                | 14.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.9&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextModelPanel.vue + 7 more                                                                                                       | `████████████░░░░░░░░`&nbsp;58.8%&nbsp;·&nbsp;8.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;41.2%&nbsp;·&nbsp;5.8&nbsp;kB                                      |
| **<abbr title="dist/client/assets/_previewColumnRows-BsuAy_1w.js">…st/client/assets/\_previewColumnRows-BsuAy_1w.js</abbr>**                                       | 13.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.5&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/icons/fingerprint-pattern.mjs">…esm/icons/fingerprint-pattern.mjs</abbr> + 23 more                     | `██████████░░░░░░░░░░`&nbsp;48.6%&nbsp;·&nbsp;6.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _previewColumnRows.ts + 1 more                                                                                                       | `██████░░░░░░░░░░░░░░`&nbsp;31.4%&nbsp;·&nbsp;4.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;20.0%&nbsp;·&nbsp;2.7&nbsp;kB                                      |
| **dist/client/assets/EventQueryList-CCnqPWm5.js**                                                                                                                  | 12.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.7&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueryPanel.vue + 1 more                                                                                                         | `██████████░░░░░░░░░░`&nbsp;49.0%&nbsp;·&nbsp;6.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;51.0%&nbsp;·&nbsp;6.4&nbsp;kB                                      |
| **<abbr title="dist/client/assets/ContextNetwork2dPanel-DC1USMki.js">…client/assets/ContextNetwork2dPanel-DC1USMki.js</abbr>**                                     | 12.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.6&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextNetworkPanel.vue + 3 more                                                                                                     | `████████████░░░░░░░░`&nbsp;61.7%&nbsp;·&nbsp;7.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;38.3%&nbsp;·&nbsp;4.7&nbsp;kB                                      |
| **dist/client/assets/SessionMenu-RQFk_gxj.js**                                                                                                                     | 10.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.8&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue                                                                                                                      | `███████████░░░░░░░░░`&nbsp;55.1%&nbsp;·&nbsp;5.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/sun.mjs + 4 more                                                                                              | `███░░░░░░░░░░░░░░░░░`&nbsp;13.8%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;flag-icons → flags/4x3/gb.svg + 1 more                                                                                                     | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.5%&nbsp;·&nbsp;667&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;24.6%&nbsp;·&nbsp;2.5&nbsp;kB                                      |
| **dist/client/assets/preload-helper-BDFthLmV.js**                                                                                                                  | 8.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.9&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → errors.ts + 2 more                                                                                                                   | `████████████░░░░░░░░`&nbsp;59.7%&nbsp;·&nbsp;5.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.3%&nbsp;·&nbsp;3.6&nbsp;kB                                      |
| **dist/client/assets/ActionWrapper-Bb0nrlrA.js**                                                                                                                   | 8.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.7&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/devtools-RytpElE1.js                                                                                                     | `██████████████████░░`&nbsp;88.9%&nbsp;·&nbsp;7.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ActionWrapper.vue                                                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.7%&nbsp;·&nbsp;320&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;7.4%&nbsp;·&nbsp;643&nbsp;B                                        |
| **dist/client/assets/LibraryPanel-e_2Fjw2Q.js**                                                                                                                    | 8.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.3&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → LibraryPanel.vue + 2 more                                                                                                            | `█████████████░░░░░░░`&nbsp;65.8%&nbsp;·&nbsp;5.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.2%&nbsp;·&nbsp;2.9&nbsp;kB                                      |
| **<abbr title="dist/client/assets/SelectConnectionPanel-VXgLMmEc.js">…client/assets/SelectConnectionPanel-VXgLMmEc.js</abbr>**                                     | 8.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.1&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectConnectionPanel.vue                                                                                                            | `████████░░░░░░░░░░░░`&nbsp;41.5%&nbsp;·&nbsp;3.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.5%&nbsp;·&nbsp;4.7&nbsp;kB                                      |
| **dist/client/assets/ErrorNotice-D4qxVBtb.js**                                                                                                                     | 7.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.2&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ErrorBody.vue + 3 more                                                                                                               | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;4.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/refresh-cw.mjs + 4 more                                                                                       | `██░░░░░░░░░░░░░░░░░░`&nbsp;12.1%&nbsp;·&nbsp;975&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;30.4%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| **dist/client/assets/useQuery-C73KoFCf.js**                                                                                                                        | 7.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.9&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → <abbr title="build/modern/queryObserver.js">…/modern/queryObserver.js</abbr>                                        | `███████████████░░░░░`&nbsp;77.1%&nbsp;·&nbsp;6.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/useBaseQuery.js">…ld/modern/useBaseQuery.js</abbr> + 2 more                                | `████░░░░░░░░░░░░░░░░`&nbsp;19.2%&nbsp;·&nbsp;1.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.7%&nbsp;·&nbsp;296&nbsp;B                                        |
| **dist/client/assets/AssistantLayout-DiJDRFAS.js**                                                                                                                 | 7.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.0&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AssistantLayout.vue + 3 more                                                                                                         | `█████████████░░░░░░░`&nbsp;67.0%&nbsp;·&nbsp;5.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/library.mjs + 1 more                                                                                          | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.7%&nbsp;·&nbsp;377&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;28.3%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| **<abbr title="dist/client/assets/SelectConnectionList-CVCmT7Q8.js">…/client/assets/SelectConnectionList-CVCmT7Q8.js</abbr>**                                      | 7.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.9&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectConnectionList.vue                                                                                                             | `█████████░░░░░░░░░░░`&nbsp;45.2%&nbsp;·&nbsp;3.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;54.8%&nbsp;·&nbsp;4.1&nbsp;kB                                      |
| **dist/client/assets/ConfigCard-CBZ26Rj\_.js**                                                                                                                     | 6.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.4&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigCard.vue                                                                                                                       | `███████████░░░░░░░░░`&nbsp;54.9%&nbsp;·&nbsp;3.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/trash.mjs + 3 more                                                                                            | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.5%&nbsp;·&nbsp;814&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.6%&nbsp;·&nbsp;2.3&nbsp;kB                                      |
| **<abbr title="dist/client/assets/PluginConnectorPanel-q2Sqb3X_.js">…/client/assets/PluginConnectorPanel-q2Sqb3X\_.js</abbr>**                                     | 6.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.2&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginConnectorPanel.vue                                                                                                             | `████████░░░░░░░░░░░░`&nbsp;42.2%&nbsp;·&nbsp;2.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.8%&nbsp;·&nbsp;4.0&nbsp;kB                                      |
| **dist/client/assets/MasterDetailPanel-DetnUAoi.js**                                                                                                               | 6.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.8&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Grid.vue + 3 more                                                                                                                    | `██████████████░░░░░░`&nbsp;70.3%&nbsp;·&nbsp;4.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;29.7%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| **dist/client/index.html**                                                                                                                                         | 6.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.2&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| **<abbr title="dist/client/assets/SessionAccountPanel-CXiiz9qz.js">…t/client/assets/SessionAccountPanel-CXiiz9qz.js</abbr>**                                       | 6.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAccountPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;53.7%&nbsp;·&nbsp;3.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.3%&nbsp;·&nbsp;2.8&nbsp;kB                                      |
| **dist/client/assets/ConnectionPanel-CBRKIsZl.js**                                                                                                                 | 6.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.4&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConnectionPanel.vue + 2 more                                                                                                         | `█████████████░░░░░░░`&nbsp;64.7%&nbsp;·&nbsp;3.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;35.3%&nbsp;·&nbsp;2.1&nbsp;kB                                      |
| **dist/client/assets/useStudioOptions-Cdw39hU4.js**                                                                                                                | 5.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.2&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts                                                                                                                  | `████████████████████`&nbsp;98.0%&nbsp;·&nbsp;5.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.0%&nbsp;·&nbsp;122&nbsp;B                                        |
| **dist/client/assets/ScrollArea-DNFJe8Fd.js**                                                                                                                      | 5.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollThumb.vue + 1 more                                                                                                             | `████████████████░░░░`&nbsp;80.6%&nbsp;·&nbsp;4.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.4%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| **dist/client/assets/PluginPanel-CSBdrwrT.js**                                                                                                                     | 5.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPanel.vue                                                                                                                      | `██████████░░░░░░░░░░`&nbsp;49.4%&nbsp;·&nbsp;2.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/external-link.mjs                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.1%&nbsp;·&nbsp;210&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.6%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| **dist/client/assets/useSetupOptions-DWPIcjdp.js**                                                                                                                 | 4.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupOptions.ts                                                                                                                   | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;49&nbsp;B                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████████████`&nbsp;98.9%&nbsp;·&nbsp;4.5&nbsp;kB                                      |
| **dist/client/assets/PluginList-Cj65fU8O.js**                                                                                                                      | 4.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.8&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginList.vue                                                                                                                       | `████████░░░░░░░░░░░░`&nbsp;38.8%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;61.2%&nbsp;·&nbsp;2.7&nbsp;kB                                      |
| **dist/client/assets/PaneSplitter-Ci45JeQh.js**                                                                                                                    | 4.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue                                                                                                                     | `█████████████░░░░░░░`&nbsp;67.3%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;32.7%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| **dist/client/assets/menu-DpyRNxse.js**                                                                                                                            | 4.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → MenuContent.vue + 6 more                                                                                                             | `███████████████░░░░░`&nbsp;73.6%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.4%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| **dist/client/assets/ScrollRow-B96AHcOW.js**                                                                                                                       | 3.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollRow.vue                                                                                                                        | `███████████████░░░░░`&nbsp;76.6%&nbsp;·&nbsp;2.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.4%&nbsp;·&nbsp;895&nbsp;B                                       |
| **dist/client/assets/OptionBar-CWGUVqST.js**                                                                                                                       | 3.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → OptionPanel.vue + 2 more                                                                                                             | `███████████░░░░░░░░░`&nbsp;55.1%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;44.9%&nbsp;·&nbsp;1.6&nbsp;kB                                      |
| **dist/client/assets/utilities-T5EAJkC\_.js**                                                                                                                      | 3.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ErrorDialog.vue + 3 more                                                                                                             | `█████████████░░░░░░░`&nbsp;65.9%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/loader-circle.mjs                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.6%&nbsp;·&nbsp;124&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;30.5%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| **<abbr title="dist/client/assets/PresentationsPanel-BYJRfC32.js">…st/client/assets/PresentationsPanel-BYJRfC32.js</abbr>**                                        | 3.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PresentationsPanel.vue                                                                                                               | `████████████░░░░░░░░`&nbsp;60.7%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;39.3%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| **dist/client/assets/ComboboxInput-CJ3bGaMh.js**                                                                                                                   | 3.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ComboboxInput.vue                                                                                                                    | `██████████████░░░░░░`&nbsp;70.5%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;29.5%&nbsp;·&nbsp;927&nbsp;B                                       |
| **dist/client/assets/StudioLayout-CcfV3mWw.js**                                                                                                                    | 2.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.3&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHeader.vue + 3 more                                                                                                            | `█████████████░░░░░░░`&nbsp;67.4%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;32.6%&nbsp;·&nbsp;918&nbsp;B                                       |
| **dist/client/assets/createLucideIcon-CdUuhHwf.js**                                                                                                                | 2.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.3&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/shared/src/build/buildLucideIconNode.mjs">…src/build/buildLucideIconNode.mjs</abbr> + 8 more           | `███████████████████░`&nbsp;97.0%&nbsp;·&nbsp;2.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.0%&nbsp;·&nbsp;81&nbsp;B                                         |
| **dist/client/assets/configMonitor-B5ozi4kA.js**                                                                                                                   | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts                                                                                                                     | `██████████████████░░`&nbsp;88.3%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.7%&nbsp;·&nbsp;301&nbsp;B                                       |
| **<abbr title="dist/client/assets/StudioDocumentSection-BoHG75l0.js">…client/assets/StudioDocumentSection-BoHG75l0.js</abbr>**                                     | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDocumentPanel.vue + 1 more                                                                                                     | `█████████░░░░░░░░░░░`&nbsp;45.4%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;54.6%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| **dist/client/assets/\_eventQueries-DcwzPSIy.js**                                                                                                                  | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.0&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _eventQueries.ts                                                                                                                     | `████████████████░░░░`&nbsp;82.0%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;18.0%&nbsp;·&nbsp;456&nbsp;B                                       |
| **dist/client/assets/useMutation-DK1o2Gae.js**                                                                                                                     | 2.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.0&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → <abbr title="build/modern/mutationObserver.js">…dern/mutationObserver.js</abbr>                                     | `██████████████░░░░░░`&nbsp;70.6%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/useMutation.js">…ild/modern/useMutation.js</abbr>                                          | `████░░░░░░░░░░░░░░░░`&nbsp;19.0%&nbsp;·&nbsp;474&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.5%&nbsp;·&nbsp;262&nbsp;B                                       |
| **dist/client/pwa-512x512.png**                                                                                                                                    | 2.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| **dist/client/maskable-icon-512x512.png**                                                                                                                          | 2.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| **dist/client/assets/ScrollEndButtons-BO9wzkes.js**                                                                                                                | 2.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;961&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollEndButtons.vue                                                                                                                 | `█████████░░░░░░░░░░░`&nbsp;46.9%&nbsp;·&nbsp;985&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-down.mjs                                                                                                | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.9%&nbsp;·&nbsp;124&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;47.2%&nbsp;·&nbsp;990&nbsp;B                                       |
| **dist/client/assets/TextInput-B0Ea6bR2.js**                                                                                                                       | 2.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextInput.vue                                                                                                                        | `██████████████░░░░░░`&nbsp;67.5%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;32.5%&nbsp;·&nbsp;681&nbsp;B                                       |
| **dist/client/assets/GridDetailPanel-BMguPKeW.js**                                                                                                                 | 2.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;893&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GridDetailPanel.vue                                                                                                                  | `█████████████░░░░░░░`&nbsp;63.4%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;36.6%&nbsp;·&nbsp;745&nbsp;B                                       |
| **dist/client/assets/SetupLayout-BMQ3QRcE.js**                                                                                                                     | 1.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1008&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupLayout.vue                                                                                                                      | `█████████░░░░░░░░░░░`&nbsp;46.6%&nbsp;·&nbsp;929&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.4%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| **dist/client/assets/GuestWorkNotice-Bh4eW_Zd.js**                                                                                                                 | 1.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.0&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GuestWorkNotice.vue                                                                                                                  | `███████░░░░░░░░░░░░░`&nbsp;35.7%&nbsp;·&nbsp;686&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;64.3%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **<abbr title="dist/client/assets/ContextEntityDiagramPanel-Dv7ukEiK.js">…nt/assets/ContextEntityDiagramPanel-Dv7ukEiK.js</abbr>**                                 | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;628&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextEntityDiagramPanel.vue                                                                                                        | `████████████████░░░░`&nbsp;78.5%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.5%&nbsp;·&nbsp;372&nbsp;B                                       |
| **dist/client/assets/storeUse-DSMBLrfD.js**                                                                                                                        | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;911&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → storeUse.ts + 1 more                                                                                                                 | `█████████████████░░░`&nbsp;83.3%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;16.7%&nbsp;·&nbsp;286&nbsp;B                                       |
| **<abbr title="dist/client/assets/EventQueriesLayout-B7htVALu.js">…st/client/assets/EventQueriesLayout-B7htVALu.js</abbr>**                                        | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;820&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueriesLayout.vue                                                                                                               | `█████████░░░░░░░░░░░`&nbsp;44.1%&nbsp;·&nbsp;753&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.9%&nbsp;·&nbsp;954&nbsp;B                                       |
| **dist/client/assets/monitorSocket-DWuPkyoT.js**                                                                                                                   | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;840&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → monitorSocket.ts                                                                                                                     | `██████████████████░░`&nbsp;91.1%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;8.9%&nbsp;·&nbsp;141&nbsp;B                                        |
| **dist/dpuse_app/wrangler.json**                                                                                                                                   | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;773&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| **dist/client/assets/Breadcrumbs-6U1TIri3.js**                                                                                                                     | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;845&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Breadcrumbs.vue                                                                                                                      | `█████████░░░░░░░░░░░`&nbsp;47.3%&nbsp;·&nbsp;743&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;52.7%&nbsp;·&nbsp;828&nbsp;B                                       |
| **dist/client/assets/action-RavnyjBE.js**                                                                                                                          | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;536&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → action.ts                                                                                                                            | `███████████████████░`&nbsp;95.7%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.3%&nbsp;·&nbsp;66&nbsp;B                                         |
| **dist/client/assets/EmptyPlaceholder-Bud77-Ga.js**                                                                                                                | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;836&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue                                                                                                                 | `██████████░░░░░░░░░░`&nbsp;48.3%&nbsp;·&nbsp;740&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;51.7%&nbsp;·&nbsp;792&nbsp;B                                       |
| **dist/client/\_headers**                                                                                                                                          | 1.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;760&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| **<abbr title="dist/client/assets/ContextDiagramPanel-Cg93hevI.js">…t/client/assets/ContextDiagramPanel-Cg93hevI.js</abbr>**                                       | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;763&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDiagramPanel.vue                                                                                                              | `█████████░░░░░░░░░░░`&nbsp;43.2%&nbsp;·&nbsp;581&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;56.8%&nbsp;·&nbsp;765&nbsp;B                                       |
| **dist/client/assets/ItemButton-zTNzenHR.js**                                                                                                                      | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;572&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ItemButton.vue                                                                                                                       | `███████████████░░░░░`&nbsp;76.9%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.1%&nbsp;·&nbsp;311&nbsp;B                                       |
| **dist/client/assets/RetrievalGate-B1NegSsR.js**                                                                                                                   | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;792&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → RetrievalGate.vue                                                                                                                    | `████████░░░░░░░░░░░░`&nbsp;39.1%&nbsp;·&nbsp;520&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.9%&nbsp;·&nbsp;809&nbsp;B                                       |
| **dist/client/assets/ConnectorDetails-80tQewTO.js**                                                                                                                | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;656&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConnectorDetails.vue                                                                                                                 | `████████░░░░░░░░░░░░`&nbsp;41.0%&nbsp;·&nbsp;535&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;59.0%&nbsp;·&nbsp;769&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePersonalDetailsPanel-C92in8WG.js">…t/assets/ManagePersonalDetailsPanel-C92in8WG.js</abbr>**                                | 1.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;328&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue                                                                                                       | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.7%&nbsp;·&nbsp;59&nbsp;B                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████████████░`&nbsp;95.3%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/PillSegment-BOEJItL6.js**                                                                                                                     | 1.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;629&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PillSegment.vue                                                                                                                      | `███████████░░░░░░░░░`&nbsp;55.4%&nbsp;·&nbsp;654&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;44.6%&nbsp;·&nbsp;526&nbsp;B                                       |
| **dist/client/assets/dataViewLoads-Bp09H-mE.js**                                                                                                                   | 1.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;523&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViewLoads.ts                                                                                                                     | `██████████████████░░`&nbsp;90.3%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;9.7%&nbsp;·&nbsp;114&nbsp;B                                        |
| **dist/client/assets/eventTracking-CrX2i6Lg.js**                                                                                                                   | 1.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;627&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → eventTracking.ts                                                                                                                     | `█████████████████░░░`&nbsp;84.8%&nbsp;·&nbsp;956&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.2%&nbsp;·&nbsp;172&nbsp;B                                       |
| **dist/client/assets/IconButton-DuFt2lGI.js**                                                                                                                      | 1.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;603&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → IconButton.vue                                                                                                                       | `████████░░░░░░░░░░░░`&nbsp;39.9%&nbsp;·&nbsp;412&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.1%&nbsp;·&nbsp;620&nbsp;B                                       |
| **dist/client/assets/TabBar-DROfoAAS.js**                                                                                                                          | 1.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;632&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TabBar.vue                                                                                                                           | `██████████░░░░░░░░░░`&nbsp;48.4%&nbsp;·&nbsp;499&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;51.6%&nbsp;·&nbsp;532&nbsp;B                                       |
| **dist/client/assets/SelectPlaceholder-95vjc3Xb.js**                                                                                                               | 1005&nbsp;B&nbsp;·&nbsp;gzip&nbsp;607&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectPlaceholder.vue + 1 more                                                                                                       | `███░░░░░░░░░░░░░░░░░`&nbsp;13.5%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████████░░░`&nbsp;86.5%&nbsp;·&nbsp;869&nbsp;B                                       |
| **dist/client/assets/useApi-SF8tY_yo-BqDrk8b5.js**                                                                                                                 | 1005&nbsp;B&nbsp;·&nbsp;gzip&nbsp;541&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/useApi-SF8tY_yo.js                                                                                                       | `████████████████░░░░`&nbsp;80.1%&nbsp;·&nbsp;805&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.9%&nbsp;·&nbsp;200&nbsp;B                                       |
| **dist/client/assets/\_assistantLibrary-DzCUxQrK.js**                                                                                                              | 989&nbsp;B&nbsp;·&nbsp;gzip&nbsp;526&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _assistantLibrary.ts                                                                                                                 | `███████████░░░░░░░░░`&nbsp;57.1%&nbsp;·&nbsp;565&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;42.9%&nbsp;·&nbsp;424&nbsp;B                                       |
| **dist/client/favicon.svg**                                                                                                                                        | 916&nbsp;B&nbsp;·&nbsp;gzip&nbsp;455&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/pwa-192x192.png**                                                                                                                                    | 902&nbsp;B&nbsp;·&nbsp;gzip&nbsp;925&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/assistantWithStyles.svg**                                                                                                                            | 891&nbsp;B&nbsp;·&nbsp;gzip&nbsp;437&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/assets/accountMonitor-DLzQZ-mF.js**                                                                                                                  | 869&nbsp;B&nbsp;·&nbsp;gzip&nbsp;521&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts                                                                                                                    | `██████████████░░░░░░`&nbsp;67.9%&nbsp;·&nbsp;590&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;32.1%&nbsp;·&nbsp;279&nbsp;B                                       |
| **dist/client/assets/ConfigIcon-DOoj38C6.js**                                                                                                                      | 863&nbsp;B&nbsp;·&nbsp;gzip&nbsp;505&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigIcon.vue                                                                                                                       | `███████████░░░░░░░░░`&nbsp;57.0%&nbsp;·&nbsp;492&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.0%&nbsp;·&nbsp;371&nbsp;B                                       |
| **dist/client/assets/DataAppsPanel-QZo76ZWo.js**                                                                                                                   | 857&nbsp;B&nbsp;·&nbsp;gzip&nbsp;516&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataAppsPanel.vue                                                                                                                    | `██████░░░░░░░░░░░░░░`&nbsp;32.3%&nbsp;·&nbsp;277&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;67.7%&nbsp;·&nbsp;580&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDimensionDiagramPanel-C1tqRx5v.js">…assets/ContextDimensionDiagramPanel-C1tqRx5v.js</abbr>**                              | 824&nbsp;B&nbsp;·&nbsp;gzip&nbsp;456&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionDiagramPanel.vue                                                                                                     | `██████████░░░░░░░░░░`&nbsp;49.5%&nbsp;·&nbsp;408&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;50.5%&nbsp;·&nbsp;416&nbsp;B                                       |
| **dist/client/maskable-icon-192x192.png**                                                                                                                          | 801&nbsp;B&nbsp;·&nbsp;gzip&nbsp;784&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/apple-touch-icon-180x180.png**                                                                                                                       | 777&nbsp;B&nbsp;·&nbsp;gzip&nbsp;772&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/assets/useMarkedTool-DtzSiHXx.js**                                                                                                                   | 772&nbsp;B&nbsp;·&nbsp;gzip&nbsp;449&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useMarkedTool.ts                                                                                                                     | `████████████░░░░░░░░`&nbsp;62.2%&nbsp;·&nbsp;480&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;37.8%&nbsp;·&nbsp;292&nbsp;B                                       |
| **dist/client/assets/SetupHomePanel-RLyioZT7.js**                                                                                                                  | 768&nbsp;B&nbsp;·&nbsp;gzip&nbsp;503&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupHomePanel.vue                                                                                                                   | `████████░░░░░░░░░░░░`&nbsp;38.3%&nbsp;·&nbsp;294&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;61.7%&nbsp;·&nbsp;474&nbsp;B                                       |
| **dist/client/assets/Tag-DogUKJ_w.js**                                                                                                                             | 705&nbsp;B&nbsp;·&nbsp;gzip&nbsp;406&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue                                                                                                                              | `███████████████░░░░░`&nbsp;73.8%&nbsp;·&nbsp;520&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.2%&nbsp;·&nbsp;185&nbsp;B                                       |
| **dist/client/assistant.svg**                                                                                                                                      | 687&nbsp;B&nbsp;·&nbsp;gzip&nbsp;352&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/assets/HouseIcon-DKvhD-Yo.js**                                                                                                                       | 594&nbsp;B&nbsp;·&nbsp;gzip&nbsp;393&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → HouseIcon.vue                                                                                                                        | `██████████░░░░░░░░░░`&nbsp;47.8%&nbsp;·&nbsp;284&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;52.2%&nbsp;·&nbsp;310&nbsp;B                                       |
| **dist/client/assets/RectangleButton-73UbJdYl.js**                                                                                                                 | 579&nbsp;B&nbsp;·&nbsp;gzip&nbsp;392&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → RectangleButton.vue                                                                                                                  | `███████░░░░░░░░░░░░░`&nbsp;32.8%&nbsp;·&nbsp;190&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;67.2%&nbsp;·&nbsp;389&nbsp;B                                       |
| **dist/client/favicon.ico**                                                                                                                                        | 571&nbsp;B&nbsp;·&nbsp;gzip&nbsp;594&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/assets/Separator-bZBxhKLZ.js**                                                                                                                       | 557&nbsp;B&nbsp;·&nbsp;gzip&nbsp;327&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Separator.vue                                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;35.0%&nbsp;·&nbsp;195&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;65.0%&nbsp;·&nbsp;362&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePreferencesPanel-B4mY9YFN.js">…lient/assets/ManagePreferencesPanel-B4mY9YFN.js</abbr>**                                    | 556&nbsp;B&nbsp;·&nbsp;gzip&nbsp;374&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue                                                                                                           | `██████░░░░░░░░░░░░░░`&nbsp;30.2%&nbsp;·&nbsp;168&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;69.8%&nbsp;·&nbsp;388&nbsp;B                                       |
| **dist/client/manifest.webmanifest**                                                                                                                               | 551&nbsp;B&nbsp;·&nbsp;gzip&nbsp;236&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/assets/cable-C1CDOHVp.js**                                                                                                                           | 514&nbsp;B&nbsp;·&nbsp;gzip&nbsp;285&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/cable.mjs                                                                                                     | `██████████████████░░`&nbsp;88.1%&nbsp;·&nbsp;453&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.9%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/useSetupSelection-CC3XtxNF.js**                                                                                                               | 489&nbsp;B&nbsp;·&nbsp;gzip&nbsp;329&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupSelection.ts                                                                                                                 | `███████████████░░░░░`&nbsp;73.6%&nbsp;·&nbsp;360&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.4%&nbsp;·&nbsp;129&nbsp;B                                       |
| **dist/client/pwa-64x64.png**                                                                                                                                      | 489&nbsp;B&nbsp;·&nbsp;gzip&nbsp;512&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **<abbr title="dist/client/assets/PluginPresenterPanel-DJC75rrj.js">…/client/assets/PluginPresenterPanel-DJC75rrj.js</abbr>**                                      | 475&nbsp;B&nbsp;·&nbsp;gzip&nbsp;270&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPresenterPanel.vue                                                                                                             | `██████░░░░░░░░░░░░░░`&nbsp;28.6%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;71.4%&nbsp;·&nbsp;339&nbsp;B                                       |
| **dist/client/assets/unsavedWork-BHeEQDeA.js**                                                                                                                     | 475&nbsp;B&nbsp;·&nbsp;gzip&nbsp;309&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → unsavedWork.ts                                                                                                                       | `██████████████░░░░░░`&nbsp;68.2%&nbsp;·&nbsp;324&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.8%&nbsp;·&nbsp;151&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginCookbookPanel-c_UGi_Xn.js">…t/client/assets/PluginCookbookPanel-c_UGi_Xn.js</abbr>**                                       | 474&nbsp;B&nbsp;·&nbsp;gzip&nbsp;272&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginCookbookPanel.vue                                                                                                              | `██████░░░░░░░░░░░░░░`&nbsp;28.7%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;71.3%&nbsp;·&nbsp;338&nbsp;B                                       |
| **dist/client/assets/PluginToolPanel-BnoJ6JWL.js**                                                                                                                 | 453&nbsp;B&nbsp;·&nbsp;gzip&nbsp;260&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginToolPanel.vue                                                                                                                  | `█████░░░░░░░░░░░░░░░`&nbsp;26.3%&nbsp;·&nbsp;119&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████████░░░░░`&nbsp;73.7%&nbsp;·&nbsp;334&nbsp;B                                       |
| **dist/client/assets/BusyBar-DShTNlRx.js**                                                                                                                         | 407&nbsp;B&nbsp;·&nbsp;gzip&nbsp;306&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → BusyBar.vue                                                                                                                          | `███████████░░░░░░░░░`&nbsp;53.8%&nbsp;·&nbsp;219&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.2%&nbsp;·&nbsp;188&nbsp;B                                       |
| **dist/client/assets/network-ahzEQdwI.js**                                                                                                                         | 404&nbsp;B&nbsp;·&nbsp;gzip&nbsp;252&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/network.mjs                                                                                                   | `█████████████████░░░`&nbsp;84.9%&nbsp;·&nbsp;343&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.1%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/useSetupRoute-CVxo1KQV.js**                                                                                                                   | 395&nbsp;B&nbsp;·&nbsp;gzip&nbsp;283&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupRoute.ts                                                                                                                     | `███████████░░░░░░░░░`&nbsp;56.5%&nbsp;·&nbsp;223&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.5%&nbsp;·&nbsp;172&nbsp;B                                       |
| **dist/client/assets/square-pen-8qEnlHdb.js**                                                                                                                      | 380&nbsp;B&nbsp;·&nbsp;gzip&nbsp;278&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square-pen.mjs                                                                                                | `█████████████████░░░`&nbsp;83.9%&nbsp;·&nbsp;319&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;16.1%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/device-BA6whVdt.js**                                                                                                                          | 334&nbsp;B&nbsp;·&nbsp;gzip&nbsp;251&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → device.ts                                                                                                                            | `████████████████░░░░`&nbsp;79.0%&nbsp;·&nbsp;264&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.0%&nbsp;·&nbsp;70&nbsp;B                                        |
| **<abbr title="dist/client/assets/ManageSubscriptionPanel-8y5IZBUc.js">…ient/assets/ManageSubscriptionPanel-8y5IZBUc.js</abbr>**                                   | 316&nbsp;B&nbsp;·&nbsp;gzip&nbsp;255&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue                                                                                                          | `█████████░░░░░░░░░░░`&nbsp;44.9%&nbsp;·&nbsp;142&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.1%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageDataServiceTokensPanel-BE3U_o1l.js">…assets/ManageDataServiceTokensPanel-BE3U_o1l.js</abbr>**                              | 313&nbsp;B&nbsp;·&nbsp;gzip&nbsp;252&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue                                                                                                     | `█████████░░░░░░░░░░░`&nbsp;44.4%&nbsp;·&nbsp;139&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **dist/client/assets/arrow-big-left-XEeV5ruU.js**                                                                                                                  | 311&nbsp;B&nbsp;·&nbsp;gzip&nbsp;235&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs                                                                                            | `████████████████░░░░`&nbsp;80.4%&nbsp;·&nbsp;250&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.6%&nbsp;·&nbsp;61&nbsp;B                                        |
| **<abbr title="dist/client/assets/GenerateTokenPanel-JzSLWBoJ.js">…st/client/assets/GenerateTokenPanel-JzSLWBoJ.js</abbr>**                                        | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;244&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue                                                                                                               | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageSessionsPanel-CSd5cbbv.js">…t/client/assets/ManageSessionsPanel-CSd5cbbv.js</abbr>**                                       | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;245&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue                                                                                                              | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ReviewActivityPanel-CiKbrJw1.js">…t/client/assets/ReviewActivityPanel-CiKbrJw1.js</abbr>**                                       | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;245&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue                                                                                                              | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/DeleteAccountPanel-BjsSYEpy.js">…st/client/assets/DeleteAccountPanel-BjsSYEpy.js</abbr>**                                        | 301&nbsp;B&nbsp;·&nbsp;gzip&nbsp;245&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue                                                                                                               | `████████░░░░░░░░░░░░`&nbsp;42.2%&nbsp;·&nbsp;127&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.8%&nbsp;·&nbsp;174&nbsp;B                                       |
| **dist/client/assets/ManageAccessPanel-CHChTVtO.js**                                                                                                               | 300&nbsp;B&nbsp;·&nbsp;gzip&nbsp;244&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue                                                                                                                | `████████░░░░░░░░░░░░`&nbsp;42.0%&nbsp;·&nbsp;126&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.0%&nbsp;·&nbsp;174&nbsp;B                                       |
| **dist/client/assets/link-DcC-SZwC.js**                                                                                                                            | 276&nbsp;B&nbsp;·&nbsp;gzip&nbsp;214&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/link.mjs                                                                                                      | `████████████████░░░░`&nbsp;77.9%&nbsp;·&nbsp;215&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;22.1%&nbsp;·&nbsp;61&nbsp;B                                        |
| **<abbr title="dist/client/assets/StudioDetailLayout-xBKy90mL.js">…st/client/assets/StudioDetailLayout-xBKy90mL.js</abbr>**                                        | 274&nbsp;B&nbsp;·&nbsp;gzip&nbsp;225&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDetailLayout.vue                                                                                                               | `███░░░░░░░░░░░░░░░░░`&nbsp;13.1%&nbsp;·&nbsp;36&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████████░░░`&nbsp;86.9%&nbsp;·&nbsp;238&nbsp;B                                       |
| **dist/client/assets/StudioListLayout-vT9lfGJf.js**                                                                                                                | 270&nbsp;B&nbsp;·&nbsp;gzip&nbsp;223&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioListLayout.vue                                                                                                                 | `███░░░░░░░░░░░░░░░░░`&nbsp;13.3%&nbsp;·&nbsp;36&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████████░░░`&nbsp;86.7%&nbsp;·&nbsp;234&nbsp;B                                       |
| **dist/dpuse_app/index.js**                                                                                                                                        | 269&nbsp;B&nbsp;·&nbsp;gzip&nbsp;209&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/assets/tools-zoULjEy8.js**                                                                                                                           | 250&nbsp;B&nbsp;·&nbsp;gzip&nbsp;209&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → tools.ts                                                                                                                             | `████████░░░░░░░░░░░░`&nbsp;41.2%&nbsp;·&nbsp;103&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.8%&nbsp;·&nbsp;147&nbsp;B                                       |
| **dist/client/assets/configCard-Cyu9Diwg.js**                                                                                                                      | 246&nbsp;B&nbsp;·&nbsp;gzip&nbsp;205&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configCard.ts                                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.3%&nbsp;·&nbsp;131&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.7%&nbsp;·&nbsp;115&nbsp;B                                       |
| **dist/client/assets/rolldown-runtime-4tVxZq34.js**                                                                                                                | 237&nbsp;B&nbsp;·&nbsp;gzip&nbsp;196&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| **dist/client/assets/appearance-CFTZUulF.js**                                                                                                                      | 225&nbsp;B&nbsp;·&nbsp;gzip&nbsp;201&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → appearance.ts                                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.7%&nbsp;·&nbsp;105&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.3%&nbsp;·&nbsp;120&nbsp;B                                       |
| **dist/client/assets/search-Ckku7oqo.js**                                                                                                                          | 194&nbsp;B&nbsp;·&nbsp;gzip&nbsp;181&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs                                                                                                    | `██████████████░░░░░░`&nbsp;68.6%&nbsp;·&nbsp;133&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.4%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/arrow-left-BOBeqZWJ.js**                                                                                                                      | 185&nbsp;B&nbsp;·&nbsp;gzip&nbsp;175&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs                                                                                                | `█████████████░░░░░░░`&nbsp;67.0%&nbsp;·&nbsp;124&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.0%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/arrow-up-CIXYWj78.js**                                                                                                                        | 182&nbsp;B&nbsp;·&nbsp;gzip&nbsp;174&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-up.mjs                                                                                                  | `█████████████░░░░░░░`&nbsp;66.5%&nbsp;·&nbsp;121&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.5%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/\_itemStepTrail-D8BRXG3A.js**                                                                                                                 | 176&nbsp;B&nbsp;·&nbsp;gzip&nbsp;157&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _itemStepTrail.ts                                                                                                                    | `█████████░░░░░░░░░░░`&nbsp;44.9%&nbsp;·&nbsp;79&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.1%&nbsp;·&nbsp;97&nbsp;B                                        |
| **dist/client/assets/plus-kDhItRWY.js**                                                                                                                            | 173&nbsp;B&nbsp;·&nbsp;gzip&nbsp;165&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs                                                                                                      | `█████████████░░░░░░░`&nbsp;64.7%&nbsp;·&nbsp;112&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;35.3%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/chevron-left-Bo-aFFfu.js**                                                                                                                    | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;159&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs                                                                                              | `████████████░░░░░░░░`&nbsp;59.3%&nbsp;·&nbsp;89&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.7%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/chevron-right-Br3NEjlK.js**                                                                                                                   | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;155&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs                                                                                             | `████████████░░░░░░░░`&nbsp;59.3%&nbsp;·&nbsp;89&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.7%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/check-DK0D8uZI.js**                                                                                                                           | 144&nbsp;B&nbsp;·&nbsp;gzip&nbsp;156&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/check.mjs                                                                                                     | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;83&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/robots.txt**                                                                                                                                         | 24&nbsp;B&nbsp;·&nbsp;gzip&nbsp;44&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build         |

Bars show each row's share of its output file.

A file with no rows beneath it is shipped as it is, such as WebAssembly, so it has no breakdown. Source maps and type declarations are left out.

- n more = the row also holds n more files from the same package or folder, each no larger than the one named. A package can appear under several output files, each holding different files, never the same file twice.

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
| Test coverage        | ✅ On  | [Vitest's V8 coverage](https://vitest.dev/guide/coverage) measures the share of source lines the unit tests run.                                                                   |

### Code Quality

| Check         | Status | What it does                                                                                                                                                                                                                                                                                               |
| :------------ | :----- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linting       | ✅ On  | [ESLint](https://eslint.org) checks the code for errors and style problems, and the [TypeScript](https://www.typescriptlang.org/) compiler type-checks the whole project. Part of the [CI workflow](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml) on every push and pull request to `main`. |
| Code analysis | ❌ Off | [SonarCloud](https://sonarcloud.io) checks every push for bugs, code smells and vulnerabilities.                                                                                                                                                                                                           |

### Security Analysis

| Check           | Status | What it does                                                                                                                                                                                                      |
| :-------------- | :----- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Push protection | ✅ On  | [GitHub push protection](https://docs.github.com/en/code-security/secret-scanning/push-protection-for-repositories-and-organizations) blocks pushes that contain credentials.                                     |
| Static analysis | ✅ On  | [GitHub CodeQL](https://codeql.github.com) scans GitHub Actions and JavaScript/TypeScript for security vulnerabilities, using the extended security queries, on every push and pull request to `main` and weekly. |
| Secret scanning | ✅ On  | [GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning) detects credentials, such as API keys and tokens, committed to the repository.                                                 |

### Dependencies

| Check               | Status | What it does                                                                                                                                                                                                                                                                                                     |
| :------------------ | :----- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vulnerability audit | ✅ On  | [npm audit](https://docs.npmjs.com/cli/commands/npm-audit) fails when a shipped dependency has any known vulnerability, or a development dependency has a high or critical one. Part of the [CI workflow](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml) on every push and pull request to `main`. |
| Supply chain risk   | ✅ On  | [Socket.dev](https://socket.dev) flags malicious packages, typosquatting and suspicious behaviour that may not yet have a CVE.                                                                                                                                                                                   |
| Security alerts     | ✅ On  | [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot) alerts when a dependency has a known vulnerability, using the GitHub Advisory Database.                                                                                                                                                 |
| Dependency updates  | ❌ Off | [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot) can open pull requests for new and vulnerable dependency versions. Dependencies are updated by hand with `npm run check` instead.                                                                                                       |

### OpenSSF 🚧

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/dpuse/dpuse-app/badge)](https://scorecard.dev/viewer/?uri=github.com/dpuse/dpuse-app)

This project is working towards the [OpenSSF Best Practices](https://www.bestpractices.dev) Passing badge, a self-certification covering security policy, vulnerability reporting, build processes, code quality, and more. Currently the [OpenSSF Scorecard](https://scorecard.dev) provides an independent automated assessment of the project's security practices and is an ongoing area of improvement.

### Reporting Vulnerabilities

Please do not open public GitHub issues for security vulnerabilities. Use [GitHub private vulnerability reporting](https://github.com/dpuse/dpuse-app/security/advisories/new) instead. See [SECURITY.md](./SECURITY.md) for the full disclosure policy, contact details, and expected response times.

<!-- QUALITY_SECURITY_END -->

<!-- CONTRIBUTING_LICENSE_START -->

## Contributing

This repository is maintained solely by its owner and does not, at present, accept external contributions.

For security vulnerabilities, see [Reporting Vulnerabilities](#reporting-vulnerabilities). For bugs, inconsistencies, or other feedback, [open a GitHub issue](https://github.com/dpuse/dpuse-app/issues) — feedback is read, but responses and fixes are at the maintainer's discretion.

## License

This project is licensed under the MIT License, permitting free use, modification, and distribution.

[MIT](./LICENSE) © 2026 Jonathan Terrell

<!-- CONTRIBUTING_LICENSE_END -->
