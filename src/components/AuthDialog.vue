<script setup lang="ts">
import { computed } from 'vue';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const show = computed(() => route.query.dialog === 'auth');

function closeDialog() {
    // Remove the dialog query param, keep all other params
    const rest = { ...route.query };
    delete rest.dialog;
    router.push({ query: { ...rest } });
}
</script>

<template>
    <Dialog
        :open="show"
        @update:open="
            (val) => {
                if (!val) closeDialog();
            }
        "
    >
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Auth Dialog</DialogTitle>
                <DialogDescription> This is the Auth dialog triggered by the <code>?dialog=auth</code> query param. </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose as-child>
                    <button @click="closeDialog">Close</button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
