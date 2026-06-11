<script setup lang="ts">
// External Dependencies
import { required } from '@regle/rules';
import { useRegle } from '@regle/core';
import { computed, reactive, ref, watch } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './ManageContextsLayout.json';

// Local Components - Static
import type { DrillBreadcrumb } from '@/components/framework/drillDetailPanel/DrillDetailPanel.vue';
import DrillDetailPanel from '@/components/framework/drillDetailPanel/DrillDetailPanel.vue';
import DrillDetailPanelItem from '@/components/framework/drillDetailPanel/DrillDetailPanelItem.vue';
import Separator from '@/components/ui/Separator.vue';
import TextField from '@/components/ui/TextField.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ─────────────────────────────────────────────────────────────────────────────

interface Contractor {
    name: string;
    rate: string;
}
interface Member {
    name: string;
    role: string;
}
interface Team {
    name: string;
    members: Member[];
}
interface Department {
    name: string;
    contractors: Contractor[];
    teams: Team[];
}
interface Organization {
    name: string;
    modelGroups: Department[];
}

const data = ref<Organization>({
    name: 'Default Context',
    modelGroups: [
        {
            name: 'Core',
            contractors: [
                { name: 'Dave Chen', rate: '$120/hr' },
                { name: 'Eve Nakamura', rate: '$95/hr' }
            ],
            teams: [
                {
                    name: 'Frontend',
                    members: [
                        { name: 'Alice Park', role: 'Engineer' },
                        { name: 'Bob Kim', role: 'Designer' }
                    ]
                },
                { name: 'Backend', members: [{ name: 'Carol Lin', role: 'Engineer' }] }
            ]
        },
        { name: 'Finance & Accounting', contractors: [], teams: [] },
        { name: 'People / HR', contractors: [], teams: [] },
        { name: 'Sales & Marketing', contractors: [], teams: [] },
        { name: 'Customer Service', contractors: [], teams: [] },
        { name: 'Product & Platform', contractors: [], teams: [] },
        { name: 'Supply Chain & Operations', contractors: [], teams: [] },
        { name: 'External / Third Party', contractors: [], teams: [] },
        { name: 'Governance, Risk, & Compliance', contractors: [], teams: [] }
    ]
});

// ─── Navigation state ─────────────────────────────────────────────────────────

const departmentIndex = ref<number | null>(null);
const currentChildList = ref<'contractors' | 'teams' | null>(null);
const teamIndex = ref<number | null>(null);
const memberIndex = ref<number | null>(null);
const contractorIndex = ref<number | null>(null);
const showDetail = ref(false);

