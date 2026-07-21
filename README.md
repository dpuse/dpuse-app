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
| dist/client/assets/ChatPanel-DscpZjyN.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-C51O6Yyj.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-KRm4P67r.js | 78.4 kB · brotli 21.5 kB |
| dist/client/assets/LibraryPanel-8Q6AywiN.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-DL0Jv3Y7.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-iiw324mf.js | 56.7 kB · brotli 13.6 kB |
| dist/client/assets/Table-SVrwP_GM.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-C-3oEI9U.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-CHtShoWU.js | 23.4 kB · brotli 6.6 kB |
| dist/client/assets/Tag-D3KK0riK.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-CwX49ARz.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-yW9JC4p9.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-q7R2P7Qu.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-CVWPU9js.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-DpxaZQXR.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-DHGU6y89.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-CogV6D0t.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-BNEL7M0v.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-DnZWLD4i.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-DrEe0jG2.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-4yAPBKjk.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-DFS4WI8Q.js | 3.4 kB · brotli 818 B |
| dist/client/assets/EstablishDataViewsLayout-D4QCzCLy.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/Grid-Db-_SR9i.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-DoYrwr4F.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/WorkbenchOptionBar-CQGEdyiO.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-CfYMZBpW.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-CUJYoaqN.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-BE8KJ3A3.js | 2.2 kB · brotli 918 B |
| dist/client/assets/DimensionList-CYWplDqj.js | 2.1 kB · brotli 992 B |
| dist/client/assets/ContextList-D9m7cw7P.js | 2.1 kB · brotli 995 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-iztDMwZm.js | 2.0 kB · brotli 999 B |
| dist/client/assets/GridDetailPanel-Bjbavkwx.js | 1.8 kB · brotli 893 B |
| dist/client/assets/configMonitor-B5gR-bhL.js | 1.8 kB · brotli 703 B |
| dist/client/assets/AboutPanel-J1BfvJeQ.js | 1.7 kB · brotli 879 B |
| dist/client/assets/KnowledgeLayout-BoZAHdaN.js | 1.6 kB · brotli 730 B |
| dist/client/assets/EmptyPlaceholder-CunA8M3t.js | 1.5 kB · brotli 690 B |
| dist/client/assets/ManageConfigsLayout-UKHOTKYX.js | 1.4 kB · brotli 729 B |
| dist/client/assets/accountMonitor-CaJOByeY.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-BU-OMdko.js | 1.3 kB · brotli 735 B |
| dist/client/assets/HomeLayout-FO-XXhki.js | 1.3 kB · brotli 673 B |
| dist/client/assets/DialogModal-tO8z4ycy.js | 1.2 kB · brotli 637 B |
| dist/client/assets/ManagePersonalDetailsPanel-BlQKKYvO.js | 1.2 kB · brotli 254 B |
| dist/client/assets/WorkbenchLayout-DWLvK0c-.js | 1.2 kB · brotli 612 B |
| dist/client/assets/establishDataViews-cpg4XhnS.js | 1.2 kB · brotli 544 B |
| dist/client/assets/ListItemButton-4rfdRKEX.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-DGqi62As.js | 857 B · brotli 501 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-R6AmU5Tw.js | 769 B · brotli 421 B |
| dist/client/assets/BuildDataAppsLayout-0E3pSVqi.js | 754 B · brotli 421 B |
| dist/client/assets/useEngine-DBRIB1ZD.js | 669 B · brotli 341 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-DH1yYtGq.js | 588 B · brotli 327 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-CnXv-FAL.js | 494 B · brotli 280 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-b5bdLQCK.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-BGwEuoJZ.js | 300 B · brotli 192 B |
| dist/client/assets/ManageConnectionPanel-BwfRxH2l.js | 297 B · brotli 187 B |
| dist/client/assets/GenerateTokenPanel-CVfV3gn5.js | 289 B · brotli 186 B |
| dist/client/assets/ManageSessionsPanel-D11wLXLu.js | 289 B · brotli 189 B |
| dist/client/assets/ReviewActivityPanel-Bgav252L.js | 289 B · brotli 188 B |
| dist/client/assets/DeleteAccountPanel-D0H6j2Qe.js | 288 B · brotli 186 B |
| dist/client/assets/ManageAccessPanel-C_KkBMhm.js | 287 B · brotli 186 B |
| dist/client/assets/arrow-big-left-CSOBIL7_.js | 280 B · brotli 185 B |
| dist/client/assets/PresenterList-DvedP2Nz.js | 216 B · brotli 159 B |
| dist/client/assets/CookbookList-C_7y_cvn.js | 215 B · brotli 160 B |
| dist/client/assets/x-DQXihpuX.js | 143 B · brotli 121 B |

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
