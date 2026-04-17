// External Dependencies
import { shallowRef } from 'vue';

// DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connector';
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionNodeConfig = shallowRef<ConnectionNodeConfig | undefined>();
export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();
