<script setup lang="ts">
// ── External Dependencies
import { reactive, ref } from 'vue';

// ── DPUse Framework
import type { ContextConfig, DimensionGroupConfig, ModelConfig, ModelGroupConfig } from './dpUseTypes';

// ── Local Components - Static
import DrillDetailPanelItem from '@/components/framework/drillDetailPanel/DrillDetailPanelItem.vue';
import ListField from '@/components/ui/ListField.vue';
import TextField from '@/components/ui/TextField.vue';
import DrillDetailPanel, { type DrillBreadcrumb } from '@/components/framework/drillDetailPanel/DrillDetailPanel.vue';

// Data
import defaultContextData from './defaultContext.json';

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

const breadcrumbs = ref([{ label: 'Home' }]);
const listTitle = ref('Model Groups');
const showDetail = ref(false);

// ── UI Handlers ──────────────────────────────────────────────────────────────────────────────────────────────────────

function handleDrill<K extends keyof ActiveLevelConfigMap>(levelId: K, fromLabel: string, toConfig: ActiveLevelConfigMap[K], newListTitle: string): void {
    activeConfigLevelId.value = levelId;
    handleSelect(levelId, toConfig);
    showDetail.value = false;
    breadcrumbs.value.push({ label: `${fromLabel} ???` });
    listTitle.value = newListTitle;
}

function handleSelect<K extends keyof ActiveLevelConfigMap>(levelId: K, config: ActiveLevelConfigMap[K], index?: number): void {
    console.log(111, levelId, config, index);
    (activeSelections as Record<string, unknown>)[levelId] = { config, index };
    showDetail.value = true;
}
</script>

<template>
    <div class="flex flex-col">
        <DrillDetailPanel :breadcrumbs="breadcrumbs" :has-detail="true" :show-detail="showDetail" :list-title="listTitle">
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
                        v-for="(model, index) in activeSelections.modelGroup?.config?.models"
                        :key="model.id"
                        :label="model.label"
                        @select="handleSelect('model', model, index)"
                    />
                </template>
            </template>

            <template #detail>
                <template v-if="activeSelections.model != null">
                    <div class="flex max-w-lg flex-col gap-y-5 py-4 pl-4">
                        <div>
                            <div class="text-xs leading-tight font-semibold text-subtle uppercase">Model</div>
                            <div class="text-xl">{{ activeSelections.model.config!.label }}</div>
                        </div>
                        <TextField v-model="activeSelections.model.config!.label" label="Label" />
                        <ListField
                            :items="activeSelections.model.config!.dimensionGroups"
                            label="Dimension Groups"
                            @select="(item) => handleDrill('dimensionGroup', activeSelections.model!.config!.label, item, 'Dimension Groups')"
                        />
                    </div>
                </template>

                <template v-else-if="activeSelections.modelGroup != null">
                    <div class="flex max-w-lg flex-col gap-y-4 py-4 pl-4">
                        <div>
                            <div class="text-xs leading-tight font-semibold text-subtle uppercase">Model Group</div>
                            <div class="text-xl">{{ activeSelections.modelGroup.config!.label }}</div>
                        </div>
                        <TextField v-model="activeSelections.modelGroup.config!.label" label="Label" />
                        <ListField
                            :items="activeSelections.modelGroup.config!.models"
                            label="Models"
                            @select="(item) => handleDrill('model', activeSelections.modelGroup!.config!.label, item, 'Models')"
                        />
                    </div>
                </template>
            </template>

            <!-- <template #no-selection>
                <div class="text-sm text-subtle">Select a context to get started.</div>
            </template> -->
        </DrillDetailPanel>
    </div>
</template>
