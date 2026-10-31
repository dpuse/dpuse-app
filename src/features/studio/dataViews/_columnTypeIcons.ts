// ── External Dependencies & Registrations
import type { Component } from 'vue';
import {
    BinaryIcon,
    CalendarClockIcon,
    CalendarDaysIcon,
    CalendarIcon,
    CircleQuestionMarkIcon,
    ClockIcon,
    DecimalsArrowRightIcon,
    HashIcon,
    KeyRoundIcon,
    LinkIcon,
    MailIcon,
    RouterIcon,
    Tally5Icon,
    TextAlignStartIcon,
    ToggleLeftIcon,
    TypeIcon
} from '@lucide/vue';

// ── DPUse Framework
import type { DataSubtypeId, DataTypeId, ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const DATA_TYPE_ICONS: Record<DataTypeId, Component> = {
    boolean: ToggleLeftIcon,
    numeric: HashIcon,
    string: TypeIcon,
    temporal: CalendarDaysIcon,
    unknown: CircleQuestionMarkIcon
};

// Subtypes of one kind share an icon, and their labels tell them apart.
export const DATA_SUBTYPE_ICONS: Record<DataSubtypeId, Component> = {
    bigint: BinaryIcon,
    date: CalendarIcon,
    dateTime: CalendarClockIcon,
    decimal: DecimalsArrowRightIcon,
    email: MailIcon,
    integer: Tally5Icon,
    ipv4: RouterIcon,
    ipv6: RouterIcon,
    plain: TextAlignStartIcon,
    time: ClockIcon,
    ulid: KeyRoundIcon,
    url: LinkIcon,
    uuid: KeyRoundIcon
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The most specific icon for a column, for where one icon stands for its whole type.
export function getColumnTypeIcon({ dataSubtypeId, dataTypeId }: Pick<ObjectColumnConfig, 'dataSubtypeId' | 'dataTypeId'>): Component {
    return dataSubtypeId == null ? DATA_TYPE_ICONS[dataTypeId] : DATA_SUBTYPE_ICONS[dataSubtypeId];
}
