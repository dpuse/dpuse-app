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
| dist/client/assets/dist-BCRjoha3.js | 279.8 kB · brotli 73.2 kB |
| dist/client/assets/ChatPanel-D49E29YW.js | 205.8 kB · brotli 45.0 kB |
| dist/client/assets/ChartNode-DcIt6h1w.js | 159.0 kB · brotli 47.9 kB |
| dist/client/assets/DocumentEditorView-C4p8RmyD.js | 155.2 kB · brotli 42.8 kB |
| dist/client/assets/index-C4KyIm4Q.js | 102.1 kB · brotli 33.4 kB |
| dist/client/assets/AuthDialog--AZOX2kY.js | 77.7 kB · brotli 21.2 kB |
| dist/client/assets/LibraryPanel-D19cNYYa.js | 71.7 kB · brotli 17.4 kB |
| dist/client/assets/runtime-core.esm-bundler-BIebCysl.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-B-2u_wYR.js | 61.9 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-D_CXjrqI.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-Dwvqss82.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-B3tR9ISe.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-WNcBXYd6.js | 22.9 kB · brotli 6.4 kB |
| dist/client/assets/Tag-BfsTz8xB.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-BqVa8c_4.js | 8.8 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-bI6aDuVo.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-Bnnz9A68.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-B3-jYBDQ.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-Dekmj1sJ.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-DcE440la.js | 6.5 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-B5t3c4Mf.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-DajuwdCd.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-C6AOiCDe.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-BJbwn_gW.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-zMEZ4k34.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/GridDetailPanel-BSqJEuTE.js | 3.9 kB · brotli 1.5 kB |
| dist/client/assets/useConfigOptionConfigs-DYAnxN_C.js | 3.4 kB · brotli 817 B |
| dist/client/assets/EstablishDataViewsLayout-Wq736w-e.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-C9SoVnrg.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-LgyeWm15.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-D1mHo4SX.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-DFcEQr6e.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-D-fChgpz.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DimensionList-Bdkl0GHy.js | 2.1 kB · brotli 995 B |
| dist/client/assets/ContextList-BsWw8zxV.js | 2.1 kB · brotli 998 B |
| dist/client/assets/GitHubLogo-fnXHziAK.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-DFlUlCb5.js | 2.0 kB · brotli 923 B |
| dist/client/assets/configMonitor-CX-ao3qo.js | 1.8 kB · brotli 699 B |
| dist/client/assets/AboutPanel-BfhgIaNO.js | 1.7 kB · brotli 874 B |
| dist/client/assets/KnowledgeLayout-CWK8qGZu.js | 1.6 kB · brotli 733 B |
| dist/client/assets/EmptyPlaceholder-Cn4RqnqA.js | 1.5 kB · brotli 689 B |
| dist/client/assets/ManageConfigsLayout-Cr40zFAj.js | 1.4 kB · brotli 742 B |
| dist/client/assets/HomeLayout-CUSDOKvP.js | 1.4 kB · brotli 681 B |
| dist/client/assets/accountMonitor-DtICIzoE.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-DBEf96kJ.js | 1.3 kB · brotli 598 B |
| dist/client/assets/TextField-DKL5-Gpr.js | 1.3 kB · brotli 729 B |
| dist/client/assets/DialogModal-DijV65wW.js | 1.2 kB · brotli 636 B |
| dist/client/assets/ManagePersonalDetailsPanel-vJuCW7F-.js | 1.2 kB · brotli 254 B |
| dist/client/assets/establishDataViews-C0zdozMT.js | 1.2 kB · brotli 536 B |
| dist/client/assets/ListItemButton-CqzqN9B5.js | 1.1 kB · brotli 522 B |
| dist/client/assets/WorkbenchHeader-BSwD5DlA.js | 1002 B · brotli 561 B |
| dist/client/assets/SelectPlaceholder-B4dkS0qA.js | 925 B · brotli 521 B |
| dist/client/assets/Input-BuWjhOXG.js | 871 B · brotli 507 B |
| dist/client/assets/useApi-s_02lHjl-CTSnjKJW.js | 863 B · brotli 418 B |
| dist/client/assets/HomePanel-e8f4Opzb.js | 857 B · brotli 509 B |
| dist/client/assets/AssembleDimensionsLayout-D59RmK9j.js | 812 B · brotli 435 B |
| dist/client/assets/PaneSplitter-C--GhAya.js | 806 B · brotli 442 B |
| dist/client/assets/BuildDataAppsLayout-CeiZ7hST.js | 797 B · brotli 437 B |
| dist/client/assets/useEngine-1kGQpmCp.js | 648 B · brotli 336 B |
| dist/client/assets/HomeIcon-DscGQ5Gw.js | 607 B · brotli 371 B |
| dist/client/assets/CloseButton-DTscxave.js | 588 B · brotli 326 B |
| dist/client/assets/AuditContentPanel-aV2lSj8q.js | 563 B · brotli 336 B |
| dist/client/assets/Separator-CmF68kJC.js | 557 B · brotli 296 B |
| dist/client/assets/ManagePreferencesPanel-CgvfLMgF.js | 494 B · brotli 283 B |
| dist/client/assets/DialogHeader-B3fBUesm.js | 314 B · brotli 212 B |
| dist/client/assets/WorkbenchLayout-CdQgnMNr.js | 305 B · brotli 213 B |
| dist/client/assets/ManageSubscriptionPanel-C9ErRQ1S.js | 303 B · brotli 196 B |
| dist/client/assets/ManageDataServiceTokensPanel-CPub-qAI.js | 300 B · brotli 194 B |
| dist/client/assets/ManageConnectionPanel-DsfNDlDR.js | 297 B · brotli 194 B |
| dist/client/assets/GenerateTokenPanel-C9oayqlS.js | 289 B · brotli 193 B |
| dist/client/assets/ManageSessionsPanel-joto_bXP.js | 289 B · brotli 194 B |
| dist/client/assets/ReviewActivityPanel-C23hTCUq.js | 289 B · brotli 191 B |
| dist/client/assets/DeleteAccountPanel-CjG_5Xam.js | 288 B · brotli 193 B |
| dist/client/assets/ManageAccessPanel-mN0LoPaC.js | 287 B · brotli 193 B |
| dist/client/assets/arrow-big-left-DgL0VIII.js | 280 B · brotli 186 B |
| dist/client/assets/PresenterList-qKcZh0zk.js | 216 B · brotli 159 B |
| dist/client/assets/CookbookList-DgJ-Glbn.js | 215 B · brotli 161 B |
| dist/client/assets/x-hO2tOvLY.js | 143 B · brotli 121 B |

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
