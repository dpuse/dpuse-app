<script setup lang="ts">
// External Dependencies
import { useForm } from '@tanstack/vue-form';
import { computed, ref, watch } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';

// Local Components - Static
import type { DrillBreadcrumb } from '@/components/framework/drillDetailPanel/DrillDetailPanel.vue';
import DrillDetailPanel from '@/components/framework/drillDetailPanel/DrillDetailPanel.vue';
import DrillDetailPanelItem from '@/components/framework/drillDetailPanel/DrillDetailPanelItem.vue';
import Separator from '@/components/ui/Separator.vue';
import TextField from '@/components/ui/textField/TextField.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../../WorkbenchLayout.vue';

// ─────────────────────────────────────────────────────────────────────────────

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
    teams: Team[];
}
interface Organization {
    name: string;
    departments: Department[];
}

const data = ref<Organization>({
    name: 'Acme Corp',
    departments: [
        {
            name: 'Engineering',
            teams: [{ name: 'Frontend', members: [{ name: 'Alice', role: 'Engineer' }] }]
        },
        { name: 'Design', teams: [] }
    ]
});

const departmentIndex = ref<number | null>(null);
const teamIndex = ref<number | null>(null);
const memberIndex = ref<number | null>(null);
const showDetail = ref(false);

const activeDepartment = computed((): Department | null => (departmentIndex.value === null ? null : (data.value.departments[departmentIndex.value] ?? null)));
const activeTeam = computed((): Team | null => (activeDepartment.value === null || teamIndex.value === null ? null : (activeDepartment.value.teams[teamIndex.value] ?? null)));
const activeMember = computed((): Member | null => (activeTeam.value === null || memberIndex.value === null ? null : (activeTeam.value.members[memberIndex.value] ?? null)));

