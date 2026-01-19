<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue';
</script>

<template>
    <div class="flex h-full items-center justify-center">
        <Button variant="outline"> Button </Button>
        <Button variant="outline" size="icon" aria-label="Submit">
            <ArrowUpIcon />
        </Button>
    </div>
</template>
