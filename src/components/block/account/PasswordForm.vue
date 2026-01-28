<script setup lang="ts">
// External dependencies
import { type HTMLAttributes, ref } from 'vue';

// Application modules
import { cn } from '@/lib/utils';

// Components
import { Button } from '@/components/base/button';
import { Input } from '@/components/base/input';
import { Field, FieldGroup, FieldLabel } from '@/components/base/field';

// Properties
type Properties = { class?: HTMLAttributes['class']; onTrigger: (password: string) => Promise<void> };
const properties = defineProps<Properties>();

// ???
const password = ref('datapos1111');
async function handleSubmit() {
    await properties.onTrigger(password.value);
}
</script>

<template>
    <div :class="cn('flex flex-col gap-6', properties.class)">
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

                    <!-- Following required to help browsers and assistive tech recognize the form as a login or password form -->
                    <Input id="username" type="text" autocomplete="username" placeholder="Username" style="display: none" tabindex="-1" aria-hidden="true" />

                    <Input id="password" type="password" autocomplete="new-password" placeholder="Enter password" required />
                </Field>

                <Field>
                    <Button type="button" @click="handleSubmit">Continue</Button>
                </Field>
            </FieldGroup>
        </form>
    </div>
</template>
