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
| dist/client/assets/ChatPanel-03P8OuuG.js | 206.0 kB · brotli 45.1 kB |
| dist/client/assets/index-CogwiGmo.js | 102.0 kB · brotli 33.4 kB |
| dist/client/assets/AuthDialog-Xt4kmiSP.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-0i17wIjD.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-BCenxOCO.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-BB4rB57l.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-CdYVqFZZ.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-1KDbo74Z.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-BxrRODr7.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-DQUkh4f9.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-9Bi8KutF.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-BiJ-_dKf.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-D94Komym.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-CvrgsECn.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-MCrpv06l.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-Ct9H38zu.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-BienEQWC.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-CuoLnJwG.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-8ZDwqXLs.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-DBOFDA04.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-B6Dv2I7J.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-CYGezI7S.js | 3.4 kB · brotli 815 B |
| dist/client/assets/EstablishDataViewsLayout-BeqQKluQ.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-Ch6KrF0m.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-C-fiso6S.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-6jTJgMbw.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-BstX0l2G.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-gezEVZ0n.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-BTPkiNwI.js | 2.2 kB · brotli 915 B |
| dist/client/assets/DimensionList-BFMQCRhY.js | 2.1 kB · brotli 993 B |
| dist/client/assets/ContextList-BCNGf960.js | 2.1 kB · brotli 998 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-2g2bXBOA.js | 1.9 kB · brotli 957 B |
| dist/client/assets/GridDetailPanel-DcUd5l57.js | 1.8 kB · brotli 886 B |
| dist/client/assets/configMonitor-DaQ1qVKT.js | 1.8 kB · brotli 697 B |
| dist/client/assets/AboutPanel-BE4p6LHD.js | 1.7 kB · brotli 872 B |
| dist/client/assets/KnowledgeLayout-BG6uSuI3.js | 1.6 kB · brotli 731 B |
| dist/client/assets/EmptyPlaceholder-DIF2wxr4.js | 1.5 kB · brotli 684 B |
| dist/client/assets/ManageConfigsLayout-CIsJwDvC.js | 1.4 kB · brotli 729 B |
| dist/client/assets/accountMonitor-CP28BRi_.js | 1.3 kB · brotli 513 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-jhXg89b6.js | 1.3 kB · brotli 740 B |
| dist/client/assets/HomeLayout-DQDrVNhV.js | 1.3 kB · brotli 674 B |
| dist/client/assets/DialogModal-C90k9X3q.js | 1.2 kB · brotli 639 B |
| dist/client/assets/ManagePersonalDetailsPanel-Cpro1vbt.js | 1.2 kB · brotli 252 B |
| dist/client/assets/WorkbenchLayout-DfpqQfcx.js | 1.2 kB · brotli 614 B |
| dist/client/assets/establishDataViews-CefsMTJ4.js | 1.2 kB · brotli 535 B |
| dist/client/assets/ListItemButton-DiaVb6Dl.js | 1.1 kB · brotli 520 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-D8gsq75h.js | 857 B · brotli 501 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-CmF89mQp.js | 769 B · brotli 419 B |
| dist/client/assets/BuildDataAppsLayout-Clg0qpNw.js | 754 B · brotli 420 B |
| dist/client/assets/useEngine-CxXFMKZ-.js | 669 B · brotli 340 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CW93Rr1V.js | 588 B · brotli 326 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-CAJeNjBf.js | 494 B · brotli 280 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-BLC6O3Xy.js | 303 B · brotli 194 B |
| dist/client/assets/ManageDataServiceTokensPanel-DBkTtWUc.js | 300 B · brotli 190 B |
| dist/client/assets/ManageConnectionPanel-Cl8uxSP2.js | 297 B · brotli 186 B |
| dist/client/assets/GenerateTokenPanel-Ct9si2WX.js | 289 B · brotli 185 B |
| dist/client/assets/ManageSessionsPanel-C5dFmwZl.js | 289 B · brotli 186 B |
| dist/client/assets/ReviewActivityPanel-B671fwyq.js | 289 B · brotli 185 B |
| dist/client/assets/DeleteAccountPanel-DFMrTCXI.js | 288 B · brotli 184 B |
| dist/client/assets/ManageAccessPanel-Cy6f054O.js | 287 B · brotli 184 B |
| dist/client/assets/arrow-big-left-gKGrJjnD.js | 280 B · brotli 184 B |
| dist/client/assets/PresenterList-DM44isHL.js | 216 B · brotli 156 B |
| dist/client/assets/CookbookList-kv5Y4AnK.js | 215 B · brotli 158 B |
| dist/client/assets/x-DbKe1M0Y.js | 143 B · brotli 125 B |

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
