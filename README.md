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
| dist/client/assets/ChatPanel-BEzeeZFV.js | 206.4 kB · brotli 45.2 kB |
| dist/client/assets/ContextList-kmbbYKre.js | 89.8 kB · brotli 24.4 kB |
| dist/client/assets/index-B1jk8GX-.js | 77.7 kB · brotli 25.7 kB |
| dist/client/assets/LibraryPanel-OuA2TqIv.js | 76.2 kB · brotli 18.4 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/TextField-Ctxi5hiX.js | 66.1 kB · brotli 17.3 kB |
| dist/client/assets/ContextualiseDataLayout-COGvrb__.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-c__qW-oI.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/Table-CbLQ13Uy.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/marked.esm-CmQPVeXu.js | 40.0 kB · brotli 11.0 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-4ZkYP8gZ.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-BUsB0VGC.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-B1zPlBg0.js | 14.2 kB · brotli 4.3 kB |
| dist/client/assets/ManageContextLayout-BDs7hTYR.js | 13.4 kB · brotli 3.4 kB |
| dist/client/assets/AuthDialog-5YiIPtBp.js | 12.0 kB · brotli 4.2 kB |
| dist/client/assets/performanceTracking-CXoo5vwG.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-BvahQQvt.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-BYC-yEKK.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-DvVd9hYw.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog-DiXqtt20.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-D-I4ssLL.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-DAtnIDry.js | 5.1 kB · brotli 1.3 kB |
| dist/client/assets/AccountDialog-B0er2tL1.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-CHB1dL7f.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-CYuQ3c7M.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-Bdi_rR3R.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-DL-N6bIQ.js | 3.6 kB · brotli 924 B |
| dist/client/assets/EstablishDataViewsLayout-DJYG70ZK.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-B-O4jFcH.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-BpywSo7J.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-DH16oOdK.js | 2.9 kB · brotli 1.3 kB |
| dist/client/assets/Card-CBmzQvK4.js | 2.7 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-rNqwMOhR.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-EOaYc_k-.js | 2.2 kB · brotli 929 B |
| dist/client/assets/ExplorePresentationsLayout-C9se-R9K.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/DimensionList-cFZbY6HL.js | 2.1 kB · brotli 968 B |
| dist/client/assets/configMonitor-COF9eETi.js | 2.0 kB · brotli 735 B |
| dist/client/assets/GridDetailPanel-CEIK_NN5.js | 1.9 kB · brotli 909 B |
| dist/client/assets/KnowledgeLayout-C2Jkufy5.js | 1.7 kB · brotli 811 B |
| dist/client/assets/AboutPanel-Dhk1fcyF.js | 1.7 kB · brotli 875 B |
| dist/client/assets/Tag-CGpYzskA.js | 1.7 kB · brotli 723 B |
| dist/client/assets/EmptyPlaceholder-BaKynn7n.js | 1.5 kB · brotli 679 B |
| dist/client/assets/ManageConfigLayout--F6pyk8v.js | 1.4 kB · brotli 733 B |
| dist/client/assets/accountMonitor-DhFPF2F3.js | 1.3 kB · brotli 514 B |
| dist/client/assets/HomeLayout-CQHp1dBc.js | 1.3 kB · brotli 681 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/createLucideIcon-Da5bIak_.js | 1.3 kB · brotli 695 B |
| dist/client/assets/DialogModal-DZfC6f3n.js | 1.3 kB · brotli 649 B |
| dist/client/assets/ManagePersonalDetailsPanel-BI2zqb7X.js | 1.3 kB · brotli 264 B |
| dist/client/assets/WorkbenchLayout-CGZquNIl.js | 1.2 kB · brotli 645 B |
| dist/client/assets/establishDataViews-BsHCN2JF.js | 1.2 kB · brotli 538 B |
| dist/client/assets/ListItemButton-BDsRDKmN.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/KnowledgeHeader-CehuQrWF.js | 991 B · brotli 525 B |
| dist/client/assets/Input-CNBzehda.js | 929 B · brotli 514 B |
| dist/client/assets/HomePanel-Dc-Pv9BK.js | 848 B · brotli 490 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-BJJv_bNN.js | 769 B · brotli 420 B |
| dist/client/assets/BuildDataAppsLayout-D39GfZcc.js | 754 B · brotli 420 B |
| dist/client/assets/useEngine-Bm6lOmdg.js | 669 B · brotli 340 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CRX01uuR.js | 589 B · brotli 327 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-BAbHwuXl.js | 528 B · brotli 293 B |
| dist/client/assets/ManageSubscriptionPanel-Bp68JwiK.js | 323 B · brotli 207 B |
| dist/client/assets/ManageDataServiceTokensPanel-BofJ2Lyl.js | 320 B · brotli 207 B |
| dist/client/assets/ManageConnectionPanel-B_8J9usz.js | 317 B · brotli 202 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/GenerateTokenPanel-B1VEhoSW.js | 309 B · brotli 200 B |
| dist/client/assets/ManageSessionsPanel-49UcJqY0.js | 309 B · brotli 201 B |
| dist/client/assets/ReviewActivityPanel-Wr0LUNsh.js | 309 B · brotli 200 B |
| dist/client/assets/DeleteAccountPanel-ymuZEe4E.js | 308 B · brotli 200 B |
| dist/client/assets/ManageAccessPanel-DFB6latZ.js | 307 B · brotli 200 B |
| dist/client/assets/arrow-big-left-DAI4_r0u.js | 291 B · brotli 218 B |
| dist/client/assets/x-j9qVIbVL.js | 154 B · brotli 150 B |
| dist/client/assets/plus-DJHoRAG3.js | 153 B · brotli 121 B |
| dist/client/assets/_plugin-vue_export-helper-BDNMzG2s.js | 84 B · brotli 88 B |

(unassigned) = bytes Sonda can't trace to a specific source line (whitespace, stray keywords, bundler-injected region markers) — not actual missing/unknown code.

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
