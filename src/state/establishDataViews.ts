// External Dependencies
import { shallowRef } from 'vue';

// DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ConnectionConfig, ConnectionNodeConfig } from '@dpuse/dpuse-shared/component/connection';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const activeConnectionConfig = shallowRef<LocalisedConfig<ConnectionConfig> | undefined>();
export const activeConnectionNodeConfig = shallowRef<ConnectionNodeConfig | undefined>();
export const activeDataViewConfig = shallowRef<DataViewConfig | undefined>();
