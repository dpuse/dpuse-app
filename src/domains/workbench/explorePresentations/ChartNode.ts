// ── External Dependencies & Registrations
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import { mergeAttributes, Node } from '@tiptap/core';

// ── Local Components - Static
import ChartNodeView from './ChartNodeView.vue';

// ── TipTap Node ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const ChartNode = Node.create({
    name: 'chart',
    group: 'block',
    atom: true,
    draggable: true,

    // Declares the node's persistent data. Tiptap serialises these as HTML attributes on the div produced by renderHTML.
    addAttributes() {
        return {
            title: { default: 'My Chart' },
            labels: { default: 'Jan,Feb,Mar,Apr,May' },
            data: { default: '10,20,15,30,25' }
        };
    },

    // Tells Tiptap which HTML elements map back to this node when parsing saved content.
    // The attributes on the matched div are read back into addAttributes(), restoring chart state.
    parseHTML() {
        return [{ tag: 'div[data-type="chart"]' }];
    },

    // Defines the serialisation format when exporting content (save to DB, copy to clipboard, etc.).
    // Produces e.g. <div data-type="chart" title="..." labels="..." data="..."></div> — not for display, just storage.
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'chart' }, HTMLAttributes)];
    },

    // Replaces Tiptap's default HTML rendering inside the editor with the Vue component.
    // ChartNodeView renders the interactive canvas chart and edit controls the user actually sees.
    addNodeView() {
        return VueNodeViewRenderer(ChartNodeView);
    }
});
