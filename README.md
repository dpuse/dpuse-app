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
| dist/client/assets/ChatPanel-H7oYq-cr.js | 151.3 kB · brotli 35.8 kB |
| dist/client/assets/AuthDialog-_J0Z7uDN.js | 78.0 kB · brotli 21.4 kB |
| dist/client/assets/index-CEErDwfx.js | 77.2 kB · brotli 25.6 kB |
| dist/client/assets/LibraryPanel-BjN4urdF.js | 76.6 kB · brotli 18.6 kB |
| dist/client/assets/ContextModelDescriptorsPanel-CMTHUixG.js | 74.1 kB · brotli 21.0 kB |
| dist/client/assets/runtime-core.esm-bundler-BzFXY5Yz.js | 65.3 kB · brotli 23.1 kB |
| dist/client/assets/ExploreData-7nRoYKIB.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/ContextList-Ba7QuA8Q.js | 54.7 kB · brotli 9.6 kB |
| dist/client/assets/Table-CR7VxUJ3.js | 51.1 kB · brotli 11.9 kB |
| dist/client/assets/sdk.modern-uK7G7M7W.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-CMCbYZk2.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-CgLue0gk.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-CYGTWoOU.js | 12.5 kB · brotli 4.1 kB |
| dist/client/assets/performanceTracking-XUGN3FDT.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-DYdoujRZ.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-Bz-r_oSn.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-B8245-fz.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog-BnsI0MoX.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-DJZKJOnE.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-SZIkomtA.js | 4.9 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-BCTbMUBx.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-BOilMp-V.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-CxZYmqgY.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs--0LkbU5c.js | 3.6 kB · brotli 924 B |
| dist/client/assets/useStudioOptions-DJXmvSEM.js | 3.5 kB · brotli 1.1 kB |
| dist/client/assets/StudioOptionBar-CBc_bBX2.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/EstablishDataViewsLayout-4x6bmA3e.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/Grid-CB3nK_ad.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-CTthfX1h.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/Card-BNVwUhbZ.js | 2.8 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-CvjpVy-n.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/StudioHomeLayout-CY2QB6oZ.js | 2.3 kB · brotli 723 B |
| dist/client/assets/DetailActionBar-B-hbuTBu.js | 2.2 kB · brotli 928 B |
| dist/client/assets/ExplorePresentationsLayout-DNknhDsT.js | 2.2 kB · brotli 1.1 kB |
| dist/client/assets/GitHubLogo-BqTpUGib.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/configMonitor-ChHubYiW.js | 2.0 kB · brotli 735 B |
| dist/client/assets/ContextualiseDataLayout-BYIm1iB0.js | 1.9 kB · brotli 894 B |
| dist/client/assets/ContextErdDiagramPanel-C0wU_W16.js | 1.9 kB · brotli 671 B |
| dist/client/assets/GridDetailPanel-DQqKl-tb.js | 1.9 kB · brotli 909 B |
| dist/client/assets/AboutPanel-Dfhj57ow.js | 1.7 kB · brotli 872 B |
| dist/client/assets/Tag-BlNJ31Z1.js | 1.7 kB · brotli 727 B |
| dist/client/assets/AssistantLayout-aL6S1YoC.js | 1.7 kB · brotli 781 B |
| dist/client/assets/EmptyPlaceholder-CRw6iN8K.js | 1.5 kB · brotli 681 B |
| dist/client/assets/accountMonitor-to_IXtAU.js | 1.4 kB · brotli 522 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/ManageConfigLayout-BmjG8Rk1.js | 1.3 kB · brotli 718 B |
| dist/client/assets/createLucideIcon-CZh6lXOE.js | 1.3 kB · brotli 700 B |
| dist/client/assets/DialogModal-DcU9Qc4a.js | 1.3 kB · brotli 649 B |
| dist/client/assets/ManagePersonalDetailsPanel-BtVlP74Y.js | 1.3 kB · brotli 268 B |
| dist/client/assets/StudioLayout-D4ZAOtht.js | 1.2 kB · brotli 664 B |
| dist/client/assets/establishDataViews-BI3D8wGq.js | 1.2 kB · brotli 539 B |
| dist/client/assets/ListItemButton-bE2tErQh.js | 1.1 kB · brotli 518 B |
| dist/client/assets/SelectPlaceholder-TUo4bI3J.js | 1005 B · brotli 538 B |
| dist/client/assets/ContextDimensionTreeDiagramPanel-C8qES4NS.js | 989 B · brotli 501 B |
| dist/client/assets/AssistantHeader-DrVbzQxJ.js | 988 B · brotli 526 B |
| dist/client/assets/Input-n65tSnM1.js | 924 B · brotli 534 B |
| dist/client/assets/HomePanel-D4XqR40a.js | 872 B · brotli 495 B |
| dist/client/assets/useApi-CROJJdhE-CMyVH91t.js | 830 B · brotli 415 B |
| dist/client/assets/BuildDataAppsLayout-qRkrShOR.js | 822 B · brotli 446 B |
| dist/client/assets/PaneSplitter-B4NyJ4UQ.js | 806 B · brotli 444 B |
| dist/client/assets/useEngine-kSl7c9HZ.js | 644 B · brotli 329 B |
| dist/client/assets/HomeIcon-kyCNFW-s.js | 607 B · brotli 362 B |
| dist/client/assets/CloseButton-DFy_JPoN.js | 589 B · brotli 322 B |
| dist/client/assets/AuditContentPanel-BgiY7Lnh.js | 562 B · brotli 337 B |
| dist/client/assets/Separator-C_wRNxcg.js | 557 B · brotli 293 B |
| dist/client/assets/ManagePreferencesPanel-Cn0cuxQS.js | 528 B · brotli 294 B |
| dist/client/assets/asyncPanel-BdRtHW7_.js | 507 B · brotli 316 B |
| dist/client/assets/ManageSubscriptionPanel-DzrqE6MJ.js | 323 B · brotli 207 B |
| dist/client/assets/ManageDataServiceTokensPanel-Dvi8wlwk.js | 320 B · brotli 206 B |
| dist/client/assets/ManageConnectionPanel-xaHujFTS.js | 317 B · brotli 202 B |
| dist/client/assets/DialogHeader-dzv62G15.js | 314 B · brotli 210 B |
| dist/client/assets/GenerateTokenPanel-DrcEQ5ER.js | 309 B · brotli 200 B |
| dist/client/assets/ManageSessionsPanel-13YPV4L0.js | 309 B · brotli 201 B |
| dist/client/assets/ReviewActivityPanel-CbW5Ht3Q.js | 309 B · brotli 200 B |
| dist/client/assets/DeleteAccountPanel-v-PAlwJt.js | 308 B · brotli 200 B |
| dist/client/assets/ManageAccessPanel-CquIaE1R.js | 307 B · brotli 200 B |
| dist/client/assets/arrow-big-left-CedjHS6A.js | 291 B · brotli 192 B |
| dist/client/assets/x-DooyY89_.js | 154 B · brotli 149 B |
| dist/client/assets/plus-CATSUnNI.js | 153 B · brotli 123 B |
| dist/client/assets/chevron-right-BxxNw4_4.js | 130 B · brotli 115 B |
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
