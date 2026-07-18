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
| dist/client/assets/ChatPanel-B1zZJyHx.js | 206.0 kB · brotli 45.1 kB |
| dist/client/assets/index-_6XnZ-EQ.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-Be3sRX-c.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-5aZdytAK.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-pgNhQRol.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-vPr0kNaL.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-Cx0iKfV3.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-ClY3w2gL.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-BwFC6gno.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-DgZOXNff.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-DnBKFcjv.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-DR9Gov24.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-D1YWM4lQ.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-CTn8SX2-.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-j-VtK3pv.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-D6FhTnBi.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-DhcSPUm6.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-Dkg9pY58.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-BgfvSKrU.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-oY4yOB5P.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-BOYrg4zc.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-DqmKIOaG.js | 3.4 kB · brotli 815 B |
| dist/client/assets/EstablishDataViewsLayout-Lxe5IbBr.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-CLyjNUT_.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-BDRDLF0F.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-DhDOaV3z.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-DesRohYg.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-DA6i7DLA.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-pyiHZrch.js | 2.2 kB · brotli 916 B |
| dist/client/assets/DimensionList-CDZJLEOS.js | 2.1 kB · brotli 991 B |
| dist/client/assets/ContextList-DpBEWHZj.js | 2.1 kB · brotli 996 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-CPbM296G.js | 2.0 kB · brotli 969 B |
| dist/client/assets/GridDetailPanel-DzC6gokS.js | 1.8 kB · brotli 892 B |
| dist/client/assets/configMonitor-54IgNuhn.js | 1.8 kB · brotli 698 B |
| dist/client/assets/AboutPanel-h-xQyRh2.js | 1.7 kB · brotli 872 B |
| dist/client/assets/KnowledgeLayout-DTq2iwgU.js | 1.6 kB · brotli 729 B |
| dist/client/assets/EmptyPlaceholder-DiCl4A85.js | 1.5 kB · brotli 690 B |
| dist/client/assets/ManageConfigsLayout-CEzfVKc-.js | 1.4 kB · brotli 729 B |
| dist/client/assets/accountMonitor-DHIhcCB-.js | 1.3 kB · brotli 513 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-CI3AaVDv.js | 1.3 kB · brotli 726 B |
| dist/client/assets/HomeLayout-D27VNIb0.js | 1.3 kB · brotli 677 B |
| dist/client/assets/DialogModal-Dkej1D1F.js | 1.2 kB · brotli 634 B |
| dist/client/assets/ManagePersonalDetailsPanel-BgIJSTL3.js | 1.2 kB · brotli 256 B |
| dist/client/assets/WorkbenchLayout-jUDR3X9N.js | 1.2 kB · brotli 612 B |
| dist/client/assets/establishDataViews-BGM5lXyK.js | 1.2 kB · brotli 540 B |
| dist/client/assets/ListItemButton-C5TtJRCf.js | 1.1 kB · brotli 522 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-Beh8Gi84.js | 857 B · brotli 502 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-CO6Xho_f.js | 769 B · brotli 422 B |
| dist/client/assets/BuildDataAppsLayout-0GdID9yy.js | 754 B · brotli 423 B |
| dist/client/assets/useEngine-iQuQs2Xf.js | 669 B · brotli 341 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-TUGhsdeQ.js | 588 B · brotli 328 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-Cq-CbMb3.js | 494 B · brotli 281 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-BlA628RV.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-McaECIlB.js | 300 B · brotli 192 B |
| dist/client/assets/ManageConnectionPanel-D4sqhUPx.js | 297 B · brotli 187 B |
| dist/client/assets/GenerateTokenPanel-r43LpjCp.js | 289 B · brotli 186 B |
| dist/client/assets/ManageSessionsPanel-v4fjvY6l.js | 289 B · brotli 188 B |
| dist/client/assets/ReviewActivityPanel-BblKyFR_.js | 289 B · brotli 186 B |
| dist/client/assets/DeleteAccountPanel-TuA-s-st.js | 288 B · brotli 186 B |
| dist/client/assets/ManageAccessPanel-DmzCtpu8.js | 287 B · brotli 186 B |
| dist/client/assets/arrow-big-left-CDfrgbB1.js | 280 B · brotli 215 B |
| dist/client/assets/PresenterList-DLAus1uj.js | 216 B · brotli 159 B |
| dist/client/assets/CookbookList-BjRj89Hw.js | 215 B · brotli 159 B |
| dist/client/assets/x-DljSWwhB.js | 143 B · brotli 120 B |

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
