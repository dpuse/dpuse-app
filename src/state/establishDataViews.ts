// External Dependencies
import { shallowRef } from 'vue';

// DPUse Framework
import type { ConnectionLocalisedConfig } from '@dpuse/dpuse-shared/component/connector';
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionConfig = shallowRef<ConnectionLocalisedConfig | undefined>();
export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();
