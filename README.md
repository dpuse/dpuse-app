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
| dist/client/assets/ChatPanel-Deo1VnKU.js | 206.4 kB · brotli 45.1 kB |
| dist/client/assets/ContextList-BnXxjimD.js | 93.1 kB · brotli 25.1 kB |
| dist/client/assets/index-Cnc1Zxhk.js | 77.8 kB · brotli 25.7 kB |
| dist/client/assets/LibraryPanel-DdgUEkYI.js | 76.2 kB · brotli 18.4 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/TextField-BgAkvkce.js | 66.1 kB · brotli 17.3 kB |
| dist/client/assets/ContextualiseDataLayout-B5O3XjRE.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData--ZbtqTvH.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/Table-CpkS4Mp2.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/marked.esm-CmQPVeXu.js | 40.0 kB · brotli 11.0 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-4ZkYP8gZ.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-BUsB0VGC.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-DdmKC72d.js | 14.2 kB · brotli 4.3 kB |
| dist/client/assets/ManageContextLayout-DgxGZAAB.js | 13.4 kB · brotli 3.4 kB |
| dist/client/assets/AuthDialog-D1q65UXq.js | 12.0 kB · brotli 4.2 kB |
| dist/client/assets/performanceTracking-B-pte_fe.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-yHBnQX13.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-M4yXWqXO.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-BgbqQRTh.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog-RAJc8KlG.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-Bxt7oqyF.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-5JfqmBhB.js | 5.1 kB · brotli 1.3 kB |
| dist/client/assets/AccountDialog-CkPSOkz5.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-Dr_VAD4X.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-D4zbrDle.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-CFQAcSyg.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-B0SZdJ9v.js | 3.6 kB · brotli 924 B |
| dist/client/assets/EstablishDataViewsLayout-Diqc2EQJ.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-BdWt1kPf.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-Dai7zbqq.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-C6VaU2VX.js | 2.9 kB · brotli 1.3 kB |
| dist/client/assets/Card-DjDroDbL.js | 2.7 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-COVtyyUq.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-EOaYc_k-.js | 2.2 kB · brotli 929 B |
| dist/client/assets/ExplorePresentationsLayout-BBaNbJcI.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/DimensionList-BFOSq-bc.js | 2.1 kB · brotli 961 B |
| dist/client/assets/configMonitor-BaA6WMjx.js | 2.0 kB · brotli 734 B |
| dist/client/assets/GridDetailPanel-D7aps3kE.js | 1.9 kB · brotli 911 B |
| dist/client/assets/KnowledgeLayout-Dp0Pv6wp.js | 1.7 kB · brotli 814 B |
| dist/client/assets/AboutPanel-e23b4rb6.js | 1.7 kB · brotli 866 B |
| dist/client/assets/Tag-CGpYzskA.js | 1.7 kB · brotli 723 B |
| dist/client/assets/EmptyPlaceholder-BaKynn7n.js | 1.5 kB · brotli 679 B |
| dist/client/assets/ManageConfigLayout-DiV2ne2r.js | 1.4 kB · brotli 731 B |
| dist/client/assets/accountMonitor-DU5KP2R4.js | 1.3 kB · brotli 515 B |
| dist/client/assets/HomeLayout-DrbQV_nC.js | 1.3 kB · brotli 676 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/createLucideIcon-Da5bIak_.js | 1.3 kB · brotli 695 B |
| dist/client/assets/DialogModal-DZfC6f3n.js | 1.3 kB · brotli 649 B |
| dist/client/assets/ManagePersonalDetailsPanel-BI2zqb7X.js | 1.3 kB · brotli 264 B |
| dist/client/assets/WorkbenchLayout-DgZfwp8P.js | 1.2 kB · brotli 642 B |
| dist/client/assets/establishDataViews-A9pyctp0.js | 1.2 kB · brotli 533 B |
| dist/client/assets/ListItemButton-BDsRDKmN.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/KnowledgeHeader-BH6qW4AE.js | 991 B · brotli 524 B |
| dist/client/assets/Input-vGw8Kmsq.js | 929 B · brotli 509 B |
| dist/client/assets/HomePanel-D_ecsxL0.js | 848 B · brotli 490 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-DGLEb89p.js | 769 B · brotli 421 B |
| dist/client/assets/BuildDataAppsLayout-CFwKt1O0.js | 754 B · brotli 420 B |
| dist/client/assets/useEngine-RFcy-vFQ.js | 669 B · brotli 339 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CRX01uuR.js | 589 B · brotli 327 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-y-WU6ASY.js | 528 B · brotli 291 B |
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
| dist/client/assets/chevron-right-sp-iEYwz.js | 130 B · brotli 114 B |
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
