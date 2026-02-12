<script setup lang="ts">
import { openaiText } from '@tanstack/ai-openai';
import { chat, toolDefinition } from '@tanstack/ai';

console.log(chat, toolDefinition, openaiText);
</script>

<template>
    <div class="flex h-full flex-1 flex-col">
        <div class="text-muted-foreground flex flex-1 items-center justify-center font-light">Assistant Search</div>
    </div>
</template>
