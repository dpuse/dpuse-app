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
| dist/client/assets/ChatPanel-DDKMftWM.js | 206.4 kB · brotli 45.2 kB |
| dist/client/assets/ContextList-u2zZbMgL.js | 89.5 kB · brotli 24.3 kB |
| dist/client/assets/index-Bt2hsFZj.js | 77.7 kB · brotli 25.7 kB |
| dist/client/assets/LibraryPanel-BHj9e1rg.js | 76.2 kB · brotli 18.4 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/TextField-jj_GBy0j.js | 66.1 kB · brotli 17.3 kB |
| dist/client/assets/ContextualiseDataLayout-CrPIQMB9.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-q3W4QQCr.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/Table-Bh1LCe5N.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/marked.esm-CmQPVeXu.js | 40.0 kB · brotli 11.0 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-4ZkYP8gZ.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-BUsB0VGC.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-Bax2dTOm.js | 14.2 kB · brotli 4.4 kB |
| dist/client/assets/ManageContextLayout-858cHlsi.js | 13.4 kB · brotli 3.4 kB |
| dist/client/assets/AuthDialog-C_xoSKxj.js | 12.0 kB · brotli 4.2 kB |
| dist/client/assets/performanceTracking-NH7pf7Bx.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-sZjGl84r.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-B_70vEhs.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-IGX937Ol.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog-DQzg-N3R.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-D-I4ssLL.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-CfetJtzW.js | 5.1 kB · brotli 1.3 kB |
| dist/client/assets/AccountDialog-B8WTIMrz.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-BV1sI0SB.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-BTk9k0X8.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-CCO_PSLn.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-DPV1Q0ju.js | 3.6 kB · brotli 926 B |
| dist/client/assets/EstablishDataViewsLayout-PMBK6Mnn.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-B-O4jFcH.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-CrgV9UeA.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-COEskzpU.js | 2.9 kB · brotli 1.3 kB |
| dist/client/assets/Card-Bj1Osbvi.js | 2.7 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-yY-rr2Yj.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-EOaYc_k-.js | 2.2 kB · brotli 929 B |
| dist/client/assets/ExplorePresentationsLayout-BQk7hCzs.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/DimensionList-DccM2dn6.js | 2.1 kB · brotli 962 B |
| dist/client/assets/configMonitor-CbxS-dDK.js | 2.0 kB · brotli 733 B |
| dist/client/assets/GridDetailPanel-CEIK_NN5.js | 1.9 kB · brotli 909 B |
| dist/client/assets/KnowledgeLayout-BTu6A8Go.js | 1.7 kB · brotli 812 B |
| dist/client/assets/AboutPanel-BSd4B1-8.js | 1.7 kB · brotli 874 B |
| dist/client/assets/Tag-CGpYzskA.js | 1.7 kB · brotli 723 B |
| dist/client/assets/EmptyPlaceholder-BaKynn7n.js | 1.5 kB · brotli 679 B |
| dist/client/assets/ManageConfigLayout-CXnX-kxb.js | 1.4 kB · brotli 732 B |
| dist/client/assets/accountMonitor-B3iheay6.js | 1.3 kB · brotli 514 B |
| dist/client/assets/HomeLayout-BKLicUlU.js | 1.3 kB · brotli 679 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/createLucideIcon-Da5bIak_.js | 1.3 kB · brotli 695 B |
| dist/client/assets/DialogModal-DZfC6f3n.js | 1.3 kB · brotli 649 B |
| dist/client/assets/ManagePersonalDetailsPanel-BI2zqb7X.js | 1.3 kB · brotli 264 B |
| dist/client/assets/WorkbenchLayout-B3-4cuI1.js | 1.2 kB · brotli 641 B |
| dist/client/assets/establishDataViews-CsJWsy5E.js | 1.2 kB · brotli 535 B |
| dist/client/assets/ListItemButton-BDsRDKmN.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/KnowledgeHeader-CR_YcFBS.js | 991 B · brotli 524 B |
| dist/client/assets/Input-D5oLIUZX.js | 929 B · brotli 513 B |
| dist/client/assets/HomePanel-CclxLHeq.js | 848 B · brotli 490 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-CqyLtext.js | 769 B · brotli 420 B |
| dist/client/assets/BuildDataAppsLayout-CG6rm_Ml.js | 754 B · brotli 421 B |
| dist/client/assets/useEngine-ioFCcQWy.js | 669 B · brotli 338 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CRX01uuR.js | 589 B · brotli 327 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-D8dxii6m.js | 528 B · brotli 293 B |
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
