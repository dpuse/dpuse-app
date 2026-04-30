import App from '../App.vue';
import { createAppRouter } from '@/router';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

describe('App', () => {
    it('renders pane toggle buttons', async () => {
        const router = createAppRouter();
        router.push('/');
        await router.isReady();
        const wrapper = mount(App, { global: { plugins: [router] } });

        expect(wrapper.find('button[aria-label="Toggle workbench panel"]').exists()).toBe(true);
        expect(wrapper.find('button[aria-label="Toggle knowledge panel"]').exists()).toBe(true);
    });
});
