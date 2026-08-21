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
| dist/client/assets/ChatSessionVercel-CTg8OfoX.js | 148.6 kB · brotli 34.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;zod | `█░░░░░░░░░░░░░░░░░░░` 7.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;ai → dist/index.js | `█░░░░░░░░░░░░░░░░░░░` 4.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/provider-utils → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 2.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;swrv | `░░░░░░░░░░░░░░░░░░░░` 0.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;eventsource-parser | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/provider → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/vue → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ChatSessionTanstack-DtkyFdR1.js | 127.1 kB · brotli 28.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client | `██░░░░░░░░░░░░░░░░░░` 7.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai | `█░░░░░░░░░░░░░░░░░░░` 4.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AuthDialog-DRvhND29.js | 78.0 kB · brotli 21.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@regle/core → dist/regle-core.min.js | `█░░░░░░░░░░░░░░░░░░░` 5.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@regle/rules → dist/regle-rules.min.js | `░░░░░░░░░░░░░░░░░░░░` 1.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/index-_obMEMqf.js | 74.9 kB · brotli 24.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 3.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router | `░░░░░░░░░░░░░░░░░░░░` 2.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → dist/runtime-dom.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 1.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;zod → v4/core/core.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ContextModelDescriptorsPanel-BnrL1zp0.js | 74.0 kB · brotli 21.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs | `█░░░░░░░░░░░░░░░░░░░` 6.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;turndown → lib/turndown.browser.es.js | `░░░░░░░░░░░░░░░░░░░░` 1.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/runtime-core.esm-bundler-DP1iE2xl.js | 65.2 kB · brotli 23.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → dist/runtime-core.esm-bundler.js | `█░░░░░░░░░░░░░░░░░░░` 4.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 1.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ExploreData-rH8N3aSd.js | 56.3 kB · brotli 13.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop | `█░░░░░░░░░░░░░░░░░░░` 3.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 2.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ContextList-BoFehzgd.js | 54.9 kB · brotli 9.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `█░░░░░░░░░░░░░░░░░░░` 3.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| dist/client/assets/Table-B-ehAqTh.js | 52.0 kB · brotli 12.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core | `█░░░░░░░░░░░░░░░░░░░` 4.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/settings-2.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/purify.es-CYRiAeUx.js | 26.2 kB · brotli 9.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs | `█░░░░░░░░░░░░░░░░░░░` 2.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/sdk.modern-uK7G7M7W.js | 24.6 kB · brotli 6.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → dist/sdk.modern.js | `█░░░░░░░░░░░░░░░░░░░` 2.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useDataWindow-Dj2lsMEH.js | 23.9 kB · brotli 6.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core | `░░░░░░░░░░░░░░░░░░░░` 2.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/performanceTracking-BtG2PmEH.js | 8.6 kB · brotli 2.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.js | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ChatPanel-VgBFvQyf.js | 7.1 kB · brotli 2.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-up.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageConfigLayout-Cw_RKP4I.js | 7.1 kB · brotli 2.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SelectItemPanel-BxRmOKV9.js | 6.9 kB · brotli 2.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SessionMenu-BRdFS5JG.js | 6.7 kB · brotli 2.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/AssistantLayout-DFdg1qLx.js | 6.3 kB · brotli 2.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConnectionDialog-NYs4VlqQ.js | 5.4 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/KnowledgeBasePanel-DdqWk2Ni.js | 5.3 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → KnowledgeBasePanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ScrollArea-D5InYIbf.js | 5.3 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AccountDialog-CwH8mIP2.js | 4.9 kB · brotli 1.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AccountDialog.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConfigCard-DHjje0RC.js | 4.8 kB · brotli 1.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigCard.vue | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/trash.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EstablishDataViewsLayout-CCfj1a2B.js | 4.8 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/DataViewList-NibAcc_C.js | 4.0 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/useStudioOptions-BEPC1krR.js | 3.6 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ConnectorList-D_QZ4qIb.js | 3.6 kB · brotli 1.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/Grid-DOZKo8KM.js | 3.4 kB · brotli 1.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SelectConnectionList-UUSq8_X1.js | 3.2 kB · brotli 1.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioOptionBar-wUd6enup.js | 3.1 kB · brotli 1.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ContextErdDiagramPanel-BFH8mL8M.js | 3.0 kB · brotli 1.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextErdDiagramPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-componentModuleTool.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/configMonitor-DUV7QFe7.js | 2.6 kB · brotli 939 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ModuleLinksPanel-CDJRtQWW.js | 2.6 kB · brotli 884 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ModuleLinksPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/CookbookList-DIuXWap-.js | 2.5 kB · brotli 1.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/PresenterList-C9-eobJR.js | 2.5 kB · brotli 1.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ToolList-DTBJQ1e_.js | 2.4 kB · brotli 1.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/EventQueryList-rpNDEMiJ.js | 2.3 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueryList.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/dataViews-C4_xSRQo.js | 2.2 kB · brotli 812 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViews.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ExplorePresentationsLayout-DiZHK3DA.js | 2.1 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ExplorePresentationsLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/previewConnectorItem-CwwaknR9.js | 2.1 kB · brotli 760 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/GitHubLogo-B7rppoYF.js | 2.1 kB · brotli 993 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GitHubLogo.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/StudioHomeLayout-B6qfiiqn.js | 2.0 kB · brotli 693 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHomeLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ContextualiseDataLayout-BF_08R4a.js | 1.9 kB · brotli 899 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextualiseDataLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/accountMonitor-Gvkxk3F4.js | 1.9 kB · brotli 716 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/GridDetailPanel-rERKm3Vl.js | 1.9 kB · brotli 911 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GridDetailPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/AboutPanel-DJgru59d.js | 1.7 kB · brotli 869 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AboutPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioLayout-B-CHfy7p.js | 1.4 kB · brotli 715 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-utilities.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EmptyPlaceholder-B3150ytE.js | 1.3 kB · brotli 640 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioDocumentPanel-ByaYOIJh.js | 1.3 kB · brotli 665 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManagePersonalDetailsPanel-TGEq0fBU.js | 1.2 kB · brotli 260 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DialogModal-DrPYrrl2.js | 1.2 kB · brotli 612 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ListItemButton-CmpyZzoQ.js | 1.1 kB · brotli 518 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ListItemButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ContextDimensionTreeDiagramPanel-DuI20X2-.js | 1.0 kB · brotli 540 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionTreeDiagramPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SelectPlaceholder-CeIZKltx.js | 1005 B · brotli 536 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Input-CUPYwDTw.js | 891 B · brotli 506 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Input.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/HomePanel-BdGB2ybu.js | 849 B · brotli 472 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → HomePanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/BuildDataAppsLayout-wuEljnEe.js | 840 B · brotli 452 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → BuildDataAppsLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/PaneSplitter-BzeQAt83.js | 806 B · brotli 443 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/StepActionButton-D3Mlfl28.js | 740 B · brotli 422 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StepActionButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-right.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Tag-C3KuVxh7.js | 723 B · brotli 362 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useEngine-DwROFjnf.js | 644 B · brotli 327 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useEngine.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/HomeIcon-DkqWwrmY.js | 607 B · brotli 366 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → HomeIcon.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/CloseButton-F8-mrhJ5.js | 588 B · brotli 326 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → CloseButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AuditContentPanel-B2ZJkTND.js | 562 B · brotli 334 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AuditContentPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Separator-CknSp6x9.js | 557 B · brotli 291 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Separator.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManagePreferencesPanel-CDmTvlV0.js | 494 B · brotli 313 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/asyncPanel-CHUzCTkp.js | 472 B · brotli 292 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-component.es-CLhFBYpO.js | 450 B · brotli 212 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-component.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EstablishDataViews-Cwq9dSZ3.js → (unassigned) → [unassigned] | 384 B · brotli 183 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DialogHeader-DUCHruOT.js | 314 B · brotli 214 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DialogHeader.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageSubscriptionPanel-DP1HBhdW.js | 303 B · brotli 201 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageDataServiceTokensPanel-Df2dhStG.js | 300 B · brotli 197 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageConnectionPanel-2WDnZYO-.js | 297 B · brotli 193 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageConnectionPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/GenerateTokenPanel-CtaxhTUN.js | 289 B · brotli 192 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageSessionsPanel-BqOmMtWB.js | 289 B · brotli 193 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ReviewActivityPanel-C6PJ9SsQ.js | 289 B · brotli 192 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DeleteAccountPanel-BxVjGJLW.js | 288 B · brotli 191 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageAccessPanel-YGGpFIUp.js | 287 B · brotli 191 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/info-BymVuWXx.js | 193 B · brotli 164 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/info.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/search-R229EmiK.js | 163 B · brotli 154 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/arrow-left-JIVl1ru0.js | 154 B · brotli 142 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/x-dJVwJlfo.js | 143 B · brotli 120 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/x.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-left-DcojnnI0.js | 119 B · brotli 111 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-right-BEIZGgv1.js | 119 B · brotli 107 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-down-CLuVlKc7.js | 117 B · brotli 107 B |
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
