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
| dist/client/assets/ChatPanel-C0yYDTOH.js | 206.0 kB · brotli 45.0 kB |
| dist/client/assets/index-CjpxzDFM.js | 102.0 kB · brotli 33.3 kB |
| dist/client/assets/AuthDialog-DIoBNAl8.js | 78.4 kB · brotli 21.4 kB |
| dist/client/assets/LibraryPanel-gNdiMh1c.js | 76.1 kB · brotli 18.3 kB |
| dist/client/assets/runtime-core.esm-bundler-DpfNuhcx.js | 70.0 kB · brotli 24.5 kB |
| dist/client/assets/ContextualiseDataLayout-DL-jsY8o.js | 61.8 kB · brotli 18.5 kB |
| dist/client/assets/ExploreData-bBJOtcS_.js | 56.7 kB · brotli 13.6 kB |
| dist/client/assets/Table-Ca6Kwfu3.js | 55.0 kB · brotli 13.0 kB |
| dist/client/assets/KnowledgeHeader-rmfv7S1Y.js | 41.3 kB · brotli 11.5 kB |
| dist/client/assets/sdk.modern-BdBoauR-.js | 24.6 kB · brotli 6.5 kB |
| dist/client/assets/useDataWindow-BHb7Mpe6.js | 23.2 kB · brotli 6.6 kB |
| dist/client/assets/Tag-BNyu0cE5.js | 9.1 kB · brotli 2.7 kB |
| dist/client/assets/ConnectionList-B83Ljmbg.js | 8.9 kB · brotli 2.3 kB |
| dist/client/assets/ContextPanel-B24GWXUQ.js | 7.2 kB · brotli 2.3 kB |
| dist/client/assets/SelectConnectionPanel-C6rk6VRo.js | 7.1 kB · brotli 1.9 kB |
| dist/client/assets/SelectItemPanel-CatzYiFa.js | 7.0 kB · brotli 2.8 kB |
| dist/client/assets/SessionMenu-DD8q2WhP.js | 6.7 kB · brotli 2.4 kB |
| dist/client/assets/ConnectorList-BlgL2S7J.js | 6.6 kB · brotli 2.2 kB |
| dist/client/assets/performanceTracking-uMWvI1kh.js | 5.7 kB · brotli 2.1 kB |
| dist/client/assets/ConnectionDialog-Hmc66S5i.js | 5.6 kB · brotli 1.9 kB |
| dist/client/assets/ScrollArea-BxRwT8ob.js | 5.1 kB · brotli 1.7 kB |
| dist/client/assets/AccountDialog-COtS_AwV.js | 5.0 kB · brotli 1.7 kB |
| dist/client/assets/useWorkbenchOptions-Ckh4mXyH.js | 4.2 kB · brotli 1.2 kB |
| dist/client/assets/useConfigOptionConfigs-BnNGVETH.js | 3.4 kB · brotli 813 B |
| dist/client/assets/EstablishDataViewsLayout-ttr-Hd5l.js | 3.2 kB · brotli 1.4 kB |
| dist/client/assets/Grid-BktXFs0V.js | 3.0 kB · brotli 1.4 kB |
| dist/client/assets/DataViewList-Bm9SKj5M.js | 3.0 kB · brotli 1.3 kB |
| dist/client/assets/WorkbenchOptionBar-DMBvTXlB.js | 2.9 kB · brotli 1.2 kB |
| dist/client/assets/Card-B8Vy01J8.js | 2.6 kB · brotli 1.0 kB |
| dist/client/assets/EventQueryList-C9OMObzU.js | 2.4 kB · brotli 1.1 kB |
| dist/client/assets/DetailActionBar-BBn-Zgn9.js | 2.2 kB · brotli 916 B |
| dist/client/assets/DimensionList-a-oD9edL.js | 2.1 kB · brotli 989 B |
| dist/client/assets/ContextList-CNKSCWP_.js | 2.1 kB · brotli 994 B |
| dist/client/assets/GitHubLogo-BwtV0Y5S.js | 2.1 kB · brotli 1.0 kB |
| dist/client/assets/ExplorePresentationsLayout-BlGQhVtf.js | 1.9 kB · brotli 957 B |
| dist/client/assets/GridDetailPanel-BaKr5eIA.js | 1.8 kB · brotli 895 B |
| dist/client/assets/configMonitor-DpzfHzFP.js | 1.8 kB · brotli 703 B |
| dist/client/assets/AboutPanel-zFARw6xP.js | 1.7 kB · brotli 872 B |
| dist/client/assets/KnowledgeLayout-DUu6vD88.js | 1.6 kB · brotli 731 B |
| dist/client/assets/EmptyPlaceholder-3zLMO9D2.js | 1.5 kB · brotli 689 B |
| dist/client/assets/ManageConfigsLayout-B4m2qarT.js | 1.4 kB · brotli 730 B |
| dist/client/assets/accountMonitor-DkVpVnlf.js | 1.3 kB · brotli 513 B |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| dist/client/assets/TextField-BhfQ0uEI.js | 1.3 kB · brotli 741 B |
| dist/client/assets/HomeLayout-CsuTX72B.js | 1.3 kB · brotli 674 B |
| dist/client/assets/DialogModal-fxNc0s7N.js | 1.2 kB · brotli 641 B |
| dist/client/assets/ManagePersonalDetailsPanel-C_ru-Ssw.js | 1.2 kB · brotli 253 B |
| dist/client/assets/WorkbenchLayout-qBcxzoRC.js | 1.2 kB · brotli 611 B |
| dist/client/assets/establishDataViews-B8Bdt7D5.js | 1.2 kB · brotli 533 B |
| dist/client/assets/ListItemButton-D0atrDQ8.js | 1.1 kB · brotli 520 B |
| dist/client/assets/SelectPlaceholder-B8VxZgae.js | 1005 B · brotli 532 B |
| dist/client/assets/HomePanel-D9YiDrhV.js | 857 B · brotli 505 B |
| dist/client/assets/useApi-CROJJdhE-CaDnHGQZ.js | 830 B · brotli 408 B |
| dist/client/assets/PaneSplitter-CGYcGFvH.js | 806 B · brotli 442 B |
| dist/client/assets/AssembleDimensionsLayout-iDvsAfqh.js | 769 B · brotli 422 B |
| dist/client/assets/BuildDataAppsLayout-BsDKFNiH.js | 754 B · brotli 422 B |
| dist/client/assets/useEngine-DrDAdqX0.js | 669 B · brotli 340 B |
| dist/client/assets/HomeIcon-iJhtSU8A.js | 607 B · brotli 363 B |
| dist/client/assets/CloseButton-CMTAgHK9.js | 588 B · brotli 321 B |
| dist/client/assets/AuditContentPanel-DCjfLc0C.js | 563 B · brotli 337 B |
| dist/client/assets/Separator-2iNzM8RJ.js | 557 B · brotli 292 B |
| dist/client/assets/ManagePreferencesPanel-CQ4-PmIL.js | 494 B · brotli 280 B |
| dist/client/assets/DialogHeader-dqjSxr-m.js | 314 B · brotli 210 B |
| dist/client/assets/ManageSubscriptionPanel-CeNAnRMI.js | 303 B · brotli 193 B |
| dist/client/assets/ManageDataServiceTokensPanel-CglxhuJF.js | 300 B · brotli 191 B |
| dist/client/assets/ManageConnectionPanel-bHjX67YX.js | 297 B · brotli 186 B |
| dist/client/assets/GenerateTokenPanel-DqedJ0tS.js | 289 B · brotli 185 B |
| dist/client/assets/ManageSessionsPanel-185lfpMB.js | 289 B · brotli 187 B |
| dist/client/assets/ReviewActivityPanel-Bd6hhFkT.js | 289 B · brotli 185 B |
| dist/client/assets/DeleteAccountPanel-Dub-GOB4.js | 288 B · brotli 185 B |
| dist/client/assets/ManageAccessPanel-AtuN0koR.js | 287 B · brotli 185 B |
| dist/client/assets/arrow-big-left-Ccry54pe.js | 280 B · brotli 217 B |
| dist/client/assets/PresenterList-jJACNc7V.js | 216 B · brotli 157 B |
| dist/client/assets/CookbookList-DvTOQHTa.js | 215 B · brotli 158 B |
| dist/client/assets/x-VQCp2rvt.js | 143 B · brotli 119 B |

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
