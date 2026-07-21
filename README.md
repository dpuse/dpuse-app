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
| dist/client/assets/ChatPanel-DDx9QR5b.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-B3it0jIK.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-IMoBZGnh.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-CuzVbLRk.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-CGagMYqj.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-C4hKIeOR.js | 56.7 kB · brotli 13.6 kB |
| dist/client/assets/Table-B2TfiSAT.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-B9MRzmI8.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-l4gMpoql.js | 23.4 kB · brotli 6.6 kB |
| dist/client/assets/Tag-9VUPJXNS.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-CBZoKxCS.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-CDLEyHNT.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-DPDKwnys.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-DmmwTpsz.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-BUpF0I-b.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-C9L22QgE.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-odUubTYX.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-DDhddbyj.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-BQRL_4-Y.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-DDzS9kqc.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-A-f3FutD.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-BNjemUj-.js | 3.4 kB · brotli 814 B |
| dist/client/assets/EstablishDataViewsLayout-BQ8isl0I.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/Grid-CUkos0ZG.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-Rclk_J4D.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-uUaapZzA.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-ChpiNZow.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-DZNBZ4Ib.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-BlqCEf9G.js | 2.2 kB · brotli 912 B |
| dist/client/assets/DimensionList-BUtCBCrs.js | 2.1 kB · brotli 987 B |
| dist/client/assets/ContextList-DK1TDbWw.js | 2.1 kB · brotli 991 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-C-m2uJWg.js | 2.0 kB · brotli 998 B |
| dist/client/assets/GridDetailPanel-BAnoSh0c.js | 1.8 kB · brotli 897 B |
| dist/client/assets/configMonitor-D6y7H9Zh.js | 1.8 kB · brotli 696 B |
| dist/client/assets/AboutPanel-r9EJ_CXM.js | 1.7 kB · brotli 879 B |
| dist/client/assets/KnowledgeLayout-DKSamHVC.js | 1.6 kB · brotli 736 B |
| dist/client/assets/EmptyPlaceholder-B3CjKd3V.js | 1.5 kB · brotli 689 B |
| dist/client/assets/ManageConfigsLayout-DWkAjy65.js | 1.4 kB · brotli 727 B |
| dist/client/assets/accountMonitor-DyUVL5QH.js | 1.3 kB · brotli 514 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-CTGtvo60.js | 1.3 kB · brotli 742 B |
| dist/client/assets/HomeLayout-QL4SOHhX.js | 1.3 kB · brotli 672 B |
| dist/client/assets/DialogModal-CnsmEmJc.js | 1.2 kB · brotli 640 B |
| dist/client/assets/ManagePersonalDetailsPanel-CDomAPhB.js | 1.2 kB · brotli 257 B |
| dist/client/assets/WorkbenchLayout-BNtdxe2t.js | 1.2 kB · brotli 611 B |
| dist/client/assets/establishDataViews-Dbn2Ghhc.js | 1.2 kB · brotli 535 B |
| dist/client/assets/ListItemButton-DQFEovz5.js | 1.1 kB · brotli 519 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-CX30Dj3K.js | 857 B · brotli 500 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-DtoLDbiu.js | 769 B · brotli 420 B |
| dist/client/assets/BuildDataAppsLayout-x4MvTzcT.js | 754 B · brotli 421 B |
| dist/client/assets/useEngine-Cqhkf4md.js | 669 B · brotli 338 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-B93B_8wp.js | 588 B · brotli 322 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-CFmwFjWX.js | 494 B · brotli 278 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-BfKpVD2Y.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-CN2Oo8w9.js | 300 B · brotli 191 B |
| dist/client/assets/ManageConnectionPanel-D1QJGczW.js | 297 B · brotli 187 B |
| dist/client/assets/GenerateTokenPanel-BzwVOCpr.js | 289 B · brotli 186 B |
| dist/client/assets/ManageSessionsPanel-6nwIFito.js | 289 B · brotli 188 B |
| dist/client/assets/ReviewActivityPanel-CgPCViKt.js | 289 B · brotli 187 B |
| dist/client/assets/DeleteAccountPanel-79ighbip.js | 288 B · brotli 185 B |
| dist/client/assets/ManageAccessPanel-D6asPTZY.js | 287 B · brotli 185 B |
| dist/client/assets/arrow-big-left-CdooHZ-h.js | 280 B · brotli 184 B |
| dist/client/assets/PresenterList-Ck5Uf_9a.js | 216 B · brotli 158 B |
| dist/client/assets/CookbookList-BN28WvS2.js | 215 B · brotli 157 B |
| dist/client/assets/x-BXO_p3-J.js | 143 B · brotli 120 B |

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
