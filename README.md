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
| dist/client/assets/ChatPanel-7QaEzfVs.js | 154.6 kB · brotli 36.1 kB |
| dist/client/assets/LibraryPanel-DkVuctX1.js | 120.4 kB · brotli 27.8 kB |
| dist/client/assets/AuthDialog-BDaXcnkO.js | 78.0 kB · brotli 21.3 kB |
| dist/client/assets/index-iTe3vToH.js | 77.4 kB · brotli 25.7 kB |
| dist/client/assets/ContextModelDescriptorsPanel-BqcdYMZE.js | 74.1 kB · brotli 21.0 kB |
| dist/client/assets/runtime-core.esm-bundler-9ds7u2Nw.js | 65.5 kB · brotli 23.1 kB |
| dist/client/assets/ExploreData-DZ_dz6FZ.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/ContextList-g3n2RM4b.js | 54.7 kB · brotli 9.6 kB |
| dist/client/assets/Table-29C_Gdvn.js | 51.7 kB · brotli 12.1 kB |
| dist/client/assets/sdk.modern-uK7G7M7W.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-DbikSnMB.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-CH3h5b5L.js | 23.6 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-CdXxOWqv.js | 12.4 kB · brotli 4.1 kB |
| dist/client/assets/performanceTracking-CX-9Refw.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-BqMb21dH.js | 7.1 kB · brotli 1.8 kB |
| dist/client/assets/SelectItemPanel-DiEGPGv3.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-DLLhxwCc.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/DataViewList-CUu-pTGD.js | 5.8 kB · brotli 2.2 kB |
| dist/client/assets/ConnectionDialog-sCZDe88T.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-g1oQllUi.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-CjwhGCm_.js | 4.9 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-hR8XRUYU.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-CiZUa6Qu.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-C67TqTER.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/ComponentCard-BtsHKcRg.js | 3.7 kB · brotli 1.4 kB |
| dist/client/assets/useConfigOptionConfigs-BAhZ8aRF.js | 3.6 kB · brotli 922 B |
| dist/client/assets/Grid-DHTnVlXL.js | 3.6 kB · brotli 1.5 kB |
| dist/client/assets/useStudioOptions-ByjIpJHT.js | 3.5 kB · brotli 1.1 kB |
| dist/client/assets/StudioOptionBar-D3cVe2Xm.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/EstablishDataViewsLayout-7htspjaT.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/dataViews-DiiDeTz0.js | 2.5 kB · brotli 898 B |
| dist/client/assets/EventQueryList-CDON4jey.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/StudioHomeLayout-CuRJxUFY.js | 2.3 kB · brotli 722 B |
| dist/client/assets/DetailActionBar-CsW83UwD.js | 2.2 kB · brotli 924 B |
| dist/client/assets/ExplorePresentationsLayout-D1bJEudq.js | 2.2 kB · brotli 1.1 kB |
| dist/client/assets/GitHubLogo-B5TX7eN-.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/configMonitor-CUfHl0ho.js | 2.0 kB · brotli 734 B |
| dist/client/assets/GridDetailPanel-brt3VkV0.js | 1.9 kB · brotli 923 B |
| dist/client/assets/ContextualiseDataLayout-BwLky9Dx.js | 1.9 kB · brotli 892 B |
| dist/client/assets/ContextErdDiagramPanel-ChM6Kjtk.js | 1.9 kB · brotli 669 B |
| dist/client/assets/AboutPanel-BaARvC0C.js | 1.7 kB · brotli 869 B |
| dist/client/assets/AssistantLayout-DANxBs7H.js | 1.7 kB · brotli 781 B |
| dist/client/assets/EmptyPlaceholder-BVqNwId_.js | 1.5 kB · brotli 677 B |
| dist/client/assets/accountMonitor-CzTGz2sG.js | 1.4 kB · brotli 516 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/ManageConfigLayout-DQ_1Mzxu.js | 1.3 kB · brotli 718 B |
| dist/client/assets/Tag-DB0Ztx6i.js | 1.3 kB · brotli 623 B |
| dist/client/assets/createLucideIcon-Dy70XlUL.js | 1.3 kB · brotli 693 B |
| dist/client/assets/DialogModal-BZtDXJkM.js | 1.3 kB · brotli 648 B |
| dist/client/assets/ManagePersonalDetailsPanel-DOinoKaA.js | 1.3 kB · brotli 264 B |
| dist/client/assets/StudioLayout-Dtw5u-P1.js | 1.2 kB · brotli 669 B |
| dist/client/assets/ListItemButton-CJKmGKqW.js | 1.1 kB · brotli 518 B |
| dist/client/assets/AssistantHeader-HxsOcFVy.js | 1022 B · brotli 540 B |
| dist/client/assets/SelectPlaceholder-CJv3av9p.js | 1005 B · brotli 531 B |
| dist/client/assets/ContextDimensionTreeDiagramPanel-Jb5V_kAa.js | 989 B · brotli 498 B |
| dist/client/assets/Input-FWQoZ4A_.js | 924 B · brotli 524 B |
| dist/client/assets/HomePanel-D2KB1hGj.js | 881 B · brotli 495 B |
| dist/client/assets/useApi-CROJJdhE-DFC_a5fl.js | 830 B · brotli 411 B |
| dist/client/assets/BuildDataAppsLayout-C9qMyxrr.js | 822 B · brotli 444 B |
| dist/client/assets/PaneSplitter-D5guXQXZ.js | 806 B · brotli 442 B |
| dist/client/assets/useEngine-CpdSO3eU.js | 644 B · brotli 327 B |
| dist/client/assets/HomeIcon-57Jw54Di.js | 607 B · brotli 361 B |
| dist/client/assets/CloseButton-DHy_hXsH.js | 589 B · brotli 328 B |
| dist/client/assets/AuditContentPanel-aqL6bxxA.js | 562 B · brotli 335 B |
| dist/client/assets/Separator-BVu4fncJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-ZSRkHCuC.js | 528 B · brotli 291 B |
| dist/client/assets/asyncPanel-CUCGXkey.js | 472 B · brotli 285 B |
| dist/client/assets/ManageSubscriptionPanel-CWdC3pNl.js | 323 B · brotli 211 B |
| dist/client/assets/ManageDataServiceTokensPanel-X1YLsz3m.js | 320 B · brotli 212 B |
| dist/client/assets/ManageConnectionPanel-DD0sRznS.js | 317 B · brotli 207 B |
| dist/client/assets/DialogHeader-OQvACgsU.js | 314 B · brotli 214 B |
| dist/client/assets/GenerateTokenPanel-C3X6do54.js | 309 B · brotli 205 B |
| dist/client/assets/ManageSessionsPanel-wWuOSuYf.js | 309 B · brotli 206 B |
| dist/client/assets/ReviewActivityPanel-CLF1akLY.js | 309 B · brotli 205 B |
| dist/client/assets/DeleteAccountPanel-D4fPUTTz.js | 308 B · brotli 205 B |
| dist/client/assets/ManageAccessPanel-D7qlnwIS.js | 307 B · brotli 205 B |
| dist/client/assets/arrow-big-left-CVOW1jis.js | 291 B · brotli 189 B |
| dist/client/assets/x-CFptHM0A.js | 154 B · brotli 155 B |
| dist/client/assets/plus-Bvddy6i_.js | 153 B · brotli 122 B |
| dist/client/assets/chevron-right-BnWcVDoA.js | 130 B · brotli 115 B |
| dist/client/assets/_plugin-vue_export-helper-BDNMzG2s.js | 84 B · brotli 88 B |

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
