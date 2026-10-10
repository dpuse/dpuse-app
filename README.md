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
| [@tanstack/store](https://github.com/TanStack/store)                   | 0.11.2  | MIT                     | [LICENSE](licenses/downloads/@tanstack/store@0.11.2-LICENSE.txt)              |
| [@tanstack/table-core](https://github.com/TanStack/table)              |  9.2.8  | MIT                     | [LICENSE](licenses/downloads/@tanstack/table-core@9.2.8-LICENSE.txt)          |
| [@tanstack/virtual-core](https://github.com/TanStack/virtual)          | 3.17.11 | MIT                     | [LICENSE](licenses/downloads/@tanstack/virtual-core@3.17.11-LICENSE.txt)      |
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
| **dist/client/assets/ChatPanel-CH8-\_8fS.js**                                                                                                                      | 197.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;53.6&nbsp;kB&nbsp;·&nbsp;22.5%&nbsp;of&nbsp;the&nbsp;build |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client → dist/esm/chat-client.js + 12 more                                                                                    | `█████████░░░░░░░░░░░`&nbsp;43.2%&nbsp;·&nbsp;85.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai → <abbr title="dist/esm/activities/chat/stream/processor.js">…ivities/chat/stream/processor.js</abbr> + 26 more               | `████████░░░░░░░░░░░░`&nbsp;38.3%&nbsp;·&nbsp;75.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → tanstackClientTools.ts + 16 more                                                                                                     | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.0%&nbsp;·&nbsp;19.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;fast-json-patch → module/core.mjs + 3 more                                                                                                 | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.1%&nbsp;·&nbsp;10.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json → dist/index.js + 1 more                                                                                                      | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.8%&nbsp;·&nbsp;3.6&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@ag-ui/core → dist/version-CTNE2I0_.mjs                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square.mjs + 2 more                                                                                           | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.4%&nbsp;·&nbsp;830&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.7%&nbsp;·&nbsp;1.4&nbsp;kB                                       |
| **<abbr title="dist/client/assets/StudioDescriptorsPanel-C04BQH-v.js">…lient/assets/StudioDescriptorsPanel-C04BQH-v.js</abbr>**                                    | 64.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;20.1&nbsp;kB&nbsp;·&nbsp;7.3%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs                                                                                                               | `██████████████████░░`&nbsp;91.0%&nbsp;·&nbsp;58.6&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextEditor.vue + 1 more                                                                                                              | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.1%&nbsp;·&nbsp;3.9&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/underline.mjs + 3 more                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.2%&nbsp;·&nbsp;802&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.6%&nbsp;·&nbsp;1.1&nbsp;kB                                       |
| **<abbr title="dist/client/assets/runtime-core.esm-bundler-7wIop7-V.js">…ent/assets/runtime-core.esm-bundler-7wIop7-V.js</abbr>**                                  | 63.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;24.5&nbsp;kB&nbsp;·&nbsp;7.2%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → <abbr title="dist/runtime-core.esm-bundler.js">…runtime-core.esm-bundler.js</abbr>                                     | `██████████████░░░░░░`&nbsp;67.6%&nbsp;·&nbsp;42.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js                                                                                           | `█████░░░░░░░░░░░░░░░`&nbsp;26.5%&nbsp;·&nbsp;16.8&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js                                                                                                   | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.0%&nbsp;·&nbsp;3.8&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.0%&nbsp;·&nbsp;0&nbsp;B                                          |
| **dist/client/assets/ExploreDataPanel-CqgkeYYu.js**                                                                                                                | 58.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;15.9&nbsp;kB&nbsp;·&nbsp;6.6%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop → index.mjs + 1 more                                                                                                | `██████████░░░░░░░░░░`&nbsp;50.3%&nbsp;·&nbsp;29.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TransformDataPanel.vue + 4 more                                                                                                      | `█████████░░░░░░░░░░░`&nbsp;44.8%&nbsp;·&nbsp;26.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/type.mjs + 8 more                                                                                             | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.6%&nbsp;·&nbsp;2.1&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.3%&nbsp;·&nbsp;754&nbsp;B                                        |
| **dist/client/assets/index-CKB0f4vV.js**                                                                                                                           | 52.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;18.6&nbsp;kB&nbsp;·&nbsp;6.0%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → index.ts + 14 more                                                                                                                   | `██████████░░░░░░░░░░`&nbsp;47.6%&nbsp;·&nbsp;25.1&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → <abbr title="dist/runtime-dom.esm-bundler.js">…t/runtime-dom.esm-bundler.js</abbr>                                      | `██████░░░░░░░░░░░░░░`&nbsp;29.7%&nbsp;·&nbsp;15.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;22.8%&nbsp;·&nbsp;12.0&nbsp;kB                                     |
| **dist/client/assets/Table-ucKlJwcC.js**                                                                                                                           | 51.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;13.6&nbsp;kB&nbsp;·&nbsp;5.9%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core → <abbr title="dist/features/column-pinning/columnPinningFeature.utils.js">…nPinningFeature.utils.js</abbr> + 32 more | `███████████████░░░░░`&nbsp;74.1%&nbsp;·&nbsp;38.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Table.vue + 4 more                                                                                                                   | `████░░░░░░░░░░░░░░░░`&nbsp;18.5%&nbsp;·&nbsp;9.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table → dist/useTable.js + 2 more                                                                                            | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.7%&nbsp;·&nbsp;2.4&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js                                                                                                          | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.3%&nbsp;·&nbsp;676&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/settings-2.mjs                                                                                                | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.4%&nbsp;·&nbsp;211&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;592&nbsp;B                                        |
| **dist/client/assets/ContextModelList-4ynylBzA.js**                                                                                                                | 45.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;11.1&nbsp;kB&nbsp;·&nbsp;5.1%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;src → _context.ts + 7 more                                                                                                                 | `███████████████████░`&nbsp;94.2%&nbsp;·&nbsp;42.5&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/network.mjs                                                                                                   | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.4%&nbsp;·&nbsp;642&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;4.4%&nbsp;·&nbsp;2.0&nbsp;kB                                       |
| **dist/client/assets/useMarkedTool-DS6QR76a.js**                                                                                                                   | 28.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;11.1&nbsp;kB&nbsp;·&nbsp;3.2%&nbsp;of&nbsp;the&nbsp;build   |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs                                                                                                             | `███████████████████░`&nbsp;97.2%&nbsp;·&nbsp;27.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useMarkedTool.ts                                                                                                                     | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.7%&nbsp;·&nbsp;491&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.1%&nbsp;·&nbsp;324&nbsp;B                                        |
| **dist/client/assets/sdk.modern-BA6sl1Hr.js**                                                                                                                      | 27.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;8.1&nbsp;kB&nbsp;·&nbsp;3.1%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → <abbr title="dist/sdk.modern.js">…t/sdk.modern.js</abbr>                                                   | `████████████████████`&nbsp;100.0%&nbsp;·&nbsp;27.5&nbsp;kB                                    |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.0%&nbsp;·&nbsp;1&nbsp;B                                          |
| **dist/client/assets/useDataWindow-BiMBDNHi.js**                                                                                                                   | 25.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;7.7&nbsp;kB&nbsp;·&nbsp;2.9%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core → dist/esm/index.js + 2 more                                                                                        | `██████████████████░░`&nbsp;90.4%&nbsp;·&nbsp;22.7&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts                                                                                                                     | `██░░░░░░░░░░░░░░░░░░`&nbsp;7.5%&nbsp;·&nbsp;1.9&nbsp;kB                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js                                                                                                  | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.5%&nbsp;·&nbsp;378&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.6%&nbsp;·&nbsp;151&nbsp;B                                        |
| **dist/client/assets/ActionWrapper-DalU34-u.js**                                                                                                                   | 22.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;9.0&nbsp;kB&nbsp;·&nbsp;2.6%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/vue-router.js + 1 more                                                                                                   | `███████████████████░`&nbsp;96.9%&nbsp;·&nbsp;22.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ActionWrapper.vue                                                                                                                    | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.6%&nbsp;·&nbsp;368&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.5%&nbsp;·&nbsp;352&nbsp;B                                        |
| **dist/client/assets/dist-DcNG900v.js**                                                                                                                            | 17.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;7.0&nbsp;kB&nbsp;·&nbsp;2.0%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/core → dist/index.js                                                                                                               | `███████████████░░░░░`&nbsp;73.8%&nbsp;·&nbsp;13.2&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@vueuse/shared → dist/index.js                                                                                                             | `█████░░░░░░░░░░░░░░░`&nbsp;25.1%&nbsp;·&nbsp;4.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;1.0%&nbsp;·&nbsp;191&nbsp;B                                        |
| **dist/client/assets/DataViewList-CW1hehpO.js**                                                                                                                    | 17.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.8&nbsp;kB&nbsp;·&nbsp;2.0%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewPanel.vue + 5 more                                                                                                           | `████████████████░░░░`&nbsp;80.3%&nbsp;·&nbsp;14.0&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.7%&nbsp;·&nbsp;3.4&nbsp;kB                                      |
| **dist/client/assets/locale-ZIVr_5Xo.js**                                                                                                                          | 13.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.3&nbsp;kB&nbsp;·&nbsp;1.5%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared.es.js                                                                                              | `█████████████████░░░`&nbsp;84.8%&nbsp;·&nbsp;11.3&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → locale.ts                                                                                                                            | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.7%&nbsp;·&nbsp;511&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.5%&nbsp;·&nbsp;1.5&nbsp;kB                                      |
| **dist/client/assets/SessionAuthPanel-CKFDZ4PC.js**                                                                                                                | 12.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;5.0&nbsp;kB&nbsp;·&nbsp;1.4%&nbsp;of&nbsp;the&nbsp;build    |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAuthPanel.vue + 5 more                                                                                                        | `██████████████████░░`&nbsp;91.2%&nbsp;·&nbsp;11.4&nbsp;kB                                     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs                                                                                            | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.1%&nbsp;·&nbsp;398&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.7%&nbsp;·&nbsp;731&nbsp;B                                        |
| **dist/client/assets/AssistantLayout-CgyHkWMM.js**                                                                                                                 | 9.8&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.9&nbsp;kB&nbsp;·&nbsp;1.1%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AssistantLayout.vue + 5 more                                                                                                         | `███████████████░░░░░`&nbsp;77.2%&nbsp;·&nbsp;7.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/library.mjs + 1 more                                                                                          | `█░░░░░░░░░░░░░░░░░░░`&nbsp;3.8%&nbsp;·&nbsp;379&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.0%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| **dist/client/assets/ErrorNotice-ley-bG3W.js**                                                                                                                     | 8.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.5&nbsp;kB&nbsp;·&nbsp;1.0%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ErrorBody.vue + 3 more                                                                                                               | `█████████████████░░░`&nbsp;83.5%&nbsp;·&nbsp;7.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/triangle-alert.mjs + 2 more                                                                                   | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.8%&nbsp;·&nbsp;976&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.7%&nbsp;·&nbsp;520&nbsp;B                                        |
| **<abbr title="dist/client/assets/performanceTracking-Ii3PaM3J.js">…t/client/assets/performanceTracking-Ii3PaM3J.js</abbr>**                                       | 8.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.2&nbsp;kB&nbsp;·&nbsp;1.0%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.js                                                                                                            | `███████████████████░`&nbsp;97.2%&nbsp;·&nbsp;8.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts                                                                                                               | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.2%&nbsp;·&nbsp;195&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.5%&nbsp;·&nbsp;48&nbsp;B                                         |
| **dist/client/assets/LibraryPanel-BXLNujWw.js**                                                                                                                    | 8.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.3&nbsp;kB&nbsp;·&nbsp;1.0%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → LibraryPanel.vue + 2 more                                                                                                            | `█████████████████░░░`&nbsp;84.0%&nbsp;·&nbsp;7.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;16.0%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| **dist/client/assets/SelectItemPanel-wElJpoDu.js**                                                                                                                 | 7.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;3.3&nbsp;kB&nbsp;·&nbsp;0.9%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectItemPanel.vue + 1 more                                                                                                         | `████████████████░░░░`&nbsp;79.5%&nbsp;·&nbsp;6.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/folder.mjs                                                                                                    | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.6%&nbsp;·&nbsp;431&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;14.9%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| **dist/client/assets/DataViewsLayout-BT_5mNhi.js**                                                                                                                 | 7.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.9&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataViewsLayout.vue + 1 more                                                                                                         | `██████████████░░░░░░`&nbsp;67.6%&nbsp;·&nbsp;4.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;32.4%&nbsp;·&nbsp;2.3&nbsp;kB                                      |
| **dist/client/assets/SessionMenu-UOHLpW9s.js**                                                                                                                     | 7.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.7&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue                                                                                                                      | `████████████░░░░░░░░`&nbsp;62.5%&nbsp;·&nbsp;4.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/sun.mjs + 4 more                                                                                              | `█████░░░░░░░░░░░░░░░`&nbsp;27.2%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.3%&nbsp;·&nbsp;741&nbsp;B                                       |
| **dist/client/assets/SetupLayout-C3mt8tOK.js**                                                                                                                     | 6.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.8%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupOptions.ts + 2 more                                                                                                          | `██████████████████░░`&nbsp;89.7%&nbsp;·&nbsp;6.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.3%&nbsp;·&nbsp;727&nbsp;B                                       |
| **dist/client/assets/ConnectionPanel-BV7FQk5R.js**                                                                                                                 | 6.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.4&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConnectionPanel.vue + 2 more                                                                                                         | `████████████████░░░░`&nbsp;79.0%&nbsp;·&nbsp;4.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.0%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| **dist/client/assets/ConfigCard-CGzp0jwV.js**                                                                                                                      | 6.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.1&nbsp;kB&nbsp;·&nbsp;0.7%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigCard.vue                                                                                                                       | `██████████████░░░░░░`&nbsp;71.9%&nbsp;·&nbsp;4.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/trash.mjs + 2 more                                                                                            | `████░░░░░░░░░░░░░░░░`&nbsp;21.4%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;6.7%&nbsp;·&nbsp;412&nbsp;B                                        |
| **dist/client/assets/GridDetailPanel-Bx8zCCWC.js**                                                                                                                 | 5.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.3&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Grid.vue + 3 more                                                                                                                    | `██████████████████░░`&nbsp;90.4%&nbsp;·&nbsp;4.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;9.6%&nbsp;·&nbsp;534&nbsp;B                                        |
| **<abbr title="dist/client/assets/SessionAccountPanel-CxKuG44N.js">…t/client/assets/SessionAccountPanel-CxKuG44N.js</abbr>**                                       | 5.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.0&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAccountPanel.vue                                                                                                              | `████████████░░░░░░░░`&nbsp;58.7%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs                                                                                            | `████░░░░░░░░░░░░░░░░`&nbsp;17.9%&nbsp;·&nbsp;939&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.5%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/ScrollArea-DL0gwbUb.js**                                                                                                                      | 5.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.0&nbsp;kB&nbsp;·&nbsp;0.6%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollThumb.vue + 1 more                                                                                                             | `██████████████████░░`&nbsp;89.8%&nbsp;·&nbsp;4.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.2%&nbsp;·&nbsp;524&nbsp;B                                       |
| **dist/client/assets/errors-Cv6f1nuO.js**                                                                                                                          | 4.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;2.2&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → errorTracking.ts + 1 more                                                                                                            | `█████████████░░░░░░░`&nbsp;62.8%&nbsp;·&nbsp;3.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;37.2%&nbsp;·&nbsp;1.8&nbsp;kB                                      |
| **dist/client/assets/PaneSplitter-DExea0Zg.js**                                                                                                                    | 4.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.9&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue                                                                                                                     | `████████████████░░░░`&nbsp;78.3%&nbsp;·&nbsp;3.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.7%&nbsp;·&nbsp;979&nbsp;B                                       |
| **dist/client/assets/PluginList-C-40B_Fs.js**                                                                                                                      | 4.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginList.vue                                                                                                                       | `█████████░░░░░░░░░░░`&nbsp;45.5%&nbsp;·&nbsp;2.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;54.5%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| **dist/client/assets/useStudioOptions-Dhp0c1Sz.js**                                                                                                                | 4.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.3&nbsp;kB&nbsp;·&nbsp;0.5%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts                                                                                                                  | `████████████████████`&nbsp;97.6%&nbsp;·&nbsp;4.2&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;2.4%&nbsp;·&nbsp;107&nbsp;B                                        |
| **<abbr title="dist/client/assets/SelectConnectionList-D72R41aW.js">…/client/assets/SelectConnectionList-D72R41aW.js</abbr>**                                      | 3.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.8&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SelectConnectionList.vue + 1 more                                                                                                    | `██████████████░░░░░░`&nbsp;68.6%&nbsp;·&nbsp;2.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;31.4%&nbsp;·&nbsp;1.2&nbsp;kB                                      |
| **dist/client/assets/ScrollRow-BCGvu5J2.js**                                                                                                                       | 3.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.7&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ScrollRow.vue                                                                                                                        | `█████████████████░░░`&nbsp;84.5%&nbsp;·&nbsp;3.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.5%&nbsp;·&nbsp;581&nbsp;B                                       |
| **dist/client/assets/StudioHomePanel-Cp2Q0QJp.js**                                                                                                                 | 3.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHomePanel.vue                                                                                                                  | `███████░░░░░░░░░░░░░`&nbsp;32.8%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████████░░░░░░░`&nbsp;67.2%&nbsp;·&nbsp;2.3&nbsp;kB                                      |
| **dist/client/assets/PluginPanel-DyBt5UbK.js**                                                                                                                     | 3.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.5&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPanel.vue                                                                                                                      | `███████████░░░░░░░░░`&nbsp;53.7%&nbsp;·&nbsp;1.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round.mjs + 2 more                                                                                       | `██████░░░░░░░░░░░░░░`&nbsp;30.5%&nbsp;·&nbsp;1.0&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;15.8%&nbsp;·&nbsp;557&nbsp;B                                       |
| **dist/client/assets/OptionBar-BDQIU4to.js**                                                                                                                       | 3.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → OptionPanel.vue + 3 more                                                                                                             | `████████████████░░░░`&nbsp;81.8%&nbsp;·&nbsp;2.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;18.2%&nbsp;·&nbsp;633&nbsp;B                                       |
| **<abbr title="dist/client/assets/PresentationsLayout-Co3FZe3h.js">…t/client/assets/PresentationsLayout-Co3FZe3h.js</abbr>**                                       | 3.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.6&nbsp;kB&nbsp;·&nbsp;0.4%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PresentationsLayout.vue                                                                                                              | `███████████████░░░░░`&nbsp;74.9%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;25.1%&nbsp;·&nbsp;832&nbsp;B                                       |
| **dist/client/assets/dataViews-FPPgIFiT.js**                                                                                                                       | 3.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViews.ts                                                                                                                         | `██████████████████░░`&nbsp;89.8%&nbsp;·&nbsp;2.8&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.2%&nbsp;·&nbsp;320&nbsp;B                                       |
| **dist/client/assets/createLucideIcon-C6VmQNNT.js**                                                                                                                | 2.5&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → <abbr title="dist/esm/shared/src/build/buildLucideIconNode.mjs">…src/build/buildLucideIconNode.mjs</abbr> + 8 more           | `███████████████████░`&nbsp;97.4%&nbsp;·&nbsp;2.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;2.6%&nbsp;·&nbsp;66&nbsp;B                                         |
| **<abbr title="dist/client/assets/EventQueriesLayout-BTh-s3X1.js">…st/client/assets/EventQueriesLayout-BTh-s3X1.js</abbr>**                                        | 2.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueriesLayout.vue                                                                                                               | `██████████████░░░░░░`&nbsp;71.6%&nbsp;·&nbsp;1.6&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;28.4%&nbsp;·&nbsp;665&nbsp;B                                       |
| **dist/client/assets/utilities-kwQ3BXb5.js**                                                                                                                       | 2.2&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.2&nbsp;kB&nbsp;·&nbsp;0.3%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → index.ts + 2 more                                                                                                                    | `████████████████░░░░`&nbsp;77.5%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/loader-circle.mjs                                                                                             | `██░░░░░░░░░░░░░░░░░░`&nbsp;8.2%&nbsp;·&nbsp;188&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;14.2%&nbsp;·&nbsp;325&nbsp;B                                       |
| **<abbr title="dist/client/assets/StudioDocumentPanel-CvKKvA6L.js">…t/client/assets/StudioDocumentPanel-CvKKvA6L.js</abbr>**                                       | 2.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDocumentPanel.vue + 1 more                                                                                                     | `████████████████░░░░`&nbsp;78.1%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.9%&nbsp;·&nbsp;475&nbsp;B                                       |
| **dist/client/assets/GitHubLogo-CMEUSnZ\_.js**                                                                                                                     | 2.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GitHubLogo.vue                                                                                                                       | `██████████████████░░`&nbsp;89.9%&nbsp;·&nbsp;1.9&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;10.1%&nbsp;·&nbsp;212&nbsp;B                                       |
| **dist/client/assets/TextInput-C3FSExkD.js**                                                                                                                       | 2.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;1.1&nbsp;kB&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build     |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextInput.vue                                                                                                                        | `███████████████░░░░░`&nbsp;72.6%&nbsp;·&nbsp;1.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;27.4%&nbsp;·&nbsp;570&nbsp;B                                       |
| **dist/client/assets/configMonitor-Cpl1CuTM.js**                                                                                                                   | 1.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;890&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts                                                                                                                     | `██████████████████░░`&nbsp;88.9%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.1%&nbsp;·&nbsp;219&nbsp;B                                       |
| **dist/client/assets/RectangleButton-BFZTBTio.js**                                                                                                                 | 1.9&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;816&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → action.ts + 1 more                                                                                                                   | `██████████████████░░`&nbsp;92.2%&nbsp;·&nbsp;1.7&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;7.8%&nbsp;·&nbsp;151&nbsp;B                                        |
| **<abbr title="dist/client/assets/PluginConnectorPanel-CCTRPaUS.js">…/client/assets/PluginConnectorPanel-CCTRPaUS.js</abbr>**                                      | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;888&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginConnectorPanel.vue                                                                                                             | `██████████████░░░░░░`&nbsp;71.6%&nbsp;·&nbsp;1.3&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;28.4%&nbsp;·&nbsp;507&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextEntityDiagramPanel-lo3JX6sU.js">…nt/assets/ContextEntityDiagramPanel-lo3JX6sU.js</abbr>**                                 | 1.7&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;628&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextEntityDiagramPanel.vue                                                                                                        | `████████████████░░░░`&nbsp;81.9%&nbsp;·&nbsp;1.4&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;18.1%&nbsp;·&nbsp;313&nbsp;B                                       |
| **dist/client/assets/monitorSocket-yroFvEPh.js**                                                                                                                   | 1.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;860&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → monitorSocket.ts                                                                                                                     | `██████████████████░░`&nbsp;92.5%&nbsp;·&nbsp;1.5&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;7.5%&nbsp;·&nbsp;126&nbsp;B                                        |
| **dist/client/assets/EmptyPlaceholder-CBAeyrqt.js**                                                                                                                | 1.6&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;836&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue                                                                                                                 | `████████░░░░░░░░░░░░`&nbsp;41.8%&nbsp;·&nbsp;674&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.2%&nbsp;·&nbsp;938&nbsp;B                                       |
| **dist/client/assets/ItemButton-hMc50KZy.js**                                                                                                                      | 1.4&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;597&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ItemButton.vue                                                                                                                       | `████████████████░░░░`&nbsp;82.1%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;17.9%&nbsp;·&nbsp;254&nbsp;B                                       |
| **dist/client/assets/Breadcrumbs-COgkvuJU.js**                                                                                                                     | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;760&nbsp;B&nbsp;·&nbsp;0.2%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Breadcrumbs.vue                                                                                                                      | `█████████████░░░░░░░`&nbsp;65.6%&nbsp;·&nbsp;894&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.4%&nbsp;·&nbsp;469&nbsp;B                                       |
| **dist/client/assets/StudioLayout-BSPwYmpz.js**                                                                                                                    | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;773&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHeader.vue + 1 more                                                                                                            | `█████████████░░░░░░░`&nbsp;66.2%&nbsp;·&nbsp;886&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.8%&nbsp;·&nbsp;452&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePersonalDetailsPanel-CEeg4BQD.js">…t/assets/ManagePersonalDetailsPanel-CEeg4BQD.js</abbr>**                                | 1.3&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;340&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue                                                                                                       | `██████████████████░░`&nbsp;89.0%&nbsp;·&nbsp;1.1&nbsp;kB                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.0%&nbsp;·&nbsp;142&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDiagramPanel-RMoSWfqO.js">…t/client/assets/ContextDiagramPanel-RMoSWfqO.js</abbr>**                                       | 1.1&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;668&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDiagramPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;55.3%&nbsp;·&nbsp;617&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;44.7%&nbsp;·&nbsp;499&nbsp;B                                       |
| **dist/client/assets/useEngine-DlTB3LbJ.js**                                                                                                                       | 1.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;564&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useEngine.ts                                                                                                                         | `█████████████████░░░`&nbsp;87.1%&nbsp;·&nbsp;922&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;12.9%&nbsp;·&nbsp;136&nbsp;B                                       |
| **dist/client/assets/eventTracking-De2aCCn\_.js**                                                                                                                  | 1.0&nbsp;kB&nbsp;·&nbsp;gzip&nbsp;588&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → eventTracking.ts                                                                                                                     | `██████████████████░░`&nbsp;88.4%&nbsp;·&nbsp;933&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██░░░░░░░░░░░░░░░░░░`&nbsp;11.6%&nbsp;·&nbsp;122&nbsp;B                                       |
| **dist/client/assets/useApi-CUWMwLLw-0E_Qr2Ad.js**                                                                                                                 | 1005&nbsp;B&nbsp;·&nbsp;gzip&nbsp;542&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router → dist/useApi-CUWMwLLw.js                                                                                                       | `███████████████████░`&nbsp;94.1%&nbsp;·&nbsp;946&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█░░░░░░░░░░░░░░░░░░░`&nbsp;5.9%&nbsp;·&nbsp;59&nbsp;B                                         |
| **dist/client/assets/SelectPlaceholder-BkSyfhr3.js**                                                                                                               | 1000&nbsp;B&nbsp;·&nbsp;gzip&nbsp;602&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build      |
| &nbsp;&nbsp;&nbsp;&nbsp;src → MousePointerClickRotatedIcon.vue + 1 more                                                                                            | `█████████████░░░░░░░`&nbsp;66.8%&nbsp;·&nbsp;668&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;33.2%&nbsp;·&nbsp;332&nbsp;B                                       |
| **dist/client/assets/DataAppsLayout-D__nf096.js**                                                                                                                  | 906&nbsp;B&nbsp;·&nbsp;gzip&nbsp;551&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataAppsLayout.vue                                                                                                                   | `███████████░░░░░░░░░`&nbsp;53.1%&nbsp;·&nbsp;481&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;46.9%&nbsp;·&nbsp;425&nbsp;B                                       |
| **dist/client/assets/ConfigIcon-DstpnIuk.js**                                                                                                                      | 858&nbsp;B&nbsp;·&nbsp;gzip&nbsp;501&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigIcon.vue                                                                                                                       | `█████████████░░░░░░░`&nbsp;67.1%&nbsp;·&nbsp;576&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;32.9%&nbsp;·&nbsp;282&nbsp;B                                       |
| **<abbr title="dist/client/assets/ContextDimensionDiagramPanel-CHitpqDu.js">…assets/ContextDimensionDiagramPanel-CHitpqDu.js</abbr>**                              | 824&nbsp;B&nbsp;·&nbsp;gzip&nbsp;457&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionDiagramPanel.vue                                                                                                     | `███████████░░░░░░░░░`&nbsp;56.7%&nbsp;·&nbsp;467&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.3%&nbsp;·&nbsp;357&nbsp;B                                       |
| **dist/client/assets/AuditContentPanel-C4KoNqNZ.js**                                                                                                               | 811&nbsp;B&nbsp;·&nbsp;gzip&nbsp;509&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AuditContentPanel.vue                                                                                                                | `██████░░░░░░░░░░░░░░`&nbsp;31.2%&nbsp;·&nbsp;253&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;68.8%&nbsp;·&nbsp;558&nbsp;B                                       |
| **dist/client/assets/PillButton-LpEIt73g.js**                                                                                                                      | 807&nbsp;B&nbsp;·&nbsp;gzip&nbsp;499&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PillButton.vue                                                                                                                       | `███████████░░░░░░░░░`&nbsp;55.9%&nbsp;·&nbsp;451&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;44.1%&nbsp;·&nbsp;356&nbsp;B                                       |
| **dist/client/assets/SetupHomePanel-BZJKiP-N.js**                                                                                                                  | 740&nbsp;B&nbsp;·&nbsp;gzip&nbsp;495&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupHomePanel.vue                                                                                                                   | `██████████░░░░░░░░░░`&nbsp;49.9%&nbsp;·&nbsp;369&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████░░░░░░░░░░`&nbsp;50.1%&nbsp;·&nbsp;371&nbsp;B                                       |
| **dist/client/assets/Tag-CBZIKsWe.js**                                                                                                                             | 708&nbsp;B&nbsp;·&nbsp;gzip&nbsp;405&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue                                                                                                                              | `████████████████░░░░`&nbsp;78.5%&nbsp;·&nbsp;556&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.5%&nbsp;·&nbsp;152&nbsp;B                                       |
| **dist/client/assets/Separator-C4TrSmOG.js**                                                                                                                       | 557&nbsp;B&nbsp;·&nbsp;gzip&nbsp;326&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Separator.vue                                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;39.3%&nbsp;·&nbsp;219&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;60.7%&nbsp;·&nbsp;338&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManagePreferencesPanel-DQcemOPh.js">…lient/assets/ManagePreferencesPanel-DQcemOPh.js</abbr>**                                    | 538&nbsp;B&nbsp;·&nbsp;gzip&nbsp;360&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue                                                                                                           | `████████░░░░░░░░░░░░`&nbsp;41.1%&nbsp;·&nbsp;221&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████████░░░░░░░░`&nbsp;58.9%&nbsp;·&nbsp;317&nbsp;B                                       |
| **<abbr title="dist/client/assets/StudioDocumentSection-B5AHLTUQ.js">…client/assets/StudioDocumentSection-B5AHLTUQ.js</abbr>**                                     | 505&nbsp;B&nbsp;·&nbsp;gzip&nbsp;338&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioDocumentSection.vue                                                                                                            | `██████░░░░░░░░░░░░░░`&nbsp;30.7%&nbsp;·&nbsp;155&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████████████░░░░░░`&nbsp;69.3%&nbsp;·&nbsp;350&nbsp;B                                       |
| **dist/client/assets/useSetupSelection-vLf7xXsX.js**                                                                                                               | 489&nbsp;B&nbsp;·&nbsp;gzip&nbsp;330&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupSelection.ts                                                                                                                 | `███████████████░░░░░`&nbsp;76.7%&nbsp;·&nbsp;375&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;23.3%&nbsp;·&nbsp;114&nbsp;B                                       |
| **dist/client/assets/accountMonitor-CUy9U51C.js**                                                                                                                  | 476&nbsp;B&nbsp;·&nbsp;gzip&nbsp;338&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts                                                                                                                    | `████████████████░░░░`&nbsp;78.6%&nbsp;·&nbsp;374&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;21.4%&nbsp;·&nbsp;102&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginPresenterPanel-fkn6cRqZ.js">…/client/assets/PluginPresenterPanel-fkn6cRqZ.js</abbr>**                                      | 458&nbsp;B&nbsp;·&nbsp;gzip&nbsp;263&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPresenterPanel.vue                                                                                                             | `█████████░░░░░░░░░░░`&nbsp;46.7%&nbsp;·&nbsp;214&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.3%&nbsp;·&nbsp;244&nbsp;B                                       |
| **<abbr title="dist/client/assets/PluginCookbookPanel-yGO8oU8C.js">…t/client/assets/PluginCookbookPanel-yGO8oU8C.js</abbr>**                                       | 457&nbsp;B&nbsp;·&nbsp;gzip&nbsp;265&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginCookbookPanel.vue                                                                                                              | `█████████░░░░░░░░░░░`&nbsp;46.8%&nbsp;·&nbsp;214&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;53.2%&nbsp;·&nbsp;243&nbsp;B                                       |
| **dist/client/assets/PluginToolPanel-BJLIpVEO.js**                                                                                                                 | 453&nbsp;B&nbsp;·&nbsp;gzip&nbsp;262&nbsp;B&nbsp;·&nbsp;0.1%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginToolPanel.vue                                                                                                                  | `█████████░░░░░░░░░░░`&nbsp;47.2%&nbsp;·&nbsp;214&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████████░░░░░░░░░`&nbsp;52.8%&nbsp;·&nbsp;239&nbsp;B                                       |
| **dist/client/assets/dataViewSummary-Baypl0NC.js**                                                                                                                 | 401&nbsp;B&nbsp;·&nbsp;gzip&nbsp;224&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViewSummary.ts                                                                                                                   | `████████████████████`&nbsp;100.0%&nbsp;·&nbsp;401&nbsp;B                                      |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `░░░░░░░░░░░░░░░░░░░░`&nbsp;0.0%&nbsp;·&nbsp;0&nbsp;B                                          |
| **dist/client/assets/useSetupRoute-BKm6p8fF.js**                                                                                                                   | 394&nbsp;B&nbsp;·&nbsp;gzip&nbsp;284&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupRoute.ts                                                                                                                     | `████████████░░░░░░░░`&nbsp;60.4%&nbsp;·&nbsp;238&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;39.6%&nbsp;·&nbsp;156&nbsp;B                                       |
| **dist/client/assets/square-pen-BGffOB0U.js**                                                                                                                      | 380&nbsp;B&nbsp;·&nbsp;gzip&nbsp;280&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/square-pen.mjs                                                                                                | `█████████████████░░░`&nbsp;86.6%&nbsp;·&nbsp;329&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;13.4%&nbsp;·&nbsp;51&nbsp;B                                        |
| **<abbr title="dist/client/assets/ManageSubscriptionPanel-QmqGh3f9.js">…ient/assets/ManageSubscriptionPanel-QmqGh3f9.js</abbr>**                                   | 323&nbsp;B&nbsp;·&nbsp;gzip&nbsp;261&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue                                                                                                          | `████████████░░░░░░░░`&nbsp;58.2%&nbsp;·&nbsp;188&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;41.8%&nbsp;·&nbsp;135&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageDataServiceTokensPanel-3sSuK6FD.js">…assets/ManageDataServiceTokensPanel-3sSuK6FD.js</abbr>**                              | 320&nbsp;B&nbsp;·&nbsp;gzip&nbsp;259&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue                                                                                                     | `████████████░░░░░░░░`&nbsp;57.8%&nbsp;·&nbsp;185&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;42.2%&nbsp;·&nbsp;135&nbsp;B                                       |
| **dist/client/assets/house-Pn9BdvsM.js**                                                                                                                           | 318&nbsp;B&nbsp;·&nbsp;gzip&nbsp;243&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/house.mjs                                                                                                     | `█████████████████░░░`&nbsp;84.0%&nbsp;·&nbsp;267&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███░░░░░░░░░░░░░░░░░`&nbsp;16.0%&nbsp;·&nbsp;51&nbsp;B                                        |
| **<abbr title="dist/client/assets/GenerateTokenPanel-s3cmpfE0.js">…st/client/assets/GenerateTokenPanel-s3cmpfE0.js</abbr>**                                        | 309&nbsp;B&nbsp;·&nbsp;gzip&nbsp;252&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue                                                                                                               | `███████████░░░░░░░░░`&nbsp;56.3%&nbsp;·&nbsp;174&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.7%&nbsp;·&nbsp;135&nbsp;B                                       |
| **<abbr title="dist/client/assets/ManageSessionsPanel-BONbpbmh.js">…t/client/assets/ManageSessionsPanel-BONbpbmh.js</abbr>**                                       | 309&nbsp;B&nbsp;·&nbsp;gzip&nbsp;252&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;56.3%&nbsp;·&nbsp;174&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.7%&nbsp;·&nbsp;135&nbsp;B                                       |
| **<abbr title="dist/client/assets/ReviewActivityPanel-fZMfh8ou.js">…t/client/assets/ReviewActivityPanel-fZMfh8ou.js</abbr>**                                       | 309&nbsp;B&nbsp;·&nbsp;gzip&nbsp;254&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue                                                                                                              | `███████████░░░░░░░░░`&nbsp;56.3%&nbsp;·&nbsp;174&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.7%&nbsp;·&nbsp;135&nbsp;B                                       |
| **<abbr title="dist/client/assets/DeleteAccountPanel-3Edi-a5L.js">…st/client/assets/DeleteAccountPanel-3Edi-a5L.js</abbr>**                                        | 308&nbsp;B&nbsp;·&nbsp;gzip&nbsp;251&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue                                                                                                               | `███████████░░░░░░░░░`&nbsp;56.2%&nbsp;·&nbsp;173&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;43.8%&nbsp;·&nbsp;135&nbsp;B                                       |
| **dist/client/assets/ManageAccessPanel-SkSC9cWH.js**                                                                                                               | 307&nbsp;B&nbsp;·&nbsp;gzip&nbsp;251&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue                                                                                                                | `███████████░░░░░░░░░`&nbsp;56.0%&nbsp;·&nbsp;172&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;44.0%&nbsp;·&nbsp;135&nbsp;B                                       |
| **dist/client/assets/file-Et6UJ4ch.js**                                                                                                                            | 290&nbsp;B&nbsp;·&nbsp;gzip&nbsp;228&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/file.mjs                                                                                                      | `████████████████░░░░`&nbsp;82.4%&nbsp;·&nbsp;239&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;17.6%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/x-D8LVxMx7.js**                                                                                                                               | 269&nbsp;B&nbsp;·&nbsp;gzip&nbsp;208&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/x.mjs + 1 more                                                                                                | `████████████████░░░░`&nbsp;81.0%&nbsp;·&nbsp;218&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████░░░░░░░░░░░░░░░░`&nbsp;19.0%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/configCard-n7VmHzBB.js**                                                                                                                      | 245&nbsp;B&nbsp;·&nbsp;gzip&nbsp;204&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configCard.ts                                                                                                                        | `████████████░░░░░░░░`&nbsp;59.6%&nbsp;·&nbsp;146&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `████████░░░░░░░░░░░░`&nbsp;40.4%&nbsp;·&nbsp;99&nbsp;B                                        |
| **dist/client/assets/search-BnZDTpDz.js**                                                                                                                          | 194&nbsp;B&nbsp;·&nbsp;gzip&nbsp;182&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs                                                                                                    | `███████████████░░░░░`&nbsp;73.7%&nbsp;·&nbsp;143&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████░░░░░░░░░░░░░░░`&nbsp;26.3%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/useConfigsReady-CtjqS3q0.js**                                                                                                                 | 189&nbsp;B&nbsp;·&nbsp;gzip&nbsp;167&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;src → retrievalReady.ts + 1 more                                                                                                           | `███████████░░░░░░░░░`&nbsp;54.5%&nbsp;·&nbsp;103&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `█████████░░░░░░░░░░░`&nbsp;45.5%&nbsp;·&nbsp;86&nbsp;B                                        |
| **dist/client/assets/arrow-left-CHA_5RMd.js**                                                                                                                      | 185&nbsp;B&nbsp;·&nbsp;gzip&nbsp;178&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs                                                                                                | `██████████████░░░░░░`&nbsp;72.4%&nbsp;·&nbsp;134&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;27.6%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/arrow-right-W41eeOrx.js**                                                                                                                     | 185&nbsp;B&nbsp;·&nbsp;gzip&nbsp;177&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-right.mjs                                                                                               | `██████████████░░░░░░`&nbsp;72.4%&nbsp;·&nbsp;134&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;27.6%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/plus-pzk63QwH.js**                                                                                                                            | 173&nbsp;B&nbsp;·&nbsp;gzip&nbsp;166&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs                                                                                                      | `██████████████░░░░░░`&nbsp;70.5%&nbsp;·&nbsp;122&nbsp;B                                       |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `██████░░░░░░░░░░░░░░`&nbsp;29.5%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/chevron-left-DWfcHMv5.js**                                                                                                                    | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;160&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs                                                                                              | `█████████████░░░░░░░`&nbsp;66.0%&nbsp;·&nbsp;99&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.0%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/chevron-right-BVRWjtmd.js**                                                                                                                   | 150&nbsp;B&nbsp;·&nbsp;gzip&nbsp;157&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs                                                                                             | `█████████████░░░░░░░`&nbsp;66.0%&nbsp;·&nbsp;99&nbsp;B                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;(bundler output, whitespace & JSON)                                                                                                        | `███████░░░░░░░░░░░░░`&nbsp;34.0%&nbsp;·&nbsp;51&nbsp;B                                        |
| **dist/client/assets/check-Bnffjy2P.js**                                                                                                                           | 144&nbsp;B&nbsp;·&nbsp;gzip&nbsp;157&nbsp;B&nbsp;·&nbsp;0.0%&nbsp;of&nbsp;the&nbsp;build       |
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
