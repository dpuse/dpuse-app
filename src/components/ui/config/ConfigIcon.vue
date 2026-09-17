<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Config icons are stored as SVG markup rather than as components, so they can only be rendered with 'v-html'. Nothing
// renders when a config carries neither, so callers need no condition of their own.
//
// Size and spacing are deliberately not props: they differ at every call site and arrive through class fallthrough. Set a
// height for an icon as wide as its SVG's viewBox, or a size to fit it inside a square.
interface Properties {
    icon?: null | string;
    iconDark?: null | string;
}
const { icon, iconDark } = defineProps<Properties>();
</script>

<template>
    <div v-if="icon || iconDark" class="flex flex-none items-center justify-center rounded-md" data-region="ConfigIcon">
        <!-- Only split into two 'v-html' copies when the SVGs actually differ; otherwise rendering the same markup twice
             duplicates element ids (mask/gradient), which can break references when one copy is display:none. -->
        <template v-if="icon && iconDark && icon !== iconDark">
            <div aria-hidden="true" class="block h-full max-w-full dark:hidden [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full" v-html="icon" />
            <div aria-hidden="true" class="hidden h-full max-w-full dark:block [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full" v-html="iconDark" />
        </template>
        <div v-else aria-hidden="true" class="h-full max-w-full [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-w-full" v-html="icon ?? iconDark" />
    </div>
</template>
