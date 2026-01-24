<script setup lang="ts">
import { type HTMLAttributes, ref } from 'vue';

import { cn } from '@/lib/utils';

import { Button } from '~/src/components/base/button';
import { Field, FieldGroup, FieldLabel } from '~/src/components/base/field';
import { Input } from '~/src/components/base/input';

const props = defineProps<{ class?: HTMLAttributes['class']; onTrigger?: (password: string) => Promise<void> }>();

const password = ref('datapos1111');
const handleSubmit = async () => {
    if (!props.onTrigger) return;
    await props.onTrigger(password.value);
};
</script>

<template>
    <div :class="cn('flex flex-col gap-6', props.class)">
        <form>
            <FieldGroup>
                <div class="flex flex-col items-center gap-2 text-center">
                    <a href="#" class="flex flex-col items-center gap-2 font-medium">
                        <span class="sr-only">Acme Inc.</span>
                    </a>
                    <h1 class="text-xl font-medium">Enter password</h1>
                </div>
                <Field>
                    <FieldLabel for="email">Password</FieldLabel>
                    <Input id="password" type="password" placeholder="Enter password" required />
                </Field>
                <Field>
                    <Button type="button" @click="handleSubmit">Continue</Button>
                </Field>
            </FieldGroup>
        </form>
    </div>
</template>
