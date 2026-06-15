<script setup lang="ts">
// ── External Dependencies & Registrations
import { required } from '@regle/rules';
import { useRegle } from '@regle/core';
import { computed, reactive, ref, watch } from 'vue';

// ── Local (App) Framework
import { t } from '@/state/locale';
import T from './ManageContextsLayout.json';

// ── Local Components - Static
import type { DrillBreadcrumb } from '@/components/framework/drillDetailPanel/DrillDetailPanel.vue';
import DrillDetailPanel from '@/components/framework/drillDetailPanel/DrillDetailPanel.vue';
import DrillDetailPanelItem from '@/components/framework/drillDetailPanel/DrillDetailPanelItem.vue';
import Separator from '@/components/ui/Separator.vue';
import TextField from '@/components/ui/TextField.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface Context {
    name: string;
    modelGroups: Model[];
}
interface ModelGroup {
    name: string;
    models: Model[];
}
interface Model {
    name: string;
    entityGroups: EntityGroup[];
    dimensionGroups: DimensionGroup[];
    secondaryMeasureGroups: SecondaryMeasureGroup[];
}
interface EntityGroup {
    name: string;
    rate: string;
}
interface DimensionGroup {
    name: string;
    members: Dimension[];
}
interface Dimension {
    name: string;
    role: string;
}
interface SecondaryMeasureGroup {
    name: string;
    measures: unknown;
}

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

const data = ref<Context>({
    name: 'Default Context',
    modelGroups: [
        {
            name: 'Core',
            entityGroups: [
                { name: 'Dave Chen', rate: '$120/hr' },
                { name: 'Eve Nakamura', rate: '$95/hr' }
            ],
            dimensionGroups: [
                {
                    name: 'Frontend',
                    members: [
                        { name: 'Alice Park', role: 'Engineer' },
                        { name: 'Bob Kim', role: 'Designer' }
                    ]
                },
                { name: 'Backend', members: [{ name: 'Carol Lin', role: 'Engineer' }] }
            ],
            secondaryMeasureGroups: []
        },
        { name: 'Finance & Accounting', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] },
        { name: 'People / HR', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] },
        { name: 'Sales & Marketing', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] },
        { name: 'Customer Service', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] },
        { name: 'Product & Platform', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] },
        { name: 'Supply Chain & Operations', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] },
        { name: 'External / Third Party', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] },
        { name: 'Governance, Risk, & Compliance', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] }
    ]
});

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const currentChildList = ref<'entityGroups' | 'dimensionGroups' | null>(null);
const showDetail = ref(false);

const modelGroupIndex = ref<number | null>(null);
const dimensionGroupIndex = ref<number | null>(null);
const dimensionIndex = ref<number | null>(null);
const entityGroupIndex = ref<number | null>(null);

const activeModel = computed((): Model | null => (modelGroupIndex.value === null ? null : (data.value.modelGroups[modelGroupIndex.value] ?? null)));

const activeDimensionGroup = computed((): DimensionGroup | null =>
    activeModel.value === null || dimensionGroupIndex.value === null ? null : (activeModel.value.dimensionGroups[dimensionGroupIndex.value] ?? null)
);
const activeEntityGroup = computed((): EntityGroup | null =>
    activeModel.value === null || entityGroupIndex.value === null ? null : (activeModel.value.entityGroups[entityGroupIndex.value] ?? null)
);

const activeDimension = computed((): Dimension | null =>
    activeDimensionGroup.value === null || dimensionIndex.value === null ? null : (activeDimensionGroup.value.members[dimensionIndex.value] ?? null)
);

// ─── Form states ──────────────────────────────────────────────────────────────

const departmentForm = reactive({ name: '' });
const teamForm = reactive({ name: '' });
const memberForm = reactive({ name: '', role: '' });
const contractorForm = reactive({ name: '', rate: '' });

const { r$: deptR$ } = useRegle(departmentForm, { name: { required } });
const { r$: teamR$ } = useRegle(teamForm, { name: { required } });
const { r$: memR$ } = useRegle(memberForm, { name: { required }, role: { required } });
const { r$: conR$ } = useRegle(contractorForm, { name: { required }, rate: { required } });

// Entity → form: populate and clear validation state on navigation
watch(activeModel, (department) => {
    departmentForm.name = department?.name ?? '';
    deptR$.$reset();
    if (!departmentForm.name) deptR$.name.$touch();
});
watch(activeDimensionGroup, (team) => {
    teamForm.name = team?.name ?? '';
    teamR$.$reset();
    if (!teamForm.name) teamR$.name.$touch();
});
watch(activeDimension, (member) => {
    memberForm.name = member?.name ?? '';
    memberForm.role = member?.role ?? '';
    memR$.$reset();
    if (!memberForm.name) memR$.name.$touch();
    if (!memberForm.role) memR$.role.$touch();
});
watch(activeEntityGroup, (contractor) => {
    contractorForm.name = contractor?.name ?? '';
    contractorForm.rate = contractor?.rate ?? '';
    conR$.$reset();
    if (!contractorForm.name) conR$.name.$touch();
    if (!contractorForm.rate) conR$.rate.$touch();
});

