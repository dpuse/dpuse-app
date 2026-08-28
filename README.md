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
| dist/client/assets/ChatSessionVercel-C0-hruZN.js | 148.6 kB · brotli 33.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;zod | `█░░░░░░░░░░░░░░░░░░░` 7.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;ai → dist/index.js | `█░░░░░░░░░░░░░░░░░░░` 4.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/provider-utils → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 2.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;swrv | `░░░░░░░░░░░░░░░░░░░░` 0.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;eventsource-parser | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/provider → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/vue → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ChatSessionTanstack-DOcqqlMm.js | 133.5 kB · brotli 29.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client | `██░░░░░░░░░░░░░░░░░░` 7.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai | `█░░░░░░░░░░░░░░░░░░░` 5.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ag-ui/core → dist/events-BaoNrGbE.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AuthDialog-B-oTWqXD.js | 77.2 kB · brotli 20.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@regle/core → dist/regle-core.min.js | `█░░░░░░░░░░░░░░░░░░░` 5.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@regle/rules → dist/regle-rules.min.js | `░░░░░░░░░░░░░░░░░░░░` 1.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/runtime-core.esm-bundler-DP1iE2xl.js | 65.2 kB · brotli 23.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → dist/runtime-core.esm-bundler.js | `█░░░░░░░░░░░░░░░░░░░` 4.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 1.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ConfigContextModelDescriptorsPanel-CxRbdEPp.js | 63.7 kB · brotli 17.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs | `█░░░░░░░░░░░░░░░░░░░` 6.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ExploreData-ViUeLMrr.js | 56.5 kB · brotli 13.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop | `█░░░░░░░░░░░░░░░░░░░` 3.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 2.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConfigContextList-Dm6h7E4l.js | 55.6 kB · brotli 9.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `█░░░░░░░░░░░░░░░░░░░` 3.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| dist/client/assets/Table-BQK8-345.js | 52.1 kB · brotli 12.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core | `█░░░░░░░░░░░░░░░░░░░` 4.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/settings-2.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/index-aMTsfh2p.js | 48.3 kB · brotli 15.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 2.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → dist/runtime-dom.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 1.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;zod → v4/core/core.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/sdk.modern-Bgk07Fwq.js | 27.6 kB · brotli 7.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → dist/sdk.modern.js | `█░░░░░░░░░░░░░░░░░░░` 2.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useMarkedTool-LDNazf1t.js | 26.9 kB · brotli 9.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs | `█░░░░░░░░░░░░░░░░░░░` 2.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useMarkedTool.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Button-BfQPlBLL.js | 24.7 kB · brotli 8.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router | `░░░░░░░░░░░░░░░░░░░░` 2.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Button.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useDataWindow-CTUHpFPr.js | 23.9 kB · brotli 6.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core | `░░░░░░░░░░░░░░░░░░░░` 2.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/session-Cabkg4xy.js | 9.9 kB · brotli 3.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-errors.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ChatPanel-BV6ae3Fa.js | 9.1 kB · brotli 3.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-up.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/performanceTracking-Wwt0m8Lk.js | 8.6 kB · brotli 2.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.js | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ConfigModuleList-CKIXauW1.js | 7.8 kB · brotli 2.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SelectItemPanel-CdIuaFab.js | 7.0 kB · brotli 2.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SessionMenu-DLeqHgqH.js | 6.8 kB · brotli 2.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConnectionDialog-DLYPrO9l.js | 5.6 kB · brotli 2.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/AssistantLayout-9UU3lqk5.js | 5.6 kB · brotli 2.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/GridDetailPanel-BWyadoH3.js | 5.6 kB · brotli 2.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ScrollArea-iE6KcXhB.js | 5.5 kB · brotli 1.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/LibraryPanel-OicvuOv7.js | 5.3 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → LibraryPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/AccountDialog-eO2JfYdj.js | 5.2 kB · brotli 1.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AccountDialog.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConfigCard-DQG6fdHC.js | 5.1 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/trash.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EstablishDataViewsLayout-Bzfje0ET.js | 5.0 kB · brotli 1.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConfigLayout-BjCTb9yq.js | 5.0 kB · brotli 1.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DataViewList-Cf4-MzKa.js | 4.4 kB · brotli 1.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/useStudioOptions-DLkxZEEa.js | 3.6 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SelectConnectionList-CtbzCZF7.js | 3.3 kB · brotli 1.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ExplorePresentationsLayout-B-YzW7N9.js | 3.3 kB · brotli 1.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ExplorePresentationsLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioOptionBar-CdatvY6l.js | 3.1 kB · brotli 1.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/StudioHomeLayout-DMrPFDsb.js | 2.8 kB · brotli 867 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHomeLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/configMonitor-DIBlau5b.js | 2.6 kB · brotli 927 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/TabBar-BhMoBQiP.js | 2.5 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TabBar.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/dataViews-d2h1KqnC.js | 2.3 kB · brotli 880 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViews.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ConfigContextModelEntityRelationshipDiagramPanel-6YsCf0Kl.js | 2.3 kB · brotli 840 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigContextModelEntityRelationshipDiagramPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ContextualiseDataLayout-BEDoezsp.js | 2.2 kB · brotli 979 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextualiseDataLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioDocumentPanel-CyJDbg93.js | 2.1 kB · brotli 1005 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/list-x.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/previewConnectorItem-kySeHhj9.js | 2.1 kB · brotli 777 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/GitHubLogo-B7rppoYF.js | 2.1 kB · brotli 993 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GitHubLogo.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/PaneSplitter-CLjLPj7R.js | 2.0 kB · brotli 952 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/accountMonitor-0k3X3uXY.js | 1.9 kB · brotli 718 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AboutPanel-B4rrRBcc.js | 1.7 kB · brotli 867 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AboutPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/TextInput-VxHqQfrn.js | 1.4 kB · brotli 763 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → TextInput.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioLayout-GVkpKAO2.js | 1.4 kB · brotli 721 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.3 kB · brotli 607 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-utilities.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ConfigContextModelDimensionSchemaDiagramPanel-BhBmMEqh.js | 1.3 kB · brotli 656 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigContextModelDimensionSchemaDiagramPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/createLucideIcon--G2y5ow4.js | 1.3 kB · brotli 693 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EmptyPlaceholder-D_h1XbRi.js | 1.3 kB · brotli 641 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ManagePersonalDetailsPanel-2z4NJDrz.js | 1.2 kB · brotli 258 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/errors-BaAdF2VW.js | 1.1 kB · brotli 507 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → errors.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ListItemButton-DxQrUiXC.js | 1.1 kB · brotli 516 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ListItemButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/locale-A1aPuVtj.js | 1.0 kB · brotli 445 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-locale.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → locale.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SelectPlaceholder-CeIZKltx.js | 1005 B · brotli 536 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/eventTracking-D9pMUDKG.js | 988 B · brotli 441 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → eventTracking.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ConfigHomePanel-ugzqAQM0.js | 899 B · brotli 494 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigHomePanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useEngine-hnC7sKFP.js | 866 B · brotli 427 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useEngine.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/BuildDataAppsLayout-CAFGF0Ze.js | 821 B · brotli 437 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → BuildDataAppsLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/StepActionButton-SvZaSSB8.js | 751 B · brotli 430 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StepActionButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-right.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Tag-Dk6KRA48.js | 708 B · brotli 351 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/HomeIcon-DkqWwrmY.js | 607 B · brotli 366 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → HomeIcon.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AuditContentPanel-B2ZJkTND.js | 562 B · brotli 334 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AuditContentPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Separator-CknSp6x9.js | 557 B · brotli 291 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Separator.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManagePreferencesPanel-DY7xluOG.js | 529 B · brotli 294 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-component.es-CLhFBYpO.js | 450 B · brotli 212 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-component.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-componentModuleTool.es-D9L1ujn3.js | 312 B · brotli 219 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-componentModuleTool.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageSubscriptionPanel-BToMBB0x.js | 303 B · brotli 195 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageDataServiceTokensPanel-CGjF03VM.js | 300 B · brotli 192 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/GenerateTokenPanel-zwZ1lggI.js | 289 B · brotli 187 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageSessionsPanel-pz7nWOkR.js | 289 B · brotli 188 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ReviewActivityPanel-BAL8UVLM.js | 289 B · brotli 187 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DeleteAccountPanel-BFxUm9S5.js | 288 B · brotli 186 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageAccessPanel-DZfSJfZo.js | 287 B · brotli 186 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useConfigsReady-DHKxjdt-.js | 270 B · brotli 179 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/info-Dp6vj3yB.js | 204 B · brotli 176 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/info.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/search-BlscX6Yx.js | 174 B · brotli 162 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/arrow-left-BZML7cyn.js | 165 B · brotli 135 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/x-Cfwycnnl.js | 154 B · brotli 145 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/x.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-left-CxkwGZQR.js | 130 B · brotli 134 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-right-Jdd_2-Ek.js | 130 B · brotli 114 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-down-BxdXG4YW.js | 128 B · brotli 114 B |
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
