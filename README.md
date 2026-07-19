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
| dist/client/assets/ChatPanel-Bqeh0-jy.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-OYBWYdzB.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-CqaotW3O.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-BnXr2uog.js | 76.1 kB · brotli 18.4 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-CdGo8ren.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-DKrqybjE.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-0bYePiIw.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-B1mEVXB_.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-BEQMrTZa.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-Bj5Rmr3a.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-DopKM9hT.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-BAUKQ79Y.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-DxFg0bKF.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-DBF9IzUo.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-C3OODFfq.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-Cv26hLH8.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-DPilxCwm.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-CqvPV-Up.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-BlULuR79.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-DU7M0yW-.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-CkU0JS1f.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-BIck9Tx-.js | 3.4 kB · brotli 818 B |
| dist/client/assets/EstablishDataViewsLayout-DfWCatXt.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/Grid-D8Pbpj28.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-jpNAGEdv.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-a52hIO3w.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-Dhi5A0pf.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-CIGoe48p.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-BWp2vZif.js | 2.2 kB · brotli 916 B |
| dist/client/assets/DimensionList-g2Iner87.js | 2.1 kB · brotli 985 B |
| dist/client/assets/ContextList-C2ta7hWm.js | 2.1 kB · brotli 991 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-BnWpvSzY.js | 2.0 kB · brotli 998 B |
| dist/client/assets/GridDetailPanel-BjYqk2lk.js | 1.8 kB · brotli 886 B |
| dist/client/assets/configMonitor-BBHrXG6Y.js | 1.8 kB · brotli 700 B |
| dist/client/assets/AboutPanel-Dv9ws7xn.js | 1.7 kB · brotli 874 B |
| dist/client/assets/KnowledgeLayout-kbBvMV7T.js | 1.6 kB · brotli 728 B |
| dist/client/assets/EmptyPlaceholder-Dl-gCkj-.js | 1.5 kB · brotli 696 B |
| dist/client/assets/ManageConfigsLayout-BbxDtX9B.js | 1.4 kB · brotli 728 B |
| dist/client/assets/accountMonitor-DBWp7JTF.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-C8GnUX_R.js | 1.3 kB · brotli 726 B |
| dist/client/assets/HomeLayout-CnkYsLOd.js | 1.3 kB · brotli 672 B |
| dist/client/assets/DialogModal-BRMBPubU.js | 1.2 kB · brotli 638 B |
| dist/client/assets/ManagePersonalDetailsPanel-Cr2ZnTK1.js | 1.2 kB · brotli 255 B |
| dist/client/assets/WorkbenchLayout-BXMbYKc2.js | 1.2 kB · brotli 613 B |
| dist/client/assets/establishDataViews-BA3iKofG.js | 1.2 kB · brotli 534 B |
| dist/client/assets/ListItemButton-hnPDnrSQ.js | 1.1 kB · brotli 522 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-BQCNjb47.js | 857 B · brotli 499 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-htam-QFP.js | 769 B · brotli 423 B |
| dist/client/assets/BuildDataAppsLayout-BfC8jyJK.js | 754 B · brotli 423 B |
| dist/client/assets/useEngine-2zxdfuie.js | 669 B · brotli 339 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-hoWnM-gG.js | 588 B · brotli 328 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-CwXQ2q-U.js | 494 B · brotli 281 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-DEkGfvVY.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-C8B-J2Q_.js | 300 B · brotli 191 B |
| dist/client/assets/ManageConnectionPanel-FYfxqzVO.js | 297 B · brotli 187 B |
| dist/client/assets/GenerateTokenPanel-CofdozgV.js | 289 B · brotli 186 B |
| dist/client/assets/ManageSessionsPanel-BrfYH2wa.js | 289 B · brotli 187 B |
| dist/client/assets/ReviewActivityPanel-CcPQJgPq.js | 289 B · brotli 186 B |
| dist/client/assets/DeleteAccountPanel-k53I_wrl.js | 288 B · brotli 185 B |
| dist/client/assets/ManageAccessPanel-BR_snX4y.js | 287 B · brotli 185 B |
| dist/client/assets/arrow-big-left-C96i8l3y.js | 280 B · brotli 221 B |
| dist/client/assets/PresenterList-Dkl53cp5.js | 216 B · brotli 158 B |
| dist/client/assets/CookbookList-C1ayn-Jy.js | 215 B · brotli 158 B |
| dist/client/assets/x-Bxg55ufZ.js | 143 B · brotli 122 B |

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
