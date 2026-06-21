<script setup lang="ts">
// ── External Dependencies & Registrations
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

const breadcrumbs = ref<DrillBreadcrumb[]>([{ label: 'Home', onClick: (): void => {} }]);
const listTitle = ref('Model Groups');
const showDetail = ref(false);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleDrillDown<K extends keyof ActiveLevelConfigMap>(toLevelId: K, toConfig: ActiveLevelConfigMap[K]): void {
    activeConfigLevelId.value = toLevelId;
    handleSelect(toLevelId, toConfig);
    showDetail.value = false;
    breadcrumbs.value.push(buildBreadcrumb(toLevelId));
    listTitle.value = getListTitle(toLevelId);
}

function handleSelect<K extends keyof ActiveLevelConfigMap>(levelId: K, config: ActiveLevelConfigMap[K], index?: number): void {
    (activeSelections[levelId] as Record<string, unknown>) = { config, index };
    showDetail.value = true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildBreadcrumb(fromLevelId: keyof ActiveLevelConfigMap): DrillBreadcrumb {
    const toLevelId = getParentLevelId(fromLevelId);
    const parentConfig = activeSelections[toLevelId];
    return { label: `${parentConfig!.config!.label} ???`, onClick: () => drillUp(toLevelId) };
}

function clearActiveItems(id: keyof ActiveLevelConfigMap): void {
    if (id === 'model') {
        activeSelections.dimensionGroup = undefined;
    } else {
        activeSelections.dimensionGroup = undefined;
        activeSelections.model = undefined;
    }
}

function drillUp(toLevelId: keyof ActiveLevelConfigMap): void {
    activeConfigLevelId.value = toLevelId;
    clearActiveItems(toLevelId);
    listTitle.value = getListTitle(toLevelId);
}

function getListTitle(id: keyof ActiveLevelConfigMap): string {
    if (id === 'dimensionGroup') return 'Dimension Groups';
    else if (id === 'model') return 'Models';
    else return 'Model Groups';
}

function getParentLevelId(id: keyof ActiveLevelConfigMap): keyof ActiveLevelConfigMap {
    if (id === 'dimensionGroup') return 'model';
    else if (id === 'model') return 'modelGroup';
    else return 'modelGroup';
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
                        <ListField :items="activeSelections.model.config!.dimensionGroups" label="Dimension Groups" @select="(item) => handleDrillDown('dimensionGroup', item)" />
                    </div>
                </template>

                <template v-else-if="activeSelections.modelGroup != null">
                    <div class="flex max-w-lg flex-col gap-y-4 py-4 pl-4">
                        <div>
                            <div class="text-xs leading-tight font-semibold text-subtle uppercase">Model Group</div>
                            <div class="text-xl">{{ activeSelections.modelGroup.config!.label }}</div>
                        </div>
                        <TextField v-model="activeSelections.modelGroup.config!.label" label="Label" />
                        <ListField :items="activeSelections.modelGroup.config!.models" label="Models" @select="(item) => handleDrillDown('model', item)" />
                    </div>
                </template>
            </template>
        </DrillDetailPanel>
    </div>
</template>