const activeDepartment = computed((): Department | null => (departmentIndex.value === null ? null : (data.value.modelGroups[departmentIndex.value] ?? null)));
const activeTeam = computed((): Team | null => (activeDepartment.value === null || teamIndex.value === null ? null : (activeDepartment.value.teams[teamIndex.value] ?? null)));
const activeMember = computed((): Member | null => (activeTeam.value === null || memberIndex.value === null ? null : (activeTeam.value.members[memberIndex.value] ?? null)));
const activeContractor = computed((): Contractor | null =>
    activeDepartment.value === null || contractorIndex.value === null ? null : (activeDepartment.value.contractors[contractorIndex.value] ?? null)
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
watch(activeDepartment, (department) => {
    departmentForm.name = department?.name ?? '';
    deptR$.$reset();
    if (!departmentForm.name) deptR$.name.$touch();
});
watch(activeTeam, (team) => {
    teamForm.name = team?.name ?? '';
    teamR$.$reset();
    if (!teamForm.name) teamR$.name.$touch();
});
watch(activeMember, (member) => {
    memberForm.name = member?.name ?? '';
    memberForm.role = member?.role ?? '';
    memR$.$reset();
    if (!memberForm.name) memR$.name.$touch();
    if (!memberForm.role) memR$.role.$touch();
});
watch(activeContractor, (contractor) => {
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
        if (activeDepartment.value) activeDepartment.value.name = value;
    }
);
watch(
    () => teamForm.name,
    (value) => {
        if (activeTeam.value) activeTeam.value.name = value;
    }
);
watch(
    () => memberForm.name,
    (value) => {
        if (activeMember.value) activeMember.value.name = value;
    }
);
watch(
    () => memberForm.role,
    (value) => {
        if (activeMember.value) activeMember.value.role = value;
    }
);
watch(
    () => contractorForm.name,
    (value) => {
        if (activeContractor.value) activeContractor.value.name = value;
    }
);
watch(
    () => contractorForm.rate,
    (value) => {
        if (activeContractor.value) activeContractor.value.rate = value;
    }
);

// ─── Reset functions ──────────────────────────────────────────────────────────

const resetToDepartments = (): void => {
    departmentIndex.value = null;
    currentChildList.value = null;
    teamIndex.value = null;
    memberIndex.value = null;
    contractorIndex.value = null;
    showDetail.value = false;
};
const resetToDepartmentDetail = (): void => {
    currentChildList.value = null;
    teamIndex.value = null;
    memberIndex.value = null;
    contractorIndex.value = null;
    showDetail.value = true;
};
const resetToTeams = (): void => {
    teamIndex.value = null;
    memberIndex.value = null;
    showDetail.value = false;
};
const resetToMembers = (): void => {
    memberIndex.value = null;
    showDetail.value = false;
};
const resetToContractors = (): void => {
    contractorIndex.value = null;
    showDetail.value = false;
};

// ─── Select / navigate functions ──────────────────────────────────────────────

const selectDepartment = (index: number): void => {
    departmentIndex.value = index;
    currentChildList.value = null;
    teamIndex.value = null;
    memberIndex.value = null;
    contractorIndex.value = null;
    showDetail.value = true;
};
const navigateToTeams = (): void => {
    currentChildList.value = 'teams';
    teamIndex.value = null;
    memberIndex.value = null;
    showDetail.value = false;
};
const navigateToContractors = (): void => {
    currentChildList.value = 'contractors';
    contractorIndex.value = null;
    showDetail.value = false;
};
const selectTeam = (index: number): void => {
    teamIndex.value = index;
    memberIndex.value = null;
    showDetail.value = true;
};
const selectMember = (index: number): void => {
    memberIndex.value = index;
    showDetail.value = true;
};
const selectContractor = (index: number): void => {
    contractorIndex.value = index;
    showDetail.value = true;
};

// ─── Back ─────────────────────────────────────────────────────────────────────

const handleBack = (): void => {
    if (memberIndex.value !== null) {
        resetToMembers();
        return;
    }
    if (contractorIndex.value !== null) {
        resetToContractors();
        return;
    }
    if (teamIndex.value !== null) {
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
    data.value.modelGroups.push({ name: '', contractors: [], teams: [] });
    selectDepartment(data.value.modelGroups.length - 1);
};
const removeDepartment = (index: number): void => {
    if (departmentIndex.value === index) {
        resetToDepartments();
    } else if (departmentIndex.value !== null && index < departmentIndex.value) {
        departmentIndex.value--;
    }
    data.value.modelGroups.splice(index, 1);
};

const addTeam = (): void => {
    if (activeDepartment.value === null) return;
    activeDepartment.value.teams.push({ name: '', members: [] });
    selectTeam(activeDepartment.value.teams.length - 1);
};
const removeTeam = (index: number): void => {
    if (activeDepartment.value === null) return;
    if (teamIndex.value === index) {
        resetToTeams();
    } else if (teamIndex.value !== null && index < teamIndex.value) {
        teamIndex.value--;
    }
    activeDepartment.value.teams.splice(index, 1);
};

const addMember = (): void => {
    if (activeTeam.value === null) return;
    activeTeam.value.members.push({ name: '', role: '' });
    selectMember(activeTeam.value.members.length - 1);
};
const removeMember = (index: number): void => {
    if (activeTeam.value === null) return;
    if (memberIndex.value === index) {
        resetToMembers();
    } else if (memberIndex.value !== null && index < memberIndex.value) {
        memberIndex.value--;
    }
    activeTeam.value.members.splice(index, 1);
};

const addContractor = (): void => {
    if (activeDepartment.value === null) return;
    activeDepartment.value.contractors.push({ name: '', rate: '' });
    selectContractor(activeDepartment.value.contractors.length - 1);
};
const removeContractor = (index: number): void => {
    if (activeDepartment.value === null) return;
    if (contractorIndex.value === index) {
        resetToContractors();
    } else if (contractorIndex.value !== null && index < contractorIndex.value) {
        contractorIndex.value--;
    }
    activeDepartment.value.contractors.splice(index, 1);
};

// ─── DrillDetailPanel bindings ────────────────────────────────────────────────

const breadcrumbs = computed((): DrillBreadcrumb[] => {
    if (departmentIndex.value === null) return [];
    const crumbs: DrillBreadcrumb[] = [{ label: 'Departments', onClick: resetToDepartments }];
    if (currentChildList.value === null) return crumbs;

    crumbs.push({ label: activeDepartment.value?.name ?? 'Untitled', onClick: resetToDepartmentDetail });

    if (currentChildList.value === 'teams') {
        if (teamIndex.value !== null) {
            crumbs.push({ label: 'Teams', onClick: resetToTeams });
            if (memberIndex.value !== null) {
                crumbs.push({ label: activeTeam.value?.name ?? 'Untitled', onClick: resetToMembers });
            }
        }
    } else if (contractorIndex.value !== null) {
        crumbs.push({ label: 'Contractors', onClick: resetToContractors });
    }

    return crumbs;
});

const listTitle = computed((): string => {
    if (teamIndex.value !== null) return 'Members';
    if (currentChildList.value === 'teams') return 'Teams';
    if (currentChildList.value === 'contractors') return 'Contractors';
    return 'Model Groupings';
});

const addLabel = computed((): string => {
    if (teamIndex.value !== null) return 'Add Member';
    if (currentChildList.value === 'teams') return 'Add Team';
    if (currentChildList.value === 'contractors') return 'Add Contractor';
    return 'Add Department';
});

const handleAdd = (): void => {
    if (teamIndex.value !== null) {
        addMember();
        return;
    }
    if (currentChildList.value === 'teams') {
        addTeam();
        return;
    }
    if (currentChildList.value === 'contractors') {
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
                :has-detail="departmentIndex !== null"
                :list-title="listTitle"
                :show-detail="showDetail"
                max-list-width="260px"
                @add="handleAdd"
                @back="handleBack"
            >
                <!-- ── List ──────────────────────────────────────────────── -->
                <template #list>
                    <!-- Members level -->
                    <template v-if="teamIndex !== null">
                        <DrillDetailPanelItem
                            v-for="(member, i) in activeTeam?.members ?? []"
                            :key="i"
                            :is-active="memberIndex === i"
                            :label="member.name"
                            @remove="removeMember(i)"
                            @select="selectMember(i)"
                        />
                        <p v-if="activeTeam?.members.length === 0" class="px-3 py-4 text-xs text-subtle">No members yet</p>
                    </template>

                    <!-- Teams level -->
                    <template v-else-if="currentChildList === 'teams'">
                        <DrillDetailPanelItem
                            v-for="(team, i) in activeDepartment?.teams ?? []"
                            :key="i"
                            :is-active="teamIndex === i"
                            :label="team.name"
                            has-children
                            @remove="removeTeam(i)"
                            @select="selectTeam(i)"
                        />
                        <p v-if="activeDepartment?.teams.length === 0" class="px-3 py-4 text-xs text-subtle">No teams yet</p>
                    </template>

                    <!-- Contractors level -->
                    <template v-else-if="currentChildList === 'contractors'">
                        <DrillDetailPanelItem
                            v-for="(contractor, i) in activeDepartment?.contractors ?? []"
                            :key="i"
                            :is-active="contractorIndex === i"
                            :label="contractor.name"
                            @remove="removeContractor(i)"
                            @select="selectContractor(i)"
                        />
                        <p v-if="activeDepartment?.contractors.length === 0" class="px-3 py-4 text-xs text-subtle">No contractors yet</p>
                    </template>

                    <!-- Departments level -->
                    <template v-else>
                        <DrillDetailPanelItem
                            v-for="(department, i) in data.modelGroups"
                            :key="i"
                            :is-active="departmentIndex === i"
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
                        <!-- Member -->
                        <template v-if="activeMember !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Member</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeMember.name || 'Untitled' }}</h2>
                            <TextField v-model="memberForm.name" class="mb-3" label="Name" :errors="memR$.name.$errors" @blur="memR$.name.$touch()" />
                            <TextField v-model="memberForm.role" label="Role" :errors="memR$.role.$errors" @blur="memR$.role.$touch()" />
                        </template>

                        <!-- Contractor -->
                        <template v-else-if="activeContractor !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Contractor</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeContractor.name || 'Untitled' }}</h2>
                            <TextField v-model="contractorForm.name" class="mb-3" label="Name" :errors="conR$.name.$errors" @blur="conR$.name.$touch()" />
                            <TextField v-model="contractorForm.rate" label="Rate" placeholder="e.g. $100/hr" :errors="conR$.rate.$errors" @blur="conR$.rate.$touch()" />
                        </template>

                        <!-- Team -->
                        <template v-else-if="activeTeam !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Team</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeTeam.name || 'Untitled' }}</h2>
                            <TextField v-model="teamForm.name" label="Team Name" :errors="teamR$.name.$errors" @blur="teamR$.name.$touch()" />
                        </template>

                        <!-- Sub-list placeholder (browsing teams or contractors, nothing selected) -->
                        <template v-else-if="currentChildList !== null">
                            <p class="text-sm text-subtle">Select a {{ currentChildList === 'teams' ? 'team' : 'contractor' }} to see details.</p>
                        </template>

                        <!-- Department (with navigation to sub-collections) -->
                        <template v-else-if="activeDepartment !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Department</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeDepartment.name || 'Untitled' }}</h2>
                            <TextField v-model="departmentForm.name" class="mb-6" label="Department Name" :errors="deptR$.name.$errors" @blur="deptR$.name.$touch()" />
                            <p class="mb-2 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Collections</p>
                            <div class="flex flex-col gap-2">
                                <button
                                    class="flex items-center justify-between rounded border border-boundary px-3 py-2.5 text-sm text-content transition-colors hover:border-accent hover:text-accent"
                                    type="button"
                                    @click="navigateToTeams"
                                >
                                    <span>Teams</span>
                                    <span class="text-subtle">{{ activeDepartment.teams.length }} ›</span>
                                </button>
                                <button
                                    class="flex items-center justify-between rounded border border-boundary px-3 py-2.5 text-sm text-content transition-colors hover:border-accent hover:text-accent"
                                    type="button"
                                    @click="navigateToContractors"
                                >
                                    <span>Contractors</span>
                                    <span class="text-subtle">{{ activeDepartment.contractors.length }} ›</span>
                                </button>
                            </div>
                        </template>
                    </div>
                </template>

                <!-- ── No selection ──────────────────────────────────────── -->
                <template #no-selection>
                    <p class="text-sm text-subtle">Select a department to get started.</p>
                </template>
            </DrillDetailPanel>
        </div>
    </WorkbenchLayout>
</template>
