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
| dist/client/assets/dist-D0VZb5Xz.js | 279.8 kB · brotli 73.1 kB |
| dist/client/assets/ChatPanel-Bzymk-U1.js | 205.4 kB · brotli 44.9 kB |
| dist/client/assets/ChartNode-D8pEt7TP.js | 159.0 kB · brotli 47.9 kB |
| dist/client/assets/DocumentEditorView-ZZezOgIB.js | 155.2 kB · brotli 42.8 kB |
| dist/client/assets/index-DXTUaa55.js | 100.6 kB · brotli 33.1 kB |
| dist/client/assets/AuthDialog-CHkjtAoS.js | 77.8 kB · brotli 21.2 kB |
| dist/client/assets/LibraryPanel-B0h5jNVG.js | 71.6 kB · brotli 17.4 kB |
| dist/client/assets/runtime-core.esm-bundler-BIebCysl.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-Bmt1_qOA.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-Bpq77qJP.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-DpzbkSGc.js | 54.9 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-CVFAmYTr.js | 41.2 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-VC54eYNo.js | 22.9 kB · brotli 6.4 kB |
| dist/client/assets/Tag-CuKIyhK-.js | 9.0 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-CNbpaRA2.js | 8.8 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-Bb8bhSQQ.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-DDkMrpYx.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SessionMenu-BCSbpbaf.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/SelectItemPanel-CLH48NRa.js | 6.6 kB · brotli 2.6 kB |
| dist/client/assets/ConnectorList-BIOTfxRn.js | 6.0 kB · brotli 2.1 kB |
| dist/client/assets/performanceTracking-De5Si3Fz.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-BjIz-sjL.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-D7pwhp4m.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-CQWo0idr.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-BECmdcxC.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/GridDetailPanel-CHv4eVT0.js | 3.9 kB · brotli 1.5 kB |
| dist/client/assets/useConfigOptionConfigs-BF1lmYSZ.js | 3.4 kB · brotli 816 B |
| dist/client/assets/EstablishDataViewsLayout-LoTYZ3Ct.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-DzykkU39.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/Grid-CtKBCi_p.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-CC7Vfa_3.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/EventQueryList-DyvmrPeF.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/Card-DehQ_wUP.js | 2.1 kB · brotli 877 B |
| dist/client/assets/DimensionList-PfyBwjYh.js | 2.1 kB · brotli 991 B |
| dist/client/assets/ContextList-BF7D6SuW.js | 2.1 kB · brotli 994 B |
| dist/client/assets/GitHubLogo-fnXHziAK.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-OCpNjRzB.js | 2.0 kB · brotli 920 B |
| dist/client/assets/configMonitor-4tKzW9Bp.js | 1.8 kB · brotli 680 B |
| dist/client/assets/AboutPanel-Bjz6Dyof.js | 1.7 kB · brotli 872 B |
| dist/client/assets/KnowledgeLayout-DAes50Rw.js | 1.6 kB · brotli 724 B |
| dist/client/assets/EmptyPlaceholder-CGVfJkBz.js | 1.5 kB · brotli 688 B |
| dist/client/assets/ManageConfigsLayout-CtjXM1bA.js | 1.4 kB · brotli 745 B |
| dist/client/assets/HomeLayout-MjiJMMsN.js | 1.4 kB · brotli 683 B |
| dist/client/assets/accountMonitor-ClaMAFYa.js | 1.3 kB · brotli 511 B |
| dist/client/assets/dpuse-shared-utilities.es-DBEf96kJ.js | 1.3 kB · brotli 598 B |
| dist/client/assets/TextField-aazknwtf.js | 1.3 kB · brotli 731 B |
| dist/client/assets/DialogModal-QImFmL-5.js | 1.2 kB · brotli 634 B |
| dist/client/assets/ManagePersonalDetailsPanel-CwQDXLvn.js | 1.2 kB · brotli 260 B |
| dist/client/assets/establishDataViews-MCyV5_iX.js | 1.2 kB · brotli 542 B |
| dist/client/assets/ListItemButton-D0Mk4tkA.js | 1.1 kB · brotli 526 B |
| dist/client/assets/WorkbenchHeader-B2ce6q7f.js | 989 B · brotli 560 B |
| dist/client/assets/SelectPlaceholder-CMdTEEAl.js | 925 B · brotli 526 B |
| dist/client/assets/Input-Ey4mv1Fg.js | 871 B · brotli 492 B |
| dist/client/assets/useApi-s_02lHjl-CTSnjKJW.js | 863 B · brotli 418 B |
| dist/client/assets/HomePanel-ddnJ_G7B.js | 857 B · brotli 504 B |
| dist/client/assets/AssembleDimensionsLayout-uw5nx2UQ.js | 812 B · brotli 439 B |
| dist/client/assets/PaneSplitter-C--GhAya.js | 806 B · brotli 442 B |
| dist/client/assets/BuildDataAppsLayout-C4SiMAGb.js | 797 B · brotli 436 B |
| dist/client/assets/HomeIcon-DscGQ5Gw.js | 607 B · brotli 371 B |
| dist/client/assets/CloseButton-C1SbiC4b.js | 589 B · brotli 325 B |
| dist/client/assets/AuditContentPanel-aV2lSj8q.js | 563 B · brotli 336 B |
| dist/client/assets/Separator-CmF68kJC.js | 557 B · brotli 296 B |
| dist/client/assets/useEngine-CmOus4Tz.js | 509 B · brotli 303 B |
| dist/client/assets/ManagePreferencesPanel-wLATQdO2.js | 494 B · brotli 287 B |
| dist/client/assets/DialogHeader-B3fBUesm.js | 314 B · brotli 212 B |
| dist/client/assets/WorkbenchLayout-C05dtcX2.js | 305 B · brotli 219 B |
| dist/client/assets/ManageSubscriptionPanel-rD5w3K9p.js | 303 B · brotli 201 B |
| dist/client/assets/ManageDataServiceTokensPanel-BEkqQsLP.js | 300 B · brotli 200 B |
| dist/client/assets/ManageConnectionPanel-WGo5sj38.js | 297 B · brotli 196 B |
| dist/client/assets/GenerateTokenPanel-DgGdyLAu.js | 289 B · brotli 195 B |
| dist/client/assets/ManageSessionsPanel-CljCmd8c.js | 289 B · brotli 196 B |
| dist/client/assets/ReviewActivityPanel-ZpdigCvY.js | 289 B · brotli 194 B |
| dist/client/assets/DeleteAccountPanel-BRwPuIoH.js | 288 B · brotli 195 B |
| dist/client/assets/ManageAccessPanel-D0Pw3bIk.js | 287 B · brotli 195 B |
| dist/client/assets/arrow-big-left-DiKh9_Yy.js | 280 B · brotli 211 B |
| dist/client/assets/PresenterList-DZhC02_B.js | 216 B · brotli 164 B |
| dist/client/assets/CookbookList-CVhxph6l.js | 215 B · brotli 159 B |
| dist/client/assets/x-CpA8YQCv.js | 143 B · brotli 119 B |

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
