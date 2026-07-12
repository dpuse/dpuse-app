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
| dist/client/assets/dist-r0qtNdC-.js | 279.8 kB · brotli 73.1 kB |
| dist/client/assets/ChatPanel-DmCYaXAJ.js | 205.9 kB · brotli 45.0 kB |
| dist/client/assets/ChartNode-JndEaMLu.js | 159.0 kB · brotli 47.9 kB |
| dist/client/assets/DocumentEditorView-6LC1i_Wr.js | 155.2 kB · brotli 42.8 kB |
| dist/client/assets/index-tyIvJh6T.js | 102.1 kB · brotli 33.4 kB |
| dist/client/assets/AuthDialog-mPxVSyIk.js | 77.7 kB · brotli 21.2 kB |
| dist/client/assets/LibraryPanel-DOguHitQ.js | 71.7 kB · brotli 17.4 kB |
| dist/client/assets/runtime-core.esm-bundler-BIebCysl.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-likwtuWN.js | 61.9 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-ud_JRmbx.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-C67DPxme.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-Zz8J3lwE.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-CpCS1oFA.js | 23.1 kB · brotli 6.5 kB |
| dist/client/assets/Tag-BY055waF.js | 9.0 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-Qz15E1_6.js | 8.8 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-D1IOgV_u.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-CiacG9es.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SessionMenu-Dilv1yOe.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/SelectItemPanel-DpzzxTUA.js | 6.7 kB · brotli 2.7 kB |
| dist/client/assets/ConnectorList-RYbiu8Pw.js | 6.0 kB · brotli 2.1 kB |
| dist/client/assets/performanceTracking-CwFGwmLU.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-C86EXTsT.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-Ck3Umo1q.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-DZigSTXM.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-BlMFgXeh.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/GridDetailPanel-DNnNHG9j.js | 3.9 kB · brotli 1.5 kB |
| dist/client/assets/useConfigOptionConfigs-DSIDmvWk.js | 3.4 kB · brotli 813 B |
| dist/client/assets/EstablishDataViewsLayout-Ckj18oqZ.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-B6IE0wc5.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-DnUGFDng.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-BWVkFvk0.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/EventQueryList-CTB_6G1q.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/Card-DehQ_wUP.js | 2.1 kB · brotli 877 B |
| dist/client/assets/DimensionList-vcQ1Pw2b.js | 2.1 kB · brotli 994 B |
| dist/client/assets/ContextList-cyzg5AzK.js | 2.1 kB · brotli 998 B |
| dist/client/assets/GitHubLogo-fnXHziAK.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-BokGIejt.js | 2.0 kB · brotli 920 B |
| dist/client/assets/configMonitor-BIvnHmEg.js | 1.8 kB · brotli 679 B |
| dist/client/assets/AboutPanel-baaX23g_.js | 1.7 kB · brotli 877 B |
| dist/client/assets/KnowledgeLayout-cU_ZUHpF.js | 1.6 kB · brotli 730 B |
| dist/client/assets/EmptyPlaceholder-DTK354Ai.js | 1.5 kB · brotli 689 B |
| dist/client/assets/ManageConfigsLayout-DQhCFF06.js | 1.4 kB · brotli 742 B |
| dist/client/assets/HomeLayout-DBsaCQAk.js | 1.4 kB · brotli 681 B |
| dist/client/assets/accountMonitor-Fsff4YgO.js | 1.3 kB · brotli 511 B |
| dist/client/assets/dpuse-shared-utilities.es-DBEf96kJ.js | 1.3 kB · brotli 598 B |
| dist/client/assets/TextField-awPg3AQ1.js | 1.3 kB · brotli 725 B |
| dist/client/assets/DialogModal-DZZ_XX7n.js | 1.2 kB · brotli 635 B |
| dist/client/assets/ManagePersonalDetailsPanel-C04MTRyV.js | 1.2 kB · brotli 253 B |
| dist/client/assets/establishDataViews-C4qbChML.js | 1.2 kB · brotli 537 B |
| dist/client/assets/ListItemButton-CUpmVQaF.js | 1.1 kB · brotli 522 B |
| dist/client/assets/WorkbenchHeader-HeHHOizs.js | 989 B · brotli 556 B |
| dist/client/assets/SelectPlaceholder-CKCuu9fk.js | 925 B · brotli 521 B |
| dist/client/assets/Input-CBCRFijy.js | 871 B · brotli 508 B |
| dist/client/assets/useApi-s_02lHjl-CTSnjKJW.js | 863 B · brotli 418 B |
| dist/client/assets/HomePanel-CvUDL3di.js | 857 B · brotli 504 B |
| dist/client/assets/AssembleDimensionsLayout-Ch4bfPUM.js | 812 B · brotli 436 B |
| dist/client/assets/PaneSplitter-C--GhAya.js | 806 B · brotli 442 B |
| dist/client/assets/BuildDataAppsLayout-Bw_sQFvD.js | 797 B · brotli 436 B |
| dist/client/assets/useEngine-CAR28fUs.js | 648 B · brotli 335 B |
| dist/client/assets/HomeIcon-DscGQ5Gw.js | 607 B · brotli 371 B |
| dist/client/assets/CloseButton-DVHYZ5sm.js | 588 B · brotli 329 B |
| dist/client/assets/AuditContentPanel-aV2lSj8q.js | 563 B · brotli 336 B |
| dist/client/assets/Separator-CmF68kJC.js | 557 B · brotli 296 B |
| dist/client/assets/ManagePreferencesPanel-IasnD54x.js | 494 B · brotli 282 B |
| dist/client/assets/DialogHeader-B3fBUesm.js | 314 B · brotli 212 B |
| dist/client/assets/WorkbenchLayout-B4CsAFNt.js | 305 B · brotli 213 B |
| dist/client/assets/ManageSubscriptionPanel-BZEji7DX.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-Dk8_CBkl.js | 300 B · brotli 193 B |
| dist/client/assets/ManageConnectionPanel-CpqxLzI8.js | 297 B · brotli 189 B |
| dist/client/assets/GenerateTokenPanel-CmvNzmjP.js | 289 B · brotli 188 B |
| dist/client/assets/ManageSessionsPanel-B-UZb3H5.js | 289 B · brotli 190 B |
| dist/client/assets/ReviewActivityPanel-ahCCZRq0.js | 289 B · brotli 188 B |
| dist/client/assets/DeleteAccountPanel-DOa5UpKI.js | 288 B · brotli 188 B |
| dist/client/assets/ManageAccessPanel-CSqZENvM.js | 287 B · brotli 188 B |
| dist/client/assets/arrow-big-left-CMg4gPks.js | 280 B · brotli 192 B |
| dist/client/assets/PresenterList-B0Gf6pGC.js | 216 B · brotli 158 B |
| dist/client/assets/CookbookList-sl9EfWQp.js | 215 B · brotli 160 B |
| dist/client/assets/x-BruHxa1_.js | 143 B · brotli 119 B |

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
