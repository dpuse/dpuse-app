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
| dist/client/assets/ChatPanel-DcVTWlof.js | 206.3 kB · brotli 45.2 kB |
| dist/client/assets/AuthDialog-BvO61wa9.js | 79.6 kB · brotli 21.8 kB |
| dist/client/assets/index-D0deeU54.js | 76.6 kB · brotli 25.2 kB |
| dist/client/assets/LibraryPanel-D3Oo6ZnB.js | 76.1 kB · brotli 18.4 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-DWqyEgu2.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-d1lbSjQx.js | 56.7 kB · brotli 13.6 kB |
| dist/client/assets/Table-Cb0Jio_A.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-DQzMkJpM.js | 41.0 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/Button-4ZkYP8gZ.js | 24.5 kB · brotli 8.6 kB |
| dist/client/assets/useDataWindow-BUsB0VGC.js | 23.5 kB · brotli 6.6 kB |
| dist/client/assets/ConnectorList-CH6Wn4vz.js | 14.1 kB · brotli 4.3 kB |
| dist/client/assets/performanceTracking-D6i3xBsT.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/SelectConnectionPanel-Cc0nHjCq.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/ContextList-nTjokUi6.js | 7.1 kB · brotli 1.5 kB |
| dist/client/assets/SelectItemPanel-ByKkuyBi.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-De-tLkXj.js | 6.8 kB · brotli 2.4 kB |
| dist/client/assets/ConnectionDialog-BW5rPQzj.js | 5.7 kB · brotli 2.0 kB |
| dist/client/assets/ScrollArea-D-gSZFWg.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-DMJv3YJa.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-hq-7btz7.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/PresenterList-BafkQaSV.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/CookbookList-8Fd7-NWJ.js | 4.1 kB · brotli 1.6 kB |
| dist/client/assets/ToolList-CW1HrAOW.js | 4.0 kB · brotli 1.6 kB |
| dist/client/assets/useConfigOptionConfigs-SgsEx7w1.js | 3.6 kB · brotli 921 B |
| dist/client/assets/EstablishDataViewsLayout-Dc_9zT4h.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-NHOktBVF.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-Bo0BjOCS.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-BCXA83t8.js | 2.9 kB · brotli 1.3 kB |
| dist/client/assets/Card-BOrf028X.js | 2.7 kB · brotli 1.1 kB |
| dist/client/assets/EventQueryList-DaG0slO4.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-EOaYc_k-.js | 2.2 kB · brotli 929 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-CgmZD1j5.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/DimensionList-CRRCcJKt.js | 2.1 kB · brotli 959 B |
| dist/client/assets/configMonitor-Dd02BJnL.js | 2.0 kB · brotli 734 B |
| dist/client/assets/GridDetailPanel-BGyQa5YH.js | 1.9 kB · brotli 896 B |
| dist/client/assets/AboutPanel-FrdNpn30.js | 1.7 kB · brotli 870 B |
| dist/client/assets/Tag-CGpYzskA.js | 1.7 kB · brotli 723 B |
| dist/client/assets/KnowledgeLayout-CKnp8evJ.js | 1.7 kB · brotli 766 B |
| dist/client/assets/EmptyPlaceholder-BaKynn7n.js | 1.5 kB · brotli 679 B |
| dist/client/assets/ManageConfigLayout-BpsvqN12.js | 1.4 kB · brotli 732 B |
| dist/client/assets/HomeLayout-CzNVT9Mv.js | 1.4 kB · brotli 688 B |
| dist/client/assets/accountMonitor-GnjgXfol.js | 1.3 kB · brotli 512 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/createLucideIcon-Da5bIak_.js | 1.3 kB · brotli 695 B |
| dist/client/assets/DialogModal-BFC8XjLW.js | 1.2 kB · brotli 636 B |
| dist/client/assets/ManagePersonalDetailsPanel-Dpnlwd6t.js | 1.2 kB · brotli 252 B |
| dist/client/assets/WorkbenchLayout-B0kw33NP.js | 1.2 kB · brotli 613 B |
| dist/client/assets/establishDataViews-XJArJzh5.js | 1.2 kB · brotli 535 B |
| dist/client/assets/ListItemButton-BDsRDKmN.js | 1.1 kB · brotli 521 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-BcwP-51R.js | 858 B · brotli 495 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-BIc0x8bh.js | 769 B · brotli 422 B |
| dist/client/assets/BuildDataAppsLayout-CTNkD-UC.js | 754 B · brotli 424 B |
| dist/client/assets/useEngine-B_xj_wtI.js | 669 B · brotli 340 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CRX01uuR.js | 589 B · brotli 327 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-g6wIPkff.js | 528 B · brotli 294 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-C_zoKTQ8.js | 303 B · brotli 195 B |
| dist/client/assets/ManageDataServiceTokensPanel-DD3fABCS.js | 300 B · brotli 193 B |
| dist/client/assets/ManageConnectionPanel-iOAQL_Rw.js | 297 B · brotli 189 B |
| dist/client/assets/arrow-big-left-DAI4_r0u.js | 291 B · brotli 218 B |
| dist/client/assets/GenerateTokenPanel-CMNQUZso.js | 289 B · brotli 188 B |
| dist/client/assets/ManageSessionsPanel-CvRl_GWZ.js | 289 B · brotli 189 B |
| dist/client/assets/ReviewActivityPanel-D8qVdC2U.js | 289 B · brotli 188 B |
| dist/client/assets/DeleteAccountPanel-0aL9Pw_w.js | 288 B · brotli 187 B |
| dist/client/assets/ManageAccessPanel-WM_xGr0O.js | 287 B · brotli 186 B |
| dist/client/assets/x-j9qVIbVL.js | 154 B · brotli 150 B |
| dist/client/assets/plus-DJHoRAG3.js | 153 B · brotli 121 B |

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
