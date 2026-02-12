<script setup lang="ts">
// External dependencies
import { MessageCircleMoreIcon, SearchIcon } from 'lucide-vue-next';

// Workbench components
import IconActionContent from '@/components/base/IconActionContent.vue';

// Properties
defineProps<{ sessionIsAuthenticated?: boolean; onSelect: () => void }>();
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Benchtop options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none px-3 pt-2 pb-6">
            <div class="flex w-full flex-1 flex-col items-center gap-y-2">
                <a class="group outline-none" @click="onSelect">
                    <IconActionContent>
                        <SearchIcon aria-hidden="true" class="size-6" :stroke-width="1.25" />
                    </IconActionContent>
                </a>

                <a class="group outline-none" @click="onSelect">
                    <IconActionContent>
                        <MessageCircleMoreIcon aria-hidden="true" class="size-5.5" :stroke-width="1.25" />
                    </IconActionContent>
                </a>
            </div>
        </div>
    </div>
</template>
