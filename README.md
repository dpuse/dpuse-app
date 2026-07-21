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
| dist/client/assets/ChatPanel-DqxCVNOH.js | 206.0 kB · brotli 45.1 kB |
| dist/client/assets/index-BaBxYGOT.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-BDsUPJf7.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-B1gdplfC.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-DhNeXELB.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-aELMVJKF.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-DJfoUupi.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-J41ljW92.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-2iiE0ISg.js | 23.4 kB · brotli 6.6 kB |
| dist/client/assets/Tag-B_ywCswY.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-CM2WCuxt.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-CUNhvSKg.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-o0rOq_b-.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-Byq4PiTx.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-BguPrchN.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-CEj1GcEX.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-DRWlzhW8.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-CUc8tAGh.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-g6Zr5zmY.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-CIXyVG2A.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-DbX464Ng.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-BS7Te4em.js | 3.4 kB · brotli 820 B |
| dist/client/assets/EstablishDataViewsLayout-DBtzF6X7.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/Grid-lXulMqgX.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-JXoIcCzy.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-CV9UMvP4.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-cXMiQHou.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-CEy_cOgW.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-Ces9MfYw.js | 2.2 kB · brotli 915 B |
| dist/client/assets/DimensionList-Bt2iuvIk.js | 2.1 kB · brotli 991 B |
| dist/client/assets/ContextList-CEzmX_Pj.js | 2.1 kB · brotli 994 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-DOYxJ9Wf.js | 2.0 kB · brotli 1001 B |
| dist/client/assets/GridDetailPanel-mxDKJq9r.js | 1.8 kB · brotli 890 B |
| dist/client/assets/configMonitor-jtZKhaQy.js | 1.8 kB · brotli 698 B |
| dist/client/assets/AboutPanel-CvE-uq2_.js | 1.7 kB · brotli 880 B |
| dist/client/assets/KnowledgeLayout-DaG0zYd_.js | 1.6 kB · brotli 734 B |
| dist/client/assets/EmptyPlaceholder-PDz1KUp4.js | 1.5 kB · brotli 694 B |
| dist/client/assets/ManageConfigsLayout-ujpIqZ4J.js | 1.4 kB · brotli 728 B |
| dist/client/assets/accountMonitor-Ci4tlBAk.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-BS8wBbfN.js | 1.3 kB · brotli 746 B |
| dist/client/assets/HomeLayout-CjHghcnp.js | 1.3 kB · brotli 676 B |
| dist/client/assets/DialogModal-Dx4Ff7Z5.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-Bi5PWCUG.js | 1.2 kB · brotli 259 B |
| dist/client/assets/WorkbenchLayout-TAeDIFzf.js | 1.2 kB · brotli 613 B |
| dist/client/assets/establishDataViews-KTRmnXoW.js | 1.2 kB · brotli 537 B |
| dist/client/assets/ListItemButton-W_-_SRCs.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-BoMT1qmI.js | 857 B · brotli 500 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-CpUrjFyd.js | 769 B · brotli 423 B |
| dist/client/assets/BuildDataAppsLayout-DUn-dIB-.js | 754 B · brotli 422 B |
| dist/client/assets/useEngine-BqEcJs50.js | 669 B · brotli 340 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-rxDxQ_Th.js | 588 B · brotli 328 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-H-sRwQAK.js | 494 B · brotli 281 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-BDU9c7ei.js | 303 B · brotli 199 B |
| dist/client/assets/ManageDataServiceTokensPanel-MQf5gXGV.js | 300 B · brotli 197 B |
| dist/client/assets/ManageConnectionPanel-6Ha9rNTE.js | 297 B · brotli 192 B |
| dist/client/assets/GenerateTokenPanel-CPxPSnnc.js | 289 B · brotli 191 B |
| dist/client/assets/ManageSessionsPanel-DblpgS70.js | 289 B · brotli 194 B |
| dist/client/assets/ReviewActivityPanel-DYrIKxM1.js | 289 B · brotli 192 B |
| dist/client/assets/DeleteAccountPanel-DzLPyQpS.js | 288 B · brotli 191 B |
| dist/client/assets/ManageAccessPanel-DHlIE7ZY.js | 287 B · brotli 191 B |
| dist/client/assets/arrow-big-left-BarU70Vr.js | 280 B · brotli 183 B |
| dist/client/assets/PresenterList-C5d82Dss.js | 216 B · brotli 182 B |
| dist/client/assets/CookbookList-DfjyHCC-.js | 215 B · brotli 188 B |
| dist/client/assets/x-BgZfK_9g.js | 143 B · brotli 127 B |

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
