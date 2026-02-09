<template>
    <button
        type="button"
        :class="[
            'inline-flex items-center justify-center rounded-md p-2 focus-visible:outline-2 focus-visible:outline-offset-2',
            'hover:text-accent-foreground hover:bg-zinc-200 focus-visible:outline-zinc-600',
            'dark:hover:bg-zinc-600 dark:focus-visible:outline-zinc-500'
        ]"
    >
        <slot />
    </button>
</template>
