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
| [@lucide/vue](https://github.com/lucide-icons/lucide)                  | 1.54.0  | ISC                     | [LICENSE](licenses/downloads/@lucide/vue@1.54.0-LICENSE.txt)                  |
| [@tanstack/ai](https://github.com/TanStack/ai)                         | 0.66.0  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai@0.66.0-LICENSE.txt)                 |
| [@tanstack/ai-client](https://github.com/TanStack/ai)                  | 0.39.0  | MIT                     | [LICENSE](licenses/downloads/@tanstack/ai-client@0.39.0-LICENSE.txt)          |
| [@tanstack/query-core](https://github.com/TanStack/query)              | 5.104.1 | MIT                     | [LICENSE](licenses/downloads/@tanstack/query-core@5.104.1-LICENSE.txt)        |
| [@tanstack/store](https://github.com/TanStack/store)                   | 0.11.2  | MIT                     | [LICENSE](licenses/downloads/@tanstack/store@0.11.2-LICENSE.txt)              |
| [@tanstack/table-core](https://github.com/TanStack/table)              |  9.2.8  | MIT                     | [LICENSE](licenses/downloads/@tanstack/table-core@9.2.8-LICENSE.txt)          |
| [@tanstack/virtual-core](https://github.com/TanStack/virtual)          | 3.17.11 | MIT                     | [LICENSE](licenses/downloads/@tanstack/virtual-core@3.17.11-LICENSE.txt)      |
| [@tanstack/vue-query](https://github.com/TanStack/query)               | 5.104.1 | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-query@5.104.1-LICENSE.txt)         |
| [@tanstack/vue-table](https://github.com/TanStack/table)               |  9.2.8  | MIT                     | [LICENSE](licenses/downloads/@tanstack/vue-table@9.2.8-LICENSE.txt)           |
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
| [vue-router](https://github.com/vuejs/router)                          |  5.4.0  | MIT                     | [LICENSE](licenses/downloads/vue-router@5.4.0-LICENSE.txt)                    |
| [web-vitals](https://github.com/GoogleChrome/web-vitals)               |  6.2.3  | Apache-2.0              | [LICENSE](licenses/downloads/web-vitals@6.2.3-LICENSE.txt)                    |

### Dependency Tree

The dependency tree below shows how each package in the table above is reached — direct and transitive — along with its installed version, release date, and update status. A package that does not ship itself, such as one whose parts are bundled separately, is left out and what ships beneath it is shown in its place. Packages flagged ❗ have a newer version available; ⚠️ indicates a package that hasn't been updated in the last 6 months or longer. Neither flag necessarily indicates a problem: we let new releases stabilise before upgrading, and some packages are mature and stable (have limited or no dependencies), so they require no active development.

- **[@dpuse/dpuse-shared](https://github.com/dpuse/dpuse-shared)** 1.0.116 — this month: 2026-10-06
    - **[valibot](https://github.com/open-circle/valibot)** 1.5.0 — 1 mth ago: 2026-09-09
- **[@fontsource-variable/inter](https://github.com/fontsource/font-files)** 5.3.0 — 2 mths ago: 2026-07-19
- **[@formkit/drag-and-drop](https://github.com/formkit/drag-and-drop)** 0.6.1 — 3 mths ago: 2026-06-15
- **[@tanstack/ai-client](https://github.com/TanStack/ai)** 0.39.0 — this month: 2026-10-08 → latest: 0.39.2 — this month: 2026-10-09 ❗
    - **[@tanstack/ai](https://github.com/TanStack/ai)** 0.66.0 — this month: 2026-10-08 → latest: 0.68.0 — this month: 2026-10-09 ❗
- **[@tanstack/ai](https://github.com/TanStack/ai)** 0.66.0 — this month: 2026-10-08 → latest: 0.68.0 — this month: 2026-10-09 ❗
    - **[@ag-ui/core](https://github.com/ag-ui-protocol/ag-ui)** 1.0.0 — this month: 2026-09-17 → latest: 1.0.2 — this month: 2026-10-05 ❗
    - **[fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)** 3.1.1 — 54 mths ago: 2022-03-24 ⚠️
    - **[partial-json](https://github.com/promplate/partial-json-parser-js)** 0.1.7 — 28 mths ago: 2024-05-14 ⚠️
- **[@tanstack/vue-query](https://github.com/TanStack/query)** 5.104.1 — this month: 2026-10-02
    - **[@tanstack/query-core](https://github.com/TanStack/query)** 5.104.1 — this month: 2026-10-02
- **[@tanstack/vue-table](https://github.com/TanStack/table)** 9.2.8 — this month: 2026-10-08
    - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — this month: 2026-09-29
    - **[@tanstack/table-core](https://github.com/TanStack/table)** 9.2.8 — this month: 2026-10-08
        - **[@tanstack/store](https://github.com/TanStack/store)** 0.11.2 — this month: 2026-09-29
- **[@tanstack/vue-virtual](https://github.com/TanStack/virtual)** 3.13.39 — this month: 2026-09-14 → latest: 3.13.40 — this month: 2026-10-09 ❗
    - **[@tanstack/virtual-core](https://github.com/TanStack/virtual)** 3.17.11 — this month: 2026-09-14 → latest: 3.18.0 — this month: 2026-10-09 ❗
- **[@teamhanko/hanko-frontend-sdk](https://github.com/teamhanko/hanko)** 3.1.0 — this month: 2026-10-01
- **[@vueuse/core](https://github.com/vueuse/vueuse)** 15.0.0 — this month: 2026-09-16
    - **[@vueuse/shared](https://github.com/vueuse/vueuse)** 15.0.0 — this month: 2026-09-16
- **[dompurify](https://github.com/cure53/DOMPurify)** 3.4.16 — this month: 2026-09-23
- **[squire-rte](https://github.com/neilj/Squire)** 2.4.9 — this month: 2026-09-15
- **[vue-router](https://github.com/vuejs/router)** 5.4.0 — this month: 2026-10-07
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
- **[@vue/runtime-dom](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
    - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
    - **[@vue/runtime-core](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
        - **[@vue/reactivity](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
        - **[@vue/shared](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
    - **[@vue/shared](https://github.com/vuejs/core)** 3.5.43 — this month: 2026-09-17
- **[web-vitals](https://github.com/GoogleChrome/web-vitals)** 6.2.3 — this month: 2026-10-05
- **[@lucide/vue](https://github.com/lucide-icons/lucide)** 1.54.0 — this month: 2026-10-09 → latest: 1.55.0 — this month: 2026-10-10 ❗

<!-- DEPENDENCY_LICENSES_END -->

<!-- BUNDLE_START -->

## Bundle Analysis

This report is updated with each release, from the bundle the release builds, using [Sonda](https://sonda.dev/), which analyses final source maps to reveal the actual effects of tree-shaking and minification rather than relying on pre-build estimates.

_Note: Sonda's Vite reports currently exclude CSS files, since Vite does not generate source maps for CSS._

| Chunk/Module/File                                                                                                                                                  | Composition                                                                                    |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **dist/client/assets/ChatPanel-Cc_p1R_p.js**                                                                                                                       | 197.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;53.5&nbsp;kB&nbsp;·&nbsp;21.5%&nbsp;of&nbsp;the&nbsp;build |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client → dist/esm/chat-client.js + 12 more                                                                                    | `█████████░░░░░░░░░░░`&nbsp;43.2%&nbsp;·&nbsp;85.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai → <abbr title="dist/esm/activities/chat/stream/processor.js">…ivities/chat/stream/processor.js</abbr> + 26 more               | `████████░░░░░░░░░░░░`&nbsp;38.3%&nbsp;·&nbsp;75.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → tanstackClientTools.ts + 16 more                                                                                                     | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.0%&nbsp;·&nbsp;19.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;fast-json-patch → module/core.mjs + 3 more                                                                                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.1%&nbsp;·&nbsp;10.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json → dist/index.js + 1 more                                                                                                      | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.8%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@ag-ui/core → dist/version-CTNE2I0_.mjs                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square.mjs + 2 more                                                                                           | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.4%&nbsp;·&nbsp;830&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.7%&nbsp;·&nbsp;1.4&nbsp;kB                                       |
| **dist/client/assets/index-CBsjwifn.js**                                                                                                                           | 80.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;26.5&nbsp;kB&nbsp;·&nbsp;8.8%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → session.ts + 15 more                                                                                                                 | `██████░░░░░░░░░░░░░░`&nbsp;31.9%&nbsp;·&nbsp;25.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → build/modern/query.js + 14 more                                                                                     | `██████░░░░░░░░░░░░░░`&nbsp;29.9%&nbsp;·&nbsp;24.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → <abbr title="dist/runtime-dom.esm-bundler.js">…t/runtime-dom.esm-bundler.js</abbr>                                      | `████░░░░░░░░░░░░░░░░`&nbsp;19.5%&nbsp;·&nbsp;15.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/queryClient.js">…ild/modern/queryClient.js</abbr> + 4 more                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.8%&nbsp;·&nbsp;3.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;14.9%&nbsp;·&nbsp;12.0&nbsp;kB                                     |
| **<abbr title="dist/client/assets/StudioDescriptorsPanel-Cs-A80SY.js">…lient/assets/StudioDescriptorsPanel-Cs-A80SY.js</abbr>**                                    | 64.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;20.1&nbsp;kB&nbsp;·&nbsp;7.0%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs                                                                                                               | `██████████████████░░`&nbsp;91.0%&nbsp;·&nbsp;58.6&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextEditor.vue + 1 more                                                                                                              | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.1%&nbsp;·&nbsp;3.9&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/underline.mjs + 3 more                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.2%&nbsp;·&nbsp;802&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.6%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| **<abbr title="dist/client/assets/runtime-core.esm-bundler-D0l-hAlG.js">…ent/assets/runtime-core.esm-bundler-D0l-hAlG.js</abbr>**                                  | 63.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;24.5&nbsp;kB&nbsp;·&nbsp;6.9%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → <abbr title="dist/runtime-core.esm-bundler.js">…runtime-core.esm-bundler.js</abbr>                                     | `█████████████░░░░░░░`&nbsp;67.5%&nbsp;·&nbsp;42.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js                                                                                           | `█████░░░░░░░░░░░░░░░`&nbsp;26.5%&nbsp;·&nbsp;16.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js                                                                                                   | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.0%&nbsp;·&nbsp;3.8&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.0%&nbsp;·&nbsp;0&nbsp;B                                          |
| **dist/client/assets/ExploreDataPanel-mprCVs4x.js**                                                                                                                | 58.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;15.9&nbsp;kB&nbsp;·&nbsp;6.4%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop → index.mjs + 1 more                                                                                                | `██████████░░░░░░░░░░`&nbsp;50.3%&nbsp;·&nbsp;29.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TransformDataPanel.vue + 4 more                                                                                                      | `█████████░░░░░░░░░░░`&nbsp;44.8%&nbsp;·&nbsp;26.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/type.mjs + 8 more                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.6%&nbsp;·&nbsp;2.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.3%&nbsp;·&nbsp;757&nbsp;B                                        |
| **dist/client/assets/Table-Cw51Fr2S.js**                                                                                                                           | 51.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;13.6&nbsp;kB&nbsp;·&nbsp;5.6%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core → <abbr title="dist/features/column-pinning/columnPinningFeature.utils.js">…nPinningFeature.utils.js</abbr> + 32 more | `███████████████░░░░░`&nbsp;74.1%&nbsp;·&nbsp;38.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Table.vue + 4 more                                                                                                                   | `████░░░░░░░░░░░░░░░░`&nbsp;18.5%&nbsp;·&nbsp;9.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table → dist/useTable.js + 2 more                                                                                            | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.7%&nbsp;·&nbsp;2.4&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js                                                                                                          | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.3%&nbsp;·&nbsp;676&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/settings-2.mjs                                                                                                | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.4%&nbsp;·&nbsp;211&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;593&nbsp;B                                        |
| **dist/client/assets/ContextModelList-BvoC0l30.js**                                                                                                                | 45.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;11.1&nbsp;kB&nbsp;·&nbsp;4.9%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _context.ts + 7 more                                                                                                                 | `███████████████████░`&nbsp;94.2%&nbsp;·&nbsp;42.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/network.mjs                                                                                                   | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.4%&nbsp;·&nbsp;642&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.4%&nbsp;·&nbsp;2.0&nbsp;kB                                       |
| **dist/client/assets/useMarkedTool-DNGS4e3N.js**                                                                                                                   | 28.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;11.1&nbsp;kB&nbsp;·&nbsp;3.1%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs                                                                                                             | `███████████████████░`&nbsp;97.2%&nbsp;·&nbsp;27.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useMarkedTool.ts                                                                                                                     | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;491&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;324&nbsp;B                                        |
| **dist/client/assets/sdk.modern-BA6sl1Hr.js**                                                                                                                      | 27.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.1&nbsp;kB&nbsp;·&nbsp;3.0%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → <abbr title="dist/sdk.modern.js">…t/sdk.modern.js</abbr>                                                   | `████████████████████`&nbsp;100.0%&nbsp;·&nbsp;27.5&nbsp;kB                                    |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.0%&nbsp;·&nbsp;1&nbsp;B                                          |
| **dist/client/assets/useDataWindow-DK9kOowf.js**                                                                                                                   | 25.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;7.7&nbsp;kB&nbsp;·&nbsp;2.7%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core → dist/esm/index.js + 2 more                                                                                        | `██████████████████░░`&nbsp;90.4%&nbsp;·&nbsp;22.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts                                                                                                                     | `██░░░░░░░░░░░░░░░░░░`&nbsp;7.5%&nbsp;·&nbsp;1.9&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js                                                                                                  | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.5%&nbsp;·&nbsp;378&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;151&nbsp;B                                        |
| **dist/client/assets/ActionWrapper-DwshROI6.js**                                                                                                                   | 22.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;9.0&nbsp;kB&nbsp;·&nbsp;2.5%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/vue-router.js + 1 more                                                                                                   | `███████████████████░`&nbsp;96.9%&nbsp;·&nbsp;22.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ActionWrapper.vue                                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.6%&nbsp;·&nbsp;368&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.5%&nbsp;·&nbsp;352&nbsp;B                                        |
| **dist/client/assets/dist-C9oYXf_t.js**                                                                                                                            | 17.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;7.0&nbsp;kB&nbsp;·&nbsp;2.0%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/core → dist/index.js                                                                                                               | `███████████████░░░░░`&nbsp;73.8%&nbsp;·&nbsp;13.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/shared → dist/index.js                                                                                                             | `█████░░░░░░░░░░░░░░░`&nbsp;25.1%&nbsp;·&nbsp;4.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.0%&nbsp;·&nbsp;191&nbsp;B                                        |
| **dist/client/assets/DataViewList-CpFz-K2L.js**                                                                                                                    | 17.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.9&nbsp;kB&nbsp;·&nbsp;1.9%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewPanel.vue + 5 more                                                                                                           | `████████████████░░░░`&nbsp;80.5%&nbsp;·&nbsp;14.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.5%&nbsp;·&nbsp;3.4&nbsp;kB                                      |
| **dist/client/assets/locale-D9kSAnR2.js**                                                                                                                          | 13.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.3&nbsp;kB&nbsp;·&nbsp;1.5%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared.es.js                                                                                              | `█████████████████░░░`&nbsp;84.8%&nbsp;·&nbsp;11.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → locale.ts                                                                                                                            | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.7%&nbsp;·&nbsp;511&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.5%&nbsp;·&nbsp;1.5&nbsp;kB                                      |
| **dist/client/assets/dataViews-CRjCIIuI.js**                                                                                                                       | 13.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;4.5&nbsp;kB&nbsp;·&nbsp;1.4%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/query-core → <abbr title="build/modern/queryObserver.js">…/modern/queryObserver.js</abbr> + 1 more                               | `████████████░░░░░░░░`&nbsp;59.1%&nbsp;·&nbsp;7.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViews.ts + 1 more                                                                                                                | `█████░░░░░░░░░░░░░░░`&nbsp;23.1%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-query → <abbr title="build/modern/useBaseQuery.js">…ld/modern/useBaseQuery.js</abbr> + 3 more                                | `███░░░░░░░░░░░░░░░░░`&nbsp;13.9%&nbsp;·&nbsp;1.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.8%&nbsp;·&nbsp;519&nbsp;B                                        |
| **dist/client/assets/SessionAuthPanel-Egza5Ku7.js**                                                                                                                | 12.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.0&nbsp;kB&nbsp;·&nbsp;1.4%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAuthPanel.vue + 5 more                                                                                                        | `██████████████████░░`&nbsp;91.2%&nbsp;·&nbsp;11.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs                                                                                            | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.1%&nbsp;·&nbsp;398&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.7%&nbsp;·&nbsp;733&nbsp;B                                        |
| **dist/client/assets/AssistantLayout-Cal_QMw3.js**                                                                                                                 | 9.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.9&nbsp;kB&nbsp;·&nbsp;1.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AssistantLayout.vue + 5 more                                                                                                         | `███████████████░░░░░`&nbsp;77.2%&nbsp;·&nbsp;7.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/library.mjs + 1 more                                                                                          | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.8%&nbsp;·&nbsp;379&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.0%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| **dist/client/assets/ErrorNotice-DGzGYGEM.js**                                                                                                                     | 8.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.4&nbsp;kB&nbsp;·&nbsp;1.0%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ErrorBody.vue + 3 more                                                                                                               | `█████████████████░░░`&nbsp;83.6%&nbsp;·&nbsp;7.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/triangle-alert.mjs + 2 more                                                                                   | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.8%&nbsp;·&nbsp;976&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.7%&nbsp;·&nbsp;514&nbsp;B                                        |
| **<abbr title="dist/client/assets/performanceTracking-DOOXfFVz.js">…t/client/assets/performanceTracking-DOOXfFVz.js</abbr>**                                       | 8.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.2&nbsp;kB&nbsp;·&nbsp;0.9%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.js                                                                                                            | `███████████████████░`&nbsp;97.2%&nbsp;·&nbsp;8.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts                                                                                                               | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.2%&nbsp;·&nbsp;195&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;48&nbsp;B                                         |
| **dist/client/assets/LibraryPanel-B_KkVtfK.js**                                                                                                                    | 8.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.3&nbsp;kB&nbsp;·&nbsp;0.9%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → LibraryPanel.vue + 2 more                                                                                                            | `█████████████████░░░`&nbsp;84.0%&nbsp;·&nbsp;7.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;16.0%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| **dist/client/assets/SelectItemPanel-BHgp5yxg.js**                                                                                                                 | 7.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.4&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectItemPanel.vue + 1 more                                                                                                         | `████████████████░░░░`&nbsp;79.8%&nbsp;·&nbsp;6.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/folder.mjs                                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.5%&nbsp;·&nbsp;432&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;14.7%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| **dist/client/assets/DataViewsLayout-fGk0cGPW.js**                                                                                                                 | 7.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.9&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewsLayout.vue + 1 more                                                                                                         | `██████████████░░░░░░`&nbsp;68.5%&nbsp;·&nbsp;5.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.5%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| **dist/client/assets/SessionMenu-DHMs1gMy.js**                                                                                                                     | 7.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.7&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue                                                                                                                      | `████████████░░░░░░░░`&nbsp;62.5%&nbsp;·&nbsp;4.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/sun.mjs + 4 more                                                                                              | `█████░░░░░░░░░░░░░░░`&nbsp;27.2%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.3%&nbsp;·&nbsp;741&nbsp;B                                       |
| **dist/client/assets/SetupLayout-B86wFtrJ.js**                                                                                                                     | 6.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupOptions.ts + 2 more                                                                                                          | `██████████████████░░`&nbsp;89.7%&nbsp;·&nbsp;6.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.3%&nbsp;·&nbsp;727&nbsp;B                                       |
| **dist/client/assets/ConnectionPanel-tr2opn5C.js**                                                                                                                 | 6.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.4&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConnectionPanel.vue + 2 more                                                                                                         | `████████████████░░░░`&nbsp;79.0%&nbsp;·&nbsp;4.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.0%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| **dist/client/assets/ConfigCard-CyDkGxHS.js**                                                                                                                      | 6.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigCard.vue                                                                                                                       | `██████████████░░░░░░`&nbsp;72.0%&nbsp;·&nbsp;4.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/trash.mjs + 2 more                                                                                            | `████░░░░░░░░░░░░░░░░`&nbsp;21.4%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.7%&nbsp;·&nbsp;407&nbsp;B                                        |
| **dist/client/assets/GridDetailPanel-KYdLKxqZ.js**                                                                                                                 | 5.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Grid.vue + 3 more                                                                                                                    | `██████████████████░░`&nbsp;90.3%&nbsp;·&nbsp;4.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;9.7%&nbsp;·&nbsp;536&nbsp;B                                        |
| **<abbr title="dist/client/assets/SessionAccountPanel-BmLS7ryO.js">…t/client/assets/SessionAccountPanel-BmLS7ryO.js</abbr>**                                       | 5.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.0&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAccountPanel.vue                                                                                                              | `████████████░░░░░░░░`&nbsp;58.6%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs                                                                                            | `████░░░░░░░░░░░░░░░░`&nbsp;17.8%&nbsp;·&nbsp;939&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.5%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/ScrollArea-DWQhZibY.js**                                                                                                                      | 5.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.0&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollThumb.vue + 1 more                                                                                                             | `██████████████████░░`&nbsp;89.9%&nbsp;·&nbsp;4.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.1%&nbsp;·&nbsp;519&nbsp;B                                       |
| **dist/client/assets/errors-CR6j2KMp.js**                                                                                                                          | 4.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.2&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → errorTracking.ts + 1 more                                                                                                            | `█████████████░░░░░░░`&nbsp;62.8%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;37.2%&nbsp;·&nbsp;1.8&nbsp;kB                                      |
| **dist/client/assets/PaneSplitter-Co7ItwrB.js**                                                                                                                    | 4.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue                                                                                                                     | `████████████████░░░░`&nbsp;78.3%&nbsp;·&nbsp;3.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.7%&nbsp;·&nbsp;980&nbsp;B                                       |
| **dist/client/assets/PluginList-DR9Pb5W\_.js**                                                                                                                     | 4.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginList.vue                                                                                                                       | `█████████░░░░░░░░░░░`&nbsp;45.5%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;54.5%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| **dist/client/assets/useStudioOptions-LbBVaoCL.js**                                                                                                                | 4.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.3&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts                                                                                                                  | `████████████████████`&nbsp;97.6%&nbsp;·&nbsp;4.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.4%&nbsp;·&nbsp;107&nbsp;B                                        |
| **<abbr title="dist/client/assets/SelectConnectionList-ByM7zLUk.js">…/client/assets/SelectConnectionList-ByM7zLUk.js</abbr>**                                      | 4.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectConnectionList.vue + 1 more                                                                                                    | `██████████████░░░░░░`&nbsp;70.7%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;29.3%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/ScrollRow-BWohkENo.js**                                                                                                                       | 3.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollRow.vue                                                                                                                        | `█████████████████░░░`&nbsp;84.6%&nbsp;·&nbsp;3.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.4%&nbsp;·&nbsp;576&nbsp;B                                       |
| **dist/client/assets/StudioHomePanel-BJMpBQaC.js**                                                                                                                 | 3.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHomePanel.vue                                                                                                                  | `███████░░░░░░░░░░░░░`&nbsp;32.8%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;67.2%&nbsp;·&nbsp;2.3&nbsp;kB                                      |
| **dist/client/assets/PluginPanel-Brz_znoF.js**                                                                                                                     | 3.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.5&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPanel.vue                                                                                                                      | `███████████░░░░░░░░░`&nbsp;53.8%&nbsp;·&nbsp;1.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round.mjs + 2 more                                                                                       | `██████░░░░░░░░░░░░░░`&nbsp;30.6%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.6%&nbsp;·&nbsp;547&nbsp;B                                       |
| **dist/client/assets/OptionBar-Cvk63sdi.js**                                                                                                                       | 3.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → OptionPanel.vue + 3 more                                                                                                             | `████████████████░░░░`&nbsp;81.8%&nbsp;·&nbsp;2.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;18.2%&nbsp;·&nbsp;634&nbsp;B                                       |
| **<abbr title="dist/client/assets/PresentationsLayout-D4d7S9T-.js">…t/client/assets/PresentationsLayout-D4d7S9T-.js</abbr>**                                       | 3.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PresentationsLayout.vue                                                                                                              | `███████████████░░░░░`&nbsp;74.9%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;25.1%&nbsp;·&nbsp;833&nbsp;B                                       |
| **dist/client/assets/createLucideIcon-Cd1BC5AU.js**                                                                                                                | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/shared/src/build/buildLucideIconNode.mjs">…src/build/buildLucideIconNode.mjs</abbr> + 8 more           | `███████████████████░`&nbsp;97.4%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.6%&nbsp;·&nbsp;66&nbsp;B                                         |
| **<abbr title="dist/client/assets/EventQueriesLayout-BMI04gQ9.js">…st/client/assets/EventQueriesLayout-BMI04gQ9.js</abbr>**                                        | 2.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueriesLayout.vue                                                                                                               | `██████████████░░░░░░`&nbsp;71.6%&nbsp;·&nbsp;1.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;28.4%&nbsp;·&nbsp;666&nbsp;B                                       |
| **dist/client/assets/utilities-CvWsQw_k.js**                                                                                                                       | 2.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → index.ts + 2 more                                                                                                                    | `████████████████░░░░`&nbsp;77.5%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/loader-circle.mjs                                                                                             | `██░░░░░░░░░░░░░░░░░░`&nbsp;8.2%&nbsp;·&nbsp;188&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;14.2%&nbsp;·&nbsp;325&nbsp;B                                       |
| **<abbr title="dist/client/assets/StudioDocumentPanel-BLO81Ufc.js">…t/client/assets/StudioDocumentPanel-BLO81Ufc.js</abbr>**                                       | 2.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDocumentPanel.vue + 1 more                                                                                                     | `████████████████░░░░`&nbsp;78.1%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.9%&nbsp;·&nbsp;475&nbsp;B                                       |
| **dist/client/assets/GitHubLogo-CB5f2rTt.js**                                                                                                                      | 2.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GitHubLogo.vue                                                                                                                       | `██████████████████░░`&nbsp;89.9%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.1%&nbsp;·&nbsp;212&nbsp;B                                       |
| **dist/client/assets/TextInput-BV1XWObj.js**                                                                                                                       | 2.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextInput.vue                                                                                                                        | `███████████████░░░░░`&nbsp;72.5%&nbsp;·&nbsp;1.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;27.5%&nbsp;·&nbsp;572&nbsp;B                                       |
| **dist/client/assets/configMonitor-CN4kMmFW.js**                                                                                                                   | 1.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;889&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts                                                                                                                     | `██████████████████░░`&nbsp;88.9%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.1%&nbsp;·&nbsp;219&nbsp;B                                       |
| **dist/client/assets/RectangleButton-C3MA7Hqm.js**                                                                                                                 | 1.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;815&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → action.ts + 1 more                                                                                                                   | `██████████████████░░`&nbsp;92.2%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;7.8%&nbsp;·&nbsp;151&nbsp;B                                        |
| **<abbr title="dist/client/assets/PluginConnectorPanel-C7uoj6r6.js">…/client/assets/PluginConnectorPanel-C7uoj6r6.js</abbr>**                                      | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;888&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginConnectorPanel.vue                                                                                                             | `██████████████░░░░░░`&nbsp;71.6%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;28.4%&nbsp;·&nbsp;507&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextEntityDiagramPanel-CxjBs6Uv.js">…nt/assets/ContextEntityDiagramPanel-CxjBs6Uv.js</abbr>**                                 | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;625&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextEntityDiagramPanel.vue                                                                                                        | `████████████████░░░░`&nbsp;81.9%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;18.1%&nbsp;·&nbsp;313&nbsp;B                                       |
| **dist/client/assets/monitorSocket-dtf2qW5o.js**                                                                                                                   | 1.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;859&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → monitorSocket.ts                                                                                                                     | `██████████████████░░`&nbsp;92.5%&nbsp;·&nbsp;1.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;7.5%&nbsp;·&nbsp;126&nbsp;B                                        |
| **dist/client/assets/EmptyPlaceholder-DggjKVGF.js**                                                                                                                | 1.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;836&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue                                                                                                                 | `████████░░░░░░░░░░░░`&nbsp;41.8%&nbsp;·&nbsp;674&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.2%&nbsp;·&nbsp;938&nbsp;B                                       |
| **dist/client/assets/ItemButton-BsT5aSFq.js**                                                                                                                      | 1.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;597&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ItemButton.vue                                                                                                                       | `████████████████░░░░`&nbsp;82.1%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;17.9%&nbsp;·&nbsp;254&nbsp;B                                       |
| **dist/client/assets/Breadcrumbs-DvPMP3NP.js**                                                                                                                     | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;758&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Breadcrumbs.vue                                                                                                                      | `█████████████░░░░░░░`&nbsp;65.8%&nbsp;·&nbsp;894&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.2%&nbsp;·&nbsp;464&nbsp;B                                       |
| **dist/client/assets/StudioLayout-CR22kYPz.js**                                                                                                                    | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;772&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHeader.vue + 1 more                                                                                                            | `█████████████░░░░░░░`&nbsp;66.0%&nbsp;·&nbsp;886&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.0%&nbsp;·&nbsp;457&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePersonalDetailsPanel-DSdz7ZYU.js">…t/assets/ManagePersonalDetailsPanel-DSdz7ZYU.js</abbr>**                                | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;339&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue                                                                                                       | `██████████████████░░`&nbsp;89.0%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.0%&nbsp;·&nbsp;142&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDiagramPanel-Bctpqcts.js">…t/client/assets/ContextDiagramPanel-Bctpqcts.js</abbr>**                                       | 1.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;671&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDiagramPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;55.2%&nbsp;·&nbsp;617&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;44.8%&nbsp;·&nbsp;500&nbsp;B                                       |
| **dist/client/assets/useEngine-CtiS_F9w.js**                                                                                                                       | 1.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;564&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useEngine.ts                                                                                                                         | `█████████████████░░░`&nbsp;87.1%&nbsp;·&nbsp;922&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;12.9%&nbsp;·&nbsp;136&nbsp;B                                       |
| **dist/client/assets/eventTracking-D5ZvPjP8.js**                                                                                                                   | 1.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;588&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → eventTracking.ts                                                                                                                     | `██████████████████░░`&nbsp;88.4%&nbsp;·&nbsp;933&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.6%&nbsp;·&nbsp;122&nbsp;B                                       |
| **dist/client/assets/useApi-CUWMwLLw-DdKTLLjT.js**                                                                                                                 | 1005&nbsp;B&nbsp;·&nbsp;gzip&nbsp;542&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/useApi-CUWMwLLw.js                                                                                                       | `███████████████████░`&nbsp;94.1%&nbsp;·&nbsp;946&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.9%&nbsp;·&nbsp;59&nbsp;B                                         |
| **dist/client/assets/SelectPlaceholder-XO6wXJX9.js**                                                                                                               | 1000&nbsp;B&nbsp;·&nbsp;gzip&nbsp;601&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → MousePointerClickRotatedIcon.vue + 1 more                                                                                            | `█████████████░░░░░░░`&nbsp;66.8%&nbsp;·&nbsp;668&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.2%&nbsp;·&nbsp;332&nbsp;B                                       |
| **dist/client/assets/DataAppsLayout-LZl6Lg5G.js**                                                                                                                  | 906&nbsp;B&nbsp;·&nbsp;gzip&nbsp;550&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataAppsLayout.vue                                                                                                                   | `███████████░░░░░░░░░`&nbsp;53.1%&nbsp;·&nbsp;481&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.9%&nbsp;·&nbsp;425&nbsp;B                                       |
| **dist/client/assets/ConfigIcon-CEpJDcFI.js**                                                                                                                      | 858&nbsp;B&nbsp;·&nbsp;gzip&nbsp;500&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigIcon.vue                                                                                                                       | `█████████████░░░░░░░`&nbsp;67.1%&nbsp;·&nbsp;576&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;32.9%&nbsp;·&nbsp;282&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDimensionDiagramPanel-D2uTWoEH.js">…assets/ContextDimensionDiagramPanel-D2uTWoEH.js</abbr>**                              | 824&nbsp;B&nbsp;·&nbsp;gzip&nbsp;453&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionDiagramPanel.vue                                                                                                     | `███████████░░░░░░░░░`&nbsp;56.7%&nbsp;·&nbsp;467&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.3%&nbsp;·&nbsp;357&nbsp;B                                       |
| **dist/client/assets/AuditContentPanel-BSnjGNwf.js**                                                                                                               | 811&nbsp;B&nbsp;·&nbsp;gzip&nbsp;508&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AuditContentPanel.vue                                                                                                                | `██████░░░░░░░░░░░░░░`&nbsp;31.2%&nbsp;·&nbsp;253&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;68.8%&nbsp;·&nbsp;558&nbsp;B                                       |
| **dist/client/assets/PillButton-BBe23ujl.js**                                                                                                                      | 807&nbsp;B&nbsp;·&nbsp;gzip&nbsp;499&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PillButton.vue                                                                                                                       | `███████████░░░░░░░░░`&nbsp;55.9%&nbsp;·&nbsp;451&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;44.1%&nbsp;·&nbsp;356&nbsp;B                                       |
| **dist/client/assets/SetupHomePanel-B6__EXc3.js**                                                                                                                  | 740&nbsp;B&nbsp;·&nbsp;gzip&nbsp;496&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupHomePanel.vue                                                                                                                   | `██████████░░░░░░░░░░`&nbsp;49.9%&nbsp;·&nbsp;369&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;50.1%&nbsp;·&nbsp;371&nbsp;B                                       |
| **dist/client/assets/Tag-C30qKLq5.js**                                                                                                                             | 708&nbsp;B&nbsp;·&nbsp;gzip&nbsp;405&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue                                                                                                                              | `████████████████░░░░`&nbsp;78.5%&nbsp;·&nbsp;556&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.5%&nbsp;·&nbsp;152&nbsp;B                                       |
| **dist/client/assets/Separator-TRZLu9un.js**                                                                                                                       | 557&nbsp;B&nbsp;·&nbsp;gzip&nbsp;324&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Separator.vue                                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;39.3%&nbsp;·&nbsp;219&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.7%&nbsp;·&nbsp;338&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePreferencesPanel-PxsUcA-C.js">…lient/assets/ManagePreferencesPanel-PxsUcA-C.js</abbr>**                                    | 538&nbsp;B&nbsp;·&nbsp;gzip&nbsp;360&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue                                                                                                           | `████████░░░░░░░░░░░░`&nbsp;41.1%&nbsp;·&nbsp;221&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.9%&nbsp;·&nbsp;317&nbsp;B                                       |
| **<abbr title="dist/client/assets/StudioDocumentSection-AVaGVdVZ.js">…client/assets/StudioDocumentSection-AVaGVdVZ.js</abbr>**                                     | 505&nbsp;B&nbsp;·&nbsp;gzip&nbsp;338&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDocumentSection.vue                                                                                                            | `██████░░░░░░░░░░░░░░`&nbsp;30.7%&nbsp;·&nbsp;155&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;69.3%&nbsp;·&nbsp;350&nbsp;B                                       |
| **dist/client/assets/useSetupSelection-Cvw_iEHU.js**                                                                                                               | 489&nbsp;B&nbsp;·&nbsp;gzip&nbsp;326&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupSelection.ts                                                                                                                 | `███████████████░░░░░`&nbsp;76.7%&nbsp;·&nbsp;375&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.3%&nbsp;·&nbsp;114&nbsp;B                                       |
| **dist/client/assets/accountMonitor-Dbbo-q-1.js**                                                                                                                  | 476&nbsp;B&nbsp;·&nbsp;gzip&nbsp;336&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts                                                                                                                    | `████████████████░░░░`&nbsp;78.6%&nbsp;·&nbsp;374&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.4%&nbsp;·&nbsp;102&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginPresenterPanel-DT-MDkAf.js">…/client/assets/PluginPresenterPanel-DT-MDkAf.js</abbr>**                                      | 458&nbsp;B&nbsp;·&nbsp;gzip&nbsp;258&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPresenterPanel.vue                                                                                                             | `█████████░░░░░░░░░░░`&nbsp;46.7%&nbsp;·&nbsp;214&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.3%&nbsp;·&nbsp;244&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginCookbookPanel--YhRaWTh.js">…t/client/assets/PluginCookbookPanel--YhRaWTh.js</abbr>**                                       | 457&nbsp;B&nbsp;·&nbsp;gzip&nbsp;261&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginCookbookPanel.vue                                                                                                              | `█████████░░░░░░░░░░░`&nbsp;46.8%&nbsp;·&nbsp;214&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.2%&nbsp;·&nbsp;243&nbsp;B                                       |
| **dist/client/assets/PluginToolPanel-CNp45oTH.js**                                                                                                                 | 453&nbsp;B&nbsp;·&nbsp;gzip&nbsp;259&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginToolPanel.vue                                                                                                                  | `█████████░░░░░░░░░░░`&nbsp;47.2%&nbsp;·&nbsp;214&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;52.8%&nbsp;·&nbsp;239&nbsp;B                                       |
| **dist/client/assets/dataViewSummary-Baypl0NC.js**                                                                                                                 | 401&nbsp;B&nbsp;·&nbsp;gzip&nbsp;224&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViewSummary.ts                                                                                                                   | `████████████████████`&nbsp;100.0%&nbsp;·&nbsp;401&nbsp;B                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.0%&nbsp;·&nbsp;0&nbsp;B                                          |
| **dist/client/assets/useSetupRoute-Sst0uFaA.js**                                                                                                                   | 394&nbsp;B&nbsp;·&nbsp;gzip&nbsp;282&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupRoute.ts                                                                                                                     | `████████████░░░░░░░░`&nbsp;60.4%&nbsp;·&nbsp;238&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;39.6%&nbsp;·&nbsp;156&nbsp;B                                       |
| **dist/client/assets/square-pen-DTMt86XL.js**                                                                                                                      | 380&nbsp;B&nbsp;·&nbsp;gzip&nbsp;278&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square-pen.mjs                                                                                                | `█████████████████░░░`&nbsp;86.6%&nbsp;·&nbsp;329&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;13.4%&nbsp;·&nbsp;51&nbsp;B                                        |
| **<abbr title="dist/client/assets/ManageSubscriptionPanel-CUXleVKs.js">…ient/assets/ManageSubscriptionPanel-CUXleVKs.js</abbr>**                                   | 323&nbsp;B&nbsp;·&nbsp;gzip&nbsp;258&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue                                                                                                          | `████████████░░░░░░░░`&nbsp;58.2%&nbsp;·&nbsp;188&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;41.8%&nbsp;·&nbsp;135&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageDataServiceTokensPanel-CZmogwNr.js">…assets/ManageDataServiceTokensPanel-CZmogwNr.js</abbr>**                              | 320&nbsp;B&nbsp;·&nbsp;gzip&nbsp;257&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue                                                                                                     | `████████████░░░░░░░░`&nbsp;57.8%&nbsp;·&nbsp;185&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;42.2%&nbsp;·&nbsp;135&nbsp;B                                       |
| **dist/client/assets/house-D0f3RLJg.js**                                                                                                                           | 318&nbsp;B&nbsp;·&nbsp;gzip&nbsp;241&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/house.mjs                                                                                                     | `█████████████████░░░`&nbsp;84.0%&nbsp;·&nbsp;267&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;16.0%&nbsp;·&nbsp;51&nbsp;B                                        |
| **<abbr title="dist/client/assets/GenerateTokenPanel-DQEqpc4K.js">…st/client/assets/GenerateTokenPanel-DQEqpc4K.js</abbr>**                                        | 309&nbsp;B&nbsp;·&nbsp;gzip&nbsp;249&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue                                                                                                               | `███████████░░░░░░░░░`&nbsp;56.3%&nbsp;·&nbsp;174&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.7%&nbsp;·&nbsp;135&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageSessionsPanel-C--e87kR.js">…t/client/assets/ManageSessionsPanel-C--e87kR.js</abbr>**                                       | 309&nbsp;B&nbsp;·&nbsp;gzip&nbsp;249&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;56.3%&nbsp;·&nbsp;174&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.7%&nbsp;·&nbsp;135&nbsp;B                                       |
| **<abbr title="dist/client/assets/ReviewActivityPanel-DfRApfKT.js">…t/client/assets/ReviewActivityPanel-DfRApfKT.js</abbr>**                                       | 309&nbsp;B&nbsp;·&nbsp;gzip&nbsp;250&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;56.3%&nbsp;·&nbsp;174&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.7%&nbsp;·&nbsp;135&nbsp;B                                       |
| **<abbr title="dist/client/assets/DeleteAccountPanel-BqVmG-NO.js">…st/client/assets/DeleteAccountPanel-BqVmG-NO.js</abbr>**                                        | 308&nbsp;B&nbsp;·&nbsp;gzip&nbsp;248&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue                                                                                                               | `███████████░░░░░░░░░`&nbsp;56.2%&nbsp;·&nbsp;173&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.8%&nbsp;·&nbsp;135&nbsp;B                                       |
| **dist/client/assets/ManageAccessPanel-DMbJGdEP.js**                                                                                                               | 307&nbsp;B&nbsp;·&nbsp;gzip&nbsp;248&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue                                                                                                                | `███████████░░░░░░░░░`&nbsp;56.0%&nbsp;·&nbsp;172&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;44.0%&nbsp;·&nbsp;135&nbsp;B                                       |
| **dist/client/assets/file-De-FNUNo.js**                                                                                                                            | 290&nbsp;B&nbsp;·&nbsp;gzip&nbsp;227&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/file.mjs                                                                                                      | `████████████████░░░░`&nbsp;82.4%&nbsp;·&nbsp;239&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;17.6%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/x-DFX1CPvp.js**                                                                                                                               | 269&nbsp;B&nbsp;·&nbsp;gzip&nbsp;203&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/x.mjs + 1 more                                                                                                | `████████████████░░░░`&nbsp;81.0%&nbsp;·&nbsp;218&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.0%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/configCard-XiLSDSHD.js**                                                                                                                      | 245&nbsp;B&nbsp;·&nbsp;gzip&nbsp;203&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configCard.ts                                                                                                                        | `████████████░░░░░░░░`&nbsp;59.6%&nbsp;·&nbsp;146&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.4%&nbsp;·&nbsp;99&nbsp;B                                        |
| **dist/client/assets/search-Bn3UpiaB.js**                                                                                                                          | 194&nbsp;B&nbsp;·&nbsp;gzip&nbsp;182&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs                                                                                                    | `███████████████░░░░░`&nbsp;73.7%&nbsp;·&nbsp;143&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.3%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/useConfigsReady-DpnNRVzZ.js**                                                                                                                 | 189&nbsp;B&nbsp;·&nbsp;gzip&nbsp;162&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → retrievalReady.ts + 1 more                                                                                                           | `███████████░░░░░░░░░`&nbsp;54.5%&nbsp;·&nbsp;103&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;45.5%&nbsp;·&nbsp;86&nbsp;B                                        |
| **dist/client/assets/arrow-left-DGhxy3eI.js**                                                                                                                      | 185&nbsp;B&nbsp;·&nbsp;gzip&nbsp;176&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs                                                                                                | `██████████████░░░░░░`&nbsp;72.4%&nbsp;·&nbsp;134&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;27.6%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/arrow-right-B3y40Wx9.js**                                                                                                                     | 185&nbsp;B&nbsp;·&nbsp;gzip&nbsp;176&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-right.mjs                                                                                               | `██████████████░░░░░░`&nbsp;72.4%&nbsp;·&nbsp;134&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;27.6%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/plus-BkZLGfGU.js**                                                                                                                            | 173&nbsp;B&nbsp;·&nbsp;gzip&nbsp;165&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs                                                                                                      | `██████████████░░░░░░`&nbsp;70.5%&nbsp;·&nbsp;122&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;29.5%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/chevron-left-DmKW35Ty.js**                                                                                                                    | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;159&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs                                                                                              | `█████████████░░░░░░░`&nbsp;66.0%&nbsp;·&nbsp;99&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.0%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/chevron-right-xBzxJgR2.js**                                                                                                                   | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;157&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs                                                                                             | `█████████████░░░░░░░`&nbsp;66.0%&nbsp;·&nbsp;99&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.0%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/check-BHUGqKug.js**                                                                                                                           | 144&nbsp;B&nbsp;·&nbsp;gzip&nbsp;156&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/check.mjs                                                                                                     | `█████████████░░░░░░░`&nbsp;64.6%&nbsp;·&nbsp;93&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;35.4%&nbsp;·&nbsp;51&nbsp;B                                        |
| **<abbr title="dist/client/assets/_plugin-vue_export-helper-BDNMzG2s.js">…nt/assets/\_plugin-vue_export-helper-BDNMzG2s.js</abbr>**                                | 84&nbsp;B&nbsp;·&nbsp;gzip&nbsp;99&nbsp;B                                                      |

Bars show each row's share of its output file.

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
