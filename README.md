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
| dist/client/assets/ChatPanel-CmYV2R6V.js | 151.2 kB · brotli 35.7 kB |
| dist/client/assets/AuthDialog-B1hPfGGN.js | 78.0 kB · brotli 21.3 kB |
| dist/client/assets/index-BJUn7j1T.js | 77.1 kB · brotli 25.6 kB |
| dist/client/assets/LibraryPanel-DsCy6jNa.js | 76.6 kB · brotli 18.6 kB |
| dist/client/assets/ContextModelDescriptorsPanel-DUMC1oSP.js | 74.1 kB · brotli 21.0 kB |
| dist/client/assets/runtime-core.esm-bundler-Db--SZRP.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ExploreData-CzvZE2x2.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/ContextList-BaeQ-OWW.js | 55.5 kB · brotli 9.7 kB |
| dist/client/assets/Table-D-Tw8X8P.js | 51.1 kB · brotli 11.9 kB |
| dist/client/assets/sdk.modern-uK7G7M7W.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-DW5tWT92.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-D6MCFvlt.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-CDnTAYnr.js | 12.5 kB · brotli 4.1 kB |
| dist/client/assets/performanceTracking-CBQTj8sZ.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel--KjY1pnu.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-DXpMLidR.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-Cb-jos6G.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog-C4lsHG07.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-COPzFK1w.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-BKN7EeEi.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-DXLM0Nj4.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-iAv1piTL.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-Bxie3kFe.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-vX2b_x16.js | 3.6 kB · brotli 924 B |
| dist/client/assets/useStudioOptions-bWghsCkz.js | 3.5 kB · brotli 1.1 kB |
| dist/client/assets/EstablishDataViewsLayout-CfTtKtnk.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/StudioOptionBar-BGm0D86P.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-BmPS90li.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-qzXj7qmG.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/Card-C-_3YkIf.js | 2.7 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-BrK1yLsL.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/StudioHomeLayout-BAEkAGp1.js | 2.3 kB · brotli 718 B |
| dist/client/assets/ExplorePresentationsLayout-87hmzBLX.js | 2.2 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-DIAMp7Oo.js | 2.2 kB · brotli 927 B |
| dist/client/assets/GitHubLogo-KauBjwFp.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/configMonitor-IwWw8O-1.js | 2.0 kB · brotli 734 B |
| dist/client/assets/ContextualiseDataLayout-D5hi-5l6.js | 2.0 kB · brotli 907 B |
| dist/client/assets/ContextErdDiagramPanel-8GOJk6Lk.js | 1.9 kB · brotli 672 B |
| dist/client/assets/GridDetailPanel-HXKQhloK.js | 1.9 kB · brotli 909 B |
| dist/client/assets/AboutPanel-BRUeEZp9.js | 1.7 kB · brotli 867 B |
| dist/client/assets/Tag-g0MC42Vh.js | 1.7 kB · brotli 724 B |
| dist/client/assets/AssistantLayout-9P8nDnPq.js | 1.7 kB · brotli 786 B |
| dist/client/assets/EmptyPlaceholder-CQrnoJyU.js | 1.5 kB · brotli 680 B |
| dist/client/assets/ManageConfigLayout-BqKKtcu6.js | 1.4 kB · brotli 728 B |
| dist/client/assets/accountMonitor-Doi9FHU1.js | 1.4 kB · brotli 522 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/createLucideIcon-KtrcG8_E.js | 1.3 kB · brotli 697 B |
| dist/client/assets/DialogModal-D2WWHNWO.js | 1.3 kB · brotli 649 B |
| dist/client/assets/ManagePersonalDetailsPanel-CiIEcsZY.js | 1.3 kB · brotli 272 B |
| dist/client/assets/StudioLayout-DBhNdWaE.js | 1.2 kB · brotli 668 B |
| dist/client/assets/establishDataViews-QqA3xfSM.js | 1.2 kB · brotli 540 B |
| dist/client/assets/ListItemButton-5iizgztz.js | 1.1 kB · brotli 519 B |
| dist/client/assets/SelectPlaceholder-D9r6ei4r.js | 1005 B · brotli 534 B |
| dist/client/assets/AssistantHeader-C-rSdC9P.js | 991 B · brotli 526 B |
| dist/client/assets/ContextDimensionTreeDiagramPanel-D7Rq_Ei6.js | 989 B · brotli 501 B |
| dist/client/assets/Input-CggCruaK.js | 929 B · brotli 513 B |
| dist/client/assets/HomePanel-CLGxwrnU.js | 873 B · brotli 495 B |
| dist/client/assets/BuildDataAppsLayout-BODxZY77.js | 869 B · brotli 459 B |
| dist/client/assets/useApi-CROJJdhE-DSjYcI3s.js | 830 B · brotli 402 B |
| dist/client/assets/PaneSplitter-MwkIRH-k.js | 806 B · brotli 443 B |
| dist/client/assets/useEngine-CHfEzqFB.js | 644 B · brotli 329 B |
| dist/client/assets/HomeIcon-CgPVFG0z.js | 607 B · brotli 373 B |
| dist/client/assets/CloseButton-BVUkun_J.js | 589 B · brotli 322 B |
| dist/client/assets/AuditContentPanel-Djdetw9X.js | 563 B · brotli 338 B |
| dist/client/assets/Separator-CzEwczbr.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-DLgaf0Gh.js | 528 B · brotli 299 B |
| dist/client/assets/ManageSubscriptionPanel-CX8pgqFR.js | 323 B · brotli 206 B |
| dist/client/assets/ManageDataServiceTokensPanel-B7Bch-4i.js | 320 B · brotli 207 B |
| dist/client/assets/ManageConnectionPanel-DXOJMM80.js | 317 B · brotli 202 B |
| dist/client/assets/DialogHeader-7ZW4--EO.js | 314 B · brotli 212 B |
| dist/client/assets/GenerateTokenPanel-Bv2qVnNC.js | 309 B · brotli 200 B |
| dist/client/assets/ManageSessionsPanel-CTEijJQz.js | 309 B · brotli 200 B |
| dist/client/assets/ReviewActivityPanel-CyoDxaYV.js | 309 B · brotli 200 B |
| dist/client/assets/DeleteAccountPanel-DWC1k6ic.js | 308 B · brotli 200 B |
| dist/client/assets/ManageAccessPanel-59jRVJMB.js | 307 B · brotli 200 B |
| dist/client/assets/arrow-big-left-3xYNRbbc.js | 291 B · brotli 190 B |
| dist/client/assets/x-Cz1razSS.js | 154 B · brotli 125 B |
| dist/client/assets/plus-BULtNroe.js | 153 B · brotli 136 B |
| dist/client/assets/chevron-right-eC4yQJbT.js | 130 B · brotli 115 B |
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
