import { ref } from 'vue';

const unlockedUpTo = ref(0);

export function useEstablishDataViewsProgress() {
    function advance(toTaskNumber: number) {
        if (toTaskNumber > unlockedUpTo.value) {
            unlockedUpTo.value = toTaskNumber;
        }
    }

    function reset() {
        unlockedUpTo.value = 0;
    }

    return { unlockedUpTo, advance, reset };
}
