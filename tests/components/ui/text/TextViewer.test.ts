// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

// ── Local Framework
import TextViewer from '@/components/ui/text/TextViewer.vue';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountViewer(properties: InstanceType<typeof TextViewer>['$props']): ReturnType<typeof mount<typeof TextViewer>> {
    return mount(TextViewer, { props: properties });
}

function readLines(wrapper: ReturnType<typeof mountViewer>): { lineNumber: string | undefined; text: string }[] {
    return wrapper.findAll('[data-line-number]').map((line) => ({ lineNumber: line.attributes('data-line-number'), text: line.findAll('span')[1]?.text() ?? '' }));
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('TextViewer', () => {
    it.each([
        ['\\n', 'a,b\n1,2\n'],
        ['\\r\\n', 'a,b\r\n1,2\r\n'],
        ['\\r', 'a,b\r1,2\r']
    ])('numbers lines split at %s, without a line after the final break', (_description, text) => {
        expect(readLines(mountViewer({ text }))).toEqual([
            { lineNumber: '1', text: 'a,b' },
            { lineNumber: '2', text: '1,2' }
        ]);
    });

    it('keeps an empty line in the count', () => {
        expect(readLines(mountViewer({ text: 'a\n\nb' })).map((line) => line.lineNumber)).toEqual(['1', '2', '3']);
    });

    it('shows no lines for no text', () => {
        expect(mountViewer({ text: '' }).findAll('[data-line-number]')).toHaveLength(0);
        expect(mountViewer({ text: undefined }).findAll('[data-line-number]')).toHaveLength(0);
    });

    it('hides the numbers from screen readers', () => {
        const number = mountViewer({ text: 'a' }).find('[data-line-number="1"] span');

        expect(number.attributes('aria-hidden')).toBe('true');
    });

    it('colours the lines it is given, and only those', () => {
        const wrapper = mountViewer({ lineHighlights: new Map([[2, 'danger']]), text: 'a\nb\nc' });

        expect(wrapper.find('[data-line-number="2"]').classes()).toContain('bg-danger');
        expect(wrapper.find('[data-line-number="1"]').classes()).not.toContain('bg-danger');
    });

    it('scrolls a line into view', () => {
        const wrapper = mountViewer({ text: 'a\nb\nc' });
        const scrollIntoView = vi.fn();
        wrapper.find('[data-line-number="3"]').element.scrollIntoView = scrollIntoView; // jsdom does not lay out, so it has no 'scrollIntoView' of its own.

        wrapper.vm.scrollToLine(3);

        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', inline: 'start' });
    });
});
