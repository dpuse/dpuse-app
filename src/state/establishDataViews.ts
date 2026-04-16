// External Dependencies
import { shallowRef } from 'vue';

// DPUse Framework
import type { DataViewLocalisedConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { ConnectionLocalisedConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connector';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionLocalisedConfig = shallowRef<ConnectionLocalisedConfig | undefined>();
export const activeDataViewLocalisedConfig = shallowRef<DataViewLocalisedConfig | undefined>();
export const activeNodeConfig = shallowRef<ConnectionNodeConfig | undefined>();
