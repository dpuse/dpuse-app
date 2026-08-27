import App from '../App.vue';
import { createAppRouter } from '@/router';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

async function clickStudioToggle(entryUrl: string) {
    const router = createAppRouter();
    await router.push(entryUrl).catch(() => undefined);
    await router.isReady();

    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [router] } });
    await flushPromises();

    const landedAt = router.currentRoute.value.fullPath;

    const errors: unknown[] = [];
    wrapper.vm.$.appContext.config.errorHandler = (error): void => {
        errors.push(error);
    };

    await wrapper.find('button[aria-label="Toggle studio panel"]').trigger('click');
    await flushPromises();

    return { landedAt, endedAt: router.currentRoute.value.fullPath, error: errors[0] as Error | undefined };
}

describe('studio toggle', () => {
    it('the URL the user actually tried', async () => {
        const result = await clickStudioToggle('/establishDataViews');
        console.log(
            'A /establishDataViews ->',
            JSON.stringify(result, (_k, v) => (v instanceof Error ? v.message.split('\n')[0] : v))
        );
        expect(result.error).toBeUndefined();
    });

    it('a screen that needs an id', async () => {
        const result = await clickStudioToggle('/establishDataViews/abc123/selectItem?sView=selectItem');
        console.log(
            'B selectItem ->',
            JSON.stringify(result, (_k, v) => (v instanceof Error ? v.message.split('\n')[0] : v))
        );
        expect(result.error).toBeDefined();
    });

    it('a route name that no longer exists', async () => {
        const result = await clickStudioToggle('/establishDataViews?sView=rubbish');
        console.log(
            'C rubbish ->',
            JSON.stringify(result, (_k, v) => (v instanceof Error ? v.message.split('\n')[0] : v))
        );
        expect(result.error).toBeDefined();
    });
});
