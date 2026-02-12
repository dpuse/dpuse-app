<script setup lang="ts">
// External dependencies
import { computed, ref } from 'vue';
import { LogOutIcon, Maximize2Icon, Minimize2Icon, MonitorIcon, MoonIcon, SunIcon, UserCogIcon } from 'lucide-vue-next';
import { onClickOutside, useColorMode, useFullscreen } from '@vueuse/core';

// Workbench components
import IconActionContent from '@/components/base/IconActionContent.vue';

// Pill expand/collapse
const pillReference = ref<HTMLElement>();
const isExpanded = ref(false);

onClickOutside(pillReference, () => {
    isExpanded.value = false;
});

// Fullscreen
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(document.body);

// Appearance / Color mode
const colorMode = useColorMode({ emitAuto: true });

const colorModeIcon = computed(() => {
    switch (colorMode.value) {
        case 'dark':
            return MoonIcon;
        case 'light':
            return SunIcon;
        default:
            return MonitorIcon;
    }
});

const colorModeAriaLabel = computed(() => {
    switch (colorMode.value) {
        case 'dark':
            return 'Appearance: dark';
        case 'light':
            return 'Appearance: light';
        default:
            return 'Appearance: system';
    }
});

function cycleColorMode(): void {
    if (colorMode.value === 'light') colorMode.value = 'dark';
    else if (colorMode.value === 'dark') colorMode.value = 'auto';
    else colorMode.value = 'light';
}
</script>

<template>
    <div ref="pillReference" class="fixed bottom-2 left-1/2 z-50 -translate-x-1/2" @mouseenter="isExpanded = true" @mouseleave="isExpanded = false">
        <!-- Minimized indicator -->
        <!-- <div v-if="!isExpanded" class="hover:bg-border/60 h-1.5 w-10 cursor-pointer rounded-full bg-zinc-300 transition-colors" @click="isExpanded = true" /> -->

        <!-- Expanded pill -->
        <div class="border-separator bg-background-secondary/90 flex items-center gap-x-0.5 rounded-full border px-1 py-0.5 shadow-lg backdrop-blur-sm" @click.stop>
            <button class="group outline-none" @click="toggleFullscreen">
                <IconActionContent :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'">
                    <component :is="isFullscreen ? Minimize2Icon : Maximize2Icon" class="size-4" :stroke-width="1.5" />
                </IconActionContent>
            </button>

            <button class="group outline-none" @click="cycleColorMode">
                <IconActionContent :aria-label="colorModeAriaLabel">
                    <component :is="colorModeIcon" class="size-4" :stroke-width="1.5" />
                </IconActionContent>
            </button>

            <div class="bg-separator mx-0.5 h-4 w-px" />

            <button class="group outline-none">
                <IconActionContent aria-label="Account">
                    <UserCogIcon class="size-4" :stroke-width="1.5" />
                </IconActionContent>
            </button>

            <button class="group outline-none">
                <IconActionContent aria-label="Sign out">
                    <LogOutIcon class="size-4" :stroke-width="1.5" />
                </IconActionContent>
            </button>
        </div>
    </div>
</template>
