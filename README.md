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
| [@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)           | 1.0.169 | MIT                     | [LICENSE](licenses/downloads/@dpuse/dpuse-shared@1.0.169-LICENSE.txt)         |
| [@fontsource-variable/inter](https://github.com/fontsource/font-files) |  5.3.0  | OFL-1.1                 | [LICENSE](licenses/downloads/@fontsource-variable/inter@5.3.0-LICENSE.txt)    |
| [@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)     |  0.6.1  | MIT                     | [LICENSE](licenses/downloads/@formkit/drag-and-drop@0.6.1-LICENSE.txt)        |
| [@lucide/vue](https://github.com/lucide-icons/lucide)                  | 1.66.0  | ISC                     | [LICENSE](licenses/downloads/@lucide/vue@1.66.0-LICENSE.txt)                  |
| [@tanstack/ai](https://github.com/TanStack/ai)                         |  1.0.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai@1.0.1-LICENSE.txt)                  |
| [@tanstack/ai-client](https://github.com/TanStack/ai)                  |  1.0.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai-client@1.0.1-LICENSE.txt)           |
| [@tanstack/ai-utils](https://github.com/TanStack/ai)                   |  1.0.0  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai-utils@1.0.0-LICENSE.txt)            |
| [@tanstack/query-core](https://github.com/TanStack/query)              | 5.105.0 | MIT                     | [LICENSE](licenses/downloads/@tanstack/query-core@5.105.0-LICENSE.txt)        |
| [@tanstack/store](https://github.com/TanStack/store)                   | 0.11.2  | MIT                     | [LICENSE](licenses/downloads/@tanstack/store@0.11.2-LICENSE.txt)              |
| [@tanstack/table-core](https://github.com/TanStack/table)              |  9.3.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/table-core@9.3.1-LICENSE.txt)          |
| [@tanstack/virtual-core](https://github.com/TanStack/virtual)          | 3.19.9  | MIT                     | [LICENSE](licenses/downloads/@tanstack/virtual-core@3.19.9-LICENSE.txt)       |
| [@tanstack/vue-query](https://github.com/TanStack/query)               | 5.105.0 | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-query@5.105.0-LICENSE.txt)         |
| [@tanstack/vue-table](https://github.com/TanStack/table)               |  9.3.1  | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-table@9.3.1-LICENSE.txt)           |
| [@tanstack/vue-virtual](https://github.com/TanStack/virtual)           | 3.13.50 | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-virtual@3.13.50-LICENSE.txt)       |
| [@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)    |  3.1.0  | MIT                     | [LICENSE](licenses/downloads/@teamhanko/hanko-frontend-sdk@3.1.0-LICENSE.txt) |
| [@vue/reactivity](https://github.com/vuejs/core)                       | 3.5.44  | MIT                     | [LICENSE](licenses/downloads/@vue/reactivity@3.5.44-LICENSE.txt)              |
| [@vue/runtime-core](https://github.com/vuejs/core)                     | 3.5.44  | MIT                     | [LICENSE](licenses/downloads/@vue/runtime-core@3.5.44-LICENSE.txt)            |
| [@vue/runtime-dom](https://github.com/vuejs/core)                      | 3.5.44  | MIT                     | [LICENSE](licenses/downloads/@vue/runtime-dom@3.5.44-LICENSE.txt)             |
| [@vue/shared](https://github.com/vuejs/core)                           | 3.5.44  | MIT                     | [LICENSE](licenses/downloads/@vue/shared@3.5.44-LICENSE.txt)                  |
| [@vueuse/core](https://github.com/vueuse/vueuse)                       | 15.0.0  | MIT                     | [LICENSE](licenses/downloads/@vueuse/core@15.0.0-LICENSE.txt)                 |
| [@vueuse/shared](https://github.com/vueuse/vueuse)                     | 15.0.0  | MIT                     | [LICENSE](licenses/downloads/@vueuse/shared@15.0.0-LICENSE.txt)               |
| [dompurify](https://github.com/cure53/DOMPurify)                       | 3.4.17  | (MPL-2.0 OR Apache-2.0) | [LICENSE](licenses/downloads/dompurify@3.4.17-LICENSE.txt)                    |
| [fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)      |  3.1.1  | MIT                     | [LICENSE](licenses/downloads/fast-json-patch@3.1.1-LICENSE.txt)               |
| [partial-json](https://github.com/promplate/partial-json-parser-js)    |  0.1.7  | MIT                     | [LICENSE](licenses/downloads/partial-json@0.1.7-LICENSE.txt)                  |
| [squire-rte](https://github.com/neilj/Squire)                          | 2.4.10  | MIT                     | [LICENSE](licenses/downloads/squire-rte@2.4.10-LICENSE.txt)                   |
| [tinybase](https://github.com/tinyplex/tinybase)                       | 10.0.1  | MIT                     | [LICENSE](licenses/downloads/tinybase@10.0.1-LICENSE.txt)                     |
| [valibot](https://github.com/open-circle/valibot)                      |  1.5.0  | MIT                     | [LICENSE](licenses/downloads/valibot@1.5.0-LICENSE.txt)                       |
| [vue-router](https://github.com/vuejs/router)                          |  5.4.0  | MIT                     | [LICENSE](licenses/downloads/vue-router@5.4.0-LICENSE.txt)                    |
| [web-vitals](https://github.com/GoogleChrome/web-vitals)               |  6.2.3  | Apache-2.0              | [LICENSE](licenses/downloads/web-vitals@6.2.3-LICENSE.txt)                    |

### Dependency Tree

The dependency tree below shows how each package in the table above is reached — direct and transitive — along with its installed version, release date, and update status. A package that does not ship itself, such as one whose parts are bundled separately, is left out and what ships beneath it is shown in its place. Packages flagged ❗ have a newer version available; ⚠️ indicates a package that hasn't been updated in the last 6 months or longer. Neither flag necessarily indicates a problem: we let new releases stabilise before upgrading, and some packages are mature and stable (have limited or no dependencies), so they require no active development.

- **[@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)** 1.0.169 — this month: 2026-10-31
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — 1 mth ago: 2026-09-09
- **[@fontsource-variable/inter](https://github.com/fontsource/font-files)** 5.3.0 — 3 mths ago: 2026-07-19
- **[@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)** 0.6.1 — 4 mths ago: 2026-06-15
- **[@lucide/vue](https://github.com/lucide-icons/lucide)** 1.66.0 — this month: 2026-10-31
- **[@tanstack/ai-client](https://github.com/TanStack/ai)** 1.0.1 — this month: 2026-10-29
    - **[@tanstack/ai-utils](https://github.com/TanStack/ai)** 1.0.0 — this month: 2026-10-22
    - **[@tanstack/ai](https://github.com/TanStack/ai)** 1.0.1 — this month: 2026-10-29
    - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29
- **[@tanstack/ai](https://github.com/TanStack/ai)** 1.0.1 — this month: 2026-10-29
    - **[@ag-ui/core](https://github.com/ag-ui-protocol/ag-ui)** 1.0.0 — 1 mth ago: 2026-09-17 → latest: 1.0.3 — this month: 2026-10-16 ❗
    - **[@tanstack/ai-utils](https://github.com/TanStack/ai)** 1.0.0 — this month: 2026-10-22
    - **[fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)** 3.1.1 — 55 mths ago: 2022-03-24 ⚠️
    - **[partial-json](https://github.com/promplate/partial-json-parser-js)** 0.1.7 — 29 mths ago: 2024-05-14 ⚠️
- **[@tanstack/vue-query](https://github.com/TanStack/query)** 5.105.0 — this month: 2026-10-26
    - **[@tanstack/query-core](https://github.com/TanStack/query)** 5.105.0 — this month: 2026-10-26
- **[@tanstack/vue-table](https://github.com/TanStack/table)** 9.3.1 — this month: 2026-10-12
    - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29
    - **[@tanstack/table-core](https://github.com/TanStack/table)** 9.3.1 — this month: 2026-10-12
        - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — 1 mth ago: 2026-09-29
- **[@tanstack/vue-virtual](https://github.com/TanStack/virtual)** 3.13.50 — this month: 2026-10-29
    - **[@tanstack/virtual-core](https://github.com/TanStack/virtual)** 3.19.9 — this month: 2026-10-29
- **[@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)** 3.1.0 — this month: 2026-10-01
- **[@vueuse/core](https://github.com/vueuse/vueuse)** 15.0.0 — 1 mth ago: 2026-09-16
    - **[@vueuse/shared](https://github.com/vueuse/vueuse)** 15.0.0 — 1 mth ago: 2026-09-16
- **[dompurify](https://github.com/cure53/DOMPurify)** 3.4.17 — this month: 2026-10-12
- **[squire-rte](https://github.com/neilj/Squire)** 2.4.10 — this month: 2026-10-21
- **[tinybase](https://github.com/tinyplex/tinybase)** 10.0.1 — 1 mth ago: 2026-09-24
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — 1 mth ago: 2026-09-09
- **[vue-router](https://github.com/vuejs/router)** 5.4.0 — this month: 2026-10-07
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.44 — this month: 2026-10-13
- **[@vue/runtime-dom](https://github.com/vuejs/core)** 3.5.44 — this month: 2026-10-13
    - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.44 — this month: 2026-10-13
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.44 — this month: 2026-10-13
    - **[@vue/runtime-core](https://github.com/vuejs/core)** 3.5.44 — this month: 2026-10-13
        - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.44 — this month: 2026-10-13
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.44 — this month: 2026-10-13
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.44 — this month: 2026-10-13
- **[web-vitals](https://github.com/GoogleChrome/web-vitals)** 6.2.3 — this month: 2026-10-05

<!-- DEPENDENCY_LICENSES_END -->

<!-- BUNDLE_START -->

## Bundle Analysis

This report is updated with each release, from the bundle the release builds, using [Sonda](https://sonda.dev/), which analyses final source maps to reveal the actual effects of tree-shaking and minification rather than relying on pre-build estimates.

_Note: Sonda's Vite reports currently exclude CSS files, since Vite does not generate source maps for CSS._

| Chunk/Module/File                                                                                                                                                  | Composition                                                                                    |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **dist/client/assets/ChatPanel-RpQTxLTi.js**                                                                                                                       | 211.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;57.8&nbsp;kB&nbsp;·&nbsp;18.3%&nbsp;of&nbsp;the&nbsp;build |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client → dist/esm/chat-client.js + 13 more                                                                                    | `████████░░░░░░░░░░░░`&nbsp;41.3%&nbsp;·&nbsp;87.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai → <abbr title="dist/esm/activities/chat/stream/processor.js">…ivities/chat/stream/processor.js</abbr> + 28 more               | `████████░░░░░░░░░░░░`&nbsp;39.5%&nbsp;·&nbsp;83.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → tanstackClientTools.ts + 16 more                                                                                                     | `█░░░░░░░░░░░░░░░░░░░`&nbsp;7.2%&nbsp;·&nbsp;15.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;fast-json-patch → module/core.mjs + 3 more                                                                                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.6%&nbsp;·&nbsp;9.8&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json → dist/index.js + 1 more                                                                                                      | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/alien.js + 1 more                                                                                                   | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@ag-ui/core → dist/version-CTNE2I0_.mjs                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/icons/gallery-vertical-end.mjs">…sm/icons/gallery-vertical-end.mjs</abbr> + 1 more                     | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.1%&nbsp;·&nbsp;294&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-utils → dist/esm/command.js                                                                                                   | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.0%&nbsp;·&nbsp;32&nbsp;B                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.2%&nbsp;·&nbsp;6.8&nbsp;kB                                       |
| **dist/client/assets/index-BMkMPGH6.js**                                                                                                                           | 115.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;38.8&nbsp;kB&nbsp;·&nbsp;10.0%&nbsp;of&nbsp;the&nbsp;build |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts + 31 more                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.3%&nbsp;·&nbsp;36.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs                                                                                                             | `█████░░░░░░░░░░░░░░░`&nbsp;24.5%&nbsp;·&nbsp;28.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → build/modern/query.js + 14 more                                                                                     | `████░░░░░░░░░░░░░░░░`&nbsp;20.8%&nbsp;·&nbsp;24.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/queryClient.js">…ild/modern/queryClient.js</abbr> + 4 more                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.7%&nbsp;·&nbsp;3.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;20.7%&nbsp;·&nbsp;23.9&nbsp;kB                                     |
| **<abbr title="dist/client/assets/runtime-core.esm-bundler-FShZ7VG4.js">…ent/assets/runtime-core.esm-bundler-FShZ7VG4.js</abbr>**                                  | 67.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;26.1&nbsp;kB&nbsp;·&nbsp;5.9%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → <abbr title="dist/runtime-core.esm-bundler.js">…runtime-core.esm-bundler.js</abbr>                                     | `██████████████░░░░░░`&nbsp;68.0%&nbsp;·&nbsp;46.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js                                                                                           | `█████░░░░░░░░░░░░░░░`&nbsp;25.4%&nbsp;·&nbsp;17.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js                                                                                                   | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.6%&nbsp;·&nbsp;3.8&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.0%&nbsp;·&nbsp;722&nbsp;B                                        |
| **<abbr title="dist/client/assets/StudioDescriptorsPanel-1vsPRBgd.js">…lient/assets/StudioDescriptorsPanel-1vsPRBgd.js</abbr>**                                    | 64.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;20.1&nbsp;kB&nbsp;·&nbsp;5.6%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs                                                                                                               | `██████████████████░░`&nbsp;89.8%&nbsp;·&nbsp;57.9&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextEditor.vue + 1 more                                                                                                              | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.5%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/italic.mjs + 2 more                                                                                           | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.8%&nbsp;·&nbsp;498&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.9%&nbsp;·&nbsp;2.5&nbsp;kB                                       |
| **dist/client/assets/ExploreDataPanel-DBcJ0_b-.js**                                                                                                                | 63.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;17.8&nbsp;kB&nbsp;·&nbsp;5.5%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop → index.mjs + 1 more                                                                                                | `█████████░░░░░░░░░░░`&nbsp;46.5%&nbsp;·&nbsp;29.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TransformDataPanel.vue + 5 more                                                                                                      | `███████░░░░░░░░░░░░░`&nbsp;37.0%&nbsp;·&nbsp;23.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/grip-vertical.mjs + 1 more                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;417&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.9%&nbsp;·&nbsp;10.1&nbsp;kB                                     |
| **dist/client/assets/Table-B9MzzqDG.js**                                                                                                                           | 54.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;14.3&nbsp;kB&nbsp;·&nbsp;4.7%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core → <abbr title="dist/features/column-pinning/columnPinningFeature.utils.js">…nPinningFeature.utils.js</abbr> + 32 more | `██████████████░░░░░░`&nbsp;69.2%&nbsp;·&nbsp;37.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Table.vue + 5 more                                                                                                                   | `████░░░░░░░░░░░░░░░░`&nbsp;18.3%&nbsp;·&nbsp;9.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table → dist/merge-proxy.js + 2 more                                                                                         | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.9%&nbsp;·&nbsp;2.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js                                                                                                          | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.2%&nbsp;·&nbsp;672&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/settings-2.mjs + 1 more                                                                                       | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;291&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.9%&nbsp;·&nbsp;3.7&nbsp;kB                                       |
| **dist/client/assets/workspaceStore-CbUj4bec.js**                                                                                                                  | 48.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;19.9&nbsp;kB&nbsp;·&nbsp;4.2%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;tinybase → index.js + 1 more                                                                                                               | `███████████████████░`&nbsp;93.3%&nbsp;·&nbsp;45.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → workspaceStore.ts                                                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.1%&nbsp;·&nbsp;3.0&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;298&nbsp;B                                        |
| **dist/client/assets/SelectItemPanel-paHXqSEl.js**                                                                                                                 | 46.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;15.0&nbsp;kB&nbsp;·&nbsp;4.0%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectItemPanel.vue + 4 more                                                                                                         | `█████████████░░░░░░░`&nbsp;64.2%&nbsp;·&nbsp;30.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/columns-3-cog.mjs + 6 more                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.5%&nbsp;·&nbsp;2.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.3%&nbsp;·&nbsp;14.6&nbsp;kB                                     |
| **dist/client/assets/ContextModelList-BGMhD3YE.js**                                                                                                                | 45.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;11.1&nbsp;kB&nbsp;·&nbsp;3.9%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextModelPanel.vue + 7 more                                                                                                       | `████░░░░░░░░░░░░░░░░`&nbsp;18.4%&nbsp;·&nbsp;8.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/network.mjs                                                                                                   | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.7%&nbsp;·&nbsp;343&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████████░░░░`&nbsp;80.8%&nbsp;·&nbsp;36.6&nbsp;kB                                     |
| **dist/client/assets/locale-CWxPktoM.js**                                                                                                                          | 36.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;12.3&nbsp;kB&nbsp;·&nbsp;3.2%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared.es.js                                                                                              | `████████████████████`&nbsp;98.3%&nbsp;·&nbsp;36.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → locale.ts                                                                                                                            | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.0%&nbsp;·&nbsp;394&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;228&nbsp;B                                        |
| **dist/client/assets/useDataWindow-BMqGS2nn.js**                                                                                                                   | 33.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;10.2&nbsp;kB&nbsp;·&nbsp;2.9%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core → dist/esm/index.js + 4 more                                                                                        | `██████████████████░░`&nbsp;92.0%&nbsp;·&nbsp;31.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts                                                                                                                     | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.4%&nbsp;·&nbsp;2.2&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js                                                                                                  | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;378&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;173&nbsp;B                                        |
| **dist/client/assets/sdk.modern-BA6sl1Hr.js**                                                                                                                      | 27.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.1&nbsp;kB&nbsp;·&nbsp;2.4%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → <abbr title="dist/sdk.modern.js">…t/sdk.modern.js</abbr>                                                   | `███████████████████░`&nbsp;97.0%&nbsp;·&nbsp;26.6&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.0%&nbsp;·&nbsp;858&nbsp;B                                        |
| **dist/client/assets/DataViewList-B4S70V0B.js**                                                                                                                    | 26.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.2&nbsp;kB&nbsp;·&nbsp;2.3%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewPanel.vue + 3 more                                                                                                           | `██████████░░░░░░░░░░`&nbsp;47.8%&nbsp;·&nbsp;12.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;52.2%&nbsp;·&nbsp;13.9&nbsp;kB                                     |
| **dist/client/assets/ActionWrapper-DX2GRYMr.js**                                                                                                                   | 22.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;9.0&nbsp;kB&nbsp;·&nbsp;2.0%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/vue-router.js + 1 more                                                                                                   | `███████████████████░`&nbsp;96.4%&nbsp;·&nbsp;21.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ActionWrapper.vue                                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.4%&nbsp;·&nbsp;320&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.2%&nbsp;·&nbsp;517&nbsp;B                                        |
| **dist/client/assets/dist-BNL21NX4.js**                                                                                                                            | 20.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.0&nbsp;kB&nbsp;·&nbsp;1.8%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/core → dist/index.js                                                                                                               | `███████████████░░░░░`&nbsp;73.6%&nbsp;·&nbsp;15.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/shared → dist/index.js                                                                                                             | `█████░░░░░░░░░░░░░░░`&nbsp;24.7%&nbsp;·&nbsp;5.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;365&nbsp;B                                        |
| **<abbr title="dist/client/assets/runtime-dom.esm-bundler-CGNWsYtq.js">…ient/assets/runtime-dom.esm-bundler-CGNWsYtq.js</abbr>**                                   | 16.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;6.9&nbsp;kB&nbsp;·&nbsp;1.4%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → <abbr title="dist/runtime-dom.esm-bundler.js">…t/runtime-dom.esm-bundler.js</abbr>                                      | `████████████████████`&nbsp;97.6%&nbsp;·&nbsp;16.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.4%&nbsp;·&nbsp;406&nbsp;B                                        |
| **<abbr title="dist/client/assets/performanceTracking-C4pZd5gt.js">…t/client/assets/performanceTracking-C4pZd5gt.js</abbr>**                                       | 15.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.4&nbsp;kB&nbsp;·&nbsp;1.3%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.attribution.js                                                                                                | `███████████████████░`&nbsp;96.8%&nbsp;·&nbsp;14.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts                                                                                                               | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.8%&nbsp;·&nbsp;430&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;72&nbsp;B                                         |
| **dist/client/assets/SessionAuthPanel-P2-cPYFv.js**                                                                                                                | 14.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.8&nbsp;kB&nbsp;·&nbsp;1.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAuthPanel.vue + 6 more                                                                                                        | `██████████████░░░░░░`&nbsp;71.5%&nbsp;·&nbsp;10.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs                                                                                            | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.9%&nbsp;·&nbsp;274&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.6%&nbsp;·&nbsp;3.8&nbsp;kB                                      |
| **dist/client/assets/\_dataViews-sCua5N2e.js**                                                                                                                     | 13.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.8&nbsp;kB&nbsp;·&nbsp;1.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → <abbr title="build/modern/queryObserver.js">…/modern/queryObserver.js</abbr> + 1 more                               | `███████████░░░░░░░░░`&nbsp;56.2%&nbsp;·&nbsp;7.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _dataViews.ts + 1 more                                                                                                               | `█████░░░░░░░░░░░░░░░`&nbsp;25.7%&nbsp;·&nbsp;3.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/useBaseQuery.js">…ld/modern/useBaseQuery.js</abbr> + 3 more                                | `███░░░░░░░░░░░░░░░░░`&nbsp;13.2%&nbsp;·&nbsp;1.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.0%&nbsp;·&nbsp;702&nbsp;B                                        |
| **<abbr title="dist/client/assets/SelectConnectionList-BbYZ7l9g.js">…/client/assets/SelectConnectionList-BbYZ7l9g.js</abbr>**                                      | 13.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.8&nbsp;kB&nbsp;·&nbsp;1.2%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectConnectionPanel.vue + 1 more                                                                                                   | `█████████░░░░░░░░░░░`&nbsp;44.8%&nbsp;·&nbsp;6.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.2%&nbsp;·&nbsp;7.6&nbsp;kB                                      |
| **dist/client/assets/ScrollEndButtons-Cl79WqYe.js**                                                                                                                | 12.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.0&nbsp;kB&nbsp;·&nbsp;1.1%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _previewColumnRows.ts + 2 more                                                                                                       | `███████████░░░░░░░░░`&nbsp;53.9%&nbsp;·&nbsp;6.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-down.mjs                                                                                                | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.9%&nbsp;·&nbsp;124&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;45.1%&nbsp;·&nbsp;5.8&nbsp;kB                                      |
| **dist/client/assets/AuditContentPanel-DISelbif.js**                                                                                                               | 8.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.3&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AuditContentPanel.vue                                                                                                                | `███████████░░░░░░░░░`&nbsp;54.3%&nbsp;·&nbsp;4.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;45.7%&nbsp;·&nbsp;4.0&nbsp;kB                                      |
| **dist/client/assets/DataViewsLayout-oddEuCcs.js**                                                                                                                 | 8.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.3&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewsLayout.vue + 1 more                                                                                                         | `████████████░░░░░░░░`&nbsp;59.7%&nbsp;·&nbsp;5.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.3%&nbsp;·&nbsp;3.5&nbsp;kB                                      |
| **dist/client/assets/preload-helper-CCAt8CAS.js**                                                                                                                  | 8.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.8&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → errors.ts + 2 more                                                                                                                   | `████████████░░░░░░░░`&nbsp;59.5%&nbsp;·&nbsp;5.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.5%&nbsp;·&nbsp;3.5&nbsp;kB                                      |
| **dist/client/assets/LibraryPanel-COrbCynZ.js**                                                                                                                    | 8.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.3&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → LibraryPanel.vue + 2 more                                                                                                            | `█████████████░░░░░░░`&nbsp;65.8%&nbsp;·&nbsp;5.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.2%&nbsp;·&nbsp;2.9&nbsp;kB                                      |
| **dist/client/assets/SessionMenu-DU_Z2GG\_.js**                                                                                                                    | 8.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.3&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue                                                                                                                      | `███████████░░░░░░░░░`&nbsp;57.5%&nbsp;·&nbsp;4.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/sun.mjs + 4 more                                                                                              | `███░░░░░░░░░░░░░░░░░`&nbsp;16.4%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.2%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| **dist/client/assets/ErrorNotice-Dtlka64a.js**                                                                                                                     | 7.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.2&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ErrorBody.vue + 3 more                                                                                                               | `████████████░░░░░░░░`&nbsp;57.8%&nbsp;·&nbsp;4.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/refresh-cw.mjs + 4 more                                                                                       | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.8%&nbsp;·&nbsp;946&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;30.4%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| **dist/client/assets/AssistantLayout-D_8RTClZ.js**                                                                                                                 | 7.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.0&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AssistantLayout.vue + 3 more                                                                                                         | `██████████████░░░░░░`&nbsp;67.9%&nbsp;·&nbsp;5.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/library.mjs + 1 more                                                                                          | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.8%&nbsp;·&nbsp;377&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;27.3%&nbsp;·&nbsp;2.1&nbsp;kB                                      |
| **dist/client/assets/SetupLayout-DiVpe09q.js**                                                                                                                     | 7.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupLayout.vue + 2 more                                                                                                             | `████░░░░░░░░░░░░░░░░`&nbsp;20.1%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████████░░░░`&nbsp;79.9%&nbsp;·&nbsp;5.7&nbsp;kB                                      |
| **<abbr title="dist/client/assets/PluginConnectorPanel-D8EuAhlm.js">…/client/assets/PluginConnectorPanel-D8EuAhlm.js</abbr>**                                      | 6.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.2&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginConnectorPanel.vue                                                                                                             | `████████░░░░░░░░░░░░`&nbsp;42.0%&nbsp;·&nbsp;2.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.0%&nbsp;·&nbsp;3.9&nbsp;kB                                      |
| **dist/client/assets/ConfigCard-BpQBj1LO.js**                                                                                                                      | 6.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigCard.vue                                                                                                                       | `███████████░░░░░░░░░`&nbsp;55.6%&nbsp;·&nbsp;3.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/trash.mjs + 3 more                                                                                            | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.8%&nbsp;·&nbsp;814&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;32.6%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| **dist/client/assets/GridDetailPanel-DmfZVQxY.js**                                                                                                                 | 6.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.5&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Grid.vue + 2 more                                                                                                                    | `██████████████░░░░░░`&nbsp;69.0%&nbsp;·&nbsp;4.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.0%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| **dist/client/assets/ConnectionPanel-CMb-3eR9.js**                                                                                                                 | 6.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConnectionPanel.vue + 2 more                                                                                                         | `█████████████░░░░░░░`&nbsp;65.5%&nbsp;·&nbsp;3.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.5%&nbsp;·&nbsp;2.1&nbsp;kB                                      |
| **<abbr title="dist/client/assets/SessionAccountPanel-BvC_-BT8.js">…t/client/assets/SessionAccountPanel-BvC\_-BT8.js</abbr>**                                      | 5.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAccountPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;52.8%&nbsp;·&nbsp;3.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs                                                                                            | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.1%&nbsp;·&nbsp;250&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.1%&nbsp;·&nbsp;2.5&nbsp;kB                                      |
| **dist/client/assets/DataViewSource-B3EgUyMP.js**                                                                                                                  | 5.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewSource.vue                                                                                                                   | `████████░░░░░░░░░░░░`&nbsp;40.8%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square-dashed.mjs + 4 more                                                                                    | `███████░░░░░░░░░░░░░`&nbsp;33.3%&nbsp;·&nbsp;1.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;25.9%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| **dist/client/assets/PluginPanel-ymeYelIP.js**                                                                                                                     | 5.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPanel.vue                                                                                                                      | `██████████░░░░░░░░░░`&nbsp;49.4%&nbsp;·&nbsp;2.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/external-link.mjs                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.1%&nbsp;·&nbsp;210&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.5%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| **dist/client/assets/PaneSplitter-Ch8a3XWs.js**                                                                                                                    | 4.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue                                                                                                                     | `█████████████░░░░░░░`&nbsp;67.4%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;32.6%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| **dist/client/assets/PluginList-Crf5gYxt.js**                                                                                                                      | 4.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginList.vue                                                                                                                       | `████████░░░░░░░░░░░░`&nbsp;39.5%&nbsp;·&nbsp;1.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.5%&nbsp;·&nbsp;2.5&nbsp;kB                                      |
| **dist/client/assets/ScrollRegion-CtYROf69.js**                                                                                                                    | 4.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.8&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/calendar-days.mjs + 7 more                                                                                    | `███████████░░░░░░░░░`&nbsp;53.6%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollRegion.vue + 1 more                                                                                                            | `████░░░░░░░░░░░░░░░░`&nbsp;19.2%&nbsp;·&nbsp;793&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;27.2%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| **dist/client/assets/ScrollRow-DUOEpmTS.js**                                                                                                                       | 3.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollRow.vue                                                                                                                        | `███████████████░░░░░`&nbsp;75.8%&nbsp;·&nbsp;2.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;24.2%&nbsp;·&nbsp;895&nbsp;B                                       |
| **dist/client/assets/utilities-v26iuUEW.js**                                                                                                                       | 3.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ErrorDialog.vue + 3 more                                                                                                             | `█████████████░░░░░░░`&nbsp;65.8%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/loader-circle.mjs                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.6%&nbsp;·&nbsp;124&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;30.6%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| **<abbr title="dist/client/assets/PresentationsPanel-3XAuwnIz.js">…st/client/assets/PresentationsPanel-3XAuwnIz.js</abbr>**                                        | 3.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PresentationsPanel.vue                                                                                                               | `████████████░░░░░░░░`&nbsp;61.9%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;38.1%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/OptionBar-CGpXucVL.js**                                                                                                                       | 3.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.5&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → OptionPanel.vue + 2 more                                                                                                             | `████████████░░░░░░░░`&nbsp;59.8%&nbsp;·&nbsp;1.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.2%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/configMonitor-2GU0AW2I.js**                                                                                                                   | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts                                                                                                                     | `██████████████████░░`&nbsp;88.3%&nbsp;·&nbsp;2.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.7%&nbsp;·&nbsp;301&nbsp;B                                       |
| **dist/client/assets/createLucideIcon-Bj_xepI7.js**                                                                                                                | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/shared/src/build/buildLucideIconNode.mjs">…src/build/buildLucideIconNode.mjs</abbr> + 8 more           | `███████████████████░`&nbsp;96.8%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.2%&nbsp;·&nbsp;81&nbsp;B                                         |
| **<abbr title="dist/client/assets/StudioDocumentSection-BCjCU69c.js">…client/assets/StudioDocumentSection-BCjCU69c.js</abbr>**                                     | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDocumentPanel.vue + 1 more                                                                                                     | `█████████░░░░░░░░░░░`&nbsp;45.4%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;54.6%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| **dist/client/assets/EventQueriesPanel-u9ezoOoG.js**                                                                                                               | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueriesPanel.vue                                                                                                                | `██████████░░░░░░░░░░`&nbsp;50.6%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;49.4%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/TextInput-TAgy7fuu.js**                                                                                                                       | 2.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextInput.vue                                                                                                                        | `██████████████░░░░░░`&nbsp;67.5%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;32.5%&nbsp;·&nbsp;681&nbsp;B                                       |
| **dist/client/assets/GuestWorkNotice-DtB7IGwZ.js**                                                                                                                 | 1.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1023&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GuestWorkNotice.vue                                                                                                                  | `███████░░░░░░░░░░░░░`&nbsp;35.5%&nbsp;·&nbsp;676&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;64.5%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **<abbr title="dist/client/assets/ContextEntityDiagramPanel-IzFiVAXf.js">…nt/assets/ContextEntityDiagramPanel-IzFiVAXf.js</abbr>**                                 | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;631&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextEntityDiagramPanel.vue                                                                                                        | `████████████████░░░░`&nbsp;78.5%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.5%&nbsp;·&nbsp;372&nbsp;B                                       |
| **dist/client/assets/type-dEYukLb-.js**                                                                                                                            | 1.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;698&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/calendar-clock.mjs + 6 more                                                                                   | `███████████████████░`&nbsp;93.8%&nbsp;·&nbsp;1.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.2%&nbsp;·&nbsp;103&nbsp;B                                        |
| **dist/client/assets/monitorSocket-Papwf2NI.js**                                                                                                                   | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;839&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → monitorSocket.ts                                                                                                                     | `██████████████████░░`&nbsp;91.1%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;8.9%&nbsp;·&nbsp;141&nbsp;B                                        |
| **dist/client/assets/action-BQynev27.js**                                                                                                                          | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;530&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → action.ts                                                                                                                            | `███████████████████░`&nbsp;95.7%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.3%&nbsp;·&nbsp;66&nbsp;B                                         |
| **dist/client/assets/EmptyPlaceholder-DnbQl1YD.js**                                                                                                                | 1.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;840&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue                                                                                                                 | `██████████░░░░░░░░░░`&nbsp;48.1%&nbsp;·&nbsp;740&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;51.9%&nbsp;·&nbsp;798&nbsp;B                                       |
| **dist/client/assets/Breadcrumbs-D5LGi68H.js**                                                                                                                     | 1.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;780&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Breadcrumbs.vue                                                                                                                      | `████████░░░░░░░░░░░░`&nbsp;39.5%&nbsp;·&nbsp;548&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.5%&nbsp;·&nbsp;839&nbsp;B                                       |
| **dist/client/assets/ItemButton-e817ojaY.js**                                                                                                                      | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;579&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ItemButton.vue                                                                                                                       | `███████████████░░░░░`&nbsp;76.9%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.1%&nbsp;·&nbsp;311&nbsp;B                                       |
| **dist/client/assets/RetrievalGate-DmvhDOLQ.js**                                                                                                                   | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;789&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → RetrievalGate.vue                                                                                                                    | `████████░░░░░░░░░░░░`&nbsp;39.1%&nbsp;·&nbsp;520&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.9%&nbsp;·&nbsp;809&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDiagramPanel-BJCu3q3A.js">…t/client/assets/ContextDiagramPanel-BJCu3q3A.js</abbr>**                                       | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;743&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDiagramPanel.vue                                                                                                              | `█████████░░░░░░░░░░░`&nbsp;44.0%&nbsp;·&nbsp;576&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;56.0%&nbsp;·&nbsp;732&nbsp;B                                       |
| **dist/client/assets/ConnectorDetails-f5K1fGVN.js**                                                                                                                | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;658&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConnectorDetails.vue                                                                                                                 | `████████░░░░░░░░░░░░`&nbsp;41.0%&nbsp;·&nbsp;535&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;59.0%&nbsp;·&nbsp;769&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePersonalDetailsPanel-_G0z8XuD.js">…t/assets/ManagePersonalDetailsPanel-\_G0z8XuD.js</abbr>**                               | 1.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;330&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue                                                                                                       | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.7%&nbsp;·&nbsp;59&nbsp;B                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████████████░`&nbsp;95.3%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/eventTracking-Ch8L1rtH.js**                                                                                                                   | 1.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;627&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → eventTracking.ts                                                                                                                     | `█████████████████░░░`&nbsp;84.8%&nbsp;·&nbsp;956&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.2%&nbsp;·&nbsp;172&nbsp;B                                       |
| **dist/client/assets/IconButton-B9uH99FI.js**                                                                                                                      | 1.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;609&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → IconButton.vue                                                                                                                       | `████████░░░░░░░░░░░░`&nbsp;39.9%&nbsp;·&nbsp;412&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.1%&nbsp;·&nbsp;620&nbsp;B                                       |
| **dist/client/assets/SelectPlaceholder-Chq7wHws.js**                                                                                                               | 1005&nbsp;B&nbsp;·&nbsp;gzip&nbsp;606&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectPlaceholder.vue + 1 more                                                                                                       | `███░░░░░░░░░░░░░░░░░`&nbsp;13.5%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████████░░░`&nbsp;86.5%&nbsp;·&nbsp;869&nbsp;B                                       |
| **dist/client/assets/useApi-CUWMwLLw-BH5VugnY.js**                                                                                                                 | 1005&nbsp;B&nbsp;·&nbsp;gzip&nbsp;543&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/useApi-CUWMwLLw.js                                                                                                       | `████████████████░░░░`&nbsp;80.1%&nbsp;·&nbsp;805&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.9%&nbsp;·&nbsp;200&nbsp;B                                       |
| **dist/client/assets/\_assistantLibrary-By8i45oe.js**                                                                                                              | 988&nbsp;B&nbsp;·&nbsp;gzip&nbsp;529&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _assistantLibrary.ts                                                                                                                 | `███████████░░░░░░░░░`&nbsp;57.2%&nbsp;·&nbsp;565&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;42.8%&nbsp;·&nbsp;423&nbsp;B                                       |
| **dist/client/assets/engine-Dk712dQK.js**                                                                                                                          | 907&nbsp;B&nbsp;·&nbsp;gzip&nbsp;524&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → engine.ts                                                                                                                            | `███████████████░░░░░`&nbsp;76.8%&nbsp;·&nbsp;697&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.2%&nbsp;·&nbsp;210&nbsp;B                                       |
| **dist/client/assets/ConfigIcon-C2lEXItx.js**                                                                                                                      | 863&nbsp;B&nbsp;·&nbsp;gzip&nbsp;507&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigIcon.vue                                                                                                                       | `███████████░░░░░░░░░`&nbsp;57.0%&nbsp;·&nbsp;492&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.0%&nbsp;·&nbsp;371&nbsp;B                                       |
| **dist/client/assets/accountMonitor-BqylpYQ4.js**                                                                                                                  | 859&nbsp;B&nbsp;·&nbsp;gzip&nbsp;517&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts                                                                                                                    | `██████████████░░░░░░`&nbsp;68.1%&nbsp;·&nbsp;585&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.9%&nbsp;·&nbsp;274&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDimensionDiagramPanel-HOutyJkB.js">…assets/ContextDimensionDiagramPanel-HOutyJkB.js</abbr>**                              | 824&nbsp;B&nbsp;·&nbsp;gzip&nbsp;458&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionDiagramPanel.vue                                                                                                     | `██████████░░░░░░░░░░`&nbsp;49.5%&nbsp;·&nbsp;408&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;50.5%&nbsp;·&nbsp;416&nbsp;B                                       |
| **dist/client/assets/PillButton-BbqM4pNT.js**                                                                                                                      | 798&nbsp;B&nbsp;·&nbsp;gzip&nbsp;497&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PillButton.vue                                                                                                                       | `█████████░░░░░░░░░░░`&nbsp;46.4%&nbsp;·&nbsp;370&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.6%&nbsp;·&nbsp;428&nbsp;B                                       |
| **dist/client/assets/DataAppsPanel-CWoL_uJO.js**                                                                                                                   | 775&nbsp;B&nbsp;·&nbsp;gzip&nbsp;487&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataAppsPanel.vue                                                                                                                    | `███████░░░░░░░░░░░░░`&nbsp;35.7%&nbsp;·&nbsp;277&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;64.3%&nbsp;·&nbsp;498&nbsp;B                                       |
| **dist/client/assets/useMarkedTool-Cp8l8wR8.js**                                                                                                                   | 772&nbsp;B&nbsp;·&nbsp;gzip&nbsp;449&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useMarkedTool.ts                                                                                                                     | `████████████░░░░░░░░`&nbsp;61.5%&nbsp;·&nbsp;475&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;38.5%&nbsp;·&nbsp;297&nbsp;B                                       |
| **dist/client/assets/SetupHomePanel-CNdKvpXS.js**                                                                                                                  | 738&nbsp;B&nbsp;·&nbsp;gzip&nbsp;500&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupHomePanel.vue                                                                                                                   | `████████░░░░░░░░░░░░`&nbsp;38.3%&nbsp;·&nbsp;283&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;61.7%&nbsp;·&nbsp;455&nbsp;B                                       |
| **dist/client/assets/Tag-CCYG7Byn.js**                                                                                                                             | 705&nbsp;B&nbsp;·&nbsp;gzip&nbsp;408&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue                                                                                                                              | `███████████████░░░░░`&nbsp;73.8%&nbsp;·&nbsp;520&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.2%&nbsp;·&nbsp;185&nbsp;B                                       |
| **dist/client/assets/HouseIcon-C08yQIO-.js**                                                                                                                       | 594&nbsp;B&nbsp;·&nbsp;gzip&nbsp;394&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → HouseIcon.vue                                                                                                                        | `██████████░░░░░░░░░░`&nbsp;47.8%&nbsp;·&nbsp;284&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;52.2%&nbsp;·&nbsp;310&nbsp;B                                       |
| **dist/client/assets/RectangleButton-DrRobosw.js**                                                                                                                 | 579&nbsp;B&nbsp;·&nbsp;gzip&nbsp;395&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → RectangleButton.vue                                                                                                                  | `███████░░░░░░░░░░░░░`&nbsp;32.8%&nbsp;·&nbsp;190&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;67.2%&nbsp;·&nbsp;389&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePreferencesPanel-DrwoXf1R.js">…lient/assets/ManagePreferencesPanel-DrwoXf1R.js</abbr>**                                    | 556&nbsp;B&nbsp;·&nbsp;gzip&nbsp;374&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue                                                                                                           | `██████░░░░░░░░░░░░░░`&nbsp;30.2%&nbsp;·&nbsp;168&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;69.8%&nbsp;·&nbsp;388&nbsp;B                                       |
| **dist/client/assets/useSetupSelection-C4HrLP0f.js**                                                                                                               | 489&nbsp;B&nbsp;·&nbsp;gzip&nbsp;332&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupSelection.ts                                                                                                                 | `███████████████░░░░░`&nbsp;73.6%&nbsp;·&nbsp;360&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.4%&nbsp;·&nbsp;129&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginPresenterPanel-lS8IIFY3.js">…/client/assets/PluginPresenterPanel-lS8IIFY3.js</abbr>**                                      | 475&nbsp;B&nbsp;·&nbsp;gzip&nbsp;272&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPresenterPanel.vue                                                                                                             | `██████░░░░░░░░░░░░░░`&nbsp;28.6%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;71.4%&nbsp;·&nbsp;339&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginCookbookPanel-Dl-qyJlV.js">…t/client/assets/PluginCookbookPanel-Dl-qyJlV.js</abbr>**                                       | 474&nbsp;B&nbsp;·&nbsp;gzip&nbsp;273&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginCookbookPanel.vue                                                                                                              | `██████░░░░░░░░░░░░░░`&nbsp;28.7%&nbsp;·&nbsp;136&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;71.3%&nbsp;·&nbsp;338&nbsp;B                                       |
| **dist/client/assets/PluginToolPanel-DZmYe3uJ.js**                                                                                                                 | 453&nbsp;B&nbsp;·&nbsp;gzip&nbsp;260&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginToolPanel.vue                                                                                                                  | `█████░░░░░░░░░░░░░░░`&nbsp;26.3%&nbsp;·&nbsp;119&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████████░░░░░`&nbsp;73.7%&nbsp;·&nbsp;334&nbsp;B                                       |
| **dist/client/assets/BusyBar-gsOzt0Ti.js**                                                                                                                         | 407&nbsp;B&nbsp;·&nbsp;gzip&nbsp;309&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → BusyBar.vue                                                                                                                          | `███████████░░░░░░░░░`&nbsp;53.8%&nbsp;·&nbsp;219&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.2%&nbsp;·&nbsp;188&nbsp;B                                       |
| **dist/client/assets/useSetupRoute-gqPJ_wnd.js**                                                                                                                   | 394&nbsp;B&nbsp;·&nbsp;gzip&nbsp;289&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupRoute.ts                                                                                                                     | `███████████░░░░░░░░░`&nbsp;56.6%&nbsp;·&nbsp;223&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.4%&nbsp;·&nbsp;171&nbsp;B                                       |
| **dist/client/assets/square-pen-tAXV-HGn.js**                                                                                                                      | 380&nbsp;B&nbsp;·&nbsp;gzip&nbsp;277&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square-pen.mjs                                                                                                | `█████████████████░░░`&nbsp;83.9%&nbsp;·&nbsp;319&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;16.1%&nbsp;·&nbsp;61&nbsp;B                                        |
| **<abbr title="dist/client/assets/ManageSubscriptionPanel-nypPhpKG.js">…ient/assets/ManageSubscriptionPanel-nypPhpKG.js</abbr>**                                   | 316&nbsp;B&nbsp;·&nbsp;gzip&nbsp;258&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue                                                                                                          | `█████████░░░░░░░░░░░`&nbsp;44.9%&nbsp;·&nbsp;142&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.1%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageDataServiceTokensPanel-y6vXjiE3.js">…assets/ManageDataServiceTokensPanel-y6vXjiE3.js</abbr>**                              | 313&nbsp;B&nbsp;·&nbsp;gzip&nbsp;255&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue                                                                                                     | `█████████░░░░░░░░░░░`&nbsp;44.4%&nbsp;·&nbsp;139&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;55.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/GenerateTokenPanel-DvDqE07I.js">…st/client/assets/GenerateTokenPanel-DvDqE07I.js</abbr>**                                        | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;248&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue                                                                                                               | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageSessionsPanel-BUaDpDRj.js">…t/client/assets/ManageSessionsPanel-BUaDpDRj.js</abbr>**                                       | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;248&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue                                                                                                              | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/ReviewActivityPanel-BzZ5vkl5.js">…t/client/assets/ReviewActivityPanel-BzZ5vkl5.js</abbr>**                                       | 302&nbsp;B&nbsp;·&nbsp;gzip&nbsp;249&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue                                                                                                              | `████████░░░░░░░░░░░░`&nbsp;42.4%&nbsp;·&nbsp;128&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.6%&nbsp;·&nbsp;174&nbsp;B                                       |
| **<abbr title="dist/client/assets/DeleteAccountPanel-DZ-Qm1yr.js">…st/client/assets/DeleteAccountPanel-DZ-Qm1yr.js</abbr>**                                        | 301&nbsp;B&nbsp;·&nbsp;gzip&nbsp;248&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue                                                                                                               | `████████░░░░░░░░░░░░`&nbsp;42.2%&nbsp;·&nbsp;127&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;57.8%&nbsp;·&nbsp;174&nbsp;B                                       |
| **dist/client/assets/ManageAccessPanel-B6Z0TaQ-.js**                                                                                                               | 300&nbsp;B&nbsp;·&nbsp;gzip&nbsp;247&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue                                                                                                                | `████████░░░░░░░░░░░░`&nbsp;42.0%&nbsp;·&nbsp;126&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.0%&nbsp;·&nbsp;174&nbsp;B                                       |
| **dist/client/assets/link-Bvm6DRte.js**                                                                                                                            | 276&nbsp;B&nbsp;·&nbsp;gzip&nbsp;211&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/link.mjs                                                                                                      | `████████████████░░░░`&nbsp;77.9%&nbsp;·&nbsp;215&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;22.1%&nbsp;·&nbsp;61&nbsp;B                                        |
| **<abbr title="dist/client/assets/StudioDetailLayout-NFhlxzvQ.js">…st/client/assets/StudioDetailLayout-NFhlxzvQ.js</abbr>**                                        | 274&nbsp;B&nbsp;·&nbsp;gzip&nbsp;227&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDetailLayout.vue                                                                                                               | `███░░░░░░░░░░░░░░░░░`&nbsp;13.1%&nbsp;·&nbsp;36&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████████░░░`&nbsp;86.9%&nbsp;·&nbsp;238&nbsp;B                                       |
| **dist/client/assets/tools-CCdYeIDW.js**                                                                                                                           | 250&nbsp;B&nbsp;·&nbsp;gzip&nbsp;202&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → tools.ts                                                                                                                             | `████████░░░░░░░░░░░░`&nbsp;41.2%&nbsp;·&nbsp;103&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.8%&nbsp;·&nbsp;147&nbsp;B                                       |
| **dist/client/assets/configCard-DFBgZW44.js**                                                                                                                      | 245&nbsp;B&nbsp;·&nbsp;gzip&nbsp;212&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configCard.ts                                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.5%&nbsp;·&nbsp;131&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.5%&nbsp;·&nbsp;114&nbsp;B                                       |
| **dist/client/assets/appearance-CXtkMXNY.js**                                                                                                                      | 225&nbsp;B&nbsp;·&nbsp;gzip&nbsp;202&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → appearance.ts                                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.7%&nbsp;·&nbsp;105&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.3%&nbsp;·&nbsp;120&nbsp;B                                       |
| **dist/client/assets/search-BfQ4haM8.js**                                                                                                                          | 194&nbsp;B&nbsp;·&nbsp;gzip&nbsp;179&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs                                                                                                    | `██████████████░░░░░░`&nbsp;68.6%&nbsp;·&nbsp;133&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.4%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/arrow-left-Ct6T6UoZ.js**                                                                                                                      | 185&nbsp;B&nbsp;·&nbsp;gzip&nbsp;174&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs                                                                                                | `█████████████░░░░░░░`&nbsp;67.0%&nbsp;·&nbsp;124&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.0%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/arrow-up-s4EQKidf.js**                                                                                                                        | 182&nbsp;B&nbsp;·&nbsp;gzip&nbsp;172&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-up.mjs                                                                                                  | `█████████████░░░░░░░`&nbsp;66.5%&nbsp;·&nbsp;121&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.5%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/plus-B3PByzFX.js**                                                                                                                            | 173&nbsp;B&nbsp;·&nbsp;gzip&nbsp;164&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs                                                                                                      | `█████████████░░░░░░░`&nbsp;64.7%&nbsp;·&nbsp;112&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;35.3%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/chevron-left-BhuzlJuG.js**                                                                                                                    | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;158&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs                                                                                              | `████████████░░░░░░░░`&nbsp;59.3%&nbsp;·&nbsp;89&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.7%&nbsp;·&nbsp;61&nbsp;B                                        |
| **dist/client/assets/chevron-right-lgN6Pdvt.js**                                                                                                                   | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;155&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs                                                                                             | `████████████░░░░░░░░`&nbsp;59.3%&nbsp;·&nbsp;89&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.7%&nbsp;·&nbsp;61&nbsp;B                                        |

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
