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
| dist/client/assets/dist-DZtEHlHt.js | 279.8 kB · brotli 73.2 kB |
| dist/client/assets/ChatPanel-BFn2EbxI.js | 205.5 kB · brotli 44.9 kB |
| dist/client/assets/ChartNode-DCdYTqR5.js | 159.0 kB · brotli 47.9 kB |
| dist/client/assets/DocumentEditorView-CWVHvIUX.js | 155.2 kB · brotli 42.7 kB |
| dist/client/assets/index-RBBQGLWR.js | 100.8 kB · brotli 33.1 kB |
| dist/client/assets/AuthDialog-CfyUvKVr.js | 77.8 kB · brotli 21.2 kB |
| dist/client/assets/LibraryPanel-D6wW7_iJ.js | 71.6 kB · brotli 17.4 kB |
| dist/client/assets/runtime-core.esm-bundler-BIebCysl.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-Dwzoxevp.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-xlChCCug.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-BdiYpvxh.js | 54.9 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-HYSBaaJL.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-Daw30li4.js | 22.9 kB · brotli 6.4 kB |
| dist/client/assets/Tag-Bl6T27iB.js | 9.0 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-DcShY0Cw.js | 8.8 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-Bl_zC1G_.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-CUP0NoEG.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SessionMenu-BbyKWXXK.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/SelectItemPanel-C2US2ogt.js | 6.6 kB · brotli 2.6 kB |
| dist/client/assets/ConnectorList-C6pih_vc.js | 6.0 kB · brotli 2.1 kB |
| dist/client/assets/performanceTracking-DS9xN-6-.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-CAjUIv_b.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-CmVKzeo2.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-mxgmWM2O.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-D6_HT2kM.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/GridDetailPanel-CEopfEKA.js | 3.9 kB · brotli 1.5 kB |
| dist/client/assets/useConfigOptionConfigs-CjusE00N.js | 3.4 kB · brotli 818 B |
| dist/client/assets/EstablishDataViewsLayout-p0CLxFOF.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-DVoALuC5.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/Grid-U0d3BMAz.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-CbJrpGsg.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/EventQueryList-DRRxkF9U.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/Card-DehQ_wUP.js | 2.1 kB · brotli 877 B |
| dist/client/assets/DimensionList-B09JggOX.js | 2.1 kB · brotli 992 B |
| dist/client/assets/ContextList-DUAEdhj6.js | 2.1 kB · brotli 993 B |
| dist/client/assets/GitHubLogo-fnXHziAK.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-DtPccgig.js | 2.0 kB · brotli 921 B |
| dist/client/assets/configMonitor-DAd0qfDg.js | 1.8 kB · brotli 681 B |
| dist/client/assets/AboutPanel-CLAtqDPT.js | 1.7 kB · brotli 882 B |
| dist/client/assets/KnowledgeLayout-TfQyX9CG.js | 1.6 kB · brotli 729 B |
| dist/client/assets/EmptyPlaceholder-C3H99r5b.js | 1.5 kB · brotli 688 B |
| dist/client/assets/ManageConfigsLayout-BoHFtPSc.js | 1.4 kB · brotli 741 B |
| dist/client/assets/HomeLayout-Du-zE-V8.js | 1.4 kB · brotli 683 B |
| dist/client/assets/accountMonitor-CBuNjq1C.js | 1.3 kB · brotli 513 B |
| dist/client/assets/dpuse-shared-utilities.es-DBEf96kJ.js | 1.3 kB · brotli 598 B |
| dist/client/assets/TextField-VHVxYEdO.js | 1.3 kB · brotli 730 B |
| dist/client/assets/DialogModal-BDir8L3o.js | 1.2 kB · brotli 636 B |
| dist/client/assets/ManagePersonalDetailsPanel-eG6wgABI.js | 1.2 kB · brotli 260 B |
| dist/client/assets/establishDataViews-GxAOg29Q.js | 1.2 kB · brotli 536 B |
| dist/client/assets/ListItemButton-RbmSidHJ.js | 1.1 kB · brotli 522 B |
| dist/client/assets/WorkbenchHeader-Uf5EnLSe.js | 989 B · brotli 554 B |
| dist/client/assets/SelectPlaceholder-BSbyKGAi.js | 925 B · brotli 522 B |
| dist/client/assets/Input-BkN4Lx_7.js | 871 B · brotli 494 B |
| dist/client/assets/useApi-s_02lHjl-CTSnjKJW.js | 863 B · brotli 418 B |
| dist/client/assets/HomePanel-BaYIKKE8.js | 857 B · brotli 509 B |
| dist/client/assets/AssembleDimensionsLayout-ro8RDQS_.js | 812 B · brotli 437 B |
| dist/client/assets/PaneSplitter-C--GhAya.js | 806 B · brotli 442 B |
| dist/client/assets/BuildDataAppsLayout-M2TJftvM.js | 797 B · brotli 439 B |
| dist/client/assets/HomeIcon-DscGQ5Gw.js | 607 B · brotli 371 B |
| dist/client/assets/CloseButton-BeywB16c.js | 587 B · brotli 330 B |
| dist/client/assets/AuditContentPanel-aV2lSj8q.js | 563 B · brotli 336 B |
| dist/client/assets/Separator-CmF68kJC.js | 557 B · brotli 296 B |
| dist/client/assets/useEngine-RtnBu4Q3.js | 509 B · brotli 304 B |
| dist/client/assets/ManagePreferencesPanel-C8cYi5jW.js | 494 B · brotli 309 B |
| dist/client/assets/DialogHeader-B3fBUesm.js | 314 B · brotli 212 B |
| dist/client/assets/WorkbenchLayout-M0aLtjMv.js | 305 B · brotli 213 B |
| dist/client/assets/ManageSubscriptionPanel-DxUo_WO2.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-Cpmccekr.js | 300 B · brotli 194 B |
| dist/client/assets/ManageConnectionPanel-DUjIy5cO.js | 297 B · brotli 190 B |
| dist/client/assets/GenerateTokenPanel-CR_PEdUc.js | 289 B · brotli 189 B |
| dist/client/assets/ManageSessionsPanel-DKdt_ga2.js | 289 B · brotli 190 B |
| dist/client/assets/ReviewActivityPanel-D9DE57Tz.js | 289 B · brotli 188 B |
| dist/client/assets/DeleteAccountPanel-BwXp5ayO.js | 288 B · brotli 189 B |
| dist/client/assets/ManageAccessPanel-BV1lb6jw.js | 287 B · brotli 189 B |
| dist/client/assets/arrow-big-left-yqijBDHJ.js | 280 B · brotli 213 B |
| dist/client/assets/PresenterList-Dn2mpyMJ.js | 216 B · brotli 158 B |
| dist/client/assets/CookbookList-CD-FjcBm.js | 215 B · brotli 159 B |
| dist/client/assets/x-BBB8ws4r.js | 143 B · brotli 121 B |

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