const selectDepartment = (index: number): void => {
    departmentIndex.value = index;
    teamIndex.value = null;
    memberIndex.value = null;
    showDetail.value = true;
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

const resetToDepartments = (): void => {
    departmentIndex.value = null;
    teamIndex.value = null;
    memberIndex.value = null;
    showDetail.value = false;
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

const addDepartment = (): void => {
    data.value.departments.push({ name: '', teams: [] });
    selectDepartment(data.value.departments.length - 1);
};
const removeDepartment = (index: number): void => {
    if (departmentIndex.value === index) {
        resetToDepartments();
    } else if (departmentIndex.value !== null && index < departmentIndex.value) {
        departmentIndex.value--;
    }
    data.value.departments.splice(index, 1);
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

// ─── DrillDetailPanel bindings ────────────────────────────────────────────────

const breadcrumbs = computed((): DrillBreadcrumb[] => {
    if (departmentIndex.value === null) return [];
    const crumbs: DrillBreadcrumb[] = [{ label: 'Departments', onClick: resetToDepartments }];
    if (teamIndex.value !== null) {
        crumbs.push({ label: activeDepartment.value?.name ?? 'Untitled', onClick: resetToTeams });
    }
    if (memberIndex.value !== null) {
        crumbs.push({ label: activeTeam.value?.name ?? 'Untitled', onClick: resetToMembers });
    }
    return crumbs;
});

const listTitle = computed((): string => {
    if (teamIndex.value !== null) return 'Members';
    if (departmentIndex.value !== null) return 'Teams';
    return 'Departments';
});

const addLabel = computed((): string => {
    if (teamIndex.value !== null) return 'Add Member';
    if (departmentIndex.value !== null) return 'Add Team';
    return 'Add Department';
});

const handleAdd = (): void => {
    if (teamIndex.value !== null) {
        addMember();
        return;
    }
    if (departmentIndex.value !== null) {
        addTeam();
        return;
    }
    addDepartment();
};

// ─── Detail form ──────────────────────────────────────────────────────────────

const detailForm = useForm({ defaultValues: { name: '', role: '' } });

watch(
    [departmentIndex, teamIndex, memberIndex],
    () => {
        if (activeMember.value !== null) {
            detailForm.reset({ name: activeMember.value.name, role: activeMember.value.role });
        } else if (activeTeam.value !== null) {
            detailForm.reset({ name: activeTeam.value.name, role: '' });
        } else if (activeDepartment.value === null) {
            detailForm.reset({ name: '', role: '' });
        } else {
            detailForm.reset({ name: activeDepartment.value.name, role: '' });
        }
    },
    { immediate: true }
);

const setName = (value: string): void => {
    const item = activeMember.value ?? activeTeam.value ?? activeDepartment.value;
    if (item !== null) item.name = value;
};

const setRole = (value: string): void => {
    if (activeMember.value !== null) activeMember.value.role = value;
};
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workflow" />

        <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <Separator class="flex-none" />

            <DrillDetailPanel
                :add-label="addLabel"
                :breadcrumbs="breadcrumbs"
                :has-detail="departmentIndex !== null"
                :list-title="listTitle"
                :show-detail="showDetail"
                max-list-width="260px"
                @add="handleAdd"
                @back="showDetail = false"
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
                    <template v-else-if="departmentIndex !== null">
                        <DrillDetailPanelItem
                            v-for="(team, i) in activeDepartment?.teams ?? []"
                            :key="i"
                            :label="team.name"
                            has-children
                            @remove="removeTeam(i)"
                            @select="selectTeam(i)"
                        />
                        <p v-if="activeDepartment?.teams.length === 0" class="px-3 py-4 text-xs text-subtle">No teams yet</p>
                    </template>

                    <!-- Departments level -->
                    <template v-else>
                        <DrillDetailPanelItem
                            v-for="(department, i) in data.departments"
                            :key="i"
                            :label="department.name"
                            has-children
                            @remove="removeDepartment(i)"
                            @select="selectDepartment(i)"
                        />
                        <p v-if="data.departments.length === 0" class="px-3 py-4 text-xs text-subtle">No departments yet</p>
                    </template>
                </template>

                <!-- ── Detail ────────────────────────────────────────────── -->
                <template #detail>
                    <div class="p-5">
                        <!-- Member -->
                        <template v-if="activeMember !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Member</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeMember.name || 'Untitled' }}</h2>
                            <detailForm.Field v-slot="{ field }" name="name">
                                <TextField
                                    class="mb-3"
                                    label="Name"
                                    :model-value="field.state.value"
                                    @update:model-value="
                                        (v) => {
                                            field.handleChange(v);
                                            setName(v);
                                        }
                                    "
                                    @blur="field.handleBlur"
                                />
                            </detailForm.Field>
                            <detailForm.Field v-slot="{ field }" name="role">
                                <TextField
                                    label="Role"
                                    :model-value="field.state.value"
                                    @update:model-value="
                                        (v) => {
                                            field.handleChange(v);
                                            setRole(v);
                                        }
                                    "
                                    @blur="field.handleBlur"
                                />
                            </detailForm.Field>
                        </template>

                        <!-- Team -->
                        <template v-else-if="activeTeam !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Team</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeTeam.name || 'Untitled' }}</h2>
                            <detailForm.Field v-slot="{ field }" name="name">
                                <TextField
                                    label="Team Name"
                                    :model-value="field.state.value"
                                    @update:model-value="
                                        (v) => {
                                            field.handleChange(v);
                                            setName(v);
                                        }
                                    "
                                    @blur="field.handleBlur"
                                />
                            </detailForm.Field>
                        </template>

                        <!-- Department -->
                        <template v-else-if="activeDepartment !== null">
                            <p class="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase">Department</p>
                            <h2 class="mb-5 text-lg font-semibold text-content">{{ activeDepartment.name || 'Untitled' }}</h2>
                            <detailForm.Field v-slot="{ field }" name="name">
                                <TextField
                                    label="Department Name"
                                    :model-value="field.state.value"
                                    @update:model-value="
                                        (v) => {
                                            field.handleChange(v);
                                            setName(v);
                                        }
                                    "
                                    @blur="field.handleBlur"
                                />
                            </detailForm.Field>
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
