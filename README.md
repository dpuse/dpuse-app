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
| dist/client/assets/ChatPanel-0n-F5OuD.js | 151.2 kB · brotli 35.7 kB |
| dist/client/assets/AuthDialog-B-NSFa9a.js | 78.0 kB · brotli 21.3 kB |
| dist/client/assets/index-D3QcYqO-.js | 77.1 kB · brotli 25.6 kB |
| dist/client/assets/LibraryPanel-CA7X5eOn.js | 76.6 kB · brotli 18.6 kB |
| dist/client/assets/ContextModelDescriptorsPanel-BZEnDXbx.js | 74.1 kB · brotli 21.1 kB |
| dist/client/assets/runtime-core.esm-bundler-BzFXY5Yz.js | 65.3 kB · brotli 23.1 kB |
| dist/client/assets/ExploreData-DDOGpTn2.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/ContextList-BMNBmVTh.js | 54.7 kB · brotli 9.6 kB |
| dist/client/assets/Table-B78cC8tm.js | 51.1 kB · brotli 11.9 kB |
| dist/client/assets/sdk.modern-uK7G7M7W.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-CMCbYZk2.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-CgLue0gk.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-C-Pp8HfC.js | 12.5 kB · brotli 4.1 kB |
| dist/client/assets/performanceTracking-C8opmzVu.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-BlJQdk40.js | 7.1 kB · brotli 1.8 kB |
| dist/client/assets/SelectItemPanel-0ZyCpzld.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-BfBa8mKT.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog-D4MUSUZt.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-DJZKJOnE.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-BwuWwCxh.js | 4.9 kB · brotli 1.6 kB |
| dist/client/assets/PresenterList-D2BfiIlt.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-CM300EBw.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-DcI13iwn.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-CJ-mSye-.js | 3.6 kB · brotli 923 B |
| dist/client/assets/Grid-BVPxEOPD.js | 3.6 kB · brotli 1.5 kB |
| dist/client/assets/useStudioOptions-CnKRgYW7.js | 3.5 kB · brotli 1.1 kB |
| dist/client/assets/ComponentCard-CR0KxMpf.js | 3.2 kB · brotli 1.2 kB |
| dist/client/assets/StudioOptionBar-B6YBh8DO.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/EstablishDataViewsLayout-DcOavlOz.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/EventQueryList-CPre5J8c.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DataViewList-gRKU6YQc.js | 2.4 kB · brotli 1.0 kB |
| dist/client/assets/StudioHomeLayout-C5xSSXK6.js | 2.3 kB · brotli 721 B |
| dist/client/assets/DetailActionBar-B-hbuTBu.js | 2.2 kB · brotli 928 B |
| dist/client/assets/ExplorePresentationsLayout-CpY_nQf8.js | 2.2 kB · brotli 1.1 kB |
| dist/client/assets/dataViews-DLFBTErI.js | 2.2 kB · brotli 869 B |
| dist/client/assets/GitHubLogo-BqTpUGib.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/configMonitor-DVDNVYnn.js | 2.0 kB · brotli 737 B |
| dist/client/assets/ContextualiseDataLayout-FRDEtU7e.js | 1.9 kB · brotli 899 B |
| dist/client/assets/ContextErdDiagramPanel-CyMdcJcJ.js | 1.9 kB · brotli 672 B |
| dist/client/assets/GridDetailPanel-DfaM4C81.js | 1.9 kB · brotli 911 B |
| dist/client/assets/AboutPanel-BMsBTzm5.js | 1.7 kB · brotli 872 B |
| dist/client/assets/Tag-BlNJ31Z1.js | 1.7 kB · brotli 727 B |
| dist/client/assets/AssistantLayout-Cpc0gOIF.js | 1.7 kB · brotli 785 B |
| dist/client/assets/EmptyPlaceholder-CRw6iN8K.js | 1.5 kB · brotli 681 B |
| dist/client/assets/accountMonitor-pAiu0Zw6.js | 1.4 kB · brotli 518 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/ManageConfigLayout-fnkLAmzs.js | 1.3 kB · brotli 718 B |
| dist/client/assets/createLucideIcon-CZh6lXOE.js | 1.3 kB · brotli 700 B |
| dist/client/assets/DialogModal-DcU9Qc4a.js | 1.3 kB · brotli 649 B |
| dist/client/assets/ManagePersonalDetailsPanel-BtVlP74Y.js | 1.3 kB · brotli 268 B |
| dist/client/assets/StudioLayout-SQpk5cFg.js | 1.2 kB · brotli 669 B |
| dist/client/assets/ListItemButton-bE2tErQh.js | 1.1 kB · brotli 518 B |
| dist/client/assets/AssistantHeader-BSfloT4e.js | 1022 B · brotli 568 B |
| dist/client/assets/SelectPlaceholder-TUo4bI3J.js | 1005 B · brotli 538 B |
| dist/client/assets/ContextDimensionTreeDiagramPanel-BvAk66Yx.js | 989 B · brotli 501 B |
| dist/client/assets/Input-Ce07qM_j.js | 924 B · brotli 533 B |
| dist/client/assets/HomePanel-ZdiHWV5Z.js | 881 B · brotli 497 B |
| dist/client/assets/useApi-CROJJdhE-CMyVH91t.js | 830 B · brotli 415 B |
| dist/client/assets/BuildDataAppsLayout-D4S0HIBE.js | 822 B · brotli 445 B |
| dist/client/assets/PaneSplitter-B4NyJ4UQ.js | 806 B · brotli 444 B |
| dist/client/assets/useEngine-D7nJ8WN_.js | 644 B · brotli 327 B |
| dist/client/assets/HomeIcon-kyCNFW-s.js | 607 B · brotli 362 B |
| dist/client/assets/CloseButton-DFy_JPoN.js | 589 B · brotli 322 B |
| dist/client/assets/AuditContentPanel-BgiY7Lnh.js | 562 B · brotli 337 B |
| dist/client/assets/Separator-C_wRNxcg.js | 557 B · brotli 293 B |
| dist/client/assets/ManagePreferencesPanel-CXnASj_J.js | 528 B · brotli 316 B |
| dist/client/assets/asyncPanel-DCQSzmVB.js | 472 B · brotli 291 B |
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
