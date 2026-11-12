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

License data is updated each time `npm run document` is run, using [license-checker](https://github.com/RSeidelsohn/license-checker-rseidelsohn). The following table lists every package whose code, styles or assets are included in this project's build, as recorded by the build itself. Modules loaded at run time are not included; each documents its own. These dependencies have been checked and confirmed to use Apache-2.0, ISC, MIT, or OFL-1.1, all of which allow commercial use. All are used unmodified, so any licence conditions that apply only to modified versions are not triggered. Developers cloning this repository should independently verify development dependencies.

| Dependency                                                             | Version | License(s)              | Document                                                                      |
| :--------------------------------------------------------------------- | :-----: | :---------------------- | :---------------------------------------------------------------------------- |
| [@ag-ui/core](https://github.com/ag-ui-protocol/ag-ui)                 |  1.0.0  | MIT                     | [LICENSE](licenses/downloads/@ag-ui/core@1.0.0-LICENSE.txt)                   |
| [@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)           | 1.0.213 | MIT                     | [LICENSE](licenses/downloads/@dpuse/dpuse-shared@1.0.213-LICENSE.txt)         |
| [@fontsource-variable/inter](https://github.com/fontsource/font-files) |  5.3.0  | OFL-1.1                 | [LICENSE](licenses/downloads/@fontsource-variable/inter@5.3.0-LICENSE.txt)    |
| [@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)     |  0.7.0  | MIT                     | [LICENSE](licenses/downloads/@formkit/drag-and-drop@0.7.0-LICENSE.txt)        |
| [@lucide/vue](https://github.com/lucide-icons/lucide)                  | 1.72.0  | ISC                     | [LICENSE](licenses/downloads/@lucide/vue@1.72.0-LICENSE.txt)                  |
| [@tanstack/ai](https://github.com/TanStack/ai)                         |  1.4.0  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai@1.4.0-LICENSE.txt)                  |
| [@tanstack/ai-client](https://github.com/TanStack/ai)                  |  1.1.0  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai-client@1.1.0-LICENSE.txt)           |
| [@tanstack/query-core](https://github.com/TanStack/query)              | 5.107.1 | MIT                     | [LICENSE](licenses/downloads/@tanstack/query-core@5.107.1-LICENSE.txt)        |
| [@tanstack/store](https://github.com/TanStack/store)                   | 0.11.2  | MIT                     | [LICENSE](licenses/downloads/@tanstack/store@0.11.2-LICENSE.txt)              |
| [@tanstack/table-core](https://github.com/TanStack/table)              |  9.3.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/table-core@9.3.1-LICENSE.txt)          |
| [@tanstack/virtual-core](https://github.com/TanStack/virtual)          | 3.19.11 | MIT                     | [LICENSE](licenses/downloads/@tanstack/virtual-core@3.19.11-LICENSE.txt)      |
| [@tanstack/vue-query](https://github.com/TanStack/query)               | 5.107.1 | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-query@5.107.1-LICENSE.txt)         |
| [@tanstack/vue-table](https://github.com/TanStack/table)               |  9.3.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-table@9.3.1-LICENSE.txt)           |
| [@tanstack/vue-virtual](https://github.com/TanStack/virtual)           | 3.13.52 | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-virtual@3.13.52-LICENSE.txt)       |
| [@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)    |  3.1.0  | MIT                     | [LICENSE](licenses/downloads/@teamhanko/hanko-frontend-sdk@3.1.0-LICENSE.txt) |
| [@vue/reactivity](https://github.com/vuejs/core)                       | 3.5.45  | MIT                     | [LICENSE](licenses/downloads/@vue/reactivity@3.5.45-LICENSE.txt)              |
| [@vue/runtime-core](https://github.com/vuejs/core)                     | 3.5.45  | MIT                     | [LICENSE](licenses/downloads/@vue/runtime-core@3.5.45-LICENSE.txt)            |
| [@vue/runtime-dom](https://github.com/vuejs/core)                      | 3.5.45  | MIT                     | [LICENSE](licenses/downloads/@vue/runtime-dom@3.5.45-LICENSE.txt)             |
| [@vue/shared](https://github.com/vuejs/core)                           | 3.5.45  | MIT                     | [LICENSE](licenses/downloads/@vue/shared@3.5.45-LICENSE.txt)                  |
| [@vueuse/core](https://github.com/vueuse/vueuse)                       | 15.0.0  | MIT                     | [LICENSE](licenses/downloads/@vueuse/core@15.0.0-LICENSE.txt)                 |
| [@vueuse/shared](https://github.com/vueuse/vueuse)                     | 15.0.0  | MIT                     | [LICENSE](licenses/downloads/@vueuse/shared@15.0.0-LICENSE.txt)               |
| [dompurify](https://github.com/cure53/DOMPurify)                       | 3.4.17  | (MPL-2.0 OR Apache-2.0) | [LICENSE](licenses/downloads/dompurify@3.4.17-LICENSE.txt)                    |
| [fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)      |  3.1.1  | MIT                     | [LICENSE](licenses/downloads/fast-json-patch@3.1.1-LICENSE.txt)               |
| [partial-json](https://github.com/promplate/partial-json-parser-js)    |  0.1.7  | MIT                     | [LICENSE](licenses/downloads/partial-json@0.1.7-LICENSE.txt)                  |
| [squire-rte](https://github.com/neilj/Squire)                          | 2.4.11  | MIT                     | [LICENSE](licenses/downloads/squire-rte@2.4.11-LICENSE.txt)                   |
| [tinybase](https://github.com/tinyplex/tinybase)                       | 10.0.1  | MIT                     | [LICENSE](licenses/downloads/tinybase@10.0.1-LICENSE.txt)                     |
| [valibot](https://github.com/open-circle/valibot)                      |  1.5.0  | MIT                     | [LICENSE](licenses/downloads/valibot@1.5.0-LICENSE.txt)                       |
| [vue-router](https://github.com/vuejs/router)                          |  5.5.0  | MIT                     | [LICENSE](licenses/downloads/vue-router@5.5.0-LICENSE.txt)                    |
| [web-vitals](https://github.com/GoogleChrome/web-vitals)               |  6.2.3  | Apache-2.0              | [LICENSE](licenses/downloads/web-vitals@6.2.3-LICENSE.txt)                    |

### Dependency Tree

The dependency tree below shows how each package in the table above is reached — direct and transitive — along with its installed version, release date, and update status. A package that does not ship itself, such as one whose parts are bundled separately, is left out and what ships beneath it is shown in its place. Packages flagged ❗ have a newer version available; ⚠️ indicates a package that hasn't been updated in the last 6 months or longer. Neither flag necessarily indicates a problem: we let new releases stabilise before upgrading, and some packages are mature and stable (have limited or no dependencies), so they require no active development.

- **[@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)** 1.0.213 — this month: 2026-11-12
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — 2 mths ago: 2026-09-09
- **[@fontsource-variable/inter](https://github.com/fontsource/font-files)** 5.3.0 — 3 mths ago: 2026-07-19
- **[@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)** 0.7.0 — this month: 2026-11-07
- **[@lucide/vue](https://github.com/lucide-icons/lucide)** 1.72.0 — this month: 2026-11-11
- **[@tanstack/ai-client](https://github.com/TanStack/ai)** 1.1.0 — this month: 2026-11-04
    - **[@tanstack/ai](https://github.com/TanStack/ai)** 1.4.0 — this month: 2026-11-09
    - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29
- **[@tanstack/ai](https://github.com/TanStack/ai)** 1.4.0 — this month: 2026-11-09
    - **[@ag-ui/core](https://github.com/ag-ui-protocol/ag-ui)** 1.0.0 — 1 mth ago: 2026-09-17 → latest: 1.0.4 — this month: 2026-11-05 ❗
    - **[fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)** 3.1.1 — 55 mths ago: 2022-03-24 ⚠️
    - **[partial-json](https://github.com/promplate/partial-json-parser-js)** 0.1.7 — 29 mths ago: 2024-05-14 ⚠️
- **[@tanstack/vue-query](https://github.com/TanStack/query)** 5.107.1 — this month: 2026-11-06
    - **[@tanstack/query-core](https://github.com/TanStack/query)** 5.107.1 — this month: 2026-11-06
- **[@tanstack/vue-table](https://github.com/TanStack/table)** 9.3.1 — 1 mth ago: 2026-10-12
    - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29
    - **[@tanstack/table-core](https://github.com/TanStack/table)** 9.3.1 — 1 mth ago: 2026-10-12
        - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29
- **[@tanstack/vue-virtual](https://github.com/TanStack/virtual)** 3.13.52 — this month: 2026-11-03
    - **[@tanstack/virtual-core](https://github.com/TanStack/virtual)** 3.19.11 — this month: 2026-11-03
- **[@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)** 3.1.0 — 1 mth ago: 2026-10-01
- **[@vueuse/core](https://github.com/vueuse/vueuse)** 15.0.0 — 1 mth ago: 2026-09-16
    - **[@vueuse/shared](https://github.com/vueuse/vueuse)** 15.0.0 — 1 mth ago: 2026-09-16
- **[dompurify](https://github.com/cure53/DOMPurify)** 3.4.17 — 1 mth ago: 2026-10-12
- **[squire-rte](https://github.com/neilj/Squire)** 2.4.11 — this month: 2026-11-10
- **[tinybase](https://github.com/tinyplex/tinybase)** 10.0.1 — 1 mth ago: 2026-09-24 → latest: 10.1.0 — this month: 2026-11-12 ❗
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — 2 mths ago: 2026-09-09
- **[vue-router](https://github.com/vuejs/router)** 5.5.0 — this month: 2026-11-10
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.45 — this month: 2026-11-05
- **[@vue/runtime-dom](https://github.com/vuejs/core)** 3.5.45 — this month: 2026-11-05
    - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.45 — this month: 2026-11-05
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.45 — this month: 2026-11-05
    - **[@vue/runtime-core](https://github.com/vuejs/core)** 3.5.45 — this month: 2026-11-05
        - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.45 — this month: 2026-11-05
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.45 — this month: 2026-11-05
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.45 — this month: 2026-11-05
- **[web-vitals](https://github.com/GoogleChrome/web-vitals)** 6.2.3 — 1 mth ago: 2026-10-05

<!-- DEPENDENCY_LICENSES_END -->

<!-- BUNDLE_START -->

## Bundle Analysis

This report is updated with each release, from the bundle the release builds, using [Sonda](https://sonda.dev/), which analyses final source maps to reveal the actual effects of tree-shaking and minification rather than relying on pre-build estimates.

_Note: Sonda's Vite reports currently exclude CSS files, since Vite does not generate source maps for CSS._

| Chunk/Module/File                                                                                                                                                  | Composition                                                                                    |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **dist/client/assets/ChatPanel-CzzbJ6AL.js**                                                                                                                       | 215.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;58.9&nbsp;kB&nbsp;·&nbsp;16.8%&nbsp;of&nbsp;the&nbsp;build |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client → dist/esm/chat-client.js + 13 more                                                                                    | `████████░░░░░░░░░░░░`&nbsp;42.2%&nbsp;·&nbsp;90.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai → <abbr title="dist/esm/activities/chat/stream/processor.js">…ivities/chat/stream/processor.js</abbr> + 28 more               | `████████░░░░░░░░░░░░`&nbsp;39.3%&nbsp;·&nbsp;84.6&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → tanstackClientTools.ts + 16 more                                                                                                     | `█░░░░░░░░░░░░░░░░░░░`&nbsp;7.0%&nbsp;·&nbsp;15.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;fast-json-patch → module/core.mjs + 3 more                                                                                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.6%&nbsp;·&nbsp;9.8&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json → dist/index.js + 1 more                                                                                                      | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/alien.js + 1 more                                                                                                   | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@ag-ui/core → dist/version-CTNE2I0_.mjs                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/icons/gallery-vertical-end.mjs">…sm/icons/gallery-vertical-end.mjs</abbr> + 1 more                     | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.1%&nbsp;·&nbsp;298&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.0%&nbsp;·&nbsp;6.5&nbsp;kB                                       |
| **dist/client/assets/index-CtaX7thh.js**                                                                                                                           | 115.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;38.9&nbsp;kB&nbsp;·&nbsp;9.0%&nbsp;of&nbsp;the&nbsp;build  |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts + 30 more                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;30.3%&nbsp;·&nbsp;35.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs                                                                                                             | `█████░░░░░░░░░░░░░░░`&nbsp;24.6%&nbsp;·&nbsp;28.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → build/modern/query.js + 14 more                                                                                     | `████░░░░░░░░░░░░░░░░`&nbsp;21.1%&nbsp;·&nbsp;24.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/queryClient.js">…ild/modern/queryClient.js</abbr> + 4 more                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.7%&nbsp;·&nbsp;3.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.3%&nbsp;·&nbsp;24.5&nbsp;kB                                     |
| **dist/client/assets/Table-5CizBAv\_.js**                                                                                                                          | 103.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;29.0&nbsp;kB&nbsp;·&nbsp;8.1%&nbsp;of&nbsp;the&nbsp;build  |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ColumnDetailPanel.vue + 14 more                                                                                                      | `████████░░░░░░░░░░░░`&nbsp;39.2%&nbsp;·&nbsp;40.6&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core → <abbr title="dist/features/column-pinning/columnPinningFeature.utils.js">…nPinningFeature.utils.js</abbr> + 32 more | `███████░░░░░░░░░░░░░`&nbsp;36.1%&nbsp;·&nbsp;37.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table → dist/merge-proxy.js + 2 more                                                                                         | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.1%&nbsp;·&nbsp;2.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/icons/sliders-horizontal.mjs">…/esm/icons/sliders-horizontal.mjs</abbr> + 6 more                       | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;1.7&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js                                                                                                          | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;676&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;20.3%&nbsp;·&nbsp;21.0&nbsp;kB                                     |
| **dist/client/assets/SelectItemPanel-DKLfY5xf.js**                                                                                                                 | 77.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;23.6&nbsp;kB&nbsp;·&nbsp;6.1%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectItemPanel.vue + 8 more                                                                                                         | `██████████████░░░░░░`&nbsp;69.3%&nbsp;·&nbsp;54.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/scan-text.mjs + 9 more                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.7%&nbsp;·&nbsp;2.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;28.0%&nbsp;·&nbsp;21.8&nbsp;kB                                     |
| **dist/client/assets/ExploreDataPanel-MVfpKT34.js**                                                                                                                | 74.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;21.2&nbsp;kB&nbsp;·&nbsp;5.8%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop → index.mjs + 1 more                                                                                                | `████████░░░░░░░░░░░░`&nbsp;40.6%&nbsp;·&nbsp;30.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TransformDataPanel.vue + 4 more                                                                                                      | `████████░░░░░░░░░░░░`&nbsp;40.4%&nbsp;·&nbsp;30.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/grip-vertical.mjs + 1 more                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;416&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;18.4%&nbsp;·&nbsp;13.8&nbsp;kB                                     |
| **<abbr title="dist/client/assets/runtime-core.esm-bundler-BVGBBtHW.js">…ent/assets/runtime-core.esm-bundler-BVGBBtHW.js</abbr>**                                  | 68.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;26.5&nbsp;kB&nbsp;·&nbsp;5.4%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → <abbr title="dist/runtime-core.esm-bundler.js">…runtime-core.esm-bundler.js</abbr>                                     | `██████████████░░░░░░`&nbsp;68.3%&nbsp;·&nbsp;47.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js                                                                                           | `█████░░░░░░░░░░░░░░░`&nbsp;25.0%&nbsp;·&nbsp;17.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js                                                                                                   | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.6%&nbsp;·&nbsp;3.8&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;749&nbsp;B                                        |
| **<abbr title="dist/client/assets/StudioDescriptorsPanel-C5OqfsVb.js">…lient/assets/StudioDescriptorsPanel-C5OqfsVb.js</abbr>**                                    | 64.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;20.2&nbsp;kB&nbsp;·&nbsp;5.0%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs                                                                                                               | `██████████████████░░`&nbsp;89.8%&nbsp;·&nbsp;58.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextEditor.vue + 1 more                                                                                                              | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.5%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/italic.mjs + 2 more                                                                                           | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.8%&nbsp;·&nbsp;498&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.9%&nbsp;·&nbsp;2.5&nbsp;kB                                       |
| **dist/client/assets/workspaceStore-BCon3Z8b.js**                                                                                                                  | 47.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;19.6&nbsp;kB&nbsp;·&nbsp;3.7%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;tinybase → index.js + 1 more                                                                                                               | `███████████████████░`&nbsp;94.5%&nbsp;·&nbsp;45.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → workspaceStore.ts                                                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.9%&nbsp;·&nbsp;2.3&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;298&nbsp;B                                        |
| **dist/client/assets/ContextModelList-Dg7_gGn0.js**                                                                                                                | 44.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;11.0&nbsp;kB&nbsp;·&nbsp;3.5%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextModelPanel.vue + 7 more                                                                                                       | `████░░░░░░░░░░░░░░░░`&nbsp;18.6%&nbsp;·&nbsp;8.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████████░░░░`&nbsp;81.4%&nbsp;·&nbsp;36.6&nbsp;kB                                     |
| **dist/client/assets/useDataWindow-CyNnvFzh.js**                                                                                                                   | 33.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;10.3&nbsp;kB&nbsp;·&nbsp;2.6%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core → dist/esm/index.js + 4 more                                                                                        | `██████████████████░░`&nbsp;92.0%&nbsp;·&nbsp;31.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts                                                                                                                     | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.4%&nbsp;·&nbsp;2.2&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js                                                                                                  | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;376&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;174&nbsp;B                                        |
| **dist/client/assets/locale-CvQwMhps.js**                                                                                                                          | 28.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;7.7&nbsp;kB&nbsp;·&nbsp;2.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared.es.js                                                                                              | `████████████████████`&nbsp;97.8%&nbsp;·&nbsp;27.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → locale.ts                                                                                                                            | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.4%&nbsp;·&nbsp;394&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.8%&nbsp;·&nbsp;238&nbsp;B                                        |
| **dist/client/assets/sdk.modern-BA6sl1Hr.js**                                                                                                                      | 27.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.1&nbsp;kB&nbsp;·&nbsp;2.1%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → <abbr title="dist/sdk.modern.js">…t/sdk.modern.js</abbr>                                                   | `███████████████████░`&nbsp;97.0%&nbsp;·&nbsp;26.6&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.0%&nbsp;·&nbsp;858&nbsp;B                                        |
| **<abbr title="dist/client/assets/PreviewColumnTable-BikqkWTr.js">…st/client/assets/PreviewColumnTable-BikqkWTr.js</abbr>**                                        | 27.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.9&nbsp;kB&nbsp;·&nbsp;2.1%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _dataFormatIcons.ts + 4 more                                                                                                         | `████████████████░░░░`&nbsp;77.7%&nbsp;·&nbsp;21.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square-dashed.mjs + 2 more                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.0%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;18.4%&nbsp;·&nbsp;5.0&nbsp;kB                                      |
| **dist/client/assets/DataViewList-DHuAONCC.js**                                                                                                                    | 25.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.0&nbsp;kB&nbsp;·&nbsp;2.0%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewPanel.vue + 3 more                                                                                                           | `██████████░░░░░░░░░░`&nbsp;48.7%&nbsp;·&nbsp;12.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;51.3%&nbsp;·&nbsp;13.1&nbsp;kB                                     |
| **dist/client/assets/\_dataViews-BFDbMqtU.js**                                                                                                                     | 23.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;7.8&nbsp;kB&nbsp;·&nbsp;1.9%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _dataViewStore.ts + 4 more                                                                                                           | `███████████░░░░░░░░░`&nbsp;54.2%&nbsp;·&nbsp;12.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → <abbr title="build/modern/queryObserver.js">…/modern/queryObserver.js</abbr> + 1 more                               | `███████░░░░░░░░░░░░░`&nbsp;32.8%&nbsp;·&nbsp;7.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/useBaseQuery.js">…ld/modern/useBaseQuery.js</abbr> + 3 more                                | `██░░░░░░░░░░░░░░░░░░`&nbsp;8.3%&nbsp;·&nbsp;2.0&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.6%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| **dist/client/assets/ActionWrapper-CjfI1AeP.js**                                                                                                                   | 23.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;9.2&nbsp;kB&nbsp;·&nbsp;1.8%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/vue-router.js + 1 more                                                                                                   | `███████████████████░`&nbsp;96.3%&nbsp;·&nbsp;22.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ActionWrapper.vue                                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.4%&nbsp;·&nbsp;321&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.4%&nbsp;·&nbsp;556&nbsp;B                                        |
| **dist/client/assets/dist-BE0aR4sf.js**                                                                                                                            | 21.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.4&nbsp;kB&nbsp;·&nbsp;1.7%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/core → dist/index.js                                                                                                               | `███████████████░░░░░`&nbsp;74.8%&nbsp;·&nbsp;16.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/shared → dist/index.js                                                                                                             | `█████░░░░░░░░░░░░░░░`&nbsp;23.5%&nbsp;·&nbsp;5.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;374&nbsp;B                                        |
| **<abbr title="dist/client/assets/runtime-dom.esm-bundler-Dkco5Ys8.js">…ient/assets/runtime-dom.esm-bundler-Dkco5Ys8.js</abbr>**                                   | 16.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;6.9&nbsp;kB&nbsp;·&nbsp;1.3%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → <abbr title="dist/runtime-dom.esm-bundler.js">…t/runtime-dom.esm-bundler.js</abbr>                                      | `████████████████████`&nbsp;97.7%&nbsp;·&nbsp;16.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.3%&nbsp;·&nbsp;398&nbsp;B                                        |
| **dist/client/assets/DataViewsLayout-D4nGLWIN.js**                                                                                                                 | 15.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.6&nbsp;kB&nbsp;·&nbsp;1.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewsLayout.vue + 2 more                                                                                                         | `████████████░░░░░░░░`&nbsp;59.3%&nbsp;·&nbsp;9.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/save.mjs + 1 more                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.9%&nbsp;·&nbsp;471&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;37.8%&nbsp;·&nbsp;6.0&nbsp;kB                                      |
| **<abbr title="dist/client/assets/performanceTracking-CO-3LiR9.js">…t/client/assets/performanceTracking-CO-3LiR9.js</abbr>**                                       | 15.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.4&nbsp;kB&nbsp;·&nbsp;1.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.attribution.js                                                                                                | `███████████████████░`&nbsp;96.8%&nbsp;·&nbsp;14.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts                                                                                                               | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.8%&nbsp;·&nbsp;430&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;72&nbsp;B                                         |
| **<abbr title="dist/client/assets/SelectConnectionList-yHRO0Tcy.js">…/client/assets/SelectConnectionList-yHRO0Tcy.js</abbr>**                                      | 14.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.1&nbsp;kB&nbsp;·&nbsp;1.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectConnectionList.vue + 1 more                                                                                                    | `█████████░░░░░░░░░░░`&nbsp;45.1%&nbsp;·&nbsp;6.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;54.9%&nbsp;·&nbsp;8.1&nbsp;kB                                      |
| **dist/client/assets/SessionAuthPanel-D4vB1DHf.js**                                                                                                                | 14.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.8&nbsp;kB&nbsp;·&nbsp;1.1%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAuthPanel.vue + 6 more                                                                                                        | `██████████████░░░░░░`&nbsp;71.5%&nbsp;·&nbsp;10.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs                                                                                            | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.9%&nbsp;·&nbsp;274&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.6%&nbsp;·&nbsp;3.8&nbsp;kB                                      |
| **<abbr title="dist/client/assets/_previewColumnRows-SdNmMs5D.js">…st/client/assets/\_previewColumnRows-SdNmMs5D.js</abbr>**                                       | 13.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.5&nbsp;kB&nbsp;·&nbsp;1.0%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/icons/fingerprint-pattern.mjs">…esm/icons/fingerprint-pattern.mjs</abbr> + 23 more                     | `██████████░░░░░░░░░░`&nbsp;48.6%&nbsp;·&nbsp;6.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _previewColumnRows.ts + 1 more                                                                                                       | `██████░░░░░░░░░░░░░░`&nbsp;31.4%&nbsp;·&nbsp;4.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;20.0%&nbsp;·&nbsp;2.7&nbsp;kB                                      |
| **dist/client/assets/LibraryPanel--LXtQaOl.js**                                                                                                                    | 9.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.8&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → LibraryPanel.vue + 3 more                                                                                                            | `█████████████░░░░░░░`&nbsp;64.4%&nbsp;·&nbsp;6.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;35.6%&nbsp;·&nbsp;3.5&nbsp;kB                                      |
| **dist/client/assets/SessionMenu-DjaOsHNr.js**                                                                                                                     | 9.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.4&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue                                                                                                                      | `████████████░░░░░░░░`&nbsp;58.7%&nbsp;·&nbsp;5.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/sun.mjs + 4 more                                                                                              | `███░░░░░░░░░░░░░░░░░`&nbsp;15.4%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;25.9%&nbsp;·&nbsp;2.3&nbsp;kB                                      |
| **dist/client/assets/preload-helper-jR8ZQsbN.js**                                                                                                                  | 8.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.9&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → errors.ts + 2 more                                                                                                                   | `████████████░░░░░░░░`&nbsp;59.6%&nbsp;·&nbsp;5.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.4%&nbsp;·&nbsp;3.6&nbsp;kB                                      |
| **dist/client/assets/ErrorNotice-JBzX9zCi.js**                                                                                                                     | 7.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.2&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ErrorBody.vue + 3 more                                                                                                               | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;4.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/refresh-cw.mjs + 4 more                                                                                       | `██░░░░░░░░░░░░░░░░░░`&nbsp;12.1%&nbsp;·&nbsp;975&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;30.4%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| **dist/client/assets/AssistantLayout-BSoN4Qeu.js**                                                                                                                 | 7.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.0&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AssistantLayout.vue + 3 more                                                                                                         | `██████████████░░░░░░`&nbsp;67.9%&nbsp;·&nbsp;5.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/library.mjs + 1 more                                                                                          | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.8%&nbsp;·&nbsp;377&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;27.3%&nbsp;·&nbsp;2.1&nbsp;kB                                      |
| **dist/client/assets/GridDetailPanel-Bt6vsBjJ.js**                                                                                                                 | 7.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.0&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Grid.vue + 3 more                                                                                                                    | `██████████████░░░░░░`&nbsp;70.1%&nbsp;·&nbsp;5.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;29.9%&nbsp;·&nbsp;2.3&nbsp;kB                                      |
| **dist/client/assets/SetupLayout-DxcMIxyq.js**                                                                                                                     | 7.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupLayout.vue + 2 more                                                                                                             | `████░░░░░░░░░░░░░░░░`&nbsp;20.1%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████████░░░░`&nbsp;79.9%&nbsp;·&nbsp;5.7&nbsp;kB                                      |
| **dist/client/assets/ConfigCard-DpqM9sUf.js**                                                                                                                      | 6.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.4&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigCard.vue                                                                                                                       | `███████████░░░░░░░░░`&nbsp;55.0%&nbsp;·&nbsp;3.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/trash.mjs + 3 more                                                                                            | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.5%&nbsp;·&nbsp;814&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.4%&nbsp;·&nbsp;2.3&nbsp;kB                                      |
| **<abbr title="dist/client/assets/PluginConnectorPanel-D-EbW4oW.js">…/client/assets/PluginConnectorPanel-D-EbW4oW.js</abbr>**                                      | 6.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.2&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginConnectorPanel.vue                                                                                                             | `████████░░░░░░░░░░░░`&nbsp;42.2%&nbsp;·&nbsp;2.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.8%&nbsp;·&nbsp;3.8&nbsp;kB                                      |
| **<abbr title="dist/client/assets/SessionAccountPanel-BIwHsAAy.js">…t/client/assets/SessionAccountPanel-BIwHsAAy.js</abbr>**                                       | 5.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAccountPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;52.7%&nbsp;·&nbsp;3.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs                                                                                            | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.1%&nbsp;·&nbsp;250&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.2%&nbsp;·&nbsp;2.6&nbsp;kB                                      |
| **dist/client/assets/ConnectionPanel-BMp9k91D.js**                                                                                                                 | 5.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConnectionPanel.vue + 2 more                                                                                                         | `█████████████░░░░░░░`&nbsp;65.9%&nbsp;·&nbsp;3.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.1%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| **dist/client/assets/PluginPanel-BO34q_6s.js**                                                                                                                     | 5.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPanel.vue                                                                                                                      | `██████████░░░░░░░░░░`&nbsp;49.4%&nbsp;·&nbsp;2.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/external-link.mjs                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.1%&nbsp;·&nbsp;210&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.5%&nbsp;·&nbsp;2.3&nbsp;kB                                      |
| **dist/client/assets/PaneSplitter-Cy_Ug91a.js**                                                                                                                    | 4.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue                                                                                                                     | `█████████████░░░░░░░`&nbsp;67.3%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;32.7%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| **dist/client/assets/PluginList-H6Nu7LTP.js**                                                                                                                      | 4.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginList.vue                                                                                                                       | `████████░░░░░░░░░░░░`&nbsp;39.5%&nbsp;·&nbsp;1.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.5%&nbsp;·&nbsp;2.5&nbsp;kB                                      |
| **dist/client/assets/menu-CpsLOW8d.js**                                                                                                                            | 4.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → MenuContent.vue + 6 more                                                                                                             | `███████████████░░░░░`&nbsp;73.6%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.4%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| **dist/client/assets/ScrollRow-DPrGn_qo.js**                                                                                                                       | 3.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollRow.vue                                                                                                                        | `███████████████░░░░░`&nbsp;76.6%&nbsp;·&nbsp;2.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.4%&nbsp;·&nbsp;895&nbsp;B                                       |
| **dist/client/assets/utilities-BosI7mwA.js**                                                                                                                       | 3.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ErrorDialog.vue + 3 more                                                                                                             | `█████████████░░░░░░░`&nbsp;65.9%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/loader-circle.mjs                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.6%&nbsp;·&nbsp;124&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;30.5%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| **dist/client/assets/OptionBar-Dli4CAPd.js**                                                                                                                       | 3.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.5&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → OptionPanel.vue + 2 more                                                                                                             | `███████████░░░░░░░░░`&nbsp;56.9%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.1%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| **<abbr title="dist/client/assets/PresentationsPanel-C4j-hQAf.js">…st/client/assets/PresentationsPanel-C4j-hQAf.js</abbr>**                                        | 3.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PresentationsPanel.vue                                                                                                               | `████████████░░░░░░░░`&nbsp;61.9%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;38.1%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/configMonitor-D53TAokE.js**                                                                                                                   | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts                                                                                                                     | `██████████████████░░`&nbsp;88.3%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.7%&nbsp;·&nbsp;301&nbsp;B                                       |
| **dist/client/assets/createLucideIcon-C8lRNG9k.js**                                                                                                                | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/shared/src/build/buildLucideIconNode.mjs">…src/build/buildLucideIconNode.mjs</abbr> + 8 more           | `███████████████████░`&nbsp;96.8%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.2%&nbsp;·&nbsp;81&nbsp;B                                         |
| **<abbr title="dist/client/assets/StudioDocumentSection-mR3cXevS.js">…client/assets/StudioDocumentSection-mR3cXevS.js</abbr>**                                     | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDocumentPanel.vue + 1 more                                                                                                     | `█████████░░░░░░░░░░░`&nbsp;45.4%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;54.6%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| **dist/client/assets/EventQueriesPanel-CxNl4uGg.js**                                                                                                               | 2.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueriesPanel.vue                                                                                                                | `██████████░░░░░░░░░░`&nbsp;50.7%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;49.3%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/ScrollEndButtons-XrHEG5eg.js**                                                                                                                | 2.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;959&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollEndButtons.vue                                                                                                                 | `█████████░░░░░░░░░░░`&nbsp;46.9%&nbsp;·&nbsp;985&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-down.mjs                                                                                                | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.9%&nbsp;·&nbsp;124&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;47.2%&nbsp;·&nbsp;990&nbsp;B                                       |
| **dist/client/assets/TextInput-BNgEwFfd.js**                                                                                                                       | 2.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextInput.vue                                                                                                                        | `██████████████░░░░░░`&nbsp;67.5%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;32.5%&nbsp;·&nbsp;681&nbsp;B                                       |
| **dist/client/assets/GuestWorkNotice-QvcB7Tk-.js**                                                                                                                 | 1.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.0&nbsp;kB&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GuestWorkNotice.vue                                                                                                                  | `███████░░░░░░░░░░░░░`&nbsp;35.4%&nbsp;·&nbsp;676&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;64.6%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **<abbr title="dist/client/assets/ContextEntityDiagramPanel-D3RIwdce.js">…nt/assets/ContextEntityDiagramPanel-D3RIwdce.js</abbr>**                                 | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;630&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextEntityDiagramPanel.vue                                                                                                        | `████████████████░░░░`&nbsp;78.5%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.5%&nbsp;·&nbsp;372&nbsp;B                                       |
| **dist/client/assets/monitorSocket-CLGGpPlz.js**                                                                                                                   | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;838&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → monitorSocket.ts                                                                                                                     | `██████████████████░░`&nbsp;91.4%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;8.6%&nbsp;·&nbsp;136&nbsp;B                                        |
| **dist/client/assets/action-RavnyjBE.js**                                                                                                                          | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;536&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → action.ts                                                                                                                            | `███████████████████░`&nbsp;95.7%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.3%&nbsp;·&nbsp;66&nbsp;B                                         |
| **dist/client/assets/EmptyPlaceholder-CaC_OlVX.js**                                                                                                                | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;836&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue                                                                                                                 | `██████████░░░░░░░░░░`&nbsp;48.3%&nbsp;·&nbsp;740&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;51.7%&nbsp;·&nbsp;793&nbsp;B                                       |
| **dist/client/assets/ItemButton-DB-bzTel.js**                                                                                                                      | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;576&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ItemButton.vue                                                                                                                       | `███████████████░░░░░`&nbsp;76.9%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.1%&nbsp;·&nbsp;311&nbsp;B                                       |
| **dist/client/assets/RetrievalGate-D20dJJQZ.js**                                                                                                                   | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;791&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → RetrievalGate.vue                                                                                                                    | `████████░░░░░░░░░░░░`&nbsp;39.1%&nbsp;·&nbsp;520&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.9%&nbsp;·&nbsp;809&nbsp;B                                       |
| **dist/client/assets/ConnectorDetails-DIfYV0Lo.js**                                                                                                                | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;656&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConnectorDetails.vue                                                                                                                 | `████████░░░░░░░░░░░░`&nbsp;41.0%&nbsp;·&nbsp;535&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;59.0%&nbsp;·&nbsp;769&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDiagramPanel-Cq4OYOr-.js">…t/client/assets/ContextDiagramPanel-Cq4OYOr-.js</abbr>**                                       | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;744&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDiagramPanel.vue                                                                                                              | `█████████░░░░░░░░░░░`&nbsp;44.2%&nbsp;·&nbsp;576&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.8%&nbsp;·&nbsp;727&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePersonalDetailsPanel-ClNKp3Bg.js">…t/assets/ManagePersonalDetailsPanel-ClNKp3Bg.js</abbr>**                                | 1.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;327&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue                                                                                                       | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.7%&nbsp;·&nbsp;59&nbsp;B                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████████████░`&nbsp;95.3%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/PillSegment-B5AnYtuz.js**                                                                                                                     | 1.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;616&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PillSegment.vue                                                                                                                      | `███████████░░░░░░░░░`&nbsp;56.5%&nbsp;·&nbsp;654&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.5%&nbsp;·&nbsp;504&nbsp;B                                       |
| **dist/client/assets/eventTracking-CMztsi2i.js**                                                                                                                   | 1.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;627&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → eventTracking.ts                                                                                                                     | `█████████████████░░░`&nbsp;84.8%&nbsp;·&nbsp;956&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.2%&nbsp;·&nbsp;172&nbsp;B                                       |
| **dist/client/assets/IconButton-c35dYfA-.js**                                                                                                                      | 1.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;605&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → IconButton.vue                                                                                                                       | `████████░░░░░░░░░░░░`&nbsp;39.9%&nbsp;·&nbsp;412&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.1%&nbsp;·&nbsp;620&nbsp;B                                       |
| **dist/client/assets/SelectPlaceholder-B4c2gNiV.js**                                                                                                               | 1005&nbsp;B&nbsp;·&nbsp;gzip&nbsp;607&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectPlaceholder.vue + 1 more                                                                                                       | `███░░░░░░░░░░░░░░░░░`&nbsp;13.5%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████████░░░`&nbsp;86.5%&nbsp;·&nbsp;869&nbsp;B                                       |
| **dist/client/assets/useApi-il6ACzUc-DmOlbkmE.js**                                                                                                                 | 1005&nbsp;B&nbsp;·&nbsp;gzip&nbsp;543&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/useApi-il6ACzUc.js                                                                                                       | `████████████████░░░░`&nbsp;80.1%&nbsp;·&nbsp;805&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.9%&nbsp;·&nbsp;200&nbsp;B                                       |
| **dist/client/assets/\_assistantLibrary-CIuuNlWi.js**                                                                                                              | 988&nbsp;B&nbsp;·&nbsp;gzip&nbsp;526&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _assistantLibrary.ts                                                                                                                 | `███████████░░░░░░░░░`&nbsp;57.2%&nbsp;·&nbsp;565&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;42.8%&nbsp;·&nbsp;423&nbsp;B                                       |
| **dist/client/assets/engine-HU3KRj0V.js**                                                                                                                          | 907&nbsp;B&nbsp;·&nbsp;gzip&nbsp;522&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → engine.ts                                                                                                                            | `███████████████░░░░░`&nbsp;76.8%&nbsp;·&nbsp;697&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.2%&nbsp;·&nbsp;210&nbsp;B                                       |
| **dist/client/assets/accountMonitor-SuWlLJ0k.js**                                                                                                                  | 864&nbsp;B&nbsp;·&nbsp;gzip&nbsp;515&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts                                                                                                                    | `██████████████░░░░░░`&nbsp;67.7%&nbsp;·&nbsp;585&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;32.3%&nbsp;·&nbsp;279&nbsp;B                                       |
| **dist/client/assets/ConfigIcon-C234V1l0.js**                                                                                                                      | 863&nbsp;B&nbsp;·&nbsp;gzip&nbsp;507&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigIcon.vue                                                                                                                       | `███████████░░░░░░░░░`&nbsp;57.0%&nbsp;·&nbsp;492&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.0%&nbsp;·&nbsp;371&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDimensionDiagramPanel-1u2lfc6U.js">…assets/ContextDimensionDiagramPanel-1u2lfc6U.js</abbr>**                              | 824&nbsp;B&nbsp;·&nbsp;gzip&nbsp;457&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionDiagramPanel.vue                                                                                                     | `██████████░░░░░░░░░░`&nbsp;49.5%&nbsp;·&nbsp;408&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;50.5%&nbsp;·&nbsp;416&nbsp;B                                       |
| **dist/client/assets/DataAppsPanel-Cb4Ug4nB.js**                                                                                                                   | 775&nbsp;B&nbsp;·&nbsp;gzip&nbsp;483&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataAppsPanel.vue                                                                                                                    | `███████░░░░░░░░░░░░░`&nbsp;35.7%&nbsp;·&nbsp;277&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;64.3%&nbsp;·&nbsp;498&nbsp;B                                       |
| **dist/client/assets/useMarkedTool-COKRyM5u.js**                                                                                                                   | 767&nbsp;B&nbsp;·&nbsp;gzip&nbsp;443&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useMarkedTool.ts                                                                                                                     | `████████████░░░░░░░░`&nbsp;61.9%&nbsp;·&nbsp;475&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;38.1%&nbsp;·&nbsp;292&nbsp;B                                       |
| **dist/client/assets/SetupHomePanel-CwP1wVGJ.js**                                                                                                                  | 763&nbsp;B&nbsp;·&nbsp;gzip&nbsp;502&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupHomePanel.vue                                                                                                                   | `████████░░░░░░░░░░░░`&nbsp;38.5%&nbsp;·&nbsp;294&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;61.5%&nbsp;·&nbsp;469&nbsp;B                                       |
| **dist/client/assets/Tag-C9G3kEaB.js**                                                                                                                             | 705&nbsp;B&nbsp;·&nbsp;gzip&nbsp;409&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue                                                                                                                              | `███████████████░░░░░`&nbsp;73.8%&nbsp;·&nbsp;520&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.2%&nbsp;·&nbsp;185&nbsp;B                                       |
| **dist/client/assets/HouseIcon-CT4QJHuO.js**                                                                                                                       | 594&nbsp;B&nbsp;·&nbsp;gzip&nbsp;393&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → HouseIcon.vue                                                                                                                        | `██████████░░░░░░░░░░`&nbsp;47.8%&nbsp;·&nbsp;284&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;52.2%&nbsp;·&nbsp;310&nbsp;B                                       |
| **dist/client/assets/RectangleButton-BnzGxIyK.js**                                                                                                                 | 579&nbsp;B&nbsp;·&nbsp;gzip&nbsp;392&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → RectangleButton.vue                                                                                                                  | `███████░░░░░░░░░░░░░`&nbsp;32.8%&nbsp;·&nbsp;190&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;67.2%&nbsp;·&nbsp;389&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePreferencesPanel-BXQ2BdeB.js">…lient/assets/ManagePreferencesPanel-BXQ2BdeB.js</abbr>**                                    | 556&nbsp;B&nbsp;·&nbsp;gzip&nbsp;374&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue                                                                                                           | `██████░░░░░░░░░░░░░░`&nbsp;30.2%&nbsp;·&nbsp;168&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;69.8%&nbsp;·&nbsp;388&nbsp;B                                       |
| **dist/client/assets/cable-DOIEO_UN.js**                                                                                                                           | 514&nbsp;B&nbsp;·&nbsp;gzip&nbsp;287&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/cable.mjs                                                                                                     | `██████████████████░░`&nbsp;88.1%&nbsp;·&nbsp;453&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.9%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/useSetupSelection-BCPEozRf.js**                                                                                                               | 489&nbsp;B&nbsp;·&nbsp;gzip&nbsp;330&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupSelection.ts                                                                                                                 | `███████████████░░░░░`&nbsp;73.6%&nbsp;·&nbsp;360&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.4%&nbsp;·&nbsp;129&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginPresenterPanel-Cb3gxmkG.js">…/client/assets/PluginPresenterPanel-Cb3gxmkG.js</abbr>**                                      | 475&nbsp;B&nbsp;·&nbsp;gzip&nbsp;273&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPresenterPanel.vue                                                                                                             | `██████░░░░░░░░░░░░░░`&nbsp;28.6%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;71.4%&nbsp;·&nbsp;339&nbsp;B                                       |
| **dist/client/assets/unsavedWork-rWYIkc5l.js**                                                                                                                     | 475&nbsp;B&nbsp;·&nbsp;gzip&nbsp;310&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → unsavedWork.ts                                                                                                                       | `██████████████░░░░░░`&nbsp;68.2%&nbsp;·&nbsp;324&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.8%&nbsp;·&nbsp;151&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginCookbookPanel-DsudH4OC.js">…t/client/assets/PluginCookbookPanel-DsudH4OC.js</abbr>**                                       | 474&nbsp;B&nbsp;·&nbsp;gzip&nbsp;274&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginCookbookPanel.vue                                                                                                              | `██████░░░░░░░░░░░░░░`&nbsp;28.7%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;71.3%&nbsp;·&nbsp;338&nbsp;B                                       |
| **dist/client/assets/PluginToolPanel-Dao0SVPL.js**                                                                                                                 | 453&nbsp;B&nbsp;·&nbsp;gzip&nbsp;262&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginToolPanel.vue                                                                                                                  | `█████░░░░░░░░░░░░░░░`&nbsp;26.3%&nbsp;·&nbsp;119&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████████░░░░░`&nbsp;73.7%&nbsp;·&nbsp;334&nbsp;B                                       |
| **dist/client/assets/BusyBar-BxexAKm7.js**                                                                                                                         | 407&nbsp;B&nbsp;·&nbsp;gzip&nbsp;305&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → BusyBar.vue                                                                                                                          | `███████████░░░░░░░░░`&nbsp;53.8%&nbsp;·&nbsp;219&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.2%&nbsp;·&nbsp;188&nbsp;B                                       |
| **dist/client/assets/network-DGQDLlqt.js**                                                                                                                         | 404&nbsp;B&nbsp;·&nbsp;gzip&nbsp;254&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/network.mjs                                                                                                   | `█████████████████░░░`&nbsp;84.9%&nbsp;·&nbsp;343&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.1%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/useSetupRoute-yAgSHMby.js**                                                                                                                   | 394&nbsp;B&nbsp;·&nbsp;gzip&nbsp;284&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupRoute.ts                                                                                                                     | `███████████░░░░░░░░░`&nbsp;56.6%&nbsp;·&nbsp;223&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.4%&nbsp;·&nbsp;171&nbsp;B                                       |
| **dist/client/assets/square-pen-BokKgw1S.js**                                                                                                                      | 380&nbsp;B&nbsp;·&nbsp;gzip&nbsp;279&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square-pen.mjs                                                                                                | `█████████████████░░░`&nbsp;83.9%&nbsp;·&nbsp;319&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;16.1%&nbsp;·&nbsp;61&nbsp;B                                        |
| **<abbr title="dist/client/assets/ManageSubscriptionPanel-DOepkmuk.js">…ient/assets/ManageSubscriptionPanel-DOepkmuk.js</abbr>**                                   | 316&nbsp;B&nbsp;·&nbsp;gzip&nbsp;254&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue                                                                                                          | `█████████░░░░░░░░░░░`&nbsp;44.9%&nbsp;·&nbsp;142&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.1%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageDataServiceTokensPanel-C1BDjfZY.js">…assets/ManageDataServiceTokensPanel-C1BDjfZY.js</abbr>**                              | 313&nbsp;B&nbsp;·&nbsp;gzip&nbsp;251&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue                                                                                                     | `█████████░░░░░░░░░░░`&nbsp;44.4%&nbsp;·&nbsp;139&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/GenerateTokenPanel-jcV7GfXK.js">…st/client/assets/GenerateTokenPanel-jcV7GfXK.js</abbr>**                                        | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;243&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue                                                                                                               | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageSessionsPanel-DQ04FCev.js">…t/client/assets/ManageSessionsPanel-DQ04FCev.js</abbr>**                                       | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;244&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue                                                                                                              | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ReviewActivityPanel-CbH11bPB.js">…t/client/assets/ReviewActivityPanel-CbH11bPB.js</abbr>**                                       | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;245&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue                                                                                                              | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/DeleteAccountPanel-COJzRgwm.js">…st/client/assets/DeleteAccountPanel-COJzRgwm.js</abbr>**                                        | 301&nbsp;B&nbsp;·&nbsp;gzip&nbsp;243&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue                                                                                                               | `████████░░░░░░░░░░░░`&nbsp;42.2%&nbsp;·&nbsp;127&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.8%&nbsp;·&nbsp;174&nbsp;B                                       |
| **dist/client/assets/ManageAccessPanel-CXoq2wp5.js**                                                                                                               | 300&nbsp;B&nbsp;·&nbsp;gzip&nbsp;243&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue                                                                                                                | `████████░░░░░░░░░░░░`&nbsp;42.0%&nbsp;·&nbsp;126&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.0%&nbsp;·&nbsp;174&nbsp;B                                       |
| **dist/client/assets/link-S4ufANdW.js**                                                                                                                            | 276&nbsp;B&nbsp;·&nbsp;gzip&nbsp;215&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/link.mjs                                                                                                      | `████████████████░░░░`&nbsp;77.9%&nbsp;·&nbsp;215&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;22.1%&nbsp;·&nbsp;61&nbsp;B                                        |
| **<abbr title="dist/client/assets/StudioDetailLayout-DNXpEPbd.js">…st/client/assets/StudioDetailLayout-DNXpEPbd.js</abbr>**                                        | 274&nbsp;B&nbsp;·&nbsp;gzip&nbsp;226&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDetailLayout.vue                                                                                                               | `███░░░░░░░░░░░░░░░░░`&nbsp;13.1%&nbsp;·&nbsp;36&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████████░░░`&nbsp;86.9%&nbsp;·&nbsp;238&nbsp;B                                       |
| **dist/client/assets/tools-CiJB7oU0.js**                                                                                                                           | 250&nbsp;B&nbsp;·&nbsp;gzip&nbsp;199&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → tools.ts                                                                                                                             | `████████░░░░░░░░░░░░`&nbsp;41.2%&nbsp;·&nbsp;103&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.8%&nbsp;·&nbsp;147&nbsp;B                                       |
| **dist/client/assets/configCard-aEJ0JIeP.js**                                                                                                                      | 245&nbsp;B&nbsp;·&nbsp;gzip&nbsp;206&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configCard.ts                                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.5%&nbsp;·&nbsp;131&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.5%&nbsp;·&nbsp;114&nbsp;B                                       |
| **dist/client/assets/rolldown-runtime-4tVxZq34.js**                                                                                                                | 237&nbsp;B&nbsp;·&nbsp;gzip&nbsp;196&nbsp;B                                                    |
| **dist/client/assets/appearance-CfcgKzpC.js**                                                                                                                      | 225&nbsp;B&nbsp;·&nbsp;gzip&nbsp;198&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → appearance.ts                                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.7%&nbsp;·&nbsp;105&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.3%&nbsp;·&nbsp;120&nbsp;B                                       |
| **dist/client/assets/search-BUlmfpj2.js**                                                                                                                          | 194&nbsp;B&nbsp;·&nbsp;gzip&nbsp;182&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs                                                                                                    | `██████████████░░░░░░`&nbsp;68.6%&nbsp;·&nbsp;133&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.4%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/arrow-left-DzqRKT67.js**                                                                                                                      | 185&nbsp;B&nbsp;·&nbsp;gzip&nbsp;177&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs                                                                                                | `█████████████░░░░░░░`&nbsp;67.0%&nbsp;·&nbsp;124&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.0%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/arrow-up-BAShqcvv.js**                                                                                                                        | 182&nbsp;B&nbsp;·&nbsp;gzip&nbsp;176&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-up.mjs                                                                                                  | `█████████████░░░░░░░`&nbsp;66.5%&nbsp;·&nbsp;121&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.5%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/\_itemStepTrail-BuTn0bZa.js**                                                                                                                 | 176&nbsp;B&nbsp;·&nbsp;gzip&nbsp;158&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _itemStepTrail.ts                                                                                                                    | `█████████░░░░░░░░░░░`&nbsp;44.9%&nbsp;·&nbsp;79&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.1%&nbsp;·&nbsp;97&nbsp;B                                        |
| **dist/client/assets/plus-B1sumWf4.js**                                                                                                                            | 173&nbsp;B&nbsp;·&nbsp;gzip&nbsp;166&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs                                                                                                      | `█████████████░░░░░░░`&nbsp;64.7%&nbsp;·&nbsp;112&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;35.3%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/chevron-left-B346XOIn.js**                                                                                                                    | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;161&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs                                                                                              | `████████████░░░░░░░░`&nbsp;59.3%&nbsp;·&nbsp;89&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.7%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/chevron-right-C3rhdev\_.js**                                                                                                                  | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;157&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs                                                                                             | `████████████░░░░░░░░`&nbsp;59.3%&nbsp;·&nbsp;89&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.7%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/check-D_65KLXO.js**                                                                                                                           | 144&nbsp;B&nbsp;·&nbsp;gzip&nbsp;156&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/check.mjs                                                                                                     | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;83&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;61&nbsp;B                                        |

Bars show each row's share of its output file.

- n more = the row also holds n more files from the same package or folder, each no larger than the one named. A package can appear under several output files, each holding different files, never the same file twice.

(bundler output, whitespace & JSON) = bytes Sonda can't trace to a source file: whitespace (indentation and line breaks), code the bundler generates (region comments, the combined import/export lines, its small runtime helper and wrappers), and imported JSON such as `config.json`, which the bundler doesn't map. The JSON and the generated code are real bytes that ship; the whitespace mostly disappears once compressed.

<!-- BUNDLE_END -->

<!-- QUALITY_SECURITY_START -->

## Quality & Security

This section is updated each time `npm run document` is run. Settings come from the repository's workflow files and GitHub. Test coverage and the Fallow score are measured at the same time.

### Testing

| Check                | Status | What it does                                                                                                                                                                                                                                                                                        |
| :------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests           | ✅ On  | [Vitest](https://vitest.dev) runs the unit tests. Part of the [CI workflow](https://github.com/dpuse/dpuse-app/actions/workflows/ci.yml) on every push and pull request to `main`.                                                                                                                  |
| Property-based tests | ❌ Off | [fast-check](https://fast-check.dev) runs many random inputs per test to find edge cases, alongside the unit tests.                                                                                                                                                                                 |
| Test coverage        | ✅ On  | ![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fdpuse%2Fdpuse-app%2Fmain%2Fcode-health-reports%2Fvitest%2Fbadge.json) [Vitest's V8 coverage](https://vitest.dev/guide/coverage) measures the share of source lines the unit tests run. The target is 80%. |

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
