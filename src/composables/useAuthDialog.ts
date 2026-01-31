// This composable provides a reactive flag for showing the Auth dialog based on the current route
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export function useAuthDialog() {
    const route = useRoute();
    // Show dialog if the current query param is 'auth'
    const showAuthDialog = computed(() => route.query.dialog === 'auth');
    return { showAuthDialog };
}
