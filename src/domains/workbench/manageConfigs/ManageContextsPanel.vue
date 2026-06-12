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
    dimensionGroups: DimensionGroupConfig[];
    entityGroups: EntityGroupConfig[];
    secondaryMeasureGroups: SecondaryMeasureGroupConfig[];
}

interface DimensionGroupConfig {
    id: string;
    label: string;
    description: string;
}

interface EntityGroupConfig {
    id: string;
    label: string;
    description: string;
}

interface SecondaryMeasureGroupConfig {
    id: string;
    label: string;
    description: string;
}

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type LevelId = 'modelGroup' | 'model' | 'dimensionGroup' | 'entityGroup' | 'secondaryMeasureGroup';

interface ActiveLevelConfigMap {
    modelGroup: ModelGroupConfig;
    model?: ModelConfig;
    dimensionGroup?: DimensionGroupConfig;
}

type ActiveLevelSelection<K extends keyof ActiveLevelConfigMap> = { config: ActiveLevelConfigMap[K]; index?: number };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG: ContextConfig = defaultContextData;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConfigLevelId = ref<LevelId>('modelGroup');

const activeSelections = reactive<{ [K in keyof ActiveLevelConfigMap]?: ActiveLevelSelection<K> }>({
    modelGroup: { config: CONTEXT_CONFIG.modelGroups[0], index: 0 }
});

const showDetail = ref(false);

// ── UI Handlers ──────────────────────────────────────────────────────────────────────────────────────────────────────

function handleDrill<K extends keyof ActiveLevelConfigMap>(levelId: K, config: ActiveLevelConfigMap[K]): void {
    activeConfigLevelId.value = levelId;
    handleSelect(levelId, config);
    showDetail.value = false;
}

function handleSelect<K extends keyof ActiveLevelConfigMap>(levelId: K, config: ActiveLevelConfigMap[K], index?: number): void {
    (activeSelections as Record<string, unknown>)[levelId] = { config, index };
    showDetail.value = true;
}
</script>

<template>
    <div class="flex flex-col">
        <DrillDetailPanel :has-detail="true" :show-detail="showDetail">
            <template #list>
                <template v-if="activeConfigLevelId === 'modelGroup'">
                    <DrillDetailPanelItem
                        v-for="(modelGroup, index) in CONTEXT_CONFIG.modelGroups"
                        :key="modelGroup.id"
                        :label="modelGroup.label"
                        @select="handleSelect('modelGroup', modelGroup, index)"
                    />
                </template>

                <template v-else-if="activeConfigLevelId === 'model'">
                    <DrillDetailPanelItem
                        v-for="(dimensionGroup, index) in activeSelections.modelGroup?.config?.models"
                        :key="dimensionGroup.id"
                        :label="dimensionGroup.label"
                        @select="handleSelect('dimensionGroup', dimensionGroup, index)"
                    />
                </template>
            </template>

            <template #detail>
                <template v-if="activeSelections.model != null">
                    <div class="flex max-w-lg flex-col py-4 pl-4">
                        <TextField v-model="activeSelections.model.config!.label" class="mb-4" label="Label" />
                        <ListField :items="activeSelections.model.config!.dimensionGroups" label="Dimension Groups" @select="(item) => handleDrill('dimensionGroup', item)" />
                    </div>
                </template>

                <template v-else-if="activeSelections.modelGroup != null">
                    <div class="flex max-w-lg flex-col py-4 pl-4">
                        <TextField v-model="activeSelections.modelGroup.config!.label" class="mb-4" label="Label" />
                        <ListField :items="activeSelections.modelGroup.config!.models" label="Models" @select="(item) => handleDrill('model', item)" />
                    </div>
                </template>
            </template>

            <!-- <template #no-selection>
                <div class="text-sm text-subtle">Select a context to get started.</div>
            </template> -->
        </DrillDetailPanel>
    </div>
</template>
