<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon } from '@lucide/vue';
import { ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Components - Static
import type { GridListItem } from './ContextList.vue';

// ── Data
import modelConfigs from './modelConfigs.json';

// ── Local Components - Static
import BaseDialog from '@/components/ui/dialog/BaseDialog.vue';
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/Input.vue';
import TextEditor from '@/components/ui/TextEditor.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type Entity = { id: string; label: Record<string, string>; description: Record<string, string> };
type Model = { entities: Entity[] };

type LocalisedEntity = { id: string; label: string; description: string };
type LocalisedModel = { entities: LocalisedEntity[] };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'characteristics', label: 'Characteristics' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: GridListItem<LocalisedConfig<ComponentBase>> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModel = shallowRef();
const activeEntityTab = shallowRef(ENTITY_TABS[0]);
const expandedEntityId = ref<string | null>(null);
const open = ref(false);
const purifiedDescription = ref('');
const modelDescription = ref('');
const modelReferenceLabel = ref('');
const modelMap = modelConfigs as Record<string, Model>;

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => modelReference,
    (newModelReference) => {
        purifiedDescription.value = DOMPurify.sanitize(marked.parse(newModelReference.description, { async: false }));
        modelDescription.value = newModelReference.description + newModelReference.description + newModelReference.description + newModelReference.description;
        modelReferenceLabel.value = newModelReference.label;
        activeModel.value = localiseModel(modelMap[newModelReference.id]);
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function toggleEntity(entityId: string): void {
    expandedEntityId.value = expandedEntityId.value === entityId ? null : entityId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function localiseModel(model: Model): LocalisedModel {
    const localisedEntities: LocalisedEntity[] = Array.from(model.entities, (entity) => ({ ...entity, label: entity.label.en, description: entity.description.en }));
    return { ...model, entities: localisedEntities };
}

function purifyText(text: string): string {
    return DOMPurify.sanitize(marked.parse(text, { async: false }));
}
</script>

<template>
    <div class="dpuse-prose flex-1 overflow-y-auto overscroll-y-none px-4">
        <div class="max-w-prose">
            <!-- Header -->
            <div class="flex flex-none items-center gap-x-3 pt-3">
                <h1 class="">{{ modelReference.label }} Model</h1>
                <Button class="" shape="minimal" @click="open = true">
                    <PencilIcon class="size-5" stroke-width="1.25" />
                </Button>
            </div>

            <!-- Description -->
            <div v-html="purifiedDescription" />

            <BaseDialog v-model="open" :title="`${modelReference.label} Descriptors`" @save="open = false">
                <div class="flex min-h-0 max-w-prose flex-1 flex-col gap-y-4 overflow-x-hidden overflow-y-auto overscroll-y-none px-6 py-4">
                    <Input v-model="modelReferenceLabel" label="Label" />
                    <TextEditor v-model="modelDescription" class="min-h-25 flex-1" label="Description" />
                </div>
            </BaseDialog>

            <svg
                xmlns="http://www.w3.org/2000/svg"
                style="background: transparent; background-color: transparent"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                version="1.1"
                width="451px"
                height="171px"
                viewBox="-0.5 -0.5 451 171"
                content='&lt;mxfile&gt;&lt;diagram name="Page-1" id="2O5--SVngWuGJgE4CyUk"&gt;7VpbU+IwFP41PK5DGnrhURHdGRfRxdX1MbahjZaGSYO0/vpNaUrvkVFnQe0MMj2XnJ4k35ecRHpwtIjOGVp6E+pgv6f1nagHT3uaNtCB+E4UcaowtX6qcBlxUhXIFTPygqUyc1sRB4clR06pz8myrLRpEGCbl3SIMbouu82pX37rErm4ppjZyK9r74jDPakFxjA3/MTE9eSrLc1MDQuUOcuehB5y6LqgguMeHDFKefq0iEbYT8YuG5e03VmLdZsYwwHfpQG7vV5OJwDb6ztDj251ugLxDxnlGfkr2eEpc1FAQsQJDWTiPM5Gg9FV4OAkYL8HT9Ye4Xi2RHZiXYvpFzqPL3whAfG4pCTgm+HXT8RHZDcq/+ki5CizHGm6wqiyme1G0Gw5AlBhrCTSYGxrCS2FURVVFdRQ5WqqopqqsFZ7rqA1JlDNFFDMFFDNFGjKRHzgyZz4/oj6lG3gBx0dW85A6EPO6BMuWCztARqGsNRZkUEcM46jgkqy5BzTBeYsFi7rAsEz1noFbhtSh+Sa4m6b5rQTD5J5zSw8MZ4uHuFam/PpFYvRHEfeYwMLrzALO/51/PtW/JNWTZc82xsfNeWuiJL2fwLCO3p29DwoeiJsze0mehq2hR/m76RnnNW++6YnbN0u+79Q4K6Skr6jZkfN70PNzGpKyh0MVQftVL2UmynhccfWjq3fj60Q7pGt1+TCfxzrNywc8NElngR398cN59AaM3HgHCfXakIa/37BjN7QCQriMiPL9A05YjxvRAOcKc9Ikt/GScQtSaI7fxNBzLMU74u206gkxUVJrDBEjAdmmTIivBBLSPcyz+Q5j5QIcUGoxmmd8pCumJ2tXIpbNtFlF/PXzx3YKd1JKi8q9AZ8ZDqGfbHGPpdvMptAI99wlSykOT51o4zPgVbBXdpv2ap481gJZIByIGhWAqUDUwu0wfC222+Hdf0497Vgrb0P1wncZnIoKOMedZNteZxrd0O+6mbrVeTDg0J+tY6q4nVX4NfqMfh/gV8/KH0t4JufH/iDgwL+dol/J/ChtV/g148duwB/ukHyh+L+VYQVmGF+ADX8h012SRFKbOQX2AIKVMkroQ+uflRVzSerfkCl+gFvrX6G5TjD3ZggcIbigps85LanO6ikK+XWranib6ndhypv8ZCmuyOHhZj/2zt1z387AMf/AA==&lt;/diagram&gt;&lt;/mxfile&gt;'
            >
                <defs />
                <g>
                    <g>
                        <rect
                            x="0"
                            y="0"
                            width="120"
                            height="60"
                            fill="#d5e8d4"
                            stroke="#82b366"
                            pointer-events="all"
                            style="fill: light-dark(rgb(213, 232, 212), rgb(31, 47, 30)); stroke: light-dark(rgb(130, 179, 102), rgb(68, 110, 44))"
                        />
                    </g>
                    <g>
                        <g transform="translate(-0.5 -0.5)">
                            <switch>
                                <foreignObject
                                    style="overflow: visible; text-align: left"
                                    pointer-events="none"
                                    width="100%"
                                    height="100%"
                                    requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                                    ><div
                                        xmlns="http://www.w3.org/1999/xhtml"
                                        style="
                                            display: flex;
                                            align-items: unsafe center;
                                            justify-content: unsafe center;
                                            width: 118px;
                                            height: 1px;
                                            padding-top: 30px;
                                            margin-left: 1px;
                                        "
                                    >
                                        <div style="box-sizing: border-box; font-size: 0; text-align: center; color: #000000">
                                            <div
                                                style="
                                                    display: inline-block;
                                                    font-size: 12px;
                                                    font-family: 'Helvetica';
                                                    color: light-dark(#000000, #ffffff);
                                                    line-height: 1.2;
                                                    pointer-events: all;
                                                    white-space: normal;
                                                    word-wrap: normal;
                                                "
                                            >
                                                Organisation
                                            </div>
                                        </div>
                                    </div></foreignObject
                                >
                                <text x="60" y="34" fill="light-dark(#000000, #ffffff)" font-family='"Helvetica"' font-size="12px" text-anchor="middle">Organisation</text>
                            </switch>
                        </g>
                    </g>
                    <g>
                        <rect
                            x="250"
                            y="0"
                            width="120"
                            height="60"
                            fill="#d5e8d4"
                            stroke="#82b366"
                            pointer-events="all"
                            style="fill: light-dark(rgb(213, 232, 212), rgb(31, 47, 30)); stroke: light-dark(rgb(130, 179, 102), rgb(68, 110, 44))"
                        />
                    </g>
                    <g>
                        <g transform="translate(-0.5 -0.5)">
                            <switch>
                                <foreignObject
                                    style="overflow: visible; text-align: left"
                                    pointer-events="none"
                                    width="100%"
                                    height="100%"
                                    requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                                    ><div
                                        xmlns="http://www.w3.org/1999/xhtml"
                                        style="
                                            display: flex;
                                            align-items: unsafe center;
                                            justify-content: unsafe center;
                                            width: 118px;
                                            height: 1px;
                                            padding-top: 30px;
                                            margin-left: 251px;
                                        "
                                    >
                                        <div style="box-sizing: border-box; font-size: 0; text-align: center; color: #000000">
                                            <div
                                                style="
                                                    display: inline-block;
                                                    font-size: 12px;
                                                    font-family: 'Helvetica';
                                                    color: light-dark(#000000, #ffffff);
                                                    line-height: 1.2;
                                                    pointer-events: all;
                                                    white-space: normal;
                                                    word-wrap: normal;
                                                "
                                            >
                                                Person
                                            </div>
                                        </div>
                                    </div></foreignObject
                                >
                                <text x="310" y="34" fill="light-dark(#000000, #ffffff)" font-family='"Helvetica"' font-size="12px" text-anchor="middle">Person</text>
                            </switch>
                        </g>
                    </g>
                    <g>
                        <rect
                            x="0"
                            y="110"
                            width="120"
                            height="60"
                            fill="#dae8fc"
                            stroke="#6c8ebf"
                            pointer-events="all"
                            style="fill: light-dark(rgb(218, 232, 252), rgb(29, 41, 59)); stroke: light-dark(rgb(108, 142, 191), rgb(92, 121, 163))"
                        />
                    </g>
                    <g>
                        <g transform="translate(-0.5 -0.5)">
                            <switch>
                                <foreignObject
                                    style="overflow: visible; text-align: left"
                                    pointer-events="none"
                                    width="100%"
                                    height="100%"
                                    requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                                    ><div
                                        xmlns="http://www.w3.org/1999/xhtml"
                                        style="
                                            display: flex;
                                            align-items: unsafe center;
                                            justify-content: unsafe center;
                                            width: 118px;
                                            height: 1px;
                                            padding-top: 140px;
                                            margin-left: 1px;
                                        "
                                    >
                                        <div style="box-sizing: border-box; font-size: 0; text-align: center; color: #000000">
                                            <div
                                                style="
                                                    display: inline-block;
                                                    font-size: 12px;
                                                    font-family: 'Helvetica';
                                                    color: light-dark(#000000, #ffffff);
                                                    line-height: 1.2;
                                                    pointer-events: all;
                                                    white-space: normal;
                                                    word-wrap: normal;
                                                "
                                            >
                                                Organisational Unit
                                            </div>
                                        </div>
                                    </div></foreignObject
                                >
                                <text x="60" y="144" fill="light-dark(#000000, #ffffff)" font-family='"Helvetica"' font-size="12px" text-anchor="middle">Organisational Unit</text>
                            </switch>
                        </g>
                    </g>
                    <g>
                        <rect
                            x="170"
                            y="110"
                            width="120"
                            height="60"
                            fill="#dae8fc"
                            stroke="#6c8ebf"
                            pointer-events="all"
                            style="fill: light-dark(rgb(218, 232, 252), rgb(29, 41, 59)); stroke: light-dark(rgb(108, 142, 191), rgb(92, 121, 163))"
                        />
                    </g>
                    <g>
                        <g transform="translate(-0.5 -0.5)">
                            <switch>
                                <foreignObject
                                    style="overflow: visible; text-align: left"
                                    pointer-events="none"
                                    width="100%"
                                    height="100%"
                                    requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                                    ><div
                                        xmlns="http://www.w3.org/1999/xhtml"
                                        style="
                                            display: flex;
                                            align-items: unsafe center;
                                            justify-content: unsafe center;
                                            width: 118px;
                                            height: 1px;
                                            padding-top: 140px;
                                            margin-left: 171px;
                                        "
                                    >
                                        <div style="box-sizing: border-box; font-size: 0; text-align: center; color: #000000">
                                            <div
                                                style="
                                                    display: inline-block;
                                                    font-size: 12px;
                                                    font-family: 'Helvetica';
                                                    color: light-dark(#000000, #ffffff);
                                                    line-height: 1.2;
                                                    pointer-events: all;
                                                    white-space: normal;
                                                    word-wrap: normal;
                                                "
                                            >
                                                Person Language
                                            </div>
                                        </div>
                                    </div></foreignObject
                                >
                                <text x="230" y="144" fill="light-dark(#000000, #ffffff)" font-family='"Helvetica"' font-size="12px" text-anchor="middle">Person Language</text>
                            </switch>
                        </g>
                    </g>
                    <g>
                        <rect
                            x="330"
                            y="110"
                            width="120"
                            height="60"
                            fill="#dae8fc"
                            stroke="#6c8ebf"
                            pointer-events="all"
                            style="fill: light-dark(rgb(218, 232, 252), rgb(29, 41, 59)); stroke: light-dark(rgb(108, 142, 191), rgb(92, 121, 163))"
                        />
                    </g>
                    <g>
                        <g transform="translate(-0.5 -0.5)">
                            <switch>
                                <foreignObject
                                    style="overflow: visible; text-align: left"
                                    pointer-events="none"
                                    width="100%"
                                    height="100%"
                                    requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"
                                    ><div
                                        xmlns="http://www.w3.org/1999/xhtml"
                                        style="
                                            display: flex;
                                            align-items: unsafe center;
                                            justify-content: unsafe center;
                                            width: 118px;
                                            height: 1px;
                                            padding-top: 140px;
                                            margin-left: 331px;
                                        "
                                    >
                                        <div style="box-sizing: border-box; font-size: 0; text-align: center; color: #000000">
                                            <div
                                                style="
                                                    display: inline-block;
                                                    font-size: 12px;
                                                    font-family: 'Helvetica';
                                                    color: light-dark(#000000, #ffffff);
                                                    line-height: 1.2;
                                                    pointer-events: all;
                                                    white-space: normal;
                                                    word-wrap: normal;
                                                "
                                            >
                                                Person Nationality
                                            </div>
                                        </div>
                                    </div></foreignObject
                                >
                                <text x="390" y="144" fill="light-dark(#000000, #ffffff)" font-family='"Helvetica"' font-size="12px" text-anchor="middle">Person Nationality</text>
                            </switch>
                        </g>
                    </g>
                    <g>
                        <path
                            d="M 60 60 L 60 94.5"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="stroke"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                        <path
                            d="M 64 64 L 56 64"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="all"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                        <ellipse cx="60" cy="98" rx="3" ry="3" fill="none" stroke="#000000" pointer-events="all" style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))" />
                        <path
                            d="M 64 110 L 60 102 L 56 110 M 60 102 L 60 110"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="all"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                    </g>
                    <g>
                        <path
                            d="M 280 60 L 280 85 L 230 85 L 230 94.5"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="stroke"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                        <path
                            d="M 284 64 L 276 64"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="all"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                        <ellipse cx="230" cy="98" rx="3" ry="3" fill="none" stroke="#000000" pointer-events="all" style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))" />
                        <path
                            d="M 234 110 L 230 102 L 226 110 M 230 102 L 230 110"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="all"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                    </g>
                    <g>
                        <path
                            d="M 340 60 L 340 85 L 390 85 L 390 94.5"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="stroke"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                        <path
                            d="M 344 64 L 336 64"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="all"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                        <ellipse cx="390" cy="98" rx="3" ry="3" fill="none" stroke="#000000" pointer-events="all" style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))" />
                        <path
                            d="M 394 110 L 390 102 L 386 110 M 390 102 L 390 110"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="all"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                    </g>
                    <g>
                        <path
                            d="M 120 140 L 140 140 L 140 80 L 90 80 L 90 94.5"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="stroke"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                        <path
                            d="M 124 136 L 124 144"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="all"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                        <ellipse cx="90" cy="98" rx="3" ry="3" fill="none" stroke="#000000" pointer-events="all" style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))" />
                        <path
                            d="M 86 106 L 94 106 M 90 101.5 L 90 110"
                            fill="none"
                            stroke="#000000"
                            stroke-miterlimit="10"
                            pointer-events="all"
                            style="stroke: light-dark(rgb(0, 0, 0), rgb(255, 255, 255))"
                        />
                    </g>
                </g>
                <switch>
                    <g requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" />
                    <a transform="translate(0,-5)" xlink:href="https://www.drawio.com/doc/faq/svg-export-text-problems" target="_blank">
                        <text text-anchor="middle" font-size="10px" x="50%" y="100%">Text is not SVG - cannot display</text>
                    </a>
                </switch>
            </svg>

            <!-- Dimensions -->
            <h2>Dimensions</h2>
            <p>Something about dimensions...</p>

            <!-- Entities -->
            <h2>Entities</h2>
            <p>Something about entities...</p>
            <div
                v-for="entity in activeModel.entities ?? []"
                :key="entity.id"
                class="mt-2 max-w-prose"
                :class="expandedEntityId === entity.id ? 'rounded-md border border-separator' : 'rounded-md'"
            >
                <div
                    role="button"
                    tabindex="0"
                    :aria-expanded="expandedEntityId === entity.id"
                    class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
                    :class="expandedEntityId === entity.id ? 'rounded-t-md' : 'rounded-md'"
                    @click="toggleEntity(entity.id)"
                    @keydown.enter="toggleEntity(entity.id)"
                    @keydown.space.prevent="toggleEntity(entity.id)"
                >
                    <ChevronRightIcon class="size-4.5" stroke-width="1.5" />
                    <div class="flex-1">{{ entity.label }}</div>
                    <Button class="" shape="minimal" @click="open = true">
                        <PencilIcon class="size-4.5" stroke-width="1.25" />
                    </Button>
                </div>
                <div v-if="expandedEntityId === entity.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
                    <!-- Description -->
                    <div v-html="purifyText(entity.description)" />

                    <!-- Entity Tabs -->
                    <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                        <template v-for="entityTab in ENTITY_TABS" :key="entityTab.id">
                            <Button
                                class="border-y-2 border-t-transparent py-1.25"
                                :class="entityTab.id === activeEntityTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                                shape="minimal"
                                @click="activeEntityTab = entityTab"
                            >
                                <div>{{ entityTab.label }}</div>
                            </Button>
                        </template>
                    </div>

                    <!-- Parents Panel -->
                    <div v-show="activeEntityTab.id === 'parents'" class="py-1">
                        <div v-for="parent in entity.parents" :key="parent">
                            {{ parent }}
                        </div>
                    </div>

                    <!-- Characteristics Panel -->
                    <div v-show="activeEntityTab.id === 'characteristics'" class="py-1">
                        <div v-for="characteristic in entity.characteristics" :key="characteristic">
                            {{ characteristic }}
                        </div>
                    </div>

                    <!-- Events Panel -->
                    <div v-show="activeEntityTab.id === 'events'" class="py-1">
                        <!-- <div v-for="event in entity.events" :key="event.id">{{ event.id }}</div> -->
                        {{ entity.events }}
                    </div>

                    <!-- Primary Measures Panel -->
                    <div v-show="activeEntityTab.id === 'primaryMeasures'" class="py-1">
                        <!-- <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.id }}</div> -->
                        {{ entity.primaryMeasures }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Secondary Measures -->
        <h2>Secondary Measures</h2>
        <p>Something about secondary measures...</p>
    </div>
</template>
