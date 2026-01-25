import { ref } from 'vue';

const isOptionBarVisible = ref(true);
const isAssistantPanelVisible = ref(true);

export function useWorkbenchChrome() {
    return {
        isOptionBarVisible,
        isAssistantPanelVisible
    };
}
