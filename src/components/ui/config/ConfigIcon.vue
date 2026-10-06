<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Config icons are stored as SVG markup, which may come from a plugin, so each is shown as an image rather than inlined.
// An image is its own document: ids inside one icon cannot collide with another copy on the page (a hidden first copy
// would otherwise blank every later one in Safari), and any script in the markup never runs. Nothing renders when a
// config carries neither, so callers need no condition of their own.
//
// Size and spacing are deliberately not props: they differ at every call site and arrive through class fallthrough. Set a
// height for an icon as wide as its SVG's viewBox, or a size to fit it inside a square.
const { icon, iconDark } = defineProps<{ icon?: null | string; iconDark?: null | string }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const darkIconURL = computed(() => (iconDark !== icon && isPresent(icon) && isPresent(iconDark) ? constructSVGDataURL(iconDark) : undefined));
const iconURL = computed(() => {
    const svg = isPresent(icon) ? icon : iconDark;
    return isPresent(svg) ? constructSVGDataURL(svg) : undefined;
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The markup must declare 'xmlns': inline SVG borrows its namespace from the page, but an image will not draw without it.
function constructSVGDataURL(svg: string): string {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function isPresent(svg: null | string | undefined): svg is string {
    return svg != null && svg !== '';
}
</script>

<template>
    <div v-if="iconURL" class="flex flex-none items-center justify-center rounded-md" data-region="ConfigIcon">
        <img alt="" class="h-full w-auto max-w-full" :class="{ 'dark:hidden': darkIconURL }" draggable="false" :src="iconURL" />
        <img v-if="darkIconURL" alt="" class="hidden h-full w-auto max-w-full dark:block" draggable="false" :src="darkIconURL" />
    </div>
</template>
