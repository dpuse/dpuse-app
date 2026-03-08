<script setup lang="ts">
// Properties & Emits
type Properties = { autoComplete?: 'email' | 'current-password' | 'new-password'; name: string; placeholder?: string; required?: boolean; type?: 'email' | 'password' | 'text' };
const { autoComplete, placeholder, required = false, type = 'text' } = defineProps<Properties>();
</script>

<template>
    <input
        :id="name"
        :name="name"
        :autocomplete="autoComplete"
        class="outline-separator placeholder:text-muted block rounded-md px-3 py-2 outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:focus:outline-indigo-500"
        :placeholder="placeholder"
        :required="required"
        :type="type"
    />
</template>
