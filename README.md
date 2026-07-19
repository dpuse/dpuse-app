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
| dist/client/assets/ChatPanel-Dn5fs_QE.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-BTNz0-ok.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-mGPSiLZ6.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-BPW23k-4.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-nzplOjx4.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-Btdf6Pby.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-pxWk3Fgc.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-CM2rt6mK.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-_AvhFpfs.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-DMsLEsF7.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-BJ46inb-.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-DmPkvhXd.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-Dygs_TOE.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-DOSxr62A.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-x-d1QBsm.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-D_E9dlsU.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-DBOomj0d.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-TGp2p3a_.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-BiYfsS16.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-CUDqTANb.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-C8EJrhgw.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-B82Oqh5H.js | 3.4 kB · brotli 816 B |
| dist/client/assets/EstablishDataViewsLayout-Dtr4EOoh.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-PdrX7Uxr.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-BD706_WO.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-9PQSRw9v.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-BLMdPv3H.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-CtUMNjAU.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-fs5Cdn5-.js | 2.2 kB · brotli 915 B |
| dist/client/assets/DimensionList-fEl757mv.js | 2.1 kB · brotli 991 B |
| dist/client/assets/ContextList-CEldy2vo.js | 2.1 kB · brotli 996 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-D_BMB5Ef.js | 2.0 kB · brotli 993 B |
| dist/client/assets/GridDetailPanel-LPoCmsOK.js | 1.8 kB · brotli 890 B |
| dist/client/assets/configMonitor-BLC5VEog.js | 1.8 kB · brotli 697 B |
| dist/client/assets/AboutPanel-CWrAYUX7.js | 1.7 kB · brotli 878 B |
| dist/client/assets/KnowledgeLayout-GZzOiVUL.js | 1.6 kB · brotli 728 B |
| dist/client/assets/EmptyPlaceholder-BB_JFBgy.js | 1.5 kB · brotli 690 B |
| dist/client/assets/ManageConfigsLayout-DMiSYUTt.js | 1.4 kB · brotli 727 B |
| dist/client/assets/accountMonitor-B9UB01ea.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-BvHGmYks.js | 1.3 kB · brotli 724 B |
| dist/client/assets/HomeLayout-CSklIE7I.js | 1.3 kB · brotli 675 B |
| dist/client/assets/DialogModal-BpLHuqPu.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-ww8iLseh.js | 1.2 kB · brotli 254 B |
| dist/client/assets/WorkbenchLayout-Z-qcfrwF.js | 1.2 kB · brotli 613 B |
| dist/client/assets/establishDataViews-DY6lBIu3.js | 1.2 kB · brotli 534 B |
| dist/client/assets/ListItemButton-DrBDcuHp.js | 1.1 kB · brotli 520 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-C9JGgqcW.js | 857 B · brotli 494 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-Bj11XnzR.js | 769 B · brotli 419 B |
| dist/client/assets/BuildDataAppsLayout-DwzCISM9.js | 754 B · brotli 418 B |
| dist/client/assets/useEngine-QMmwRBvV.js | 669 B · brotli 339 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CoCGaUNe.js | 588 B · brotli 322 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-CncMzoGZ.js | 494 B · brotli 279 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-C2McLYp1.js | 303 B · brotli 194 B |
| dist/client/assets/ManageDataServiceTokensPanel-DIvj2C3k.js | 300 B · brotli 190 B |
| dist/client/assets/ManageConnectionPanel-DfBfBe4N.js | 297 B · brotli 187 B |
| dist/client/assets/GenerateTokenPanel-B6WfJlUV.js | 289 B · brotli 186 B |
| dist/client/assets/ManageSessionsPanel-C_ihAQgE.js | 289 B · brotli 187 B |
| dist/client/assets/ReviewActivityPanel-Dgea4KE_.js | 289 B · brotli 186 B |
| dist/client/assets/DeleteAccountPanel-Bx-PuQow.js | 288 B · brotli 186 B |
| dist/client/assets/ManageAccessPanel-HBYf9lVE.js | 287 B · brotli 186 B |
| dist/client/assets/arrow-big-left-CnbJBDES.js | 280 B · brotli 221 B |
| dist/client/assets/PresenterList-t0ggih89.js | 216 B · brotli 157 B |
| dist/client/assets/CookbookList-JwfQVu1A.js | 215 B · brotli 159 B |
| dist/client/assets/x-BFC-QZlL.js | 143 B · brotli 120 B |

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
