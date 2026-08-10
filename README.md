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
| dist/client/assets/LibraryPanel-BBijoBY4.js | 127.1 kB · brotli 29.6 kB |
| dist/client/assets/AuthDialog-D_lcsJ-o.js | 78.5 kB · brotli 21.4 kB |
| dist/client/assets/ContextModelDescriptorsPanel-BrHimuXC.js | 74.1 kB · brotli 21.0 kB |
| dist/client/assets/runtime-core.esm-bundler-BVTNtdRT.js | 65.4 kB · brotli 23.1 kB |
| dist/client/assets/ExploreData-BLLfIM1t.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/ContextList-C3dPA-Zb.js | 54.8 kB · brotli 9.6 kB |
| dist/client/assets/Table-Hht4fiF9.js | 51.7 kB · brotli 12.1 kB |
| dist/client/assets/index-9apghRMH.js | 49.1 kB · brotli 16.5 kB |
| dist/client/assets/purify.es-BKQOAcDz.js | 26.5 kB · brotli 9.1 kB |
| dist/client/assets/sdk.modern-uK7G7M7W.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-C0jAkXOb.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-B14ENSSQ.js | 23.6 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-CwmZvcco.js | 12.4 kB · brotli 4.0 kB |
| dist/client/assets/performanceTracking-tzZjj05F.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-xyGOF2U1.js | 7.0 kB · brotli 1.8 kB |
| dist/client/assets/SelectItemPanel-C7OrjheE.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-DQqo2XRg.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/DataViewList-TKbG5KEP.js | 5.8 kB · brotli 2.2 kB |
| dist/client/assets/ConnectionDialog-DKg0hRav.js | 5.5 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-D7k9eeOK.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-BuV7Hj-u.js | 4.9 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-CGdzIm1O.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-DA0i9pBr.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-aRbi19sr.js | 3.9 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-DMtQrpPN.js | 3.7 kB · brotli 929 B |
| dist/client/assets/ConfigCard-XlZhj34Y.js | 3.7 kB · brotli 1.3 kB |
| dist/client/assets/useStudioOptions-D1u9Lymt.js | 3.6 kB · brotli 1.1 kB |
| dist/client/assets/Grid-x8F8yxUj.js | 3.6 kB · brotli 1.5 kB |
| dist/client/assets/StudioOptionBar-BdEtTluY.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/EstablishDataViewsLayout-CaI01V5W.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/dataViews-CKkgKw1v.js | 2.5 kB · brotli 898 B |
| dist/client/assets/EventQueryList-CzNDqoqq.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-C_dz70gk.js | 2.2 kB · brotli 923 B |
| dist/client/assets/ExplorePresentationsLayout-C3sO3gVH.js | 2.2 kB · brotli 1.1 kB |
| dist/client/assets/GitHubLogo-E2wt_zfl.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/StudioHomeLayout-CBmW25ac.js | 2.1 kB · brotli 702 B |
| dist/client/assets/configMonitor-DL1RKI5t.js | 2.0 kB · brotli 749 B |
| dist/client/assets/GridDetailPanel-CY-aIRGo.js | 1.9 kB · brotli 917 B |
| dist/client/assets/ContextualiseDataLayout-Im_nwJy8.js | 1.9 kB · brotli 893 B |
| dist/client/assets/ContextErdDiagramPanel-CayamsRA.js | 1.9 kB · brotli 673 B |
| dist/client/assets/AboutPanel-BbRB4TV2.js | 1.7 kB · brotli 875 B |
| dist/client/assets/AssistantLayout-CJ9waKK4.js | 1.5 kB · brotli 737 B |
| dist/client/assets/EmptyPlaceholder-BE_b5H1I.js | 1.5 kB · brotli 679 B |
| dist/client/assets/accountMonitor-DqzcKEzb.js | 1.4 kB · brotli 516 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/ManageConfigLayout-mv9VPLr-.js | 1.3 kB · brotli 721 B |
| dist/client/assets/Tag-BLjah1Ct.js | 1.3 kB · brotli 624 B |
| dist/client/assets/createLucideIcon-C9SFe7-l.js | 1.3 kB · brotli 694 B |
| dist/client/assets/DialogModal-CNM2dxTi.js | 1.3 kB · brotli 648 B |
| dist/client/assets/ManagePersonalDetailsPanel-JN2bsOee.js | 1.3 kB · brotli 268 B |
| dist/client/assets/StudioLayout-BscE4G6n.js | 1.2 kB · brotli 668 B |
| dist/client/assets/ListItemButton-BldTZaRA.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-BvGS0Ml2.js | 1005 B · brotli 538 B |
| dist/client/assets/ContextDimensionTreeDiagramPanel-BNvqXYbZ.js | 989 B · brotli 499 B |
| dist/client/assets/Input-CT5J76-s.js | 924 B · brotli 529 B |
| dist/client/assets/useApi-CROJJdhE-BWQSVrf2.js | 830 B · brotli 409 B |
| dist/client/assets/BuildDataAppsLayout-DVu8etVU.js | 827 B · brotli 447 B |
| dist/client/assets/HomePanel-DNRC_EeN.js | 810 B · brotli 469 B |
| dist/client/assets/PaneSplitter-DQc8LoWu.js | 806 B · brotli 442 B |
| dist/client/assets/useEngine-DjMXuUAu.js | 644 B · brotli 326 B |
| dist/client/assets/HomeIcon-Dk0pRo0U.js | 607 B · brotli 362 B |
| dist/client/assets/CloseButton-CYjwGJiI.js | 589 B · brotli 321 B |
| dist/client/assets/AuditContentPanel-peUI1ln1.js | 562 B · brotli 337 B |
| dist/client/assets/Separator-CuX6Oe02.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-BtbfIgUl.js | 528 B · brotli 319 B |
| dist/client/assets/asyncPanel-DGQQApz7.js | 472 B · brotli 291 B |
| dist/client/assets/ManageSubscriptionPanel-CaGOk6_O.js | 323 B · brotli 207 B |
| dist/client/assets/ManageDataServiceTokensPanel-ChMNbSc9.js | 320 B · brotli 206 B |
| dist/client/assets/ManageConnectionPanel-DWl7TaOE.js | 317 B · brotli 202 B |
| dist/client/assets/DialogHeader-C264-v5F.js | 314 B · brotli 211 B |
| dist/client/assets/GenerateTokenPanel-L6hZVCdv.js | 309 B · brotli 201 B |
| dist/client/assets/ManageSessionsPanel-wjCkkWHv.js | 309 B · brotli 201 B |
| dist/client/assets/ReviewActivityPanel-Co2XVkRo.js | 309 B · brotli 201 B |
| dist/client/assets/DeleteAccountPanel-CpndXpus.js | 308 B · brotli 201 B |
| dist/client/assets/ManageAccessPanel-Cq438whL.js | 307 B · brotli 201 B |
| dist/client/assets/arrow-big-left-Ctpaku-U.js | 291 B · brotli 190 B |
| dist/client/assets/x-Cdyc9U8e.js | 154 B · brotli 153 B |
| dist/client/assets/plus-5D4HzBml.js | 153 B · brotli 121 B |
| dist/client/assets/chevron-right-BgQ_EZUv.js | 130 B · brotli 116 B |
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
