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
| dist/client/assets/ChatPanel-CY6gBhdi.js | 160.1 kB · brotli 37.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client | `██░░░░░░░░░░░░░░░░░░` 9.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai | `█░░░░░░░░░░░░░░░░░░░` 7.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 2.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ag-ui/core → dist/events-BaoNrGbE.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ContextDescriptorsPanel-S1es1cqz.js | 63.6 kB · brotli 17.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs | `█░░░░░░░░░░░░░░░░░░░` 7.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/index-BeAVQk8P.js | 61.4 kB · brotli 18.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 4.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → dist/runtime-dom.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 2.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 1.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-locale.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/runtime-core.esm-bundler-CSO7nrcq.js | 61.3 kB · brotli 21.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → dist/runtime-core.esm-bundler.js | `█░░░░░░░░░░░░░░░░░░░` 5.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 2.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ExploreDataPanel-DfoDtpTH.js | 56.7 kB · brotli 13.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop | `█░░░░░░░░░░░░░░░░░░░` 3.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 3.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/Table-D_2UpRfS.js | 52.1 kB · brotli 12.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core | `█░░░░░░░░░░░░░░░░░░░` 5.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/settings-2.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ContextModelList-dStdVtV6.js | 46.9 kB · brotli 8.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `█░░░░░░░░░░░░░░░░░░░` 4.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| dist/client/assets/sdk.modern-Bgk07Fwq.js | 27.6 kB · brotli 7.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → dist/sdk.modern.js | `█░░░░░░░░░░░░░░░░░░░` 3.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useMarkedTool-BI_kvD0k.js | 26.9 kB · brotli 9.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs | `█░░░░░░░░░░░░░░░░░░░` 3.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useMarkedTool.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useDataWindow-D7X_ODrf.js | 25.1 kB · brotli 7.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core | `█░░░░░░░░░░░░░░░░░░░` 2.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ActionWrapper-BSBhuylB.js | 23.0 kB · brotli 8.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router | `█░░░░░░░░░░░░░░░░░░░` 2.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ActionWrapper.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SessionAuthPanel-CTl6IeQI.js | 12.2 kB · brotli 4.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/performanceTracking-BmxLwLrp.js | 8.6 kB · brotli 2.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.js | `░░░░░░░░░░░░░░░░░░░░` 1.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AssistantLayout-Ccatnkun.js | 8.2 kB · brotli 3.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/LibraryPanel-CJhB4g5r.js | 7.7 kB · brotli 2.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SessionMenu-BEKqILgC.js | 7.4 kB · brotli 2.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SetupLayout-B0z8GYax.js | 7.4 kB · brotli 2.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/preload-helper-CkSicxY3.js | 6.9 kB · brotli 2.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-errors.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SelectItemPanel-CGsbcZ3_.js | 6.5 kB · brotli 2.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConnectionPanel-ayUSj_yH.js | 5.6 kB · brotli 2.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ScrollArea-T9WqiNnz.js | 5.6 kB · brotli 1.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/GridDetailPanel-BJJPzt0Q.js | 5.6 kB · brotli 2.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SessionAccountPanel-hfbO1cWh.js | 5.4 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionAccountPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConfigCard-fqsvRi-4.js | 5.2 kB · brotli 1.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DataViewsLayout-DYU3bEGN.js | 4.9 kB · brotli 1.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/DataViewList-B3F11L8t.js | 4.6 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/PluginList-C3TsCN7M.js | 4.2 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginList.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| dist/client/assets/SelectConnectionList-CUKkrOBe.js | 4.2 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/PluginPanel-DFgQjYC9.js | 3.9 kB · brotli 1.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/useOptions-BmK-TETy.js | 3.5 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useOptions.ts | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dataViews-AatohV5N.js | 3.5 kB · brotli 1.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViews.ts | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/StudioHomePanel-D92snwog.js | 3.2 kB · brotli 985 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHomePanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/OptionBar-HI_dM0XH.js | 3.1 kB · brotli 1.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/configMonitor-BkQhnWpi.js | 3.1 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/PresentationsLayout-D3r-2yOc.js | 3.0 kB · brotli 1.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PresentationsLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/createLucideIcon-DKvPW11h.js | 2.5 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ContextEntityRelationshipDiagramPanel-R50oVUPS.js | 2.3 kB · brotli 867 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextEntityRelationshipDiagramPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/PaneSplitter-DwW0xcxA.js | 2.1 kB · brotli 1016 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EventQueriesLayout-0_KYswP8.js | 2.1 kB · brotli 947 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueriesLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/GitHubLogo-BLt5JtLY.js | 2.1 kB · brotli 1003 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GitHubLogo.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/TextInput-B-lCo5Gv.js | 2.0 kB · brotli 1017 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextInput.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/accountMonitor-DQdw_T9j.js | 1.9 kB · brotli 718 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/PluginConnectorPanel-C5lIcVQ_.js | 1.7 kB · brotli 735 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginConnectorPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioDocumentPanel-BqxEDR2T.js | 1.5 kB · brotli 793 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ItemButton-BssLhZLP.js | 1.4 kB · brotli 512 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ItemButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Breadcrumbs-B8l1WwK9.js | 1.4 kB · brotli 711 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Breadcrumbs.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ContextDimensionSchemaDiagramPanel-CR5rAcmQ.js | 1.4 kB · brotli 698 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionSchemaDiagramPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-utilities.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/StudioLayout-CS9Qh43h.js | 1.3 kB · brotli 697 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/EmptyPlaceholder-BQEQan7-.js | 1.3 kB · brotli 640 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ManagePersonalDetailsPanel-DVK33o82.js | 1.2 kB · brotli 259 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SelectPlaceholder-BDxs5HIr.js | 1005 B · brotli 531 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/eventTracking-DqpckylD.js | 988 B · brotli 441 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → eventTracking.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useEngine-BSs5a-ot.js | 910 B · brotli 451 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useEngine.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/IconButton-8PiWYk9L.js | 897 B · brotli 505 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → IconButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/DataAppsLayout-Dckls6Ex.js | 825 B · brotli 442 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DataAppsLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/action-B53h8BLt.js | 813 B · brotli 255 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → action.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SetupHomePanel-jcxC153A.js | 724 B · brotli 431 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SetupHomePanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Tag-qJmaWkwh.js | 708 B · brotli 369 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-componentModuleTool.es-_99hL0o8.js | 619 B · brotli 332 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-componentModuleTool.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Separator-fppq9oTy.js | 557 B · brotli 297 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Separator.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AuditContentPanel-DV3fEIzy.js | 525 B · brotli 326 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AuditContentPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManagePreferencesPanel-COVVjSKU.js | 494 B · brotli 283 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/PluginPresenterPanel-qQQ8_R1E.js | 458 B · brotli 223 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginPresenterPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/PluginCookbookPanel-B2qVL8Cu.js | 457 B · brotli 223 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginCookbookPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/PluginToolPanel-DGOlAN5s.js | 453 B · brotli 222 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PluginToolPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-component.es-CLhFBYpO.js | 450 B · brotli 212 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-component.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useSetupRoute-CpFfjGyW.js | 363 B · brotli 227 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useSetupRoute.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useElementIsWide-_s67cLh2.js | 339 B · brotli 228 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useElementIsWide.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/house-e-vWOmqh.js | 318 B · brotli 225 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/house.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageSubscriptionPanel-sPFNL6hh.js | 303 B · brotli 195 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageDataServiceTokensPanel-n3NrHgFZ.js | 300 B · brotli 195 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/GenerateTokenPanel-CVXw2_-0.js | 289 B · brotli 189 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageSessionsPanel-AkOsk6Bm.js | 289 B · brotli 190 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ReviewActivityPanel-rk8FE0nT.js | 289 B · brotli 189 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DeleteAccountPanel-CZhwydQW.js | 288 B · brotli 189 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageAccessPanel-C1Naq8bn.js | 287 B · brotli 189 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useConfigsReady-BkGr0zBs.js | 268 B · brotli 178 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/search-DWWgOer9.js | 194 B · brotli 157 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/arrow-left-DWsRdqaS.js | 185 B · brotli 147 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/arrow-right-CUHzEY7q.js | 185 B · brotli 146 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-right.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/x-CnIwSmJf.js | 174 B · brotli 138 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/x.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/plus-aQ-9muOJ.js | 173 B · brotli 137 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-left-jC-q5QAB.js | 150 B · brotli 154 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-right-BArd3the.js | 150 B · brotli 130 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-down-VtsEQpYc.js | 148 B · brotli 135 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-down.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |

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
