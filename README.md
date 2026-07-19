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
| dist/client/assets/ChatPanel-DgN5fGaS.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-C_KjyewE.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-Blj36PLv.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-BAkyHsdM.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-BOpkTyH8.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-Bfvul8N0.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-2unBnAG4.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-Flh8QFRw.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-lRDOocx0.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-CobwTZKU.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-Bsk69HLV.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-ClGIuj6d.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-CTJ1hWCq.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-Db7VpHd_.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-U2qsZ6Eb.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-BnAPrjRB.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-Bl9XjnKK.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-BdipQnqe.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-B58RX7zh.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-D2BKak_A.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-C-GajjoY.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-DewEhlbW.js | 3.4 kB · brotli 815 B |
| dist/client/assets/EstablishDataViewsLayout-B9zVFc3h.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/Grid-BnCY85vr.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-COqfKCyE.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-CwYcS6JL.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-CNketxyZ.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-DCpjkDYM.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-CRaoO9I-.js | 2.2 kB · brotli 915 B |
| dist/client/assets/DimensionList-DhgXX-FL.js | 2.1 kB · brotli 991 B |
| dist/client/assets/ContextList-OGqWh-Hc.js | 2.1 kB · brotli 994 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-b5N7sr_1.js | 2.0 kB · brotli 1004 B |
| dist/client/assets/GridDetailPanel-vkn56glL.js | 1.8 kB · brotli 895 B |
| dist/client/assets/configMonitor-DgdE7vDS.js | 1.8 kB · brotli 698 B |
| dist/client/assets/AboutPanel-C_GOshmP.js | 1.7 kB · brotli 881 B |
| dist/client/assets/KnowledgeLayout-jDxfyIGM.js | 1.6 kB · brotli 727 B |
| dist/client/assets/EmptyPlaceholder-BwTVWXd8.js | 1.5 kB · brotli 687 B |
| dist/client/assets/ManageConfigsLayout-81BdgCGE.js | 1.4 kB · brotli 727 B |
| dist/client/assets/accountMonitor-SRgwjySQ.js | 1.3 kB · brotli 514 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-8roNIE8o.js | 1.3 kB · brotli 742 B |
| dist/client/assets/HomeLayout-BGtUObG8.js | 1.3 kB · brotli 669 B |
| dist/client/assets/DialogModal-DthtmxBT.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-Dc_QVF0S.js | 1.2 kB · brotli 256 B |
| dist/client/assets/WorkbenchLayout-DWKtLS6m.js | 1.2 kB · brotli 612 B |
| dist/client/assets/establishDataViews-KLcPoXTi.js | 1.2 kB · brotli 533 B |
| dist/client/assets/ListItemButton-CchaDs7Y.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-DqHt-S5g.js | 857 B · brotli 500 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-CAjruQql.js | 769 B · brotli 421 B |
| dist/client/assets/BuildDataAppsLayout-C5mKB1AL.js | 754 B · brotli 420 B |
| dist/client/assets/useEngine-DEubR-Nr.js | 669 B · brotli 341 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-DWSKBeWd.js | 588 B · brotli 321 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-B3vXUKIF.js | 494 B · brotli 279 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-CzdQHKlJ.js | 303 B · brotli 193 B |
| dist/client/assets/ManageDataServiceTokensPanel-DgnczWWZ.js | 300 B · brotli 190 B |
| dist/client/assets/ManageConnectionPanel-BmMMxf9u.js | 297 B · brotli 185 B |
| dist/client/assets/GenerateTokenPanel-Dw-z92aI.js | 289 B · brotli 185 B |
| dist/client/assets/ManageSessionsPanel-Bdcb7FVK.js | 289 B · brotli 186 B |
| dist/client/assets/ReviewActivityPanel-CwHj4K6J.js | 289 B · brotli 185 B |
| dist/client/assets/DeleteAccountPanel-DdnKzwjv.js | 288 B · brotli 184 B |
| dist/client/assets/ManageAccessPanel-D5e2iMEc.js | 287 B · brotli 184 B |
| dist/client/assets/arrow-big-left-rzMLMVud.js | 280 B · brotli 219 B |
| dist/client/assets/PresenterList-ByjdsC7i.js | 216 B · brotli 157 B |
| dist/client/assets/CookbookList-yLvcI1n1.js | 215 B · brotli 158 B |
| dist/client/assets/x-DdHp3ZUO.js | 143 B · brotli 120 B |

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
