<script setup lang="ts">
// ── External Dependencies & Registrations
import { ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ModuleConfig } from '@dpuse/dpuse-shared/component/module';

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import GitHubLogo from '@/components/branding/GitHubLogo.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Documentation: { en: 'Documentation', es: 'Documentación' },
    GitHub_repository: { en: 'GitHub Repository', es: 'Repositorio de GitHub' },
    Links: { en: 'Links', es: 'Enlaces' },
    Sign_in: { en: 'Sign in', es: 'Iniciar sesión' },
    Website: { en: 'Website', es: 'Sitio web' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { localisedConfig } = defineProps<{ localisedConfig: LocalisedConfig<ModuleConfig> }>();
</script>

<template>
    <h2>{{ t(T, 'Links') }}</h2>
    <ul>
        <li v-if="localisedConfig.vendorHomeURL" class="flex items-center gap-x-2">
            <GlobeIcon class="size-4" />
            <a :href="localisedConfig.vendorHomeURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                {{ localisedConfig.label }}
                {{ t(T, 'Website') }}
                <ExternalLinkIcon class="size-4" />
            </a>
        </li>

        <li v-if="localisedConfig.vendorDocumentationURL" class="flex items-center gap-x-2">
            <InfoIcon class="size-4" />
            <a :href="localisedConfig.vendorDocumentationURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                {{ localisedConfig.label }}
                {{ t(T, 'Documentation') }}
                <ExternalLinkIcon class="size-4" />
            </a>
        </li>

        <li v-if="localisedConfig.vendorAccountURL" class="flex items-center gap-x-2">
            <UserRoundIcon class="size-4" />
            <a :href="localisedConfig.vendorAccountURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                {{ localisedConfig.label }}
                {{ t(T, 'Sign_in') }}
                <ExternalLinkIcon class="size-4" />
            </a>
        </li>

        <li class="flex items-center gap-x-2">
            <a :href="`https://github.com/dpuse/${localisedConfig.id}`" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                <GitHubLogo class="size-4" />
                {{ t(T, 'GitHub_repository') }}
                <ExternalLinkIcon class="size-4" />
            </a>
        </li>
    </ul>
</template>
