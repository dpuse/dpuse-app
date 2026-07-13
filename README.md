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
| dist/client/assets/dist-8iMCx6aQ.js | 279.8 kB · brotli 73.2 kB |
| dist/client/assets/ChatPanel-BmrCnlPJ.js | 205.9 kB · brotli 45.0 kB |
| dist/client/assets/ChartNode-XFomadsP.js | 159.0 kB · brotli 47.9 kB |
| dist/client/assets/DocumentEditorView-88s5dJGt.js | 155.2 kB · brotli 42.8 kB |
| dist/client/assets/index-sVbahlSf.js | 102.1 kB · brotli 33.4 kB |
| dist/client/assets/AuthDialog-Rewg8IiQ.js | 77.7 kB · brotli 21.2 kB |
| dist/client/assets/LibraryPanel-CnBq5-Q3.js | 71.7 kB · brotli 17.4 kB |
| dist/client/assets/runtime-core.esm-bundler-BIebCysl.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-DQRlRVhB.js | 61.9 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-DCT4NF6N.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-ybhHeONk.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-CuFi_yz9.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-dFrzGina.js | 23.1 kB · brotli 6.5 kB |
| dist/client/assets/Tag-D75qTlgO.js | 9.0 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-S_rGe0HQ.js | 8.8 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-DnYQV_6I.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-CR9p9lIO.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SessionMenu-2oKLYTLx.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/SelectItemPanel-D2Soeq-u.js | 6.7 kB · brotli 2.7 kB |
| dist/client/assets/ConnectorList-CbzbGTZx.js | 6.0 kB · brotli 2.1 kB |
| dist/client/assets/performanceTracking-BhBz1iPl.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-CVXALCmE.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-DvQZxKcM.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-BFqRPVPS.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-BFyciZSw.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/GridDetailPanel-DXr_uu9t.js | 3.9 kB · brotli 1.5 kB |
| dist/client/assets/useConfigOptionConfigs-CiLfyCvL.js | 3.4 kB · brotli 813 B |
| dist/client/assets/EstablishDataViewsLayout-IjubEWJ9.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-C4vFfzGk.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-C58AS9r4.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-Dlxi0_j1.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/EventQueryList-CRakWcYJ.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/Card-DehQ_wUP.js | 2.1 kB · brotli 877 B |
| dist/client/assets/DimensionList-m5YmNI29.js | 2.1 kB · brotli 994 B |
| dist/client/assets/ContextList-B39FROC_.js | 2.1 kB · brotli 997 B |
| dist/client/assets/GitHubLogo-fnXHziAK.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-B98LJQPT.js | 2.0 kB · brotli 922 B |
| dist/client/assets/configMonitor-CMF8beEJ.js | 1.8 kB · brotli 678 B |
| dist/client/assets/AboutPanel-b3tsE08l.js | 1.7 kB · brotli 874 B |
| dist/client/assets/KnowledgeLayout-mbFLmz7U.js | 1.6 kB · brotli 724 B |
| dist/client/assets/EmptyPlaceholder-D979H9L9.js | 1.5 kB · brotli 688 B |
| dist/client/assets/ManageConfigsLayout-B8IQk4FD.js | 1.4 kB · brotli 742 B |
| dist/client/assets/HomeLayout-CsUOSktF.js | 1.4 kB · brotli 684 B |
| dist/client/assets/accountMonitor-DZk7JxBZ.js | 1.3 kB · brotli 510 B |
| dist/client/assets/dpuse-shared-utilities.es-DBEf96kJ.js | 1.3 kB · brotli 598 B |
| dist/client/assets/TextField-HoenpQVD.js | 1.3 kB · brotli 742 B |
| dist/client/assets/DialogModal-b1G6MIbN.js | 1.2 kB · brotli 634 B |
| dist/client/assets/ManagePersonalDetailsPanel-HU2GD8zP.js | 1.2 kB · brotli 259 B |
| dist/client/assets/establishDataViews-BZoB0nv3.js | 1.2 kB · brotli 536 B |
| dist/client/assets/ListItemButton-C-YuXWl3.js | 1.1 kB · brotli 522 B |
| dist/client/assets/WorkbenchHeader-B6V5rb5T.js | 989 B · brotli 553 B |
| dist/client/assets/SelectPlaceholder-DAa0qREK.js | 925 B · brotli 520 B |
| dist/client/assets/Input-CiSVXPhQ.js | 871 B · brotli 492 B |
| dist/client/assets/useApi-s_02lHjl-CTSnjKJW.js | 863 B · brotli 418 B |
| dist/client/assets/HomePanel-BKoUVXkp.js | 857 B · brotli 503 B |
| dist/client/assets/AssembleDimensionsLayout-CLxL0Zy_.js | 812 B · brotli 438 B |
| dist/client/assets/PaneSplitter-C--GhAya.js | 806 B · brotli 442 B |
| dist/client/assets/BuildDataAppsLayout-7GOJfI7Z.js | 797 B · brotli 435 B |
| dist/client/assets/useEngine-CiNRcm2J.js | 648 B · brotli 331 B |
| dist/client/assets/HomeIcon-DscGQ5Gw.js | 607 B · brotli 371 B |
| dist/client/assets/CloseButton-B7dfv4RO.js | 588 B · brotli 324 B |
| dist/client/assets/AuditContentPanel-aV2lSj8q.js | 563 B · brotli 336 B |
| dist/client/assets/Separator-CmF68kJC.js | 557 B · brotli 296 B |
| dist/client/assets/ManagePreferencesPanel-CtknRh4b.js | 494 B · brotli 280 B |
| dist/client/assets/DialogHeader-B3fBUesm.js | 314 B · brotli 212 B |
| dist/client/assets/WorkbenchLayout-D_WtcWRS.js | 305 B · brotli 212 B |
| dist/client/assets/ManageSubscriptionPanel-B1N_7EzB.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-LHWZNLqB.js | 300 B · brotli 193 B |
| dist/client/assets/ManageConnectionPanel-ndKK8ZT8.js | 297 B · brotli 190 B |
| dist/client/assets/GenerateTokenPanel-Ba4g31lR.js | 289 B · brotli 188 B |
| dist/client/assets/ManageSessionsPanel-jQlXPV6h.js | 289 B · brotli 189 B |
| dist/client/assets/ReviewActivityPanel-DXvik9lX.js | 289 B · brotli 187 B |
| dist/client/assets/DeleteAccountPanel-B9fzAIpP.js | 288 B · brotli 188 B |
| dist/client/assets/ManageAccessPanel-9q1QcXOR.js | 287 B · brotli 188 B |
| dist/client/assets/arrow-big-left-DBm88Lyp.js | 280 B · brotli 192 B |
| dist/client/assets/PresenterList-B30FgmYS.js | 216 B · brotli 157 B |
| dist/client/assets/CookbookList-CS1AifyQ.js | 215 B · brotli 159 B |
| dist/client/assets/x-B5EhXfJp.js | 143 B · brotli 119 B |

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
