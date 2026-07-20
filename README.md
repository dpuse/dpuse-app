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
| dist/client/assets/ChatPanel-DsuVu0xP.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-BE2h43Cq.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-BR8Mqo2q.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-BsdNIquB.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-qvLqfh4Z.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-Cu6X2dBq.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-DzT7c3p6.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-DKCbdNET.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-BUtM1MUH.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-datM0mjG.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-ChVPv7vd.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-D0rSyf6C.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-Cr0bq8Go.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-eTntrQb-.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-LLCnJxs6.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-Da19Smnf.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-CbcwOvw8.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-Cc8v2Z9f.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-CgpcsZpx.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-BDDHdJpO.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-BvVCEBkR.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-xCtwvx4f.js | 3.4 kB · brotli 819 B |
| dist/client/assets/EstablishDataViewsLayout-CBlnZqa0.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-jnuvbd5R.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-RJrUifYn.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-CvtwWuxX.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-DRFeTNyW.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-QYQR-7Na.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-xtCEQuXl.js | 2.2 kB · brotli 915 B |
| dist/client/assets/DimensionList-B1sSrM_T.js | 2.1 kB · brotli 990 B |
| dist/client/assets/ContextList-BSoLp0Fn.js | 2.1 kB · brotli 992 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-8xMfJj0Q.js | 2.0 kB · brotli 998 B |
| dist/client/assets/GridDetailPanel-CSOWYmCr.js | 1.8 kB · brotli 891 B |
| dist/client/assets/configMonitor-yUskzfai.js | 1.8 kB · brotli 698 B |
| dist/client/assets/AboutPanel-rYqFUdO4.js | 1.7 kB · brotli 876 B |
| dist/client/assets/KnowledgeLayout-DoyZNQFY.js | 1.6 kB · brotli 727 B |
| dist/client/assets/EmptyPlaceholder-DXcp_vgU.js | 1.5 kB · brotli 689 B |
| dist/client/assets/ManageConfigsLayout-CPvljhmD.js | 1.4 kB · brotli 727 B |
| dist/client/assets/accountMonitor-BE5YmC83.js | 1.3 kB · brotli 517 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-Ck7P3f-8.js | 1.3 kB · brotli 735 B |
| dist/client/assets/HomeLayout-Bo06sICf.js | 1.3 kB · brotli 674 B |
| dist/client/assets/DialogModal-D7FuxN15.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-C9w2JRDK.js | 1.2 kB · brotli 253 B |
| dist/client/assets/WorkbenchLayout-B-J8K3Sf.js | 1.2 kB · brotli 612 B |
| dist/client/assets/establishDataViews-BlLAI6ak.js | 1.2 kB · brotli 536 B |
| dist/client/assets/ListItemButton-DmtsgnsI.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-CqjMV_DJ.js | 857 B · brotli 502 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-BMNfMoZv.js | 769 B · brotli 421 B |
| dist/client/assets/BuildDataAppsLayout-DNOxzYWE.js | 754 B · brotli 421 B |
| dist/client/assets/useEngine-DPhduXsO.js | 669 B · brotli 340 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-f-GR_Jx1.js | 588 B · brotli 325 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-BzPcCcU4.js | 494 B · brotli 276 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-qhubLTEL.js | 303 B · brotli 196 B |
| dist/client/assets/ManageDataServiceTokensPanel-CVDwEdzc.js | 300 B · brotli 192 B |
| dist/client/assets/ManageConnectionPanel-C0o7IyWB.js | 297 B · brotli 187 B |
| dist/client/assets/GenerateTokenPanel-BZdJDcFw.js | 289 B · brotli 187 B |
| dist/client/assets/ManageSessionsPanel-Cvp60Gd4.js | 289 B · brotli 188 B |
| dist/client/assets/ReviewActivityPanel-FoV5gNLD.js | 289 B · brotli 187 B |
| dist/client/assets/DeleteAccountPanel-CiKeAL6s.js | 288 B · brotli 186 B |
| dist/client/assets/ManageAccessPanel-NWaZZZ2u.js | 287 B · brotli 186 B |
| dist/client/assets/arrow-big-left-CmtSHsoV.js | 280 B · brotli 188 B |
| dist/client/assets/PresenterList-sGIMlNM8.js | 216 B · brotli 158 B |
| dist/client/assets/CookbookList-lhSclcBt.js | 215 B · brotli 159 B |
| dist/client/assets/x-DFF_GrAO.js | 143 B · brotli 119 B |

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