// Form → data: write back to source on change
watch(
    () => departmentForm.name,
    (value) => {
        if (activeModel.value) activeModel.value.name = value;
    }
);
watch(
    () => teamForm.name,
    (value) => {
        if (activeDimensionGroup.value) activeDimensionGroup.value.name = value;
    }
);
watch(
    () => memberForm.name,
    (value) => {
        if (activeDimension.value) activeDimension.value.name = value;
    }
);
watch(
    () => memberForm.role,
    (value) => {
        if (activeDimension.value) activeDimension.value.role = value;
    }
);
watch(
    () => contractorForm.name,
    (value) => {
        if (activeEntityGroup.value) activeEntityGroup.value.name = value;
    }
);
watch(
    () => contractorForm.rate,
    (value) => {
        if (activeEntityGroup.value) activeEntityGroup.value.rate = value;
    }
);

// ─── Reset functions ──────────────────────────────────────────────────────────

const resetToDepartments = (): void => {
    modelGroupIndex.value = null;
    currentChildList.value = null;
    dimensionGroupIndex.value = null;
    dimensionIndex.value = null;
    entityGroupIndex.value = null;
    showDetail.value = false;
};
const resetToDepartmentDetail = (): void => {
    currentChildList.value = null;
    dimensionGroupIndex.value = null;
    dimensionIndex.value = null;
    entityGroupIndex.value = null;
    showDetail.value = true;
};
const resetToTeams = (): void => {
    dimensionGroupIndex.value = null;
    dimensionIndex.value = null;
    showDetail.value = false;
};
const resetToMembers = (): void => {
    dimensionIndex.value = null;
    showDetail.value = false;
};
const resetToContractors = (): void => {
    entityGroupIndex.value = null;
    showDetail.value = false;
};

// ─── Select / navigate functions ──────────────────────────────────────────────

const selectDepartment = (index: number): void => {
    modelGroupIndex.value = index;
    currentChildList.value = null;
    dimensionGroupIndex.value = null;
    dimensionIndex.value = null;
    entityGroupIndex.value = null;
    showDetail.value = true;
};
const navigateToTeams = (): void => {
    currentChildList.value = 'dimensionGroups';
    dimensionGroupIndex.value = null;
    dimensionIndex.value = null;
    showDetail.value = false;
};
const navigateToContractors = (): void => {
    currentChildList.value = 'entityGroups';
    entityGroupIndex.value = null;
    showDetail.value = false;
};
const selectTeam = (index: number): void => {
    dimensionGroupIndex.value = index;
    dimensionIndex.value = null;
    showDetail.value = true;
};
const selectMember = (index: number): void => {
    dimensionIndex.value = index;
    showDetail.value = true;
};
const selectContractor = (index: number): void => {
    entityGroupIndex.value = index;
    showDetail.value = true;
};

// ─── Back ─────────────────────────────────────────────────────────────────────

const handleBack = (): void => {
    if (dimensionIndex.value !== null) {
        resetToMembers();
        return;
    }
    if (entityGroupIndex.value !== null) {
        resetToContractors();
        return;
    }
    if (dimensionGroupIndex.value !== null) {
        resetToTeams();
        return;
    }
    if (currentChildList.value !== null) {
        resetToDepartmentDetail();
        return;
    }
    resetToDepartments();
};

// ─── Add / Remove ─────────────────────────────────────────────────────────────

const addDepartment = (): void => {
    data.value.modelGroups.push({ name: '', entityGroups: [], dimensionGroups: [], secondaryMeasureGroups: [] });
    selectDepartment(data.value.modelGroups.length - 1);
};
const removeDepartment = (index: number): void => {
    if (modelGroupIndex.value === index) {
        resetToDepartments();
    } else if (modelGroupIndex.value !== null && index < modelGroupIndex.value) {
        modelGroupIndex.value--;
    }
    data.value.modelGroups.splice(index, 1);
};

const addTeam = (): void => {
    if (activeModel.value === null) return;
    activeModel.value.dimensionGroups.push({ name: '', members: [] });
    selectTeam(activeModel.value.dimensionGroups.length - 1);
};
const removeTeam = (index: number): void => {
    if (activeModel.value === null) return;
    if (dimensionGroupIndex.value === index) {
        resetToTeams();
    } else if (dimensionGroupIndex.value !== null && index < dimensionGroupIndex.value) {
        dimensionGroupIndex.value--;
    }
    activeModel.value.dimensionGroups.splice(index, 1);
};

