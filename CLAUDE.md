# dpuse-app

Conventions shared by all DPUse projects (section banners, sub-groups, comments) are in the parent folder's
[CLAUDE.md](../CLAUDE.md). The rules below are specific to this Vue app.

## Conventions

### Section banners

Common banners, in order: `External Dependencies & Registrations`, `Constants`, `State`, `Derived State`, `Side Effects`,
`Event Handlers`, `Helpers`.

See [PaneSplitter.vue](src/components/ui/PaneSplitter.vue) for a worked example of banners and sub-groups.

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
- **Format.** Put code names in single quotes. Wrap at column 120.

See [main.ts](src/main.ts) for a worked example.

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

### Template comments

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
