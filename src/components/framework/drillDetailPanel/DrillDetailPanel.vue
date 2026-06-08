<script setup lang="ts">
export type DrillBreadcrumb = { label: string; onClick?: () => void };

type Properties = {
    addLabel?: string;
    breadcrumbs?: DrillBreadcrumb[];
    hasDetail?: boolean;
    listTitle?: string;
    maxDetailWidth?: string;
    maxListWidth?: string;
    showDetail?: boolean;
};

const {
    addLabel,
    breadcrumbs = [],
    hasDetail = false,
    listTitle,
    maxDetailWidth,
    maxListWidth,
    showDetail = false,
} = defineProps<Properties>();

defineEmits<{ add: []; back: [] }>();

defineSlots<{
    detail(): unknown;
    list(): unknown;
    'no-selection'(): unknown;
}>();
</script>

<template>
    <div
        class="flex min-h-0 flex-1 flex-col"
        :class="{ 'ddp--detail': showDetail }"
        :style="{
            'container-type': 'inline-size',
            '--ddp-max-list-width': maxListWidth ?? '240px',
            '--ddp-max-detail-width': maxDetailWidth,
        }"
        data-region="DrillDetailPanel"
    >
        <!-- Breadcrumb / Nav bar -->
        <nav
            v-if="breadcrumbs.length > 0 || showDetail"
            class="flex flex-none items-center border-b border-separator px-4 py-2"
            aria-label="Navigation breadcrumb"
        >
            <ol class="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 text-xs">
                <template v-for="(crumb, i) in breadcrumbs" :key="i">
                    <li v-if="i > 0" aria-hidden="true" class="select-none text-subtle">/</li>
                    <li>
                        <button
                            v-if="crumb.onClick"
                            class="text-accent hover:text-emphasis"
                            type="button"
                            @click="crumb.onClick"
                        >
                            {{ crumb.label }}
                        </button>
                        <span v-else class="text-muted">{{ crumb.label }}</span>
                    </li>
                </template>
            </ol>
            <button
                class="ddp-back ml-3 shrink-0 text-xs text-accent hover:text-emphasis"
                type="button"
                @click="$emit('back')"
            >
                &#8592; List
            </button>
        </nav>

        <!-- Panes -->
        <div class="flex min-h-0 flex-1">
            <!-- List pane -->
            <div class="ddp-list flex min-w-0 flex-col border-r border-boundary">
                <div
                    v-if="listTitle"
                    class="flex-none border-b border-separator px-3 py-2 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted uppercase"
                >
                    {{ listTitle }}
                </div>
                <div class="min-h-0 flex-1 overflow-y-auto">
                    <slot name="list" />
                </div>
                <div v-if="addLabel" class="flex-none border-t border-separator px-3 py-2">
                    <button class="text-xs text-accent hover:text-emphasis" type="button" @click="$emit('add')">
                        + {{ addLabel }}
                    </button>
                </div>
            </div>

            <!-- Detail pane -->
            <div class="ddp-detail min-w-0 flex-1">
                <div v-if="hasDetail" class="h-full overflow-y-auto">
                    <slot name="detail" />
                </div>
                <div v-else class="p-4">
                    <slot name="no-selection" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Narrow: list fills the pane; detail is hidden */
.ddp-list {
    display: flex;
    flex: 1 1 0%;
}
.ddp-detail {
    display: none;
}

/* Narrow + detail mode: swap visibility */
.ddp--detail .ddp-list { display: none; }
.ddp--detail .ddp-detail { display: flex; flex: 1 1 0%; flex-direction: column; }

/* Back button: only shown on narrow when in detail mode */
.ddp-back { display: none; }
.ddp--detail .ddp-back { display: inline; }

/* Wide: always show both panes side-by-side */
@container (min-width: 768px) {
    .ddp-list,
    .ddp--detail .ddp-list {
        display: flex;
        flex: 0 0 var(--ddp-max-list-width, 240px);
        width: var(--ddp-max-list-width, 240px);
    }
    .ddp-detail,
    .ddp--detail .ddp-detail {
        display: flex;
        flex: 1 1 0%;
        flex-direction: column;
        max-width: var(--ddp-max-detail-width, none);
    }
    .ddp-back,
    .ddp--detail .ddp-back {
        display: none;
    }
}
</style>
