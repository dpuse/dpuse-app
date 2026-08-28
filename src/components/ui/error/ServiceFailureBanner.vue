<script setup lang="ts">
// ── External Dependencies & Registrations
import { TriangleAlertIcon } from '@lucide/vue';

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Every failure that reaches this banner is a dead end that only a page reload can clear, so the caller supplies the
// message naming the service that failed and the refresh action is fixed here.
//
// 'retryPath' is where the user was heading when the failure abandoned the navigation. A route that cannot fetch its
// chunk leaves the URL untouched, so without it a refresh would return them to the screen they were leaving.
const { message, retryPath } = defineProps<{ message: string; retryPath?: string }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'refresh.label': { en: 'Refresh', es: 'Actualizar' }
};

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Both fetch the document again, which is what picks up the new deployment's chunk names. 'assign' is used when the
// failure recorded where the user was heading, so the refresh finishes that journey rather than reloading in place.
function handleRefresh(): void {
    if (retryPath == null) {
        location.reload();
        return;
    }
    location.assign(retryPath);
}
</script>

<template>
    <div class="pointer-events-none flex justify-center px-4" data-region="ServiceFailureBanner">
        <!-- The row spans the viewport only to centre the tab, so it lets pointer events through to the pane toggles beneath it. -->
        <div
            class="service-failure-tab pointer-events-auto flex max-w-2xl items-center gap-3 rounded-b-xl border-x border-b border-danger-ring/40 px-4 py-2 text-[15px] text-danger-text shadow-lg"
        >
            <TriangleAlertIcon class="size-8 shrink-0" stroke-width="1.5" />
            <span class="min-w-0">{{ message }}</span>
            <Button class="shrink-0" size="sm" variant="neutral" @click="handleRefresh">{{ t(T, 'refresh.label') }}</Button>
        </div>
    </div>
</template>

<style scoped>
.service-failure-tab {
    /* The danger tint is translucent in dark mode — it is meant to sit on a surface, not float over content — so it is
       painted as an image over an opaque surface base rather than set as the background colour, which would let
       whatever is scrolling underneath bleed through. */
    background-color: var(--surface);
    background-image: linear-gradient(var(--danger), var(--danger));
}
</style>