const addMember = (): void => {
    if (activeDimensionGroup.value === null) return;
    activeDimensionGroup.value.members.push({ name: '', role: '' });
    selectMember(activeDimensionGroup.value.members.length - 1);
};
const removeMember = (index: number): void => {
    if (activeDimensionGroup.value === null) return;
    if (dimensionIndex.value === index) {
        resetToMembers();
    } else if (dimensionIndex.value !== null && index < dimensionIndex.value) {
        dimensionIndex.value--;
    }
    activeDimensionGroup.value.members.splice(index, 1);
};

const addContractor = (): void => {
    if (activeModel.value === null) return;
    activeModel.value.entityGroups.push({ name: '', rate: '' });
    selectContractor(activeModel.value.entityGroups.length - 1);
};
const removeContractor = (index: number): void => {
    if (activeModel.value === null) return;
    if (entityGroupIndex.value === index) {
        resetToContractors();
    } else if (entityGroupIndex.value !== null && index < entityGroupIndex.value) {
        entityGroupIndex.value--;
    }
    activeModel.value.entityGroups.splice(index, 1);
};

// ─── DrillDetailPanel bindings ────────────────────────────────────────────────

const breadcrumbs = computed((): DrillBreadcrumb[] => {
    if (modelGroupIndex.value === null) return [];
    const crumbs: DrillBreadcrumb[] = [{ label: 'Entity Groups', onClick: resetToDepartments }];
    if (currentChildList.value === null) return crumbs;

    crumbs.push({ label: activeModel.value?.name ?? 'Untitled', onClick: resetToDepartmentDetail });

    if (currentChildList.value === 'dimensionGroups') {
        if (dimensionGroupIndex.value !== null) {
            crumbs.push({ label: 'Dimension Groups', onClick: resetToTeams });
            if (dimensionIndex.value !== null) {
                crumbs.push({ label: activeDimensionGroup.value?.name ?? 'Untitled', onClick: resetToMembers });
            }
        }
    } else if (entityGroupIndex.value !== null) {
        crumbs.push({ label: 'Entity Groups', onClick: resetToContractors });
    }

    return crumbs;
});

const listTitle = computed((): string => {
    if (dimensionGroupIndex.value !== null) return 'Members';
    if (currentChildList.value === 'dimensionGroups') return 'Dimension Groups';
    if (currentChildList.value === 'entityGroups') return 'Entity Groups';
    return 'Model Groups';
});

const addLabel = computed((): string => {
    if (dimensionGroupIndex.value !== null) return 'Add Dimension';
    if (currentChildList.value === 'dimensionGroups') return 'Add DimensionGroup';
    if (currentChildList.value === 'entityGroups') return 'Add EntityGroup';
    return 'Add Model';
});

