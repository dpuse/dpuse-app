// ── External Dependencies & Registrations
import type { InjectionKey, ShallowRef } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface MenuContext {
    closeMenu: (isFocusReturned: boolean) => void; // Focus goes back to the trigger after a choice or Escape, and stays where it moved after a click outside or Tab.
    contentElement: ShallowRef<HTMLElement | undefined>;
    menuId: string;
    triggerElement: ShallowRef<HTMLElement | undefined>;
}

export interface MenuTriggerAttributes {
    'aria-controls': string | undefined;
    'aria-expanded': boolean;
    'aria-haspopup': 'menu';
    onClick: () => void;
    onKeydown: (event: KeyboardEvent) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const menuContextKey: InjectionKey<MenuContext> = Symbol('menuContext');
