// External Dependencies
import { shallowRef } from 'vue';

// DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { ConnectionLocalisedConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionConfig = shallowRef<ConnectionLocalisedConfig | undefined>();
export const activeConnectionNodeConfig = shallowRef<ConnectionNodeConfig | undefined>();
export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();
