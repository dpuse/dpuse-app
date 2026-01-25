<script setup lang="ts">
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'reka-ui';
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto rounded-b-lg border-x border-b">
        <div class="text-green9 h-64 w-full px-8 text-sm font-semibold md:px-16">
            <SplitterGroup id="splitter-group-1" direction="horizontal">
                <SplitterPanel id="splitter-group-1-panel-1" :min-size="20" class="flex items-center justify-center rounded-xl border bg-white"> Panel A </SplitterPanel>
                <SplitterResizeHandle id="splitter-group-1-resize-handle-1" class="w-2" />
                <SplitterPanel id="splitter-group-1-panel-2" :min-size="20">
                    <SplitterGroup id="splitter-group-2" direction="vertical">
                        <SplitterPanel id="splitter-group-2-panel-1" :min-size="20" class="flex items-center justify-center rounded-xl border bg-white"> Panel B </SplitterPanel>
                        <SplitterResizeHandle id="splitter-group-2-resize-handle-1" class="h-2" />
                        <SplitterPanel id="splitter-group-2-panel-2" :min-size="20" class="flex items-center justify-center rounded-xl border bg-white"> Panel C </SplitterPanel>
                    </SplitterGroup>
                </SplitterPanel>
            </SplitterGroup>
        </div>
    </div>
</template>
