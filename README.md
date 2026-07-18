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
| dist/client/assets/ChatPanel-C-Qi5jOV.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-DAPr9d0S.js | 101.8 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-8vsoqgSs.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-BoHIjkfB.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-yxeAJfpj.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-DWxwiVDz.js | 56.7 kB · brotli 13.6 kB |
| dist/client/assets/Table-CxIL42Xq.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-DI1nFv0g.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-DKyC6Y4l.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-BXQhT0KP.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-D1BII4R8.js | 8.8 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-B7_WbKbS.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-BF1OGaUT.js | 7.0 kB · brotli 1.8 kB |
| dist/client/assets/SelectItemPanel-DGg1uS0S.js | 6.9 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-Dg1Ngade.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-C4oMLe39.js | 6.5 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking--HRD7W_y.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-DVu-qDEb.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-DoRgRoBn.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-YJcaPqwn.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-WkPXy3v8.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/GridDetailPanel-BSgfafxS.js | 3.9 kB · brotli 1.5 kB |
| dist/client/assets/useConfigOptionConfigs-BR7dIRC7.js | 3.4 kB · brotli 818 B |
| dist/client/assets/EstablishDataViewsLayout-ByDXNQ-m.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-HfWuibJS.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-BnWTxhA_.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-BakRY5rs.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-DwE5Q4yV.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-CPIRetzs.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DimensionList-D0h0tQJN.js | 2.1 kB · brotli 991 B |
| dist/client/assets/ContextList-CZcmtn78.js | 2.1 kB · brotli 996 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/configMonitor-D0w6IBi0.js | 1.8 kB · brotli 716 B |
| dist/client/assets/AboutPanel-CiNRZJqp.js | 1.7 kB · brotli 880 B |
| dist/client/assets/KnowledgeLayout-CLJ7sz2d.js | 1.6 kB · brotli 727 B |
| dist/client/assets/EmptyPlaceholder-TVV1cBhL.js | 1.5 kB · brotli 688 B |
| dist/client/assets/ManageConfigsLayout-BtpBVxis.js | 1.4 kB · brotli 728 B |
| dist/client/assets/accountMonitor-B5mTpFjE.js | 1.3 kB · brotli 514 B |
| dist/client/assets/dpuse-shared-utilities.es-DBEf96kJ.js | 1.3 kB · brotli 598 B |
| dist/client/assets/TextField-BpwxxTeC.js | 1.3 kB · brotli 727 B |
| dist/client/assets/HomeLayout-D1L_V_I3.js | 1.3 kB · brotli 674 B |
| dist/client/assets/DialogModal-CGsNNCnG.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-CM3cGp0Z.js | 1.2 kB · brotli 253 B |
| dist/client/assets/WorkbenchLayout-DzkiD0e8.js | 1.2 kB · brotli 613 B |
| dist/client/assets/establishDataViews-DykrgoPS.js | 1.2 kB · brotli 537 B |
| dist/client/assets/ListItemButton-Cr5HcOs8.js | 1.1 kB · brotli 523 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/ExplorePresentationsLayout-DWbMoJ3O.js | 941 B · brotli 511 B |
| dist/client/assets/HomePanel-Bxyw9p7V.js | 857 B · brotli 502 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-BYfQqmV6.js | 769 B · brotli 421 B |
| dist/client/assets/BuildDataAppsLayout-C12QS9rk.js | 754 B · brotli 426 B |
| dist/client/assets/useEngine-Dy0CNkLd.js | 669 B · brotli 342 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CThqpCbP.js | 588 B · brotli 325 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-ChABpG8y.js | 494 B · brotli 281 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-DQpXZTb_.js | 303 B · brotli 196 B |
| dist/client/assets/ManageDataServiceTokensPanel-ZEu4wpFY.js | 300 B · brotli 194 B |
| dist/client/assets/ManageConnectionPanel-DDc4MoAn.js | 297 B · brotli 189 B |
| dist/client/assets/GenerateTokenPanel-Cv-gRjuv.js | 289 B · brotli 188 B |
| dist/client/assets/ManageSessionsPanel-Dbws0UcH.js | 289 B · brotli 189 B |
| dist/client/assets/ReviewActivityPanel-D_APRIMf.js | 289 B · brotli 188 B |
| dist/client/assets/DeleteAccountPanel-ByjzPBt-.js | 288 B · brotli 188 B |
| dist/client/assets/ManageAccessPanel-CcjyY--F.js | 287 B · brotli 187 B |
| dist/client/assets/arrow-big-left-B0mJKOVW.js | 280 B · brotli 184 B |
| dist/client/assets/PresenterList-DyGiFcoC.js | 216 B · brotli 158 B |
| dist/client/assets/CookbookList-D4twdTWS.js | 215 B · brotli 158 B |
| dist/client/assets/x-B8bkNPon.js | 143 B · brotli 120 B |

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
