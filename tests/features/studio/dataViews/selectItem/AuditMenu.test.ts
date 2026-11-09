// ── External Dependencies & Registrations
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import AuditMenu from '@/features/studio/dataViews/selectItem/AuditMenu.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const AUDIT_CHOICES = [
    { byteLimit: 1_048_576, id: '1048576', label: '1 MB' },
    { byteLimit: undefined, id: 'all', label: 'All' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

afterEach(() => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});

describe('AuditMenu', () => {
    it('opens on its first choice and hands over the size chosen', async () => {
        const wrapper = mountMenu();

        await wrapper.get('[aria-haspopup="menu"]').trigger('click');
        await wrapper.vm.$nextTick();
        const items = wrapper.findAll('[role="menuitem"]');

        expect(items.map((item) => item.text())).toEqual(['1 MB', 'All']);
        expect(document.activeElement).toBe(items[0]?.element);

        await items[0]?.trigger('click');

        expect(wrapper.emitted('select')).toEqual([[1_048_576]]);
        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });

    it('hands over undefined for the whole item', async () => {
        const wrapper = mountMenu();

        await wrapper.get('[aria-haspopup="menu"]').trigger('click');
        await wrapper.findAll('[role="menuitem"]')[1]?.trigger('click');

        expect(wrapper.emitted('select')).toEqual([[undefined]]);
    });

    it('moves with the arrow keys, wrapping round, and returns to its button on Escape', async () => {
        const wrapper = mountMenu();
        const button = wrapper.get('[aria-haspopup="menu"]');

        await button.trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();
        const items = wrapper.findAll('[role="menuitem"]');

        await items[0]?.trigger('keydown', { key: 'ArrowUp' });
        expect(document.activeElement).toBe(items[1]?.element);

        await items[1]?.trigger('keydown', { key: 'Escape' });
        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
        expect(document.activeElement).toBe(button.element);
    });

    it('does not open while disabled', async () => {
        const wrapper = mountMenu(true);

        await wrapper.get('[aria-haspopup="menu"]').trigger('click');

        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountMenu(isDisabled = false): VueWrapper {
    const wrapper = mount(AuditMenu, { attachTo: document.body, props: { auditChoices: AUDIT_CHOICES, disabled: isDisabled } });
    wrappers.push(wrapper);
    return wrapper;
}
