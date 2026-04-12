<script setup lang="ts">
// TODO: Do we want to remove the 'https://blockly-demo.appspot.com' CSP setting and download the images to this app?

// External Dependencies
import { onMounted } from 'vue';
import { blockRendering, common, inject, Theme, Themes, thrasos } from 'blockly/core';

// App Core
import type { TaskLocalisedConfig } from './EstablishDataViewsLayout.vue';

// Properties & Emits
const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();
const emit = defineEmits<{ (event: 'complete', taskLocalisedConfig: TaskLocalisedConfig): void }>();

// Side Effects  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => {
    class DPUseConstantProvider extends blockRendering.ConstantProvider {
        constructor() {
            super();
            this.NOTCH_WIDTH = 26;
            this.NOTCH_HEIGHT = 6;
            this.CORNER_RADIUS = 4;
            this.MEDIUM_PADDING = 18;
            this.LARGE_PADDING = 18;
            this.BOTTOM_ROW_MIN_HEIGHT = 18;
            this.TOP_ROW_MIN_HEIGHT = 18;
        }

        protected override makeNotch(): blockRendering.Notch {
            const width = this.NOTCH_WIDTH;
            const height = this.NOTCH_HEIGHT;
            // Flat-bottomed trapezoid: straight angled sides + horizontal flat at the bottom
            const innerWidth = Math.round(width / 2); // width of the flat bottom segment
            const slopeWidth = (width - innerWidth) / 2; // width of each straight side

            function makeMainPath(direction: number): string {
                return (
                    `l ${direction * slopeWidth},${height} ` + // straight diagonal down
                    `h ${direction * innerWidth} ` + // flat bottom
                    `l ${direction * slopeWidth},${-height} ` // straight diagonal back up
                );
            }

            return { type: this.SHAPES.NOTCH, width, height, pathLeft: makeMainPath(1), pathRight: makeMainPath(-1) };
        }
    }

    class DPUseRenderer extends thrasos.Renderer {
        constructor() {
            super('dpuse');
        }

        protected override makeConstants_(): DPUseConstantProvider {
            return new DPUseConstantProvider();
        }
    }

    blockRendering.register('dpuse', DPUseRenderer);

    const DPUseTheme = Theme.defineTheme('dpuse', {
        name: 'dpuse',
        base: Themes.Classic, // Classic, Zelos
        blockStyles: {
            list_blocks: { colourPrimary: '#4DB6B5', colourSecondary: '#CE93D8', colourTertiary: '#FFFFFF' },
            logic_blocks: { colourPrimary: '#d1c4e9', colourSecondary: '#90CAF9', colourTertiary: '#FFFFFF' },
            loop_blocks: { colourPrimary: '#a5d6a7', colourSecondary: '#A5D6A7', colourTertiary: '#FFFFFF' },
            math_blocks: { colourPrimary: '#4285f4', colourSecondary: '#9FA8DA', colourTertiary: '#FFFFFF' },
            procedure_blocks: { colourPrimary: '#d7ccc8', colourSecondary: '#B0BEC5', colourTertiary: '#FFFFFF' },
            text_blocks: { colourPrimary: '#FFCA26', colourSecondary: '#80CBC4', colourTertiary: '#FFFFFF' },
            variable_blocks: { colourPrimary: '#ef9a9a', colourSecondary: '#FFE082', colourTertiary: '#FFFFFF' },
            variable_dynamic_blocks: { colourPrimary: '#EF6C00', colourSecondary: '#FFCC80', colourTertiary: '#FFFFFF' },
            hat_blocks: { colourPrimary: '#880E4F', colourSecondary: '#F48FB1', colourTertiary: '#FFFFFF', hat: 'cap' },
            colour_blocks: { colourPrimary: '#B71C1C', colourSecondary: '#EF9A9A', colourTertiary: '#FFFFFF' }
        },
        componentStyles: {
            workspaceBackgroundColour: '#FFFFFF',
            toolboxBackgroundColour: '#FFFFFF',
            toolboxForegroundColour: '#5F6368',
            flyoutBackgroundColour: '#FFFFFF',
            flyoutForegroundColour: '#3C4043',
            flyoutOpacity: 1,
            scrollbarColour: '#DADCE0',
            scrollbarOpacity: 0.8,
            insertionMarkerColour: '#1A73E8',
            insertionMarkerOpacity: 0.4
        },
        fontStyle: { family: "'Google Sans', Roboto, sans-serif", weight: '400', size: 11 },
        startHats: false
    });

    // Create the definition.
    const definitions = common.createBlockDefinitionsFromJsonArray([
        {
            type: 'list_blocks',
            message0: 'list_blocks %1',
            args0: [{ type: 'field_number', name: 'FIELD_NAME', value: 0 }],
            previousStatement: null,
            nextStatement: null,
            style: 'list_blocks'
        },
        {
            type: 'logic_blocks',
            message0: 'logic_blocks %1',
            args0: [{ type: 'field_number', name: 'FIELD_NAME', value: 0 }],
            previousStatement: null,
            nextStatement: null,
            style: 'logic_blocks'
        },
        {
            type: 'loop_blocks',
            message0: 'loop_blocks %1',
            args0: [{ type: 'field_number', name: 'FIELD_NAME', value: 0 }],
            previousStatement: null,
            nextStatement: null,
            style: 'loop_blocks'
        },
        {
            type: 'math_blocks',
            message0: 'math_blocks %1',
            args0: [{ type: 'field_number', name: 'FIELD_NAME', value: 0 }],
            previousStatement: null,
            nextStatement: null,
            style: 'math_blocks'
        },
        {
            type: 'procedure_blocks',
            message0: 'procedure_blocks %1',
            args0: [{ type: 'field_number', name: 'FIELD_NAME', value: 0 }],
            previousStatement: null,
            nextStatement: null,
            style: 'procedure_blocks'
        },
        {
            type: 'text_blocks',
            message0: 'text_blocks %1',
            args0: [{ type: 'field_number', name: 'FIELD_NAME', value: 0 }],
            previousStatement: null,
            nextStatement: null,
            style: 'text_blocks'
        },
        {
            type: 'variable_blocks',
            message0: 'variable_blocks %1',
            args0: [{ type: 'field_number', name: 'FIELD_NAME', value: 0 }],
            previousStatement: null,
            nextStatement: null,
            style: 'variable_blocks'
        }
    ]);

    // Register the definition.
    common.defineBlocks(definitions);
    const toolbox = {
        kind: 'flyoutToolbox',
        contents: [
            { kind: 'block', type: 'list_blocks' },
            { kind: 'block', type: 'logic_blocks' },
            { kind: 'block', type: 'loop_blocks' },
            { kind: 'block', type: 'math_blocks' },
            { kind: 'block', type: 'procedure_blocks' },
            { kind: 'block', type: 'text_blocks' },
            { kind: 'block', type: 'variable_blocks' }
        ]
    };

    // Renderers: dpuse, dark, geras, highcontrast, thrasos, tritanopia, zelos
    // Themes: clasic, deuteranopia, modern, thrasos, zelos
    const workspace = inject('blocklyDiv', { toolbox: toolbox, renderer: 'dpuse', theme: 'dpuse' });
});

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function triggerComplete(): void {
    emit('complete', taskLocalisedConfig);
}
</script>

<template>
    <div class="px-4 pt-1">
        <div>Transform...</div>

        <div id="blocklyDiv" style="height: 480px; width: 100%"></div>

        <RouterLink :to="{ name: 'investigate', query: { ...$route.query, wbView: 'investigate' } }" @click="triggerComplete">Next...</RouterLink>
    </div>
</template>

<style scoped>
:deep(.blocklyText) {
    fill: #09090b !important;
}
</style>
