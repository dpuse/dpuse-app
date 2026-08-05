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
| dist/client/assets/ChatPanel-DbaKgzJa.js | 151.2 kB · brotli 35.7 kB |
| dist/client/assets/AuthDialog-BVRjMgP6.js | 78.0 kB · brotli 21.3 kB |
| dist/client/assets/index-F5cuy7FA.js | 77.2 kB · brotli 25.6 kB |
| dist/client/assets/LibraryPanel-DiOkiH2l.js | 76.6 kB · brotli 18.6 kB |
| dist/client/assets/ContextModelDescriptorsPanel-kp1k1CFe.js | 74.1 kB · brotli 21.0 kB |
| dist/client/assets/runtime-core.esm-bundler-Db--SZRP.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ExploreData-KbX-ZC9n.js | 56.8 kB · brotli 13.6 kB |
| dist/client/assets/ContextList-BJB7OFon.js | 55.4 kB · brotli 9.7 kB |
| dist/client/assets/Table-Bnv6OvFc.js | 51.1 kB · brotli 11.9 kB |
| dist/client/assets/sdk.modern-uK7G7M7W.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-DW5tWT92.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-D6MCFvlt.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-DggplGGd.js | 12.5 kB · brotli 4.1 kB |
| dist/client/assets/performanceTracking-BG35nM1l.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-1BcZaPs_.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-B3xKmUcj.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-DNUTV8KG.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog--8pNQXNB.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-COPzFK1w.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-BnkV7G7e.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/PresenterList-CuJYdyJo.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-CTp0pZPS.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-DQkgS3V2.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-CfgSJdhm.js | 3.6 kB · brotli 923 B |
| dist/client/assets/useWorkbenchOptions-CulrTGIT.js | 3.6 kB · brotli 1.1 kB |
| dist/client/assets/WorkbenchOptionBar-B1EyKAlX.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/EstablishDataViewsLayout-DCX-nwXU.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-pRq8wUbd.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-C6WhyABK.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/Card-C2zpl6_k.js | 2.7 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-ECdom5RM.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/ExplorePresentationsLayout-DRyqGrlx.js | 2.2 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-DIAMp7Oo.js | 2.2 kB · brotli 927 B |
| dist/client/assets/GitHubLogo-KauBjwFp.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/configMonitor-Dyd4l2tE.js | 2.0 kB · brotli 735 B |
| dist/client/assets/ContextualiseDataLayout-B5Pn3tv-.js | 2.0 kB · brotli 915 B |
| dist/client/assets/ContextErdDiagramPanel-EIJD7Clu.js | 1.9 kB · brotli 674 B |
| dist/client/assets/GridDetailPanel-DFL1iRrP.js | 1.9 kB · brotli 910 B |
| dist/client/assets/AboutPanel-BLI5IF7S.js | 1.7 kB · brotli 883 B |
| dist/client/assets/KnowledgeLayout-BvGyU8WJ.js | 1.7 kB · brotli 799 B |
| dist/client/assets/Tag-g0MC42Vh.js | 1.7 kB · brotli 724 B |
| dist/client/assets/EmptyPlaceholder-CQrnoJyU.js | 1.5 kB · brotli 680 B |
| dist/client/assets/ManageConfigLayout-D4VltGZ4.js | 1.4 kB · brotli 734 B |
| dist/client/assets/HomeLayout-CnqigTpy.js | 1.4 kB · brotli 681 B |
| dist/client/assets/accountMonitor-CZUllt7k.js | 1.3 kB · brotli 519 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/createLucideIcon-KtrcG8_E.js | 1.3 kB · brotli 697 B |
| dist/client/assets/DialogModal-D2WWHNWO.js | 1.3 kB · brotli 649 B |
| dist/client/assets/ManagePersonalDetailsPanel-CiIEcsZY.js | 1.3 kB · brotli 272 B |
| dist/client/assets/WorkbenchLayout-CTST7Xkw.js | 1.2 kB · brotli 645 B |
| dist/client/assets/establishDataViews-zYWvYzYE.js | 1.2 kB · brotli 540 B |
| dist/client/assets/ListItemButton-5iizgztz.js | 1.1 kB · brotli 519 B |
| dist/client/assets/SelectPlaceholder-D9r6ei4r.js | 1005 B · brotli 534 B |
| dist/client/assets/KnowledgeHeader-BzL8VvIl.js | 991 B · brotli 524 B |
| dist/client/assets/ContextDimensionTreeDiagramPanel-BkPHJSQi.js | 989 B · brotli 501 B |
| dist/client/assets/Input-OQuip1m1.js | 929 B · brotli 513 B |
| dist/client/assets/BuildDataAppsLayout-C_Oume4y.js | 875 B · brotli 465 B |
| dist/client/assets/HomePanel-CqbpqnSX.js | 848 B · brotli 486 B |
| dist/client/assets/useApi-CROJJdhE-DSjYcI3s.js | 830 B · brotli 402 B |
| dist/client/assets/PaneSplitter-MwkIRH-k.js | 806 B · brotli 443 B |
| dist/client/assets/useEngine-PFo0LiZ3.js | 669 B · brotli 343 B |
| dist/client/assets/HomeIcon-CgPVFG0z.js | 607 B · brotli 373 B |
| dist/client/assets/CloseButton-BVUkun_J.js | 589 B · brotli 322 B |
| dist/client/assets/AuditContentPanel-Djdetw9X.js | 563 B · brotli 338 B |
| dist/client/assets/Separator-CzEwczbr.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-CpTupHX6.js | 528 B · brotli 294 B |
| dist/client/assets/ManageSubscriptionPanel-CX8pgqFR.js | 323 B · brotli 206 B |
| dist/client/assets/ManageDataServiceTokensPanel-B7Bch-4i.js | 320 B · brotli 207 B |
| dist/client/assets/ManageConnectionPanel-DXOJMM80.js | 317 B · brotli 202 B |
| dist/client/assets/DialogHeader-7ZW4--EO.js | 314 B · brotli 212 B |
| dist/client/assets/GenerateTokenPanel-Bv2qVnNC.js | 309 B · brotli 200 B |
| dist/client/assets/ManageSessionsPanel-CTEijJQz.js | 309 B · brotli 200 B |
| dist/client/assets/ReviewActivityPanel-CyoDxaYV.js | 309 B · brotli 200 B |
| dist/client/assets/DeleteAccountPanel-DWC1k6ic.js | 308 B · brotli 200 B |
| dist/client/assets/ManageAccessPanel-59jRVJMB.js | 307 B · brotli 200 B |
| dist/client/assets/arrow-big-left-3xYNRbbc.js | 291 B · brotli 190 B |
| dist/client/assets/x-Cz1razSS.js | 154 B · brotli 125 B |
| dist/client/assets/plus-BULtNroe.js | 153 B · brotli 136 B |
| dist/client/assets/chevron-right-eC4yQJbT.js | 130 B · brotli 115 B |
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
