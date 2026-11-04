// ── External Dependencies & Registrations
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import { Menu } from '@/components/ui/menu';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// A menu with a set of choices, one of them disabled, an on/off setting and an action.
const TestMenu = defineComponent({
    components: { MenuContent: Menu.Content, MenuItem: Menu.Item, MenuRoot: Menu.Root, MenuSeparator: Menu.Separator },
    emits: ['action'],
    setup() {
        return { chosenId: ref('b'), isOn: ref(false) };
    },
    template: `
        <MenuRoot>
            <template #trigger="{ triggerAttributes }"><button v-bind="triggerAttributes" type="button">Open</button></template>
            <MenuContent label="Test">
                <MenuItem v-for="id in ['a', 'b', 'c']" :key="id" :is-checked="chosenId === id" :is-disabled="id === 'c'" kind="radio" @select="chosenId = id">{{ id }}</MenuItem>
                <MenuSeparator />
                <MenuItem :is-checked="isOn" kind="checkbox" @select="isOn = !isOn">On</MenuItem>
                <MenuItem @select="$emit('action')">Action</MenuItem>
            </MenuContent>
        </MenuRoot>`
});

function mountMenu(): VueWrapper {
    const wrapper = mount(TestMenu, { attachTo: document.body });
    wrappers.push(wrapper);
    return wrapper;
}

async function openMenu(wrapper: VueWrapper): Promise<void> {
    await wrapper.get('[aria-haspopup="menu"]').trigger('click');
    await wrapper.vm.$nextTick();
}

// Pressed on whatever has focus, as a key press in a browser is.
function pressKey(key: string): void {
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

afterEach(() => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount();
});

describe('Menu', () => {
    it('names its trigger and opens on the chosen item', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.get('[aria-haspopup="menu"]');

        expect(trigger.attributes('aria-expanded')).toBe('false');

        await openMenu(wrapper);
        const menu = wrapper.get('[role="menu"]');

        expect(trigger.attributes('aria-expanded')).toBe('true');
        expect(trigger.attributes('aria-controls')).toBe(menu.attributes('id'));
        expect(menu.attributes('aria-label')).toBe('Test');
        expect(document.activeElement?.textContent.trim()).toBe('b');
    });

    it('marks radio and checkbox items, and leaves an action unmarked', async () => {
        const wrapper = mountMenu();
        await openMenu(wrapper);

        expect(wrapper.findAll('[role="menuitemradio"]').map((item) => item.attributes('aria-checked'))).toEqual(['false', 'true', 'false']);
        expect(wrapper.get('[role="menuitemcheckbox"]').attributes('aria-checked')).toBe('false');
        expect(wrapper.get('[role="menuitem"]').attributes('aria-checked')).toBeUndefined();
    });

    it('skips a disabled item with the arrow keys, and wraps round', async () => {
        const wrapper = mountMenu();
        await openMenu(wrapper);

        pressKey('ArrowDown');
        expect(document.activeElement?.textContent.trim()).toBe('On');

        pressKey('End');
        pressKey('ArrowDown');
        expect(document.activeElement?.textContent.trim()).toBe('a');
    });

    it('does not choose a disabled item', async () => {
        const wrapper = mountMenu();
        await openMenu(wrapper);

        await wrapper.findAll('[role="menuitemradio"]')[2]?.trigger('click');

        expect(wrapper.find('[role="menu"]').exists()).toBe(true);
        expect(wrapper.findAll('[role="menuitemradio"]')[2]?.attributes('aria-disabled')).toBe('true');
    });

    it('closes on a choice and returns focus to its trigger', async () => {
        const wrapper = mountMenu();
        await openMenu(wrapper);

        await wrapper.get('[role="menuitem"]').trigger('click');

        expect(wrapper.emitted('action')).toHaveLength(1);
        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
        expect(document.activeElement).toBe(wrapper.get('[aria-haspopup="menu"]').element);
    });

    it('opens from its trigger with the arrow keys and closes on Escape', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.get('[aria-haspopup="menu"]');

        await trigger.trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[role="menu"]').exists()).toBe(true);

        pressKey('Escape');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
        expect(document.activeElement).toBe(trigger.element);
    });

    it('closes on Tab without taking focus back', async () => {
        const wrapper = mountMenu();
        await openMenu(wrapper);

        pressKey('Tab');
        await wrapper.vm.$nextTick();

        expect(wrapper.find('[role="menu"]').exists()).toBe(false);
    });
});
