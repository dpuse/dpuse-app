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
| dist/client/assets/ChatPanel-D9eAvqHB.js | 206.0 kB · brotli 45.1 kB |
| dist/client/assets/index-BM7iCa1Z.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-CLAJjfHm.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-DD08IoWD.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-BrX39XTM.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-BGE2LRvX.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-b61qZfJ9.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-BgpdfCGq.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-CcTUuIzX.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-Dop2exm9.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-DH53_22h.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-W7vXu-0q.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-B-HgYwGb.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-CExhnrPR.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-tPTg5rG4.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-d8bJ95HL.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-BGntJ-qT.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-BYzfdEnx.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-k3hXQR1x.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-CKSnTdeW.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-A659jFTI.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-CVzpMPxp.js | 3.4 kB · brotli 813 B |
| dist/client/assets/EstablishDataViewsLayout-Cneyn4Ba.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/Grid-KVxD1F2u.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-CVRA0zHe.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-CtYwWkMR.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-bybEe8mg.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-DcQ7DIOC.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-BUoRsiqi.js | 2.2 kB · brotli 915 B |
| dist/client/assets/DimensionList-m9d4Tz4S.js | 2.1 kB · brotli 990 B |
| dist/client/assets/ContextList-DwbA_O5S.js | 2.1 kB · brotli 993 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-BFSqhO0g.js | 2.0 kB · brotli 993 B |
| dist/client/assets/GridDetailPanel-CkUuG724.js | 1.8 kB · brotli 893 B |
| dist/client/assets/configMonitor-D2jcWf_R.js | 1.8 kB · brotli 702 B |
| dist/client/assets/AboutPanel-CCQQ-D1S.js | 1.7 kB · brotli 888 B |
| dist/client/assets/KnowledgeLayout-BbXhFXeU.js | 1.6 kB · brotli 732 B |
| dist/client/assets/EmptyPlaceholder-5wiEGOYH.js | 1.5 kB · brotli 689 B |
| dist/client/assets/ManageConfigsLayout-DEDBnjhB.js | 1.4 kB · brotli 728 B |
| dist/client/assets/accountMonitor-itEuJdGQ.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-DLzzuLUO.js | 1.3 kB · brotli 741 B |
| dist/client/assets/HomeLayout-DTuIU-GP.js | 1.3 kB · brotli 674 B |
| dist/client/assets/DialogModal-BsbntG2m.js | 1.2 kB · brotli 638 B |
| dist/client/assets/ManagePersonalDetailsPanel-Bat3T94Q.js | 1.2 kB · brotli 254 B |
| dist/client/assets/WorkbenchLayout-DfvLUU8u.js | 1.2 kB · brotli 612 B |
| dist/client/assets/establishDataViews-CKATfGNf.js | 1.2 kB · brotli 536 B |
| dist/client/assets/ListItemButton-ClEforFx.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-B-5F7SHZ.js | 857 B · brotli 499 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-CXqGZ-YY.js | 769 B · brotli 423 B |
| dist/client/assets/BuildDataAppsLayout-B_Ua_VxE.js | 754 B · brotli 422 B |
| dist/client/assets/useEngine-CuEPbMst.js | 669 B · brotli 341 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-znaWY52L.js | 588 B · brotli 326 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-MTU6u8XT.js | 494 B · brotli 281 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-CcKA-Hao.js | 303 B · brotli 200 B |
| dist/client/assets/ManageDataServiceTokensPanel-Dkot_cnx.js | 300 B · brotli 191 B |
| dist/client/assets/ManageConnectionPanel-K_mQk-9y.js | 297 B · brotli 187 B |
| dist/client/assets/GenerateTokenPanel-CrIn7mtj.js | 289 B · brotli 186 B |
| dist/client/assets/ManageSessionsPanel-C1sT-nCP.js | 289 B · brotli 188 B |
| dist/client/assets/ReviewActivityPanel-C0lqKCLX.js | 289 B · brotli 187 B |
| dist/client/assets/DeleteAccountPanel-0GmjpK5L.js | 288 B · brotli 186 B |
| dist/client/assets/ManageAccessPanel-CA0wmXuk.js | 287 B · brotli 186 B |
| dist/client/assets/arrow-big-left-C4eAy_jk.js | 280 B · brotli 215 B |
| dist/client/assets/PresenterList-BzLIQ9I0.js | 216 B · brotli 165 B |
| dist/client/assets/CookbookList-Bhje2bJ0.js | 215 B · brotli 166 B |
| dist/client/assets/x-kn5WKAPJ.js | 143 B · brotli 121 B |

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
