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
| dist/client/assets/dist-F22_2P3j.js | 279.8 kB · brotli 73.1 kB |
| dist/client/assets/ChatPanel-CS-GZkK7.js | 205.9 kB · brotli 44.9 kB |
| dist/client/assets/ChartNode-DVENxyNl.js | 159.0 kB · brotli 47.9 kB |
| dist/client/assets/DocumentEditorView-D6Xb-kKn.js | 155.2 kB · brotli 42.8 kB |
| dist/client/assets/index-CelKSH09.js | 102.1 kB · brotli 33.4 kB |
| dist/client/assets/AuthDialog-DCu5i4XD.js | 77.7 kB · brotli 21.2 kB |
| dist/client/assets/LibraryPanel-XvePsAuv.js | 71.7 kB · brotli 17.4 kB |
| dist/client/assets/runtime-core.esm-bundler-BIebCysl.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-Cg0hm3RC.js | 61.9 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-BvN3OGUM.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-DPRrQxxG.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-Ce_tTDKq.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-BPtOJ9bF.js | 22.9 kB · brotli 6.4 kB |
| dist/client/assets/Tag-D5RihsA-.js | 9.0 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-BYAOJOZm.js | 8.8 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-kGsd_vRy.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-COqSCbyP.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SessionMenu-PUgElXbs.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/SelectItemPanel--ltsd3Zc.js | 6.6 kB · brotli 2.6 kB |
| dist/client/assets/ConnectorList-DqeqpURN.js | 6.0 kB · brotli 2.1 kB |
| dist/client/assets/performanceTracking-Bj7RQ7Qp.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-17G3vr8K.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-HxgZCHcy.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-C1yfOgQH.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-B5GbMcjr.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/GridDetailPanel-EFij3aqC.js | 3.9 kB · brotli 1.5 kB |
| dist/client/assets/useConfigOptionConfigs-BzEBGqBW.js | 3.4 kB · brotli 816 B |
| dist/client/assets/EstablishDataViewsLayout-5fVOwt1j.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-iilzD0Ts.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/Grid-CKYq5mLk.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-CUklod7n.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/EventQueryList-devm2u75.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/Card-DehQ_wUP.js | 2.1 kB · brotli 877 B |
| dist/client/assets/DimensionList-C3XTwvW0.js | 2.1 kB · brotli 992 B |
| dist/client/assets/ContextList-DHgKLb-k.js | 2.1 kB · brotli 996 B |
| dist/client/assets/GitHubLogo-fnXHziAK.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-J1L0xYp1.js | 2.0 kB · brotli 919 B |
| dist/client/assets/configMonitor-B6fbuyLj.js | 1.8 kB · brotli 680 B |
| dist/client/assets/AboutPanel-Bp6H0RlK.js | 1.7 kB · brotli 881 B |
| dist/client/assets/KnowledgeLayout-DDQxiKtX.js | 1.6 kB · brotli 727 B |
| dist/client/assets/EmptyPlaceholder-Cnf2LKfj.js | 1.5 kB · brotli 688 B |
| dist/client/assets/ManageConfigsLayout-BW9SdJYF.js | 1.4 kB · brotli 742 B |
| dist/client/assets/HomeLayout-Cv6RpSIG.js | 1.4 kB · brotli 684 B |
| dist/client/assets/accountMonitor-CmDyQRAL.js | 1.3 kB · brotli 512 B |
| dist/client/assets/dpuse-shared-utilities.es-DBEf96kJ.js | 1.3 kB · brotli 598 B |
| dist/client/assets/TextField-B1JFS6nr.js | 1.3 kB · brotli 728 B |
| dist/client/assets/DialogModal-cPTzRKTi.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-CPCZrIH-.js | 1.2 kB · brotli 260 B |
| dist/client/assets/establishDataViews-CA6WdNry.js | 1.2 kB · brotli 537 B |
| dist/client/assets/ListItemButton-BZ95QBBW.js | 1.1 kB · brotli 521 B |
| dist/client/assets/WorkbenchHeader-B8EGiaGm.js | 989 B · brotli 560 B |
| dist/client/assets/SelectPlaceholder-Bjc0VrgT.js | 925 B · brotli 520 B |
| dist/client/assets/Input-CXJTgCbM.js | 871 B · brotli 493 B |
| dist/client/assets/useApi-s_02lHjl-CTSnjKJW.js | 863 B · brotli 418 B |
| dist/client/assets/HomePanel-Cmo8spwI.js | 857 B · brotli 508 B |
| dist/client/assets/AssembleDimensionsLayout-KXumtx2o.js | 812 B · brotli 435 B |
| dist/client/assets/PaneSplitter-C--GhAya.js | 806 B · brotli 442 B |
| dist/client/assets/BuildDataAppsLayout-BGcdv-Kt.js | 797 B · brotli 435 B |
| dist/client/assets/useEngine-CdJRou5T.js | 648 B · brotli 332 B |
| dist/client/assets/HomeIcon-DscGQ5Gw.js | 607 B · brotli 371 B |
| dist/client/assets/CloseButton-DSNzj8EZ.js | 588 B · brotli 331 B |
| dist/client/assets/AuditContentPanel-aV2lSj8q.js | 563 B · brotli 336 B |
| dist/client/assets/Separator-CmF68kJC.js | 557 B · brotli 296 B |
| dist/client/assets/ManagePreferencesPanel-BqFRp8P_.js | 494 B · brotli 279 B |
| dist/client/assets/DialogHeader-B3fBUesm.js | 314 B · brotli 212 B |
| dist/client/assets/WorkbenchLayout-DpfltSqK.js | 305 B · brotli 213 B |
| dist/client/assets/ManageSubscriptionPanel-CpzPgYfv.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-Dps0uZok.js | 300 B · brotli 193 B |
| dist/client/assets/ManageConnectionPanel-Bhg4w380.js | 297 B · brotli 190 B |
| dist/client/assets/GenerateTokenPanel-Tk1CK-7q.js | 289 B · brotli 186 B |
| dist/client/assets/ManageSessionsPanel-Di2SOB0U.js | 289 B · brotli 189 B |
| dist/client/assets/ReviewActivityPanel-sDWehhgF.js | 289 B · brotli 187 B |
| dist/client/assets/DeleteAccountPanel-Di3bR9hB.js | 288 B · brotli 186 B |
| dist/client/assets/ManageAccessPanel-OxH4odkt.js | 287 B · brotli 188 B |
| dist/client/assets/arrow-big-left-DkRVDQgm.js | 280 B · brotli 211 B |
| dist/client/assets/PresenterList-Az0ldR1V.js | 216 B · brotli 158 B |
| dist/client/assets/CookbookList-XuhK8mgS.js | 215 B · brotli 160 B |
| dist/client/assets/x-Nk5lU-TJ.js | 143 B · brotli 120 B |

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
