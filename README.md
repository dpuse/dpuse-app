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
| dist/client/assets/ChatSessionVercel-DUrJXgKG.js | 148.0 kB · brotli 33.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;zod | `█░░░░░░░░░░░░░░░░░░░` 7.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;ai → dist/index.js | `█░░░░░░░░░░░░░░░░░░░` 4.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/provider-utils → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 2.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;swrv | `░░░░░░░░░░░░░░░░░░░░` 0.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;eventsource-parser | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/provider → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/vue → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ChatSessionTanstack-Duf9Nner.js | 120.0 kB · brotli 27.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client | `█░░░░░░░░░░░░░░░░░░░` 7.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai | `█░░░░░░░░░░░░░░░░░░░` 4.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AuthDialog-QFiqZ_14.js | 78.4 kB · brotli 21.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@regle/core → dist/regle-core.min.js | `█░░░░░░░░░░░░░░░░░░░` 5.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@regle/rules → dist/regle-rules.min.js | `░░░░░░░░░░░░░░░░░░░░` 1.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/user-round-key.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/index-BObPLKvV.js | 74.8 kB · brotli 24.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 3.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router | `░░░░░░░░░░░░░░░░░░░░` 2.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → dist/runtime-dom.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 1.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;zod → v4/core/core.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ContextModelDescriptorsPanel-BVfVLPhY.js | 74.1 kB · brotli 21.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;squire-rte → dist/squire.mjs | `█░░░░░░░░░░░░░░░░░░░` 6.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;turndown → lib/turndown.browser.es.js | `░░░░░░░░░░░░░░░░░░░░` 1.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/runtime-core.esm-bundler-9ds7u2Nw.js | 65.5 kB · brotli 23.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → dist/runtime-core.esm-bundler.js | `█░░░░░░░░░░░░░░░░░░░` 4.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 1.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ExploreData--Qu2gCFY.js | 56.8 kB · brotli 13.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop | `█░░░░░░░░░░░░░░░░░░░` 3.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `█░░░░░░░░░░░░░░░░░░░` 2.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ContextList-6bG6YFmg.js | 54.4 kB · brotli 9.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/network.mjs | `█░░░░░░░░░░░░░░░░░░░` 3.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| dist/client/assets/Table2-CbGarzIn.js | 52.7 kB · brotli 12.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core | `█░░░░░░░░░░░░░░░░░░░` 4.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/store → dist/shallow.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/settings-2.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/purify.es-BKQOAcDz.js | 26.5 kB · brotli 9.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs | `█░░░░░░░░░░░░░░░░░░░` 2.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/sdk.modern-uK7G7M7W.js | 24.6 kB · brotli 6.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@teamhanko/hanko-frontend-sdk → dist/sdk.modern.js | `█░░░░░░░░░░░░░░░░░░░` 2.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useDataWindow-B7rn-ir7.js | 23.8 kB · brotli 6.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core | `░░░░░░░░░░░░░░░░░░░░` 2.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/plus.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/performanceTracking-BXpwQmyY.js | 8.6 kB · brotli 2.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.js | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ChatPanel-BCtP90SI.js | 7.2 kB · brotli 2.7 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-up.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SelectConnectionPanel-CptNJup7.js | 7.0 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SelectItemPanel-D0C0EQnY.js | 7.0 kB · brotli 2.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/SessionMenu-aqoD-e-d.js | 6.7 kB · brotli 2.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → SessionMenu.vue | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/AssistantLayout-C2xTlJ_g.js | 6.4 kB · brotli 2.3 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConnectionDialog-COnbE7xH.js | 5.5 kB · brotli 1.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/KnowledgeBasePanel-CnRHQxHw.js | 5.4 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → KnowledgeBasePanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ScrollArea2-D5Al3nDk.js | 5.4 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ConnectorList-DobWQfTT.js | 5.2 kB · brotli 1.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/AccountDialog-D1wUBZmn.js | 4.8 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AccountDialog.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| dist/client/assets/ConfigCard-De8KsY7C.js | 4.6 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ConfigCard.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DataViewList-BHh3fxjy.js | 4.1 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/PresenterList-Bp1TZUhH.js | 4.1 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/CookbookList-Bav2Jgzx.js | 4.0 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/ToolList-CKLb9OpR.js | 3.9 kB · brotli 1.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/useConfigOptionConfigs-ByJRxI5n.js | 3.8 kB · brotli 979 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useConfigOptionConfigs.ts | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useStudioOptions-00FXIqWQ.js | 3.6 kB · brotli 1.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useStudioOptions.ts | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Grid-BUwo0xcF.js | 3.5 kB · brotli 1.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Grid.vue | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioOptionBar-Cfmcnla8.js | 3.2 kB · brotli 1.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EstablishDataViewsLayout-h1tIyE3U.js | 2.9 kB · brotli 1.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/dataViews-DN9JX6zk.js | 2.6 kB · brotli 930 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → dataViews.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EventQueryList-DkKEN6Bs.js | 2.4 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EventQueryList.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/DetailActionBar-DHKVQbWv.js | 2.2 kB · brotli 945 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DetailActionBar.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-right.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ExplorePresentationsLayout-D-05c_zZ.js | 2.2 kB · brotli 1.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ExplorePresentationsLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/GitHubLogo-B5TX7eN-.js | 2.1 kB · brotli 1.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GitHubLogo.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/previewConnectorItem-BggjN5Mh.js | 2.1 kB · brotli 783 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/StudioHomeLayout-B2OTEnK0.js | 2.1 kB · brotli 726 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → StudioHomeLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/configMonitor-DKKDHb8N.js | 2.0 kB · brotli 781 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → configMonitor.ts | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ContextErdDiagramPanel-tLjp9Zf1.js | 2.0 kB · brotli 751 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextErdDiagramPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ContextualiseDataLayout-BPbqPeUF.js | 2.0 kB · brotli 938 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextualiseDataLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/GridDetailPanel-PKHDcGeQ.js | 2.0 kB · brotli 951 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GridDetailPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/AboutPanel-DpiH--rS.js | 1.8 kB · brotli 914 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AboutPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/EmptyPlaceholder-DzFtZ0T6.js | 1.5 kB · brotli 720 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → EmptyPlaceholder.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioLayout-BCnUb120.js | 1.4 kB · brotli 750 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/accountMonitor-DGkgy6Md.js | 1.4 kB · brotli 559 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → accountMonitor.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-utilities.es-CFX6uv8k.js | 1.4 kB · brotli 639 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-utilities.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageConfigLayout-T4KEEbX1.js | 1.3 kB · brotli 730 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageConfigLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dist/client/assets/StudioDocumentPanel-DPNZqshK.js | 1.3 kB · brotli 696 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManagePersonalDetailsPanel-CK0vGtN7.js | 1.3 kB · brotli 299 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePersonalDetailsPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DialogModal-C--OcNWr.js | 1.2 kB · brotli 643 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ListItemButton-DR2JD78r.js | 1.2 kB · brotli 557 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ListItemButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ContextDimensionTreeDiagramPanel-D1LnOPpW.js | 1.1 kB · brotli 595 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ContextDimensionTreeDiagramPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/SelectPlaceholder-CJv3av9p.js | 1.0 kB · brotli 577 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Input-QxVyOk7E.js | 967 B · brotli 549 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Input.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/BuildDataAppsLayout-W4SCLpOb.js | 898 B · brotli 493 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → BuildDataAppsLayout.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/HomePanel-DNohTn9D.js | 862 B · brotli 524 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → HomePanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/PaneSplitter-D5guXQXZ.js | 856 B · brotli 483 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → PaneSplitter.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/dpuse-shared-component.es-BrcotRcU.js | 739 B · brotli 390 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared → dist/dpuse-shared-component.es.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/external-link.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Tag-uwOrRSwH.js | 729 B · brotli 381 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Tag.vue | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/useEngine-Bul3tp3K.js | 691 B · brotli 366 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useEngine.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/HomeIcon-57Jw54Di.js | 653 B · brotli 397 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → HomeIcon.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/CloseButton-C-XNBatJ.js | 637 B · brotli 366 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → CloseButton.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/AuditContentPanel-aqL6bxxA.js | 617 B · brotli 369 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → AuditContentPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/Separator-BVu4fncJ.js | 604 B · brotli 326 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → Separator.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManagePreferencesPanel-BRn20MNs.js | 554 B · brotli 341 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManagePreferencesPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/asyncPanel-Cq31rzm5.js | 520 B · brotli 327 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/EstablishDataViews-Cwq9dSZ3.js → (unassigned) → [unassigned] | 440 B · brotli 213 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageDataServiceTokensPanel-_3gaEFeC.js | 366 B · brotli 235 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageDataServiceTokensPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DialogHeader-OQvACgsU.js | 364 B · brotli 248 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DialogHeader.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageSubscriptionPanel-uzvC0Cw6.js | 364 B · brotli 232 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSubscriptionPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageConnectionPanel-BON6N8LM.js | 356 B · brotli 233 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageConnectionPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageSessionsPanel-DKHlGk9G.js | 346 B · brotli 227 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageSessionsPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ReviewActivityPanel-B671t5z0.js | 346 B · brotli 225 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ReviewActivityPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/GenerateTokenPanel-qOYL6COo.js | 345 B · brotli 226 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → GenerateTokenPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/DeleteAccountPanel-7lzp_EuD.js | 344 B · brotli 226 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → DeleteAccountPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/ManageAccessPanel-DF5fLA8d.js | 342 B · brotli 225 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src → ManageAccessPanel.vue | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/arrow-big-left-CYVzM9se.js | 332 B · brotli 217 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-big-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/info-8rU-b7z9.js | 235 B · brotli 212 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/info.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/search-BEVkLdwN.js | 207 B · brotli 198 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/search.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/arrow-left-Jzvi1h82.js | 202 B · brotli 194 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/arrow-left.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/x-VVU8HNe1.js | 182 B · brotli 186 B |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/x.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-right-C6Jwbj-A.js | 170 B · brotli 174 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-right.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| dist/client/assets/chevron-down-DEn7jkcr.js | 167 B · brotli 144 B |
| &nbsp;&nbsp;&nbsp;&nbsp;(unassigned) → [unassigned] | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@lucide/vue → dist/esm/icons/chevron-down.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.0% |

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
