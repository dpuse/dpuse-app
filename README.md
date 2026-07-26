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
| dist/client/assets/ChatPanel-szq406Ny.js | 206.4 kB · brotli 45.2 kB |
| dist/client/assets/index-CAE-gCxt.js | 77.6 kB · brotli 25.6 kB |
| dist/client/assets/LibraryPanel-BoTM14aE.js | 76.2 kB · brotli 18.4 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/TextField-DD_o-mF5.js | 66.1 kB · brotli 17.3 kB |
| dist/client/assets/ContextualiseDataLayout-39pUr1Yq.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-s1XmoKH8.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/Table-C1oQ5YRn.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-BlR8tEYd.js | 41.0 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-4ZkYP8gZ.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-BUsB0VGC.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-CdS_rdOT.js | 14.2 kB · brotli 4.3 kB |
| dist/client/assets/ManageContextLayout-tkDJ-8kJ.js | 13.4 kB · brotli 3.4 kB |
| dist/client/assets/AuthDialog-DHIDpV5r.js | 12.7 kB · brotli 4.5 kB |
| dist/client/assets/ContextList-D6ODN38k.js | 9.6 kB · brotli 2.1 kB |
| dist/client/assets/performanceTracking-CcQb6a29.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-BIjUxqIZ.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-yxzlp3S3.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-B8Z7VaPS.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog-BfYMX8fF.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-D-I4ssLL.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-C0cj1_Mr.js | 5.1 kB · brotli 1.3 kB |
| dist/client/assets/AccountDialog-D6k1-_jf.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-BFjQfRxA.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-TUzLY5y5.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-Pf7Whvfz.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-Co-EwLJv.js | 3.6 kB · brotli 916 B |
| dist/client/assets/EstablishDataViewsLayout-BB3pzi_u.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-B-O4jFcH.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-D3jMl4SG.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-CR3g1XxN.js | 2.9 kB · brotli 1.3 kB |
| dist/client/assets/Card-FCdKu8E0.js | 2.7 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-BsEVhATP.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-EOaYc_k-.js | 2.2 kB · brotli 929 B |
| dist/client/assets/ExplorePresentationsLayout-BLDJpVRm.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/DimensionList-Dya5cnvl.js | 2.1 kB · brotli 964 B |
| dist/client/assets/configMonitor-DdrFFMcv.js | 2.0 kB · brotli 735 B |
| dist/client/assets/GridDetailPanel-CEIK_NN5.js | 1.9 kB · brotli 909 B |
| dist/client/assets/AboutPanel-C7zRf7om.js | 1.7 kB · brotli 877 B |
| dist/client/assets/KnowledgeLayout-Bs2y2bzO.js | 1.7 kB · brotli 798 B |
| dist/client/assets/Tag-CGpYzskA.js | 1.7 kB · brotli 723 B |
| dist/client/assets/EmptyPlaceholder-BaKynn7n.js | 1.5 kB · brotli 679 B |
| dist/client/assets/ManageConfigLayout-BvSbSBNA.js | 1.4 kB · brotli 732 B |
| dist/client/assets/HomeLayout-MWgEEfv9.js | 1.4 kB · brotli 688 B |
| dist/client/assets/accountMonitor-Cgi7cghL.js | 1.3 kB · brotli 514 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/createLucideIcon-Da5bIak_.js | 1.3 kB · brotli 695 B |
| dist/client/assets/DialogModal-DZfC6f3n.js | 1.3 kB · brotli 649 B |
| dist/client/assets/ManagePersonalDetailsPanel-BI2zqb7X.js | 1.3 kB · brotli 264 B |
| dist/client/assets/WorkbenchLayout-V35Zsl1B.js | 1.2 kB · brotli 642 B |
| dist/client/assets/establishDataViews-BLWvfTAB.js | 1.2 kB · brotli 535 B |
| dist/client/assets/ListItemButton-BDsRDKmN.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-BxDIfw-M.js | 858 B · brotli 501 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-CJqoG6s5.js | 769 B · brotli 420 B |
| dist/client/assets/BuildDataAppsLayout-B4IMkq3w.js | 754 B · brotli 421 B |
| dist/client/assets/useEngine-C8sBF9v7.js | 669 B · brotli 341 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CRX01uuR.js | 589 B · brotli 327 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel--pasQq7R.js | 528 B · brotli 292 B |
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
