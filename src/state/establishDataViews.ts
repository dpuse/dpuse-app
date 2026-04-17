// External Dependencies
import { shallowRef } from 'vue';

// DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();
