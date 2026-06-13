// External Dependencies
import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

// Local Components - Domain
import ChartNodeView from './ChartNodeView.vue';

// ─────────────────────────────────────────────────────────────────────────────

export const ChartNode = Node.create({
    name: 'chart',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            title: { default: 'My Chart' },
            labels: { default: 'Jan,Feb,Mar,Apr,May' },
            data: { default: '10,20,15,30,25' },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="chart"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'chart' }, HTMLAttributes)];
    },

    addNodeView() {
        return VueNodeViewRenderer(ChartNodeView);
    },
});
