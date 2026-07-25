# DPUse App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Deployed On Cloudflare](https://img.shields.io/badge/Deployed_On-Cloudflare-f6821f)](https://www.cloudflare.io)

## Introduction

The DPUse browser application.

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

## Dependency Licenses

## Bundle Analysis

<!-- BUNDLE_START -->

The Bundle Analysis Report is generated automatically on each release using [Sonda](https://sonda.dev/), which analyses final source maps to reveal the actual effects of tree-shaking and minification rather than relying on pre-build estimates.

_Note: Sonda's Vite reports currently exclude CSS files, since Vite does not generate source maps for CSS._

|Chunk/Module/File|Composition|
|:------ |:-----------|
| dist/client/assets/ChatPanel-DnilgSI4.js | 206.3 kB · brotli 45.2 kB |
| dist/client/assets/AuthDialog-BZXMItJR.js | 79.6 kB · brotli 21.8 kB |
| dist/client/assets/index-CP82iH5y.js | 76.6 kB · brotli 25.3 kB |
| dist/client/assets/LibraryPanel-NFkJwKXq.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-DeG9ySg5.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-Ciz6uJZo.js | 56.7 kB · brotli 13.6 kB |
| dist/client/assets/Table-DFHTFxkT.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-JGw91mKr.js | 41.0 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-4ZkYP8gZ.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-BUsB0VGC.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-DVX96j8M.js | 14.1 kB · brotli 4.3 kB |
| dist/client/assets/performanceTracking-0JXxYgpa.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-5KmQRVLz.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-sMTryVRp.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-Su4T3rSq.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ContextList-BJYvvaI1.js | 6.2 kB · brotli 1.2 kB |
| dist/client/assets/ConnectionDialog-CNTgKbwG.js | 5.7 kB · brotli 2.0 kB |
| dist/client/assets/ScrollArea-ClIu9dVB.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-CfpMkhlg.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-Ciz1Qvli.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/PresenterList-OeqV9Fw4.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-DPwOJySi.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-9Oec46Z3.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-VoPSZcF4.js | 3.6 kB · brotli 924 B |
| dist/client/assets/EstablishDataViewsLayout-Dkta4kc6.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-ksMk_pnm.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-Dsp6MUtf.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-n6JKp_N_.js | 2.9 kB · brotli 1.3 kB |
| dist/client/assets/Card-D6NE2L-o.js | 2.7 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-Dn3RyE-y.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-EOaYc_k-.js | 2.2 kB · brotli 929 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-Duk40OTi.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/DimensionList-Tq8DfnAN.js | 2.1 kB · brotli 962 B |
| dist/client/assets/configMonitor-DRBEhA8o.js | 2.0 kB · brotli 734 B |
| dist/client/assets/GridDetailPanel-fu3mX5Bs.js | 1.9 kB · brotli 896 B |
| dist/client/assets/AboutPanel-vJiB3JE_.js | 1.7 kB · brotli 887 B |
| dist/client/assets/Tag-CGpYzskA.js | 1.7 kB · brotli 723 B |
| dist/client/assets/KnowledgeLayout-D5noy1og.js | 1.7 kB · brotli 774 B |
| dist/client/assets/EmptyPlaceholder-BaKynn7n.js | 1.5 kB · brotli 679 B |
| dist/client/assets/ManageConfigLayout-DaUmUHZL.js | 1.4 kB · brotli 733 B |
| dist/client/assets/HomeLayout-BlFimbN3.js | 1.4 kB · brotli 684 B |
| dist/client/assets/accountMonitor-lWjvQBwi.js | 1.3 kB · brotli 517 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/createLucideIcon-Da5bIak_.js | 1.3 kB · brotli 695 B |
| dist/client/assets/DialogModal-CR6tCXeo.js | 1.2 kB · brotli 641 B |
| dist/client/assets/ManagePersonalDetailsPanel-DLrcK5cN.js | 1.2 kB · brotli 259 B |
| dist/client/assets/WorkbenchLayout-D0DY-8V2.js | 1.2 kB · brotli 613 B |
| dist/client/assets/establishDataViews-CkK8YTUg.js | 1.2 kB · brotli 536 B |
| dist/client/assets/ListItemButton-BDsRDKmN.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-DwKSmDRG.js | 858 B · brotli 505 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-BNtdKZOw.js | 769 B · brotli 420 B |
| dist/client/assets/BuildDataAppsLayout-DyicH-35.js | 754 B · brotli 422 B |
| dist/client/assets/useEngine-OeU8uYAU.js | 669 B · brotli 347 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CRX01uuR.js | 589 B · brotli 327 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-DPm4NKPg.js | 528 B · brotli 292 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-CRCrx9n6.js | 303 B · brotli 197 B |
| dist/client/assets/ManageDataServiceTokensPanel-Cdbhde9Z.js | 300 B · brotli 193 B |
| dist/client/assets/ManageConnectionPanel-D_oP1bcZ.js | 297 B · brotli 188 B |
| dist/client/assets/arrow-big-left-DAI4_r0u.js | 291 B · brotli 218 B |
| dist/client/assets/GenerateTokenPanel-CRMmNHz0.js | 289 B · brotli 188 B |
| dist/client/assets/ManageSessionsPanel-tUELE31q.js | 289 B · brotli 189 B |
| dist/client/assets/ReviewActivityPanel-Ct_5oqcf.js | 289 B · brotli 188 B |
| dist/client/assets/DeleteAccountPanel-vDi95TUL.js | 288 B · brotli 187 B |
| dist/client/assets/ManageAccessPanel-BYg2b4mY.js | 287 B · brotli 187 B |
| dist/client/assets/x-j9qVIbVL.js | 154 B · brotli 150 B |
| dist/client/assets/plus-DJHoRAG3.js | 153 B · brotli 121 B |

(unassigned) = bytes Sonda can't trace to a specific source line (whitespace, stray keywords, bundler-injected region markers) — not actual missing/unknown code.

<!-- BUNDLE_END -->

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
