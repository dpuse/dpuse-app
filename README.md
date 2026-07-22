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
| dist/client/assets/ChatPanel-UJw1vF17.js | 206.2 kB · brotli 45.1 kB |
| dist/client/assets/index-BuCTZVAE.js | 102.1 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-Qb21_hPt.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-DE25Mf-1.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-Dvq5LDZ6.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-C53vy9jy.js | 56.7 kB · brotli 13.6 kB |
| dist/client/assets/Table-BJt3AfK7.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-DU1g_ohJ.js | 41.0 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-BENl0m78.js | 23.4 kB · brotli 6.6 kB |
| dist/client/assets/Tag-Vm_gy4Ci.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-SpcU47h4.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/performanceTracking-DxewBCiO.js | 8.6 kB · brotli 2.9 kB |
| dist/client/assets/ContextPanel-Mb8KTbHg.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-Ci7dMFcr.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-mxeOjCw6.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-BoOI0kL3.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-xc0Tk9zV.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/ConnectionDialog-DD4YHE_5.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-BtJkoOjc.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-CqO_IfuM.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-DftN7mse.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-D0OzbDh_.js | 3.4 kB · brotli 815 B |
| dist/client/assets/EstablishDataViewsLayout-CWFXa0tM.js | 3.2 kB · brotli 1.3 kB |
| dist/client/assets/Grid-D5jvCeGc.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/DataViewList-BJKM350Y.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-CGCft6GL.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-DR0AkkGt.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-BcEujzCF.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-Dlrg2Z9H.js | 2.2 kB · brotli 919 B |
| dist/client/assets/DimensionList-DhtJ2W-V.js | 2.1 kB · brotli 986 B |
| dist/client/assets/ContextList-BbcHInAG.js | 2.1 kB · brotli 990 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-Cc43u9OC.js | 2.1 kB · brotli 1023 B |
| dist/client/assets/GridDetailPanel-C7F22F73.js | 1.8 kB · brotli 888 B |
| dist/client/assets/configMonitor-DvXBipAo.js | 1.8 kB · brotli 698 B |
| dist/client/assets/AboutPanel-CqPoj-Ie.js | 1.7 kB · brotli 878 B |
| dist/client/assets/KnowledgeLayout-BtXBDRgl.js | 1.6 kB · brotli 724 B |
| dist/client/assets/EmptyPlaceholder-XRm_vVVr.js | 1.5 kB · brotli 688 B |
| dist/client/assets/ManageConfigsLayout-Cxv-Z-yk.js | 1.4 kB · brotli 729 B |
| dist/client/assets/accountMonitor-gIGu6FGJ.js | 1.3 kB · brotli 515 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-XFj7o4Gn.js | 1.3 kB · brotli 743 B |
| dist/client/assets/HomeLayout-BSux5lbF.js | 1.3 kB · brotli 672 B |
| dist/client/assets/DialogModal-CHUeQuD2.js | 1.2 kB · brotli 636 B |
| dist/client/assets/ManagePersonalDetailsPanel-Dm5xG5Rn.js | 1.2 kB · brotli 255 B |
| dist/client/assets/WorkbenchLayout--We4AMBP.js | 1.2 kB · brotli 617 B |
| dist/client/assets/establishDataViews-DP_DXOBK.js | 1.2 kB · brotli 535 B |
| dist/client/assets/ListItemButton-D46zC7a1.js | 1.1 kB · brotli 523 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-CXzc0viX.js | 857 B · brotli 499 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-RcvDLBhU.js | 769 B · brotli 420 B |
| dist/client/assets/BuildDataAppsLayout-DT8f19wz.js | 754 B · brotli 421 B |
| dist/client/assets/useEngine-Ck7sZore.js | 669 B · brotli 341 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-Conkxywe.js | 588 B · brotli 323 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-BLkeG5xX.js | 494 B · brotli 281 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-HWZoKLN1.js | 303 B · brotli 196 B |
| dist/client/assets/ManageDataServiceTokensPanel-DyUQ0Gwv.js | 300 B · brotli 192 B |
| dist/client/assets/ManageConnectionPanel-BnkdfW0W.js | 297 B · brotli 187 B |
| dist/client/assets/GenerateTokenPanel-BmXIy0St.js | 289 B · brotli 186 B |
| dist/client/assets/ManageSessionsPanel-fdFM_iJn.js | 289 B · brotli 188 B |
| dist/client/assets/ReviewActivityPanel-D1dTuAEt.js | 289 B · brotli 187 B |
| dist/client/assets/DeleteAccountPanel-CgMUn22A.js | 288 B · brotli 186 B |
| dist/client/assets/ManageAccessPanel-DZ_8VjrJ.js | 287 B · brotli 186 B |
| dist/client/assets/arrow-big-left-DVMvCJ7Q.js | 280 B · brotli 184 B |
| dist/client/assets/PresenterList-sdRQ7Xsi.js | 216 B · brotli 160 B |
| dist/client/assets/CookbookList-D7jTd81y.js | 215 B · brotli 162 B |
| dist/client/assets/x-XYuPj1mL.js | 143 B · brotli 121 B |

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
