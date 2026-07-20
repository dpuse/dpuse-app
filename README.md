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
| dist/client/assets/ChatPanel-HNqNZ5WU.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-DG61tcBM.js | 102.0 kB · brotli 33.4 kB |
| dist/client/assets/AuthDialog-B87aayv4.js | 78.4 kB · brotli 21.5 kB |
| dist/client/assets/LibraryPanel-Be76laJ1.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-bxBNq1zK.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-fjgAZxId.js | 56.7 kB · brotli 13.6 kB |
| dist/client/assets/Table-Cygz3cVF.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-DzSzQUFI.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-Z3GkRgx7.js | 23.4 kB · brotli 6.6 kB |
| dist/client/assets/Tag-CAqu-LmR.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-MiE7CIso.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-BV1Dn52M.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-BlsB0TZS.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-BZ9zsrFQ.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-DlwzUVOq.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-Cl6bPYyb.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-Bga5cUzm.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-29TjYgwX.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-B5ygysQF.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-B5pfyEpa.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-1klCR7Ui.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-aafUuBom.js | 3.4 kB · brotli 813 B |
| dist/client/assets/EstablishDataViewsLayout-GNUv97A6.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-CyHR8Zx1.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-BYpIEVMr.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-BOB-j1Ok.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-BJwrdrA-.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-ClweMyXx.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-DFKZmo2d.js | 2.2 kB · brotli 915 B |
| dist/client/assets/DimensionList-D-WrqerR.js | 2.1 kB · brotli 995 B |
| dist/client/assets/ContextList-BT2Ds7xM.js | 2.1 kB · brotli 994 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-DcyTQ_lE.js | 2.0 kB · brotli 999 B |
| dist/client/assets/GridDetailPanel-D2eLD0jV.js | 1.8 kB · brotli 892 B |
| dist/client/assets/configMonitor-CJAhAvz8.js | 1.8 kB · brotli 698 B |
| dist/client/assets/AboutPanel-BI5sYeDY.js | 1.7 kB · brotli 872 B |
| dist/client/assets/KnowledgeLayout-Cyx_3y9O.js | 1.6 kB · brotli 732 B |
| dist/client/assets/EmptyPlaceholder-DVl3Q4Gy.js | 1.5 kB · brotli 683 B |
| dist/client/assets/ManageConfigsLayout-Dm_Siuw-.js | 1.4 kB · brotli 730 B |
| dist/client/assets/accountMonitor-BuBslKzX.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-BICe1tng.js | 1.3 kB · brotli 729 B |
| dist/client/assets/HomeLayout-D7vhTXC9.js | 1.3 kB · brotli 674 B |
| dist/client/assets/DialogModal-CXEzsxDG.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-CW1T_zWB.js | 1.2 kB · brotli 254 B |
| dist/client/assets/WorkbenchLayout-DBMJ6SYz.js | 1.2 kB · brotli 612 B |
| dist/client/assets/establishDataViews-D5Imfz8X.js | 1.2 kB · brotli 542 B |
| dist/client/assets/ListItemButton-B9xTcyTL.js | 1.1 kB · brotli 519 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-oDpVjlru.js | 857 B · brotli 504 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-DN4I-Qs5.js | 769 B · brotli 422 B |
| dist/client/assets/BuildDataAppsLayout-DkiPnekM.js | 754 B · brotli 426 B |
| dist/client/assets/useEngine-BOiYBwYH.js | 669 B · brotli 341 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-BDXQ-XBw.js | 588 B · brotli 323 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-1jTvRDe6.js | 494 B · brotli 281 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-BCPaTnQi.js | 303 B · brotli 202 B |
| dist/client/assets/ManageDataServiceTokensPanel-BtZ5ypKB.js | 300 B · brotli 199 B |
| dist/client/assets/ManageConnectionPanel-y7gq3M-B.js | 297 B · brotli 195 B |
| dist/client/assets/GenerateTokenPanel-CyM-RlYJ.js | 289 B · brotli 194 B |
| dist/client/assets/ManageSessionsPanel-Bdiqzw2m.js | 289 B · brotli 195 B |
| dist/client/assets/ReviewActivityPanel-C5UPqr09.js | 289 B · brotli 194 B |
| dist/client/assets/DeleteAccountPanel-CBQiGWqF.js | 288 B · brotli 193 B |
| dist/client/assets/ManageAccessPanel-iHHt22Aq.js | 287 B · brotli 192 B |
| dist/client/assets/arrow-big-left-DKRktoMe.js | 280 B · brotli 185 B |
| dist/client/assets/PresenterList-DucL3u1I.js | 216 B · brotli 158 B |
| dist/client/assets/CookbookList-D02DL6ia.js | 215 B · brotli 158 B |
| dist/client/assets/x-BCVf5qfp.js | 143 B · brotli 121 B |

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
