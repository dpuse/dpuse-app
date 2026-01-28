<script setup lang="ts">
// Components
import Header from '@/components/block/header/Header.vue';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Application modules
import { useKnowledge } from '@/composables/useKnowledge';

// Properties
type Properties = { isDisplayWide: boolean; title: string };
const properties = defineProps<Properties>();

const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en') ?? {
    primaryOptions: [],
    secondaryOptions: []
};
</script>

<template>
    <div class="flex h-full flex-col rounded-b-lg border-x border-b">
        <Header title="Workflow" :is-display-wide="properties.isDisplayWide" />

        <div class="flex-1 overflow-y-auto overscroll-y-none">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4 p-4">
                <Card v-for="optionConfig of activeBenchtopConfig.primaryOptions" :key="optionConfig.id" class="h-50">
                    <CardHeader>
                        <CardTitle>{{ optionConfig.label }}</CardTitle>
                        <CardDescription>Card Description</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Card Content</p>
                    </CardContent>
                    <CardFooter>
                        <p>Card Footer</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
</template>
