import App from '../App.vue';
import { createAppRouter } from '@/router';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

describe('App', () => {
    it('mounts renders properly', async () => {
        const router = createAppRouter();
        router.push('/');
        await router.isReady();
        const wrapper = mount(App, { global: { plugins: [router] } });
        expect(wrapper.text()).toContain('Workflow');
    });
});
