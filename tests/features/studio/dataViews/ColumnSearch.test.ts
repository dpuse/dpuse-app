// ── External Dependencies & Registrations
import { afterEach, describe, expect, it } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import ColumnSearch from '@/features/studio/dataViews/ColumnSearch.vue';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/dataViews/ColumnSearch_.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const OPTIONS = [
    { id: '0', label: 'Amount', needsAttention: false },
    { id: '2', label: 'City', needsAttention: true }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const mountedWrappers: VueWrapper[] = []; // Mounted on the page, because focus only moves between attached elements.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ColumnSearch', () => {
    afterEach(() => {
        for (const wrapper of mountedWrappers.splice(0)) wrapper.unmount();
    });

    it('opens the field from the icon and puts focus in it', async () => {
        const wrapper = mountSearch();

        expect(wrapper.find('input').exists()).toBe(false);
        await openSearch(wrapper);

        expect(findButton(wrapper).attributes('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(wrapper.get('input').element);
    });

    it('marks a column that needs checking, hands over its index when chosen, then closes', async () => {
        const wrapper = mountSearch();
        await openSearch(wrapper);
        const input = wrapper.get('input');

        await input.setValue('cit');
        expect(wrapper.find(`[role="option"] [aria-label="${t(TEXT, 'attention.aria')}"]`).exists()).toBe(true);
        await input.trigger('keydown', { key: 'Enter' });

        expect(wrapper.emitted('select')).toStrictEqual([[2]]);
        expect(wrapper.find('input').exists()).toBe(false);
        expect(document.activeElement).toBe(findButton(wrapper).element);
    });

    it('closes with Escape once the field has nothing to undo, and returns focus to the icon', async () => {
        const wrapper = mountSearch();
        await openSearch(wrapper);

        await wrapper.get('input').trigger('keydown', { key: 'Escape' });

        expect(wrapper.find('input').exists()).toBe(false);
        expect(findButton(wrapper).attributes('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(findButton(wrapper).element);
    });

    it('closes when focus moves elsewhere, leaving focus there', async () => {
        const wrapper = mountSearch();
        const outsideButton = document.createElement('button');
        document.body.append(outsideButton);
        await openSearch(wrapper);

        outsideButton.focus();
        await flushPromises();

        expect(wrapper.find('input').exists()).toBe(false);
        expect(document.activeElement).toBe(outsideButton);
        outsideButton.remove();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountSearch(): VueWrapper {
    const wrapper = mount(ColumnSearch, { attachTo: document.body, props: { options: OPTIONS } });
    mountedWrappers.push(wrapper);
    return wrapper;
}

function findButton(wrapper: VueWrapper): ReturnType<VueWrapper['get']> {
    return wrapper.get(`button[aria-label="${t(TEXT, 'search.aria')}"]`);
}

async function openSearch(wrapper: VueWrapper): Promise<void> {
    await findButton(wrapper).trigger('click');
    await flushPromises();
}
