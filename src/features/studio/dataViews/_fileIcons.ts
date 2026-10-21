// ── External Dependencies & Registrations
import type { Component } from 'vue';
import { FileArchiveIcon, FileAudioIcon, FileIcon, FileImageIcon, FileJsonIcon, FileSpreadsheetIcon, FileTextIcon, FileVideoIcon } from '@lucide/vue';
import {
    IconFileTypeBmp,
    IconFileTypeCsv,
    IconFileTypeDoc,
    IconFileTypeDocx,
    IconFileTypeHtml,
    IconFileTypeJpg,
    IconFileTypePdf,
    IconFileTypePng,
    IconFileTypePpt,
    IconFileTypeSql,
    IconFileTypeSvg,
    IconFileTypeTxt,
    IconFileTypeXls,
    IconFileTypeXml,
    IconFileTypeZip
} from '@tabler/icons-vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── File Icons ─ Tabler draws the format's name on the page, so it is used where it has the format. Lucide, the app's
// own icon set, covers the rest by kind of file. Each icon is imported by name so the build keeps only these.
const FILE_ICONS_BY_EXTENSION = new Map<string, Component>([
    ['7z', FileArchiveIcon],
    ['aac', FileAudioIcon],
    ['avi', FileVideoIcon],
    ['bmp', IconFileTypeBmp],
    ['bz2', FileArchiveIcon],
    ['csv', IconFileTypeCsv],
    ['doc', IconFileTypeDoc],
    ['docx', IconFileTypeDocx],
    ['flac', FileAudioIcon],
    ['gif', FileImageIcon],
    ['gz', FileArchiveIcon],
    ['heic', FileImageIcon],
    ['htm', IconFileTypeHtml],
    ['html', IconFileTypeHtml],
    ['jpeg', IconFileTypeJpg],
    ['jpg', IconFileTypeJpg],
    ['json', FileJsonIcon],
    ['m4a', FileAudioIcon],
    ['m4v', FileVideoIcon],
    ['md', FileTextIcon],
    ['mkv', FileVideoIcon],
    ['mov', FileVideoIcon],
    ['mp3', FileAudioIcon],
    ['mp4', FileVideoIcon],
    ['ods', FileSpreadsheetIcon],
    ['ogg', FileAudioIcon],
    ['pdf', IconFileTypePdf],
    ['png', IconFileTypePng],
    ['ppt', IconFileTypePpt],
    ['pptx', IconFileTypePpt],
    ['rar', FileArchiveIcon],
    ['sql', IconFileTypeSql],
    ['svg', IconFileTypeSvg],
    ['tab', FileSpreadsheetIcon],
    ['tar', FileArchiveIcon],
    ['tgz', FileArchiveIcon],
    ['tif', FileImageIcon],
    ['tiff', FileImageIcon],
    ['tsv', FileSpreadsheetIcon],
    ['txt', IconFileTypeTxt],
    ['wav', FileAudioIcon],
    ['webm', FileVideoIcon],
    ['webp', FileImageIcon],
    ['xls', IconFileTypeXls],
    ['xlsm', IconFileTypeXls],
    ['xlsx', IconFileTypeXls],
    ['xml', IconFileTypeXml],
    ['xz', FileArchiveIcon],
    ['zip', IconFileTypeZip]
]);

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function lookupFileIcon(extension?: string): Component {
    return (extension == null ? undefined : FILE_ICONS_BY_EXTENSION.get(extension.toLowerCase())) ?? FileIcon;
}
