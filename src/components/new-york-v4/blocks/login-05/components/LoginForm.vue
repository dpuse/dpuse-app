<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { useColorMode } from '@vueuse/core';

import { cn } from '@/lib/utils';

import AppleLogo from '@/components/icon/logo/AppleLogo.vue';
import GitHubLogo from '@/components/icon/logo/GitHubLogo.vue';
import GoogleLogo from '@/components/icon/logo/GoogleLogo.vue';
import MicrosoftLogo from '@/components/icon/logo/MicrosoftLogo.vue';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

// ???
const colorMode = useColorMode();

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <div :class="cn('flex flex-col gap-6', props.class)">
        <form>
            <FieldGroup>
                <div class="flex flex-col items-center gap-2 text-center">
                    <a href="#" class="flex flex-col items-center gap-2 font-medium">
                        <span class="sr-only">Acme Inc.</span>
                    </a>
                    <h1 class="text-xl font-medium">Data Positioning + Use</h1>
                    <FieldDescription>
                        Don't have an account?
                        <a href="#">Sign up</a>
                    </FieldDescription>
                </div>
                <Field>
                    <FieldLabel for="email">Email</FieldLabel>
                    <Input id="email" type="email" placeholder="m@example.com" required />
                </Field>
                <Field>
                    <Button type="submit">Sign in</Button>
                </Field>
                <FieldSeparator>Or continue with</FieldSeparator>
                <Field class="grid gap-4 sm:grid-cols-2">
                    <Button variant="outline" type="button">
                        <AppleLogo class="size-5" :fill="colorMode === 'light' ? 'black' : 'white'" />
                        Apple
                    </Button>
                    <Button variant="outline" type="button">
                        <GitHubLogo class="size-5" :fill="colorMode === 'light' ? 'black' : 'white'" />
                        Github
                    </Button>
                    <Button variant="outline" type="button">
                        <GoogleLogo class="size-5" />
                        Google
                    </Button>
                    <Button variant="outline" type="button">
                        <MicrosoftLogo class="size-5" />
                        Microsoft
                    </Button>
                </Field>
            </FieldGroup>
        </form>
        <FieldDescription class="px-6 text-center"> By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. </FieldDescription>
    </div>
</template>
