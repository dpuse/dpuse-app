// ── Static Components
import MenuContent from './MenuContent.vue';
import MenuGroup from './MenuGroup.vue';
import MenuItem from './MenuItem.vue';
import MenuRoot from './MenuRoot.vue';
import MenuSeparator from './MenuSeparator.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Used as 'Menu.Root', 'Menu.Content' and so on, so the parts of one menu read as one family in a template.
export const Menu = { Content: MenuContent, Group: MenuGroup, Item: MenuItem, Root: MenuRoot, Separator: MenuSeparator };
