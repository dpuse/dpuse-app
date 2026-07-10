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
| dist/client/assets/dist-CJ5Q6wQd.js | 279.8 kB · brotli 73.3 kB |
| dist/client/assets/ChatPanel-DCpFbEAv.js | 205.4 kB · brotli 44.9 kB |
| dist/client/assets/ChartNode-C101CmTm.js | 159.0 kB · brotli 47.9 kB |
| dist/client/assets/DocumentEditorView-BaP4pQJn.js | 155.2 kB · brotli 42.8 kB |
| dist/client/assets/index-DM8wrwBz.js | 100.6 kB · brotli 33.2 kB |
| dist/client/assets/AuthDialog-M_1Hc3Ab.js | 77.8 kB · brotli 21.2 kB |
| dist/client/assets/LibraryPanel-BDCRjp4T.js | 71.6 kB · brotli 17.4 kB |
| dist/client/assets/runtime-core.esm-bundler-BIebCysl.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-2NmWCxNX.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-CsjqX0Mn.js | 56.7 kB · brotli 13.5 kB |
| dist/client/assets/Table-CJQS21fv.js | 54.9 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-CjMrXMbZ.js | 41.2 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-DqalfpU9.js | 22.9 kB · brotli 6.4 kB |
| dist/client/assets/Tag-CY5vL2d8.js | 9.0 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-RpD2gMD0.js | 8.8 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-3Gt4dbde.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-Bb9oD4hR.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SessionMenu-Cr78Dosp.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/SelectItemPanel-LUqV4aVO.js | 6.6 kB · brotli 2.6 kB |
| dist/client/assets/ConnectorList-FgTAgUE3.js | 6.0 kB · brotli 2.1 kB |
| dist/client/assets/performanceTracking-CoNvNaLU.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-D75d3caU.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-lnIeppIZ.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-CJCRRR8o.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-LI3ISjwW.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/GridDetailPanel-BqDbuWmd.js | 3.9 kB · brotli 1.5 kB |
| dist/client/assets/useConfigOptionConfigs-8XtWHvbV.js | 3.4 kB · brotli 814 B |
| dist/client/assets/EstablishDataViewsLayout-BOE_3gMc.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-UnTtIhUK.js | 3.0 kB · brotli 1.2 kB |
| dist/client/assets/Grid-b8eWp3Ug.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-DYWYChcz.js | 2.9 kB · brotli 1.3 kB |
| dist/client/assets/EventQueryList-Dk9RR9n4.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/Card-DehQ_wUP.js | 2.1 kB · brotli 877 B |
| dist/client/assets/DimensionList-C-J4NJg-.js | 2.1 kB · brotli 987 B |
| dist/client/assets/ContextList-DBBsT1h0.js | 2.1 kB · brotli 989 B |
| dist/client/assets/GitHubLogo-fnXHziAK.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-DDVniEL6.js | 2.0 kB · brotli 922 B |
| dist/client/assets/configMonitor-DQCb0D7I.js | 1.8 kB · brotli 680 B |
| dist/client/assets/AboutPanel-CsXOWQCh.js | 1.7 kB · brotli 877 B |
| dist/client/assets/KnowledgeLayout-CvttK47L.js | 1.6 kB · brotli 722 B |
| dist/client/assets/EmptyPlaceholder-DDus8vxe.js | 1.5 kB · brotli 689 B |
| dist/client/assets/ManageConfigsLayout-ixwjbTJ_.js | 1.4 kB · brotli 747 B |
| dist/client/assets/HomeLayout-CA1L_cqr.js | 1.4 kB · brotli 682 B |
| dist/client/assets/accountMonitor-BTqoh1Su.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-DBEf96kJ.js | 1.3 kB · brotli 598 B |
| dist/client/assets/TextField-Bu5KkdHo.js | 1.3 kB · brotli 725 B |
| dist/client/assets/DialogModal-DAW-r4Bx.js | 1.2 kB · brotli 636 B |
| dist/client/assets/ManagePersonalDetailsPanel-CkdXVHop.js | 1.2 kB · brotli 257 B |
| dist/client/assets/establishDataViews-BfnMIL-9.js | 1.2 kB · brotli 534 B |
| dist/client/assets/ListItemButton-Ldu7R44q.js | 1.1 kB · brotli 521 B |
| dist/client/assets/WorkbenchHeader-DCaWCz4X.js | 989 B · brotli 550 B |
| dist/client/assets/SelectPlaceholder-B1xmkznR.js | 925 B · brotli 520 B |
| dist/client/assets/Input-xm0l26iY.js | 871 B · brotli 494 B |
| dist/client/assets/useApi-s_02lHjl-CTSnjKJW.js | 863 B · brotli 418 B |
| dist/client/assets/HomePanel-DtSbjnCg.js | 857 B · brotli 508 B |
| dist/client/assets/AssembleDimensionsLayout-BGBnRJLh.js | 812 B · brotli 436 B |
| dist/client/assets/PaneSplitter-C--GhAya.js | 806 B · brotli 442 B |
| dist/client/assets/BuildDataAppsLayout-B8g-9kWQ.js | 797 B · brotli 439 B |
| dist/client/assets/HomeIcon-DscGQ5Gw.js | 607 B · brotli 371 B |
| dist/client/assets/CloseButton-DHJsS1CU.js | 589 B · brotli 331 B |
| dist/client/assets/AuditContentPanel-aV2lSj8q.js | 563 B · brotli 336 B |
| dist/client/assets/Separator-CmF68kJC.js | 557 B · brotli 296 B |
| dist/client/assets/useEngine-B1gtPmFx.js | 509 B · brotli 305 B |
| dist/client/assets/ManagePreferencesPanel-CdRtxGvM.js | 494 B · brotli 281 B |
| dist/client/assets/DialogHeader-B3fBUesm.js | 314 B · brotli 212 B |
| dist/client/assets/WorkbenchLayout-BTW5a2jL.js | 305 B · brotli 216 B |
| dist/client/assets/ManageSubscriptionPanel-CxJWDlph.js | 303 B · brotli 198 B |
| dist/client/assets/ManageDataServiceTokensPanel-CYuw6haQ.js | 300 B · brotli 199 B |
| dist/client/assets/ManageConnectionPanel-BXNnNK8V.js | 297 B · brotli 195 B |
| dist/client/assets/GenerateTokenPanel-Du-spF78.js | 289 B · brotli 193 B |
| dist/client/assets/ManageSessionsPanel-CIVf0rz8.js | 289 B · brotli 194 B |
| dist/client/assets/ReviewActivityPanel-DRhtSg_u.js | 289 B · brotli 193 B |
| dist/client/assets/DeleteAccountPanel-DjGna_W3.js | 288 B · brotli 193 B |
| dist/client/assets/ManageAccessPanel-B_5141kX.js | 287 B · brotli 193 B |
| dist/client/assets/arrow-big-left-B7kXRja1.js | 280 B · brotli 191 B |
| dist/client/assets/PresenterList-DKqBZ9lV.js | 216 B · brotli 157 B |
| dist/client/assets/CookbookList-BKgt1nRq.js | 215 B · brotli 158 B |
| dist/client/assets/x-1MCz-SNM.js | 143 B · brotli 119 B |

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