const handleAdd = (): void => {
    if (dimensionGroupIndex.value !== null) {
        addMember();
        return;
    }
    if (currentChildList.value === 'dimensionGroups') {
        addTeam();
        return;
    }
    if (currentChildList.value === 'entityGroups') {
        addContractor();
        return;
    }
    addDepartment();
};
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Manage_Contexts')" to="workbench" />

        <div class="relative mx-4 flex min-h-0 flex-1 flex-col overflow-hidden">
            <Separator class="flex-none" />

            <DrillDetailPanel
                :add-label="addLabel"
                :breadcrumbs="breadcrumbs"
                :has-detail="modelGroupIndex !== null"
                :list-title="listTitle"
                :show-detail="showDetail"
                max-list-width="260px"
                @add="handleAdd"
                @back="handleBack"
            >
                <!-- ── List ──────────────────────────────────────────────── -->
                <template #list>
                    <!-- Members level -->
                    <template v-if="dimensionGroupIndex !== null">
                        <DrillDetailPanelItem
                            v-for="(member, i) in activeDimensionGroup?.members ?? []"
                            :key="i"
                            :is-active="dimensionIndex === i"
                            :label="member.name"
                            @remove="removeMember(i)"
                            @select="selectMember(i)"
                        />
                        <p v-if="activeDimensionGroup?.members.length === 0" class="px-3 py-4 text-xs text-subtle">No members yet</p>
                    </template>

                    <!-- Dimension Groups level -->
                    <template v-else-if="currentChildList === 'dimensionGroups'">
                        <DrillDetailPanelItem
                            v-for="(team, i) in activeModel?.dimensionGroups ?? []"
                            :key="i"
                            :is-active="dimensionGroupIndex === i"
                            :label="team.name"
                            has-children
                            @remove="removeTeam(i)"
                            @select="selectTeam(i)"
                        />
                        <p v-if="activeModel?.dimensionGroups.length === 0" class="px-3 py-4 text-xs text-subtle">No dimension groups yet</p>
                    </template>

                    <!-- Entity Groups level -->
                    <template v-else-if="currentChildList === 'entityGroups'">
                        <DrillDetailPanelItem
                            v-for="(contractor, i) in activeModel?.entityGroups ?? []"
                            :key="i"
                            :is-active="entityGroupIndex === i"
                            :label="contractor.name"
                            @remove="removeContractor(i)"
                            @select="selectContractor(i)"
                        />
                        <p v-if="activeModel?.entityGroups.length === 0" class="px-3 py-4 text-xs text-subtle">No entity groups yet</p>
                    </template>

                    <!-- Entity Groups level -->
                    <template v-else>
                        <DrillDetailPanelItem
                            v-for="(department, i) in data.modelGroups"
                            :key="i"
                            :is-active="modelGroupIndex === i"
                            :label="department.name"
                            has-children
                            @remove="removeDepartment(i)"
                            @select="selectDepartment(i)"
                        />
                        <p v-if="data.modelGroups.length === 0" class="px-3 py-4 text-xs text-subtle">No departments yet</p>
                    </template>
                </template>

                <!-- ── Detail ────────────────────────────────────────────── -->
                <template #detail>
                    <div class="p-5">
                        <!-- Dimension -->
                        <template v-if="activeDimension !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Dimension</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeDimension.name || 'Untitled' }}</h2>
                            <TextField v-model="memberForm.name" class="mb-3" label="Name" :errors="memR$.name.$errors" @blur="memR$.name.$touch()" />
                            <TextField v-model="memberForm.role" label="Role" :errors="memR$.role.$errors" @blur="memR$.role.$touch()" />
                        </template>

                        <!-- Entity Group -->
                        <template v-else-if="activeEntityGroup !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">EntityGroup</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeEntityGroup.name || 'Untitled' }}</h2>
                            <TextField v-model="contractorForm.name" class="mb-3" label="Name" :errors="conR$.name.$errors" @blur="conR$.name.$touch()" />
                            <TextField v-model="contractorForm.rate" label="Rate" placeholder="e.g. $100/hr" :errors="conR$.rate.$errors" @blur="conR$.rate.$touch()" />
                        </template>

                        <!-- DimensionGroup -->
                        <template v-else-if="activeDimensionGroup !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">DimensionGroup</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeDimensionGroup.name || 'Untitled' }}</h2>
                            <TextField v-model="teamForm.name" label="DimensionGroup Name" :errors="teamR$.name.$errors" @blur="teamR$.name.$touch()" />
                        </template>

                        <!-- Sub-list placeholder (browsing dimensionGroups or entityGroups, nothing selected) -->
                        <template v-else-if="currentChildList !== null">
                            <p class="text-sm text-subtle">Select a {{ currentChildList === 'dimensionGroups' ? 'team' : 'contractor' }} to see details.</p>
                        </template>

                        <!-- Model (with navigation to sub-collections) -->
                        <template v-else-if="activeModel !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Model</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeModel.name || 'Untitled' }}</h2>
                            <TextField v-model="departmentForm.name" class="mb-6" label="Model Name" :errors="deptR$.name.$errors" @blur="deptR$.name.$touch()" />
                            <p class="mb-2 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Collections</p>
                            <div class="flex flex-col gap-2">
                                <button
                                    class="flex items-center justify-between rounded border border-boundary px-3 py-2.5 text-sm text-content transition-colors hover:border-accent hover:text-accent"
                                    type="button"
                                    @click="navigateToTeams"
                                >
                                    <span>Dimension Groups</span>
                                    <span class="text-subtle">{{ activeModel.dimensionGroups.length }} ›</span>
                                </button>
                                <button
                                    class="flex items-center justify-between rounded border border-boundary px-3 py-2.5 text-sm text-content transition-colors hover:border-accent hover:text-accent"
                                    type="button"
                                    @click="navigateToContractors"
                                >
                                    <span>Entity Groups</span>
                                    <span class="text-subtle">{{ activeModel.entityGroups.length }} ›</span>
                                </button>
                            </div>
                        </template>
                    </div>
                </template>

                <!-- ── No selection ──────────────────────────────────────── -->
                <template #no-selection>
                    <p class="text-sm text-subtle">Select a model group to get started.</p>
                </template>
            </DrillDetailPanel>
        </div>
    </WorkbenchLayout>
</template>
