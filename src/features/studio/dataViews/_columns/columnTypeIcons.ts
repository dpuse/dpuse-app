// ── External Dependencies & Registrations
import type { Component } from 'vue';
import {
    BinaryIcon,
    BookOpenIcon,
    BracesIcon,
    CalendarClockIcon,
    CalendarDaysIcon,
    CalendarIcon,
    CircleQuestionMarkIcon,
    ClockIcon,
    CoinsIcon,
    CreditCardIcon,
    DecimalsArrowRightIcon,
    EthernetPortIcon,
    FingerprintIcon,
    FlagIcon,
    HashIcon,
    LandmarkIcon,
    LanguagesIcon,
    LinkIcon,
    MailIcon,
    NetworkIcon,
    PaletteIcon,
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
    countryCode: FlagIcon,
    currencyCode: CoinsIcon,
    date: CalendarIcon,
    dateTime: CalendarClockIcon,
    decimal: DecimalsArrowRightIcon,
    email: MailIcon,
    hexColor: PaletteIcon,
    iban: LandmarkIcon,
    integer: Tally5Icon,
    ipRange: NetworkIcon,
    ipv4: RouterIcon,
    ipv6: RouterIcon,
    isbn: BookOpenIcon,
    json: BracesIcon,
    languageCode: LanguagesIcon,
    macAddress: EthernetPortIcon,
    paymentCard: CreditCardIcon,
    plain: TextAlignStartIcon,
    time: ClockIcon,
    ulid: FingerprintIcon,
    url: LinkIcon,
    uuid: FingerprintIcon
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The most specific icon for a column, for where one icon stands for its whole type.
export function getColumnTypeIcon({ dataSubtypeId, dataTypeId }: Pick<ObjectColumnConfig, 'dataSubtypeId' | 'dataTypeId'>): Component {
    return dataSubtypeId == null ? DATA_TYPE_ICONS[dataTypeId] : DATA_SUBTYPE_ICONS[dataSubtypeId];
}
