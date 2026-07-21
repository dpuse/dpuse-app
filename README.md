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
| dist/client/assets/ChatPanel-BZ56Qi5F.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-D10ZwfFN.js | 102.0 kB · brotli 33.4 kB |
| dist/client/assets/AuthDialog-VpsePXKt.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-DR2wAWax.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-DTP60HhS.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-DR9PUHFx.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-Bls8V5Lw.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-SW4VmPcI.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-un7HUTo5.js | 23.4 kB · brotli 6.6 kB |
| dist/client/assets/Tag-C1HAwLeR.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-DNv7qSgL.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-CcrWfIWX.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-BxWL4Rcc.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-C2q97RZt.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-CUtohaN7.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-CRMfQXpZ.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-DtKY6JF2.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-CoLNss-6.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-CuIgL4s8.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-Ducg0PSv.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-D8jUgK-4.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-BnzpEpIn.js | 3.4 kB · brotli 814 B |
| dist/client/assets/EstablishDataViewsLayout-VX15PSC2.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-CZVVlc2_.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-BvbQG6tD.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-BNePdJqS.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-ClnW6-Ra.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-BwRlVxzw.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-D29UrRp4.js | 2.2 kB · brotli 916 B |
| dist/client/assets/DimensionList-CMTzcNd1.js | 2.1 kB · brotli 986 B |
| dist/client/assets/ContextList-5SJ7bhGJ.js | 2.1 kB · brotli 991 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-DcoVymLr.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/GridDetailPanel-DGNXFf-Y.js | 1.8 kB · brotli 895 B |
| dist/client/assets/configMonitor-C2mybAEd.js | 1.8 kB · brotli 697 B |
| dist/client/assets/AboutPanel-lmE3eiPP.js | 1.7 kB · brotli 881 B |
| dist/client/assets/KnowledgeLayout-lGul_xSA.js | 1.6 kB · brotli 729 B |
| dist/client/assets/EmptyPlaceholder-EjxRJmFg.js | 1.5 kB · brotli 688 B |
| dist/client/assets/ManageConfigsLayout-OQBu7sDT.js | 1.4 kB · brotli 730 B |
| dist/client/assets/accountMonitor-BjTod12l.js | 1.3 kB · brotli 516 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-LKUyXmVA.js | 1.3 kB · brotli 740 B |
| dist/client/assets/HomeLayout-BgIztpM9.js | 1.3 kB · brotli 672 B |
| dist/client/assets/DialogModal-CCxvHgit.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-CJOFdAww.js | 1.2 kB · brotli 252 B |
| dist/client/assets/WorkbenchLayout-CEtNHxjX.js | 1.2 kB · brotli 618 B |
| dist/client/assets/establishDataViews-DRR4v8qD.js | 1.2 kB · brotli 536 B |
| dist/client/assets/ListItemButton-BA3pN3Sy.js | 1.1 kB · brotli 523 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-BdALF3hg.js | 857 B · brotli 498 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-BJYb37v4.js | 769 B · brotli 421 B |
| dist/client/assets/BuildDataAppsLayout-B5HzABsY.js | 754 B · brotli 425 B |
| dist/client/assets/useEngine-huTtu7hs.js | 669 B · brotli 341 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CoDaKxrF.js | 588 B · brotli 322 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-LrLEie4u.js | 494 B · brotli 280 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-CG6uEXHg.js | 303 B · brotli 197 B |
| dist/client/assets/ManageDataServiceTokensPanel-DcMcGqOF.js | 300 B · brotli 194 B |
| dist/client/assets/ManageConnectionPanel-CM8hwMDC.js | 297 B · brotli 190 B |
| dist/client/assets/GenerateTokenPanel--M_O8sFV.js | 289 B · brotli 189 B |
| dist/client/assets/ManageSessionsPanel-DT5doR7M.js | 289 B · brotli 190 B |
| dist/client/assets/ReviewActivityPanel-4JXIFQz6.js | 289 B · brotli 189 B |
| dist/client/assets/DeleteAccountPanel-CSJ642eh.js | 288 B · brotli 188 B |
| dist/client/assets/ManageAccessPanel-BcXzqkX2.js | 287 B · brotli 187 B |
| dist/client/assets/arrow-big-left-CsyEGfPv.js | 280 B · brotli 216 B |
| dist/client/assets/PresenterList-Pr6Mq1il.js | 216 B · brotli 160 B |
| dist/client/assets/CookbookList-MPvGwxmZ.js | 215 B · brotli 187 B |
| dist/client/assets/x-9ochjiro.js | 143 B · brotli 119 B |

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
