# dpuse-app

Conventions shared by all DPUse projects (section banners, sub-groups, comments) are in the parent folder's
[CLAUDE.md](../CLAUDE.md). The rules below are specific to this Vue app.

## Conventions

### Section banners

The canonical list of banner names, in order, is [src/template.ts](src/template.ts). Check it before adding or
reviewing a banner.

See [PaneSplitter.vue](src/components/ui/PaneSplitter.vue) for a worked example of banners and sub-groups.

### Imports

Import app modules through `@/`, never `~/src/` or a long relative path.

### Comments

Comments must be easy to read, short, accurate and clear. They add to the parent folder's rule (say why, not what).

Write for a programmer new to the app. A comment must make the intent clear without the reader knowing the app's
internals: first the situation the code deals with, then what the code does about it and why. Describing the
mechanism alone is not enough.

Clear does not mean long. Use the fewest words that make the intent clear — usually one or two lines, rarely more
than three. Cut anything the code already shows.

- **Name the subject first.** Open with what the comment is about. A verb-first sentence describing the code just
  below is fine ("Reports and shows…"). Never open with "this", "it", "they", "the same", or a fragment whose subject
  is unclear ("Thrown before mount…", "Kept because they…").
- **Explain why, not what.** Delete a comment that only repeats the code ("Create and mount the app.").
- **Stand alone.** A comment must make sense by itself. Never point to "above" or "below"; say the reason again.
- **One term per idea.** Use the same word for the same thing everywhere ("stale deployment", not also "stale
  deploy"). Prefer a code name in quotes ('ErrorBoundary') or plain words over app-specific terms.
- **Name the fault.** Code that exists only for fault injection names its fault: `'?fault=bootstrap' throws here…`.
- **Plain, active sentences, one idea each.** Avoid chains of semicolons and dashes, and casual phrasing.
- **Accurate.** Every claim must match the code. Check claims about browser or library behaviour before writing
  them, and state security trade-offs plainly.
- **Log is not report.** "Logs" means to the console, "reports" means to the DPUse API. Never use one for the other,
  and name both when code does one but not the other.
- **Format.** Put code names in single quotes. Comments on their own lines wrap at column 120; end-of-line comments
  have no limit.

Comment anything a reader would stop and puzzle over, in the template as well as the script: an unusual `v-show`
instead of `v-if`, a non-obvious class binding.

See [main.ts](src/main.ts) for a worked example.

### Vue

These are required, not preferences:

- **Template refs use `useTemplateRef`.** The string key stays the plain template name and the variable takes a suffix:
  `const containerElement = useTemplateRef<HTMLDivElement>('container')` with `ref="container"`. Never
  `ref<HTMLElement | null>(null)`.
- **v-model uses `defineModel`**, in the State section. Never a prop paired with a manual `emit('update:…')`.
- **Every component that renders a `<slot>` declares it with `defineSlots`**, with typed slot props, including the
  default slot and slots with no props. It goes between `defineProps` and `defineEmits`. Mark a slot optional
  (`tags?()`) when callers do not always fill it.

Design rules:

- **Declarative first.** A value derived from other state is a `computed`, not a ref that a watcher sets.
- **Immediate watchers.** A watcher that sets state from a value that can already be set at mount (a URL-restored
  selection, cached data, a first-render prop) takes `{ immediate: true }`, or becomes a `computed`.
- **VueUse wherever it fits.** Do not hand-write listeners, observers, media queries, storage, timers, debounce or
  WebSockets that VueUse covers. Raw `addEventListener` and `setTimeout` stay only where there is no effect scope
  (`main.ts`, `errorTracking.ts`, `router/index.ts`). Use VueUse's own options before adding wrappers, e.g.
  `eventFilter: debounceFilter(ms)` on `useLocalStorage`.
- **Composables and size.** Share reactive logic through composables. Split a component or module when it grows
  unwieldy rather than letting it absorb more.
- **Where composables live.** `src/composables/` holds only generic composables that any part of the app could use
  (`useSplitPanes`). Any other composable lives in the file or folder of what it serves: shared state in `src/state/`
  (`useConfigsReady` in `configs.ts`), a feature in its folder, a component beside it.
- **Repeated markup becomes data.** Three or more template blocks with the same structure that would change together
  become a typed constant list, a `computed` that filters it, and one `v-for` keyed by id. Leave two blocks, or blocks
  alike by coincidence, as they are. Do not add flags to force a block to fit.
- **Copy imported JSON before editing it.** JSON that stands in for a fetch is passed through `structuredClone` before
  it becomes editable state, because the import is one object shared by the whole session.

### Feature folders

- A `_` prefix (`_components/`, `_data/`, `_context.ts`) marks files private to their feature folder.
- Code that only one feature uses lives in that feature: one file as `_name.ts` (`_dataViews.ts`), several in a `_`
  folder. It sits in the lowest folder that holds all its users, and moves to a shared top-level folder (`src/state/`,
  `src/composables/`) once a second feature uses it. A file used from outside its feature, by `App.vue` or the router,
  is not private and takes no `_`. A feature's own components and route views take no `_` either, and shared UI
  building blocks in `src/components/ui/` stay there even when one feature uses them today.
- Variants of a shared panel are thin wrapper files (`PluginToolPanel.vue` around `PluginPanel.vue`), not branches
  inside one generic component.
- Setup master-detail screens use `GridDetailPanel` with `useSetupSelection()`. The selection lives in the route's
  `id` param, and the detail panel is keyed by item id so each selection starts fresh.

### Services

- `src/services/` holds shared plumbing that talks to something outside the app: the engine worker, the meta store,
  the query client, authentication, and the loaders for tools and presenters. It has no business logic and no UI.
- Network calls and module loads live in a service. A component or composable holds only the reactive state around
  them: loading, failure and retry.
- A client that only one feature uses lives in that feature's folder (`features/assistant/chat/useChatSession.ts`).
- `src/observability/` keeps its own folder for telemetry, error reporting and the live monitors.
- The engine runs in a worker and loads only connectors. Tools and presenters need the DOM, so they load on the main
  thread through the dpuse-shared loaders (`loadTool`, `loadPresenter`).
- A module loaded once for the whole app uses `shareLoad`, so callers that arrive together share one load and a failed
  load can be tried again.

### Component names

Name a component for what it **is**, not for an architectural role. Plain nouns by default — `Button`, `Card`,
`Dialog`, `Menu`, `Panel` — and no suffix taxonomy to enforce.

- **Disambiguate only on collision.** Add a suffix or prefix when two things would otherwise share a name, or to
  name a shared primitive several variants build on — `ButtonBase`, `ProductCard` vs. `UserCard`.
- **Compound components for complex interactive widgets** — dialogs, menus, dropdowns, tabs. Split by role within
  the family rather than inventing a global suffix: `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`; `Menu.Root`,
  `Menu.Item`.
- **`Wrapper` is a normal, acceptable name** for a component whose job is to wrap children with cross-cutting
  behaviour (error boundaries, providers, polymorphic root elements). Do not avoid it.
- **`Shell` is reserved for the single top-level app frame** (`AppShell`) — not applied generically to dialogs,
  error displays, or plugin panels.
- Avoid vague verb-suffixes (`Display`, `Manager`, `Handler`) only when a more specific noun is obviously
  available; don't force a rename otherwise.

**Pane, Layout and Panel** each have one meaning in this app:

- **Pane** — a resizable part of the screen: the studio and assistant panes in `App.vue`, the chat and library panes
  in `AssistantLayout`.
- **Layout** — arranges or frames other components, through a `<slot>` or a nested `<RouterView>`, and has no
  content of its own beyond a header. `StudioLayout`, `DataViewsLayout`, `SetupLayout`, `AssistantLayout`.
- **Panel** — content. A page the router shows, a detail area beside a list, an account section. `StudioHomePanel`,
  `SelectItemPanel`, `DataViewPanel`.

To choose: a component that shows its own content is a panel; one that holds other components' content is a layout.
What the router shows at a given level is a **view**, whichever of the two it is.

### Props

Type props inline in `defineProps`, destructured directly — no separate `interface Properties`:

```ts
const { pluginLocalisedConfig, setupOptionLocalisedConfig } = defineProps<{
    pluginLocalisedConfig: LocalisedConfig<PluginConfig>;
    setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig>;
}>();
```

A prop passed through several layers unchanged (a dynamic tab's config, threaded from a list down through a
wrapper into the component that renders it) keeps the same name at every layer, so the binding at each `<Component
:prop="...">` call site never has to translate one name into another.

### Locale strings

Translations live in a `TEXT` table, keyed by what the string is for, never by what it says. It is not called `T`,
because `T` is the generic type parameter throughout the app. `TEXT` is defined in a sibling JSON file named after the
component with a trailing underscore — `PluginPanel.vue` reads from `PluginPanel_.json` — and imported as a named
export:

```ts
import { TEXT } from './PluginPanel_.json';
```

```json
{
    "TEXT": {
        "cancel.label": { "en": "Cancel", "es": "Cancelar" },
        "reporting.pending.text": { "en": "Logging this error…", "es": "Registrando este error…" },
        "step.label": { "en": "Step {number}", "es": "Paso {number}" }
    }
}
```

Import the named export directly (`import { TEXT } from './X_.json'`) — never a default import followed by a `.TEXT`
lookup. Named JSON imports work throughout this codebase without extra config.

The key is `subject.role`, in lowerCamel segments, quoted, alphabetical. Rules:

- The last segment is the **role**, drawn from a closed set: `label` for buttons, menu items, field names and short
  headings; `title` for panel and page headers; `text` for prose; `placeholder`; `aria` for screen-reader-only
  strings; `error` for validation and failure messages.
- Earlier segments are the **subject** — a noun, plus a state where one applies (`reporting.pending`,
  `reporting.failed`). `TEXT` is scoped one-to-one to its component, so the component is already the scope: a key
  needs no prefix naming it.
- `label` and `aria` are alternatives, not a stack. `detail.aria`, never `detail.label.aria`.
- Plurals take `.one` / `.other` before the role: `dataView.one.text`, `dataView.other.text`.
- **The key never carries copy.** No English sentences, no `{number}` placeholders, no punctuation, and no casing
  that means something — placeholders and casing belong to the values. This is the component-name rule one level
  down: name the contract, not the content, because the content is the part that changes. A key reading
  `Select_a_connection_to_configure_the_data_view_before_continuing` outlived the sentence it was named for.

Using the strings:

- **Whole phrases.** A phrase containing a name is one entry with a placeholder (`"{label} Website"`), used as
  `t(TEXT, 'website.label', { label })`. Never place a variable beside a translated word, because word order differs
  between languages.
- **No raw ids on screen.** Turn ids into labels with the dpuse-shared helpers, passing `localeId.value`:
  `constructConnectorCategoryConfig`, `constructConnectorUsageConfig`, `getComponentStatus`. Hide a status tag whose
  label is empty.
- **Translate in a `computed`** that reads `localeId.value`, never in a watcher or on load. Translating re-creates the
  objects, so a watcher on a selection watches its id, not the object.
- **TODOs about JSON contents** go as a trailing comment on the import line, naming the key and languages, because
  JSON cannot hold comments.

### Dialogs and notices

If it asks a question, answer it with buttons. If it only shows something, close it with an ✕.

- **Questions** (confirm a delete, reload now, lose unsaved changes): labelled buttons only, no ✕, because an ✕ does not
  say whether it means yes or no. The safe choice ('Cancel', 'Later') sits to the left of the main action. Escape means
  the safe choice.
- **Content** (an edit dialog, error detail, a panel) and purely informational notices keep the ✕, because closing them
  is not a decision.

The components follow the same split. `DialogBase` holds only the shared behaviour (`showModal`, Escape, focus, one
close path) and none of the look.

- `Dialog` ─ content. Header, ✕, 'full' or 'reserved' sizing, full screen below `md`.
- `ConfirmDialog` ─ questions. `role="alertdialog"`, no ✕, a bottom sheet below `md` (in thumb reach, page still
  visible) and a small centred box from `md` up.

Floating notices sit above the bottom row of controls (the session button and the pill actions), never over it:
`bottom-[calc(var(--safe-bottom-offset)+2.5rem+0.75rem)]`.

### Updates and unsaved work

- **Never swap loaded code in place.** A browser cannot unload a module, and two versions side by side disagree. The
  engine keeps its first worker and its first connectors until the page reloads.
- **Any module change asks for a reload.** A `deploy`, `delete` or `clear` for the engine, a connector, presenter, tool
  or cookbook, or a changed list after a reconnect, sets `moduleUpdateIsAvailable`. The notice offers Later and Reload,
  and the user decides. Only a new app version also reloads by itself, on the next screen change.
- **The notice's wording comes from what is pending**, not from what arrived last: app, modules, or both.
- **Later hides it for an hour**, or until the next screen change or a newer update, whichever comes first.
- **Screens report unsaved work** with `useUnsavedWork(() => …)`. A reload or leaving the page then warns, and the
  notice's Reload asks first in the app's own `ConfirmDialog`.

### Accessibility

- An icon-only button has an `:aria-label` from `TEXT` (role `aria`). A button repeated on every row includes the
  row's name: "Edit {label}".
- Never nest interactive elements inside a button, link or heading. An expandable row is a heading holding a text
  button, with its actions beside the heading
  ([ContextDisclosure.vue](src/features/studio/setup/context/_components/ContextDisclosure.vue)). A whole clickable card
  uses a stretched overlay with its actions above it, and no heading around the overlay.
- A custom widget implements the whole WAI-ARIA Authoring Practices pattern: roles, states, relationships and
  keyboard support. `ContextEntityList.vue` is the worked example for tabs.

### Errors

Error locators follow `dpuse-app.<fileName>[.<functionName>]`, e.g. `dpuse-app.faultInjection.throwOnFault`. A file
named `index` uses its parent folder's name: `dpuse-app.router`.

### Pitfalls

- `.dpuse-prose` rules sit outside any `@layer`, so they beat Tailwind utilities. Use the `!` form (`m-0!`) or style a
  wrapper element.
- An absolutely positioned element, including `sr-only` text, inside a horizontal scroller needs a positioned ancestor
  inside the scroller. Otherwise iOS Safari scrolls the whole page sideways, and no emulator shows it.

### Template comments

A template comment that labels a block names it, then explains it after `─`: `<!-- Pane Splitter ─ Only when both
panes are visible. -->`. A label with nothing to explain is just the name: `<!-- Header -->`.

A template comment may sit above a component's root element. It does not make the component multi-root: in
development Vue skips comments when it looks for the single root to pass attributes to, and production builds strip
comments altogether, so attribute fallthrough still works (verified on Vue 3.5). What does break fallthrough is a
second element or text node at the root.

A root comment does break `<Transition mode="out-in">` in development. When a component with a comment beside its root
leaves the transition, Vue never reports it as gone, so the next view never appears (verified on Vue 3.5;
production is unaffected because the comments are stripped). Any component shown through `RouterViewTransition` must
therefore have no comment at its template root. Until this is revisited, those comments go in a `Template Notes` block
at the top of the script instead — see
[SelectConnectionList.vue](src/features/studio/dataViews/selectConnection/SelectConnectionList.vue).
