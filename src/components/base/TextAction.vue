<template>
    <div
        :class="[
            'inline-flex items-center rounded-md px-2.5 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2',
            'bg-zinc-100 hover:bg-zinc-200 focus-visible:outline-zinc-600',
            'dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:focus-visible:outline-zinc-700'
        ]"
    >
        <slot />
    </div>
</template>
