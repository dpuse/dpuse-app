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

|Chunk/Module/File|Composition|
|:------ |:-----------|
| dist-BGrRc1p2.js | 279.1 kB · gz 83.8 kB · br 73.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-view → dist/index.js | `█░░░░░░░░░░░░░░░░░░░` 5.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/core → dist/index.js | `█░░░░░░░░░░░░░░░░░░░` 5.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-model → dist/index.js | `█░░░░░░░░░░░░░░░░░░░` 2.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-transform → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 1.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-state → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-commands → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/vue-3 → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-schema-list → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;orderedmap → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-keymap → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;w3c-keyname → index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| ChatPanel-BLcIjRZk.js | 205.4 kB · gz 52.3 kB · br 44.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;zod | `██░░░░░░░░░░░░░░░░░░` 8.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;ai → dist/index.js | `█░░░░░░░░░░░░░░░░░░░` 2.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/provider-utils → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 1.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;swrv | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/provider → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;eventsource-parser | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;@ai-sdk/vue → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ChartNode-CVfH_ONO.js | 159.0 kB · gz 54.5 kB · br 47.9 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;chart.js | `██░░░░░░░░░░░░░░░░░░` 10.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@kurkle/color → dist/color.esm.js | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| DocumentEditorView-fFtYcDx9.js | 153.0 kB · gz 48.1 kB · br 42.2 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;yjs → dist/yjs.mjs | `█░░░░░░░░░░░░░░░░░░░` 4.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;lib0 | `░░░░░░░░░░░░░░░░░░░░` 1.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/y-tiptap → dist/y-tiptap.js | `░░░░░░░░░░░░░░░░░░░░` 1.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extensions → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;y-partyserver → dist/provider/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-history → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;y-protocols | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-gapcursor → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;rope-sequence → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-collaboration → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;prosemirror-dropcursor → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-collaboration-caret → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-bold → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-heading → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-italic → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-paragraph → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/core → dist/jsx-runtime/jsx-runtime.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;nanoid | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-document → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-text → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-dropcursor → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tiptap/extension-gapcursor → dist/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| index-DNMFG3yN.js | 100.9 kB · gz 37.5 kB · br 33.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;dompurify → dist/purify.es.mjs | `░░░░░░░░░░░░░░░░░░░░` 2.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;vue-router | `░░░░░░░░░░░░░░░░░░░░` 1.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-dom → dist/runtime-dom.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 1.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;(runtime) | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@dpuse/dpuse-shared | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;zod → v4/core/core.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| AuthDialog-dpHPi-Dh.js | 79.2 kB · gz 25.2 kB · br 21.8 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@regle/core → dist/regle-core.min.js | `█░░░░░░░░░░░░░░░░░░░` 2.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;@regle/rules → dist/regle-rules.min.js | `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next → dist/esm/icons/user-round-key.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| LibraryPanel-CsQBfgMR.js | 70.2 kB · gz 19.0 kB · br 17.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai | `░░░░░░░░░░░░░░░░░░░░` 2.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/ai-client | `░░░░░░░░░░░░░░░░░░░░` 1.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;partial-json | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next → dist/esm/icons/send-horizontal.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;(runtime) → rolldown/runtime.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| runtime-core.esm-bundler-BcP5EM5M.js | 70.0 kB · gz 26.9 kB · br 24.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/runtime-core → dist/runtime-core.esm-bundler.js | `█░░░░░░░░░░░░░░░░░░░` 4.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/reactivity → dist/reactivity.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 1.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;@vue/shared → dist/shared.esm-bundler.js | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| ContextualiseDataLayout-B6U3mDPF.js | 61.8 kB · gz 21.1 kB · br 18.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-selection | `░░░░░░░░░░░░░░░░░░░░` 0.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-transition | `░░░░░░░░░░░░░░░░░░░░` 0.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-zoom | `░░░░░░░░░░░░░░░░░░░░` 0.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-color | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-force | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-quadtree | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-interpolate | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-drag | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-timer | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-dispatch → src/dispatch.js | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;d3-ease → src/cubic.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ExploreData-DlWEalv6.js | 56.7 kB · gz 15.2 kB · br 13.6 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@formkit/drag-and-drop | `░░░░░░░░░░░░░░░░░░░░` 1.9% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 1.6% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| Table-DhQj_tS5.js | 54.9 kB · gz 14.4 kB · br 13.0 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/table-core → build/lib/index.mjs | `█░░░░░░░░░░░░░░░░░░░` 3.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.7% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-table → build/lib/index.mjs | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| KnowledgeHeader-C_68jjvm.js | 41.2 kB · gz 12.5 kB · br 11.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;marked → lib/marked.esm.js | `░░░░░░░░░░░░░░░░░░░░` 1.8% |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| sdk.modern-BGKRpR1c.js → @teamhanko/hanko-frontend-sdk → dist/sdk.modern.js | 24.5 kB · gz 7.3 kB · br 6.5 kB · `░░░░░░░░░░░░░░░░░░░░` 1.1% |
| useDataWindow-DawosXFe.js | 22.7 kB · gz 7.0 kB · br 6.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/virtual-core | `░░░░░░░░░░░░░░░░░░░░` 1.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → useDataWindow.ts | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| &nbsp;&nbsp;&nbsp;&nbsp;@tanstack/vue-virtual → dist/esm/index.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next → dist/esm/icons/plus.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ContextPanel-CV1GHIlk.js → src | 7.2 kB · gz 2.6 kB · br 2.3 kB · `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| SelectConnectionPanel-CpDnBoEK.js → src | 7.2 kB · gz 2.1 kB · br 1.9 kB · `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| SessionMenu-DOQU2ZXa.js | 6.7 kB · gz 2.6 kB · br 2.4 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next | `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| SelectItemPanel-iUCMOZIL.js → src | 6.6 kB · gz 2.9 kB · br 2.6 kB · `░░░░░░░░░░░░░░░░░░░░` 0.5% |
| ConnectionList-byRrg-YM.js → src | 6.4 kB · gz 1.9 kB · br 1.7 kB · `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| ConnectorList-ILi0DDKx.js | 5.8 kB · gz 2.4 kB · br 2.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next → dist/esm/icons/external-link.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| performanceTracking-BByA8kRE.js | 5.7 kB · gz 2.4 kB · br 2.1 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;web-vitals → dist/web-vitals.js | `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| &nbsp;&nbsp;&nbsp;&nbsp;src → performanceTracking.ts | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ConnectionDialog-C4AqeWjt.js → src | 5.5 kB · gz 2.1 kB · br 1.9 kB · `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| ScrollArea-q0oQy61h.js → src | 5.1 kB · gz 1.9 kB · br 1.7 kB · `░░░░░░░░░░░░░░░░░░░░` 0.4% |
| AccountDialog-Cu-CB3HD.js → src | 4.9 kB · gz 1.9 kB · br 1.7 kB · `░░░░░░░░░░░░░░░░░░░░` 0.3% |
| useWorkbenchOptions-CECb9RoG.js → src → useWorkbenchOptions.ts | 4.2 kB · gz 1.4 kB · br 1.2 kB · `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| GridDetailPanel-HZ6-N7qA.js | 3.9 kB · gz 1.7 kB · br 1.5 kB |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next → dist/esm/icons/arrow-big-right.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| useConfigOptionConfigs-C2rMw2qz.js → src → useConfigOptionConfigs.ts | 3.4 kB · gz 912 B · br 816 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| EstablishDataViewsLayout-iAEPN0Zk.js → src | 3.2 kB · gz 1.5 kB · br 1.3 kB · `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| Grid-DbHgAQ5H.js → src | 3.0 kB · gz 1.4 kB · br 1.3 kB · `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| DataViewList-Dq2zeEh8.js → src | 2.9 kB · gz 1.4 kB · br 1.2 kB · `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| WorkbenchOptionBar-BcoQPi3J.js → src | 2.9 kB · gz 1.4 kB · br 1.2 kB · `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| Card-DWQqFmIN.js → src | 2.6 kB · gz 1.1 kB · br 956 B · `░░░░░░░░░░░░░░░░░░░░` 0.2% |
| EventQueryList-CoXN26E9.js → src | 2.3 kB · gz 1.2 kB · br 1.1 kB · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| DimensionList-CWD7FGMI.js → src | 2.1 kB · gz 1.1 kB · br 966 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| ContextList-FAZWqR7h.js → src | 2.1 kB · gz 1.1 kB · br 968 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| ExplorePresentationsLayout-wNTKTCrl.js → src | 1.9 kB · gz 1019 B · br 899 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| AboutPanel-DLVjXz_M.js → src | 1.7 kB · gz 971 B · br 873 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| KnowledgeLayout-DOwNt_2F.js → src | 1.5 kB · gz 765 B · br 694 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| EmptyPlaceholder-Cm01eh8d.js → src | 1.5 kB · gz 787 B · br 690 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| ManageConfigsLayout-j-o0JwFy.js → src | 1.4 kB · gz 826 B · br 746 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| configMonitor-Ch3jzwBJ.js → src → configMonitor.ts | 1.4 kB · gz 702 B · br 598 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| HomeLayout-C7lyETLd.js → src | 1.4 kB · gz 755 B · br 684 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| dpuse-shared-utilities.es-DBEf96kJ.js → @dpuse/dpuse-shared → dist/dpuse-shared-utilities.es.js | 1.3 kB · gz 675 B · br 598 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| TextField-Cpw--ZW2.js → src | 1.3 kB · gz 815 B · br 727 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| ManagePersonalDetailsPanel-Dl1YAuYb.js → src → ManagePersonalDetailsPanel.vue | 1.2 kB · gz 327 B · br 257 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| DialogModal-xWGQny-U.js → src | 1.2 kB · gz 718 B · br 614 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| accountMonitor-CslSgeiJ.js → src → accountMonitor.ts | 1.2 kB · gz 600 B · br 495 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| establishDataViews-De5dE4Pc.js → src → establishDataViews.ts | 1.2 kB · gz 649 B · br 545 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| ListItemButton-BWcCc29v.js → src | 1.1 kB · gz 605 B · br 521 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| WorkbenchHeader-CRvf0N8f.js → src | 989 B · gz 593 B · br 559 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| SelectPlaceholder-C-6_DDfE.js | 925 B · gz 587 B · br 523 B |
| &nbsp;&nbsp;&nbsp;&nbsp;src | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| &nbsp;&nbsp;&nbsp;&nbsp;lucide-vue-next → dist/esm/icons/mouse-pointer-click.js | `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| Input-CwnBy7Hi.js → src | 871 B · gz 541 B · br 492 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| HomePanel-DH7H5RQ5.js → src | 857 B · gz 547 B · br 516 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| AssembleDimensionsLayout-CYmEkMgu.js → src | 812 B · gz 489 B · br 443 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| PaneSplitter-CzBGPKY4.js → src | 806 B · gz 514 B · br 442 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| BuildDataAppsLayout-CgOKjPsR.js → src | 797 B · gz 494 B · br 444 B · `░░░░░░░░░░░░░░░░░░░░` 0.1% |
| HomeIcon-DwXnJewB.js → src | 607 B · gz 408 B · br 371 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| CloseButton-DLYYDsgR.js → src | 589 B · gz 385 B · br 330 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| AuditContentPanel-rYialCod.js → src | 563 B · gz 395 B · br 343 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| Separator-gEX25Avu.js → src | 557 B · gz 328 B · br 298 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| useEngine-CKFpZDoC.js → src → useEngine.ts | 509 B · gz 362 B · br 303 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ManagePreferencesPanel-6KR_Rgb6.js → src | 494 B · gz 339 B · br 280 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| DialogHeader-CQemKkWW.js → src | 314 B · gz 251 B · br 214 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| WorkbenchLayout-B0_sPupM.js → src → WorkbenchLayout.vue | 305 B · gz 255 B · br 214 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ManageSubscriptionPanel-BW5phoC_.js → src → ManageSubscriptionPanel.vue | 303 B · gz 249 B · br 197 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ManageDataServiceTokensPanel-DuAb1jNm.js → src → ManageDataServiceTokensPanel.vue | 300 B · gz 246 B · br 196 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ManageConnectionPanel-4VE5kRfF.js → src → ManageConnectionPanel.vue | 297 B · gz 244 B · br 192 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| GenerateTokenPanel-BYBQqp8C.js → src → GenerateTokenPanel.vue | 289 B · gz 239 B · br 191 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ManageSessionsPanel-BUU1qyfA.js → src → ManageSessionsPanel.vue | 289 B · gz 239 B · br 192 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ReviewActivityPanel-uLAkmuhO.js → src → ReviewActivityPanel.vue | 289 B · gz 240 B · br 190 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| DeleteAccountPanel-DpOpvUru.js → src → DeleteAccountPanel.vue | 288 B · gz 238 B · br 191 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| ManageAccessPanel-C9NOxCHR.js → src → ManageAccessPanel.vue | 287 B · gz 238 B · br 191 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| arrow-big-left-3prWO63m.js → lucide-vue-next → dist/esm/icons/arrow-big-left.js | 274 B · gz 205 B · br 178 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| PresenterList-DMaMEitd.js → src | 216 B · gz 198 B · br 159 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| CookbookList-CmffW3k0.js → src | 215 B · gz 196 B · br 158 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |
| x-DQvkE5Qx.js → lucide-vue-next → dist/esm/icons/x.js | 143 B · gz 142 B · br 120 B · `░░░░░░░░░░░░░░░░░░░░` 0.0% |

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
