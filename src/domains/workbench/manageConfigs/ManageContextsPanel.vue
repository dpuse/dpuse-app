<script setup lang="ts">
// ── External Dependencies
import { reactive, ref } from 'vue';

// ── Local Components - Static
import DrillDetailPanelItem from '@/components/framework/drillDetailPanel/DrillDetailPanelItem.vue';
import ListField from '@/components/ui/ListField.vue';
import TextField from '@/components/ui/TextField.vue';
import DrillDetailPanel, { type DrillBreadcrumb } from '@/components/framework/drillDetailPanel/DrillDetailPanel.vue';

// Data
import defaultContextData from './defaultContext.json';

// ── DPUse Types ──────────────────────────────────────────────────────────────────────────────────────────────────────

interface ContextConfig {
    id: string;
    label: string;
    description: string;
    modelGroups: ModelGroupConfig[];
}

interface ModelGroupConfig {
    id: string;
    label: string;
    description: string;
    models: ModelConfig[];
}

interface ModelConfig {
    id: string;
    label: string;
    description: string;
    dimensionGroups: unknown[];
    entityGroups: unknown[];
    secondaryMeasureGroups: unknown[];
}

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type LevelId = 'context' | 'modelGroup' | 'model' | 'dimensionGroup' | 'entityGroup' | 'secondaryMeasureGroup';

interface ActiveLevelConfigMap {
    context: ContextConfig;
    modelGroup?: ModelGroupConfig;
    model?: ModelConfig;
}

type ActiveLevelSelection<K extends keyof ActiveLevelConfigMap> = { config: ActiveLevelConfigMap[K]; index?: number };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_CONFIGS: ContextConfig[] = [defaultContextData];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConfigLevelId = ref<LevelId>('context');

const activeSelections = reactive<{ [K in keyof ActiveLevelConfigMap]?: ActiveLevelSelection<K> }>({
    context: { config: CONTEXT_CONFIGS[0], index: 0 }
});

// ── UI Handlers ──────────────────────────────────────────────────────────────────────────────────────────────────────

function handleDrill<K extends keyof ActiveLevelConfigMap>(levelId: K, config: ActiveLevelConfigMap[K]): void {
    activeConfigLevelId.value = levelId;
    handleSelect(levelId, config);
}

function handleSelect<K extends keyof ActiveLevelConfigMap>(levelId: K, config: ActiveLevelConfigMap[K], index?: number): void {
    (activeSelections as Record<string, unknown>)[levelId] = { config, index };
}
</script>

<template>
    <div class="flex flex-col">
        <DrillDetailPanel :has-detail="activeSelections.context != null">
            <template #list>
                <template v-if="activeConfigLevelId === 'context'">
                    <DrillDetailPanelItem
                        v-for="(contextConfig, index) in CONTEXT_CONFIGS"
                        :key="contextConfig.id"
                        :label="`${contextConfig.label} Context`"
                        @select="handleSelect('context', contextConfig, index)"
                    />
                </template>

                <template v-if="activeConfigLevelId === 'modelGroup'">
                    <DrillDetailPanelItem
                        v-for="(modelGroup, index) in activeSelections.context?.config.modelGroups"
                        :key="modelGroup.id"
                        :label="`${modelGroup.label} Model`"
                        @select="handleSelect('modelGroup', modelGroup, index)"
                    />
                </template>
            </template>

            <template #detail>
                <template v-if="activeSelections.modelGroup != null">
                    <div class="flex max-w-lg flex-col py-4 pl-4">
                        <TextField v-model="activeSelections.modelGroup.config!.label" class="mb-4" label="Label" />
                        <ListField :items="activeSelections.modelGroup.config!.models" label="Models" @select="(item) => handleDrill('model', item)" />
                    </div>
                </template>

                <template v-else-if="activeSelections.context != null">
                    <div class="flex max-w-lg flex-col py-4 pl-4">
                        <TextField v-model="activeSelections.context.config.label" class="mb-4" label="Label" />
                        <ListField :items="activeSelections.context.config.modelGroups" label="Model Groups" @select="(item) => handleDrill('modelGroup', item)" />
                    </div>
                </template>
            </template>

            <template #no-selection>
                <div class="text-sm text-subtle">Select a context to get started.</div>
            </template>
        </DrillDetailPanel>
    </div>
</template>
