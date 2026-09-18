# Lines of Code & Build Size

Baseline for `src/`, taken on 2026-09-18 at commit `032efb0c`, before adopting VueUse. Re-run after each migration step to measure the saving.

- **Total** — every line in the file.
- **Comments** — lines that hold only a comment. A comment trailing code counts as code.
- **Code** — total minus blank and comment lines.
- **Script / Template / Style** — code lines inside each block of a `.vue` file.

## Summary

| Type    |   Files |      Total |  Comments |       Code |    Script |  Template |   Style |
| :------ | ------: | ---------: | --------: | ---------: | --------: | --------: | ------: |
| .vue    |     124 |     10,860 |     1,789 |      7,421 |     3,910 |     2,533 |     480 |
| .ts     |      62 |      6,031 |     1,225 |      3,910 |         – |         – |       – |
| .json   |      23 |      1,781 |         – |      1,781 |         – |         – |       – |
| .css    |       1 |        344 |        21 |        291 |         – |         – |       – |
| **All** | **210** | **19,016** | **3,035** | **13,403** | **3,910** | **2,533** | **480** |

## VueUse migration targets

| Step               | File                                   | Total | Comments | Code |
| :----------------- | :------------------------------------- | ----: | -------: | ---: |
| 2 · useElementSize | `composables/useElementIsWide.ts`      |    60 |       16 |   33 |
| 3 · useMediaQuery  | `state/appLayout.ts`                   |   104 |       27 |   53 |
| 4 · onClickOutside | `features/assistant/chat/ChatMenu.vue` |    90 |       21 |   53 |
| 4 · onClickOutside | `components/ui/PaneSplitter.vue`       |   247 |       44 |  172 |

## By folder

| Folder                                                | Files | Comments |  Code |
| :---------------------------------------------------- | ----: | -------: | ----: |
| `src`                                                 |     3 |      142 |   252 |
| `__tests__`                                           |    14 |      108 | 1,018 |
| `assets`                                              |     1 |       21 |   291 |
| `components/branding`                                 |     6 |        5 |   109 |
| `components/icons`                                    |     4 |        3 |    40 |
| `components/ui`                                       |    10 |       82 |   395 |
| `components/ui/action`                                |     8 |       38 |   172 |
| `components/ui/config`                                |     3 |       32 |   123 |
| `components/ui/dialog`                                |     2 |       36 |   102 |
| `components/ui/error`                                 |     4 |      212 |   359 |
| `components/ui/grid`                                  |     3 |       51 |   197 |
| `components/ui/placeholder`                           |     3 |       11 |    53 |
| `components/ui/scroll`                                |     4 |       69 |   514 |
| `components/ui/table`                                 |     5 |       67 |   372 |
| `components/ui/text`                                  |     4 |       51 |   291 |
| `composables`                                         |     4 |      167 |   265 |
| `features/assistant/_components`                      |     5 |       83 |   259 |
| `features/assistant/chat`                             |     7 |      164 |   444 |
| `features/assistant/chat/tools`                       |     8 |       30 |   239 |
| `features/assistant/library`                          |     4 |      109 |   251 |
| `features/session`                                    |     2 |       90 |   354 |
| `features/session/accountPanel`                       |    11 |       17 |   191 |
| `features/session/authPanel`                          |     3 |       35 |   296 |
| `features/studio`                                     |     2 |        9 |    73 |
| `features/studio/_components`                         |     6 |       22 |   103 |
| `features/studio/connectionPanel`                     |     5 |       56 |   196 |
| `features/studio/dataApps`                            |     1 |        5 |    23 |
| `features/studio/dataViews`                           |     3 |       52 |   245 |
| `features/studio/dataViews/auditContent`              |     1 |       12 |    12 |
| `features/studio/dataViews/exploreData`               |     3 |       87 |   638 |
| `features/studio/dataViews/exploreData/transformData` |     1 |        4 |    70 |
| `features/studio/dataViews/selectConnection`          |     2 |       90 |   208 |
| `features/studio/dataViews/selectItem`                |     2 |       41 |   278 |
| `features/studio/eventQueries`                        |     1 |       10 |    76 |
| `features/studio/options`                             |     3 |       61 |   187 |
| `features/studio/presentations`                       |     1 |       19 |   126 |
| `features/studio/setup`                               |     6 |       34 |   131 |
| `features/studio/setup/_data`                         |     1 |        – |    80 |
| `features/studio/setup/context`                       |    15 |       80 |   549 |
| `features/studio/setup/context/_components`           |     6 |       30 |   139 |
| `features/studio/setup/context/_data`                 |     2 |        – | 1,527 |
| `features/studio/setup/plugins`                       |     5 |       31 |    94 |
| `features/studio/setup/plugins/_components`           |     4 |       25 |   151 |
| `observability`                                       |     6 |      165 |   687 |
| `router`                                              |     1 |       52 |   144 |
| `services`                                            |     6 |      229 |   230 |
| `state`                                               |     8 |      243 |   765 |
| `utilities`                                           |     1 |       55 |    84 |

## By file

### src

| File        | Total | Comments | Code | Script | Template | Style |
| :---------- | ----: | -------: | ---: | -----: | -------: | ----: |
| App.vue     |   302 |       63 |  191 |    126 |       61 |     – |
| main.ts     |   125 |       52 |   59 |      – |        – |     – |
| template.ts |    56 |       27 |    2 |      – |        – |     – |

### **tests**

| File                    | Total | Comments | Code | Script | Template | Style |
| :---------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| App.spec.ts             |    16 |        – |   14 |      – |        – |     – |
| assistantChat.spec.ts   |    37 |        3 |   29 |      – |        – |     – |
| asyncPanel.spec.ts      |   141 |       11 |  107 |      – |        – |     – |
| chatComposer.spec.ts    |   285 |       30 |  216 |      – |        – |     – |
| chatModelSwitch.spec.ts |    75 |        4 |   59 |      – |        – |     – |
| Dialog.spec.ts          |    33 |        2 |   22 |      – |        – |     – |
| dialogs.spec.ts         |    72 |        6 |   46 |      – |        – |     – |
| elementIsWide.spec.ts   |   134 |        5 |  106 |      – |        – |     – |
| ErrorBoundary.spec.ts   |    83 |        3 |   64 |      – |        – |     – |
| errorReporting.spec.ts  |   137 |       11 |  103 |      – |        – |     – |
| errors.spec.ts          |   170 |        7 |  128 |      – |        – |     – |
| scratchToggle.spec.ts   |    50 |        7 |   33 |      – |        – |     – |
| setup.ts                |    66 |       16 |   46 |      – |        – |     – |
| splitPanes.spec.ts      |    63 |        3 |   45 |      – |        – |     – |

### assets

| File     | Total | Comments | Code | Script | Template | Style |
| :------- | ----: | -------: | ---: | -----: | -------: | ----: |
| main.css |   344 |       21 |  291 |      – |        – |     – |

### components/branding

| File              | Total | Comments | Code | Script | Template | Style |
| :---------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| AppleLogo.vue     |    11 |        1 |    9 |      – |        5 |     – |
| AssistantLogo.vue |    15 |        1 |   13 |      – |        9 |     – |
| DPUseLogo.vue     |    21 |        – |   21 |      – |       19 |     – |
| GitHubLogo.vue    |    20 |        1 |   18 |      – |       14 |     – |
| GoogleLogo.vue    |    39 |        1 |   37 |      – |       33 |     – |
| MicrosoftLogo.vue |    13 |        1 |   11 |      – |        7 |     – |

### components/icons

| File                             | Total | Comments | Code | Script | Template | Style |
| :------------------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| ContextIconPENDING.vue           |     7 |        – |    7 |      – |        5 |     – |
| HomeIconPENDING.vue              |    13 |        1 |   11 |      – |        7 |     – |
| MousePointerClickRotatedIcon.vue |    15 |        1 |   13 |      – |        9 |     – |
| StudioHomeIcon.vue               |    11 |        1 |    9 |      – |        5 |     – |

### components/ui

| File                 | Total | Comments | Code | Script | Template | Style |
| :------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| Breadcrumbs.vue      |    61 |        9 |   43 |     15 |       24 |     – |
| BusyBar.vue          |    22 |        – |   19 |      4 |        – |    11 |
| ListFieldPENDING.vue |    31 |        6 |   17 |      5 |        8 |     – |
| PaneSplitter_.json   |     7 |        – |    7 |      – |        – |     – |
| PaneSplitter.vue     |   247 |       44 |  172 |    113 |       55 |     – |
| Pill.vue             |    41 |        4 |   28 |     14 |       10 |     – |
| Separator.vue        |    18 |        1 |   14 |      4 |        6 |     – |
| TabBar.vue           |    36 |        4 |   26 |      6 |       16 |     – |
| Tag.vue              |    33 |        3 |   25 |     18 |        3 |     – |
| TaskBar.vue          |    63 |       11 |   44 |     14 |       26 |     – |

### components/ui/action

| File                | Total | Comments | Code | Script | Template | Style |
| :------------------ | ----: | -------: | ---: | -----: | -------: | ----: |
| action.ts           |    31 |       11 |   15 |      – |        – |     – |
| ActionWrapper.vue   |    27 |        3 |   20 |      8 |        8 |     – |
| CloseButton.vue     |    20 |        3 |   13 |      6 |        3 |     – |
| IconButton.vue      |    40 |        5 |   28 |     20 |        4 |     – |
| ItemButton.vue      |    44 |        4 |   34 |     27 |        3 |     – |
| PillButton.vue      |    28 |        3 |   21 |      8 |        9 |     – |
| RectangleButton.vue |    26 |        4 |   17 |     10 |        3 |     – |
| ToggleButton.vue    |    36 |        5 |   24 |     11 |        9 |     – |

### components/ui/config

| File           | Total | Comments | Code | Script | Template | Style |
| :------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| configCard.ts  |    17 |        5 |    7 |      – |        – |     – |
| ConfigCard.vue |   134 |       19 |  100 |     26 |       70 |     – |
| ConfigIcon.vue |    26 |        8 |   16 |      5 |        7 |     – |

### components/ui/dialog

| File             | Total | Comments | Code | Script | Template | Style |
| :--------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| Dialog.vue       |   154 |       35 |   96 |     31 |       18 |    41 |
| DialogHeader.vue |     9 |        1 |    6 |      1 |        1 |     – |

### components/ui/error

| File                  | Total | Comments | Code | Script | Template | Style |
| :-------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| ErrorBody.vue         |   165 |       54 |   89 |     41 |       44 |     – |
| ErrorBoundary.vue     |    71 |       21 |   37 |     29 |        4 |     – |
| ErrorNotice.vue       |   363 |      110 |  197 |     58 |       28 |   105 |
| LoadFailureNotice.vue |    76 |       27 |   36 |     23 |        9 |     – |

### components/ui/grid

| File                | Total | Comments | Code | Script | Template | Style |
| :------------------ | ----: | -------: | ---: | -----: | -------: | ----: |
| Grid.vue            |   158 |       22 |  115 |     77 |       34 |     – |
| gridDetail.ts       |    19 |       12 |    3 |      – |        – |     – |
| GridDetailPanel.vue |   113 |       17 |   79 |     37 |       38 |     – |

### components/ui/placeholder

| File                        | Total | Comments | Code | Script | Template | Style |
| :-------------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| ComponentLoadingSpinner.vue |    23 |        7 |   12 |      5 |        3 |     – |
| EmptyPlaceholder.vue        |    33 |        2 |   28 |      2 |       22 |     – |
| SelectPlaceholder.vue       |    18 |        2 |   13 |      5 |        4 |     – |

### components/ui/scroll

| File            | Total | Comments | Code | Script | Template | Style |
| :-------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| ScrollArea.vue  |   131 |       15 |   93 |     35 |       21 |    31 |
| ScrollRow_.json |     6 |        – |    6 |      – |        – |     – |
| ScrollRow.vue   |   204 |       37 |  139 |    106 |       29 |     – |
| ScrollThumb.vue |   352 |       17 |  276 |    180 |       26 |    62 |

### components/ui/table

| File                  | Total | Comments | Code | Script | Template | Style |
| :-------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| Table.vue             |   311 |       47 |  224 |    105 |      105 |     8 |
| TableColumnPicker.vue |    63 |        6 |   45 |     18 |       23 |     – |
| tableFeatures.ts      |    14 |        4 |    8 |      – |        – |     – |
| TableHeaderCell.vue   |   110 |        9 |   86 |     21 |       61 |     – |
| TableRowCell.vue      |    12 |        1 |    9 |      1 |        4 |     – |

### components/ui/text

| File           | Total | Comments | Code | Script | Template | Style |
| :------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| TextArea.vue   |    66 |        8 |   46 |     22 |       20 |     – |
| TextEditor.vue |   235 |       30 |  171 |    133 |       34 |     – |
| TextInput.vue  |    90 |       11 |   60 |     38 |       18 |     – |
| TextViewer.vue |    19 |        2 |   14 |      5 |        5 |     – |

### composables

| File                | Total | Comments | Code | Script | Template | Style |
| :------------------ | ----: | -------: | ---: | -----: | -------: | ----: |
| useBreadcrumbs.ts   |    40 |        3 |   28 |      – |        – |     – |
| useDataWindow.ts    |   331 |      129 |  170 |      – |        – |     – |
| useElementIsWide.ts |    60 |       16 |   33 |      – |        – |     – |
| useSplitPanes.ts    |    65 |       19 |   34 |      – |        – |     – |

### features/assistant/_components

| File                    | Total | Comments | Code | Script | Template | Style |
| :---------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| AssistantHeader.vue     |    42 |        7 |   29 |      3 |       22 |     – |
| AssistantLayout.vue     |   212 |       44 |  127 |     86 |       37 |     – |
| AssistantModelMenu.vue  |    79 |       12 |   52 |     23 |       25 |     – |
| AssistantPaneToggle.vue |    20 |        3 |   13 |      6 |        3 |     – |
| PendingLabel.vue        |    64 |       17 |   38 |      5 |       10 |    17 |

### features/assistant/chat

| File               | Total | Comments | Code | Script | Template | Style |
| :----------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| assistantChat.ts   |    35 |        5 |   25 |      – |        – |     – |
| ChatEmptyState.vue |    42 |       11 |   25 |      3 |       18 |     – |
| ChatInput.vue      |   158 |       47 |   83 |     47 |       32 |     – |
| ChatMenu.vue       |    90 |       21 |   53 |     32 |       17 |     – |
| ChatPanel.vue      |   275 |       47 |  190 |     73 |       63 |    48 |
| ChatPaneToggle.vue |    28 |       13 |   10 |      3 |        3 |     – |
| modelConfigs.ts    |    81 |       20 |   58 |      – |        – |     – |

### features/assistant/chat/tools

| File                    | Total | Comments | Code | Script | Template | Style |
| :---------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| getConnection.ts        |    18 |        2 |   14 |      – |        – |     – |
| getConnector.ts         |    35 |        3 |   27 |      – |        – |     – |
| getLocalTime.ts         |     9 |        1 |    7 |      – |        – |     – |
| listConnections.ts      |    15 |        2 |   11 |      – |        – |     – |
| listConnectorItems.ts   |    44 |        6 |   32 |      – |        – |     – |
| listConnectors.ts       |    21 |        3 |   14 |      – |        – |     – |
| previewConnectorItem.ts |    48 |        6 |   33 |      – |        – |     – |
| tanstackClientTools.ts  |   118 |        7 |  101 |      – |        – |     – |

### features/assistant/library

| File                     | Total | Comments | Code | Script | Template | Style |
| :----------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| LibraryDocumentPanel.vue |    82 |       23 |   45 |      9 |       32 |     – |
| LibraryPanel.vue         |   251 |       60 |  154 |     93 |       57 |     – |
| LibraryPaneToggle.vue    |    34 |       13 |   16 |      3 |        9 |     – |
| LibrarySearchInput.vue   |    59 |       13 |   36 |     10 |       22 |     – |

### features/session

| File              | Total | Comments | Code | Script | Template | Style |
| :---------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| SessionButton.vue |   201 |       37 |  139 |     38 |       30 |    65 |
| SessionMenu.vue   |   312 |       53 |  215 |     97 |       91 |    21 |

### features/session/accountPanel

| File                             | Total | Comments | Code | Script | Template | Style |
| :------------------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| DeleteAccountPanel.vue           |     5 |        – |    4 |      2 |        – |     – |
| GenerateTokenPanel.vue           |     5 |        – |    4 |      2 |        – |     – |
| ManageAccessPanel.vue            |     5 |        – |    4 |      2 |        – |     – |
| ManageDataServiceTokensPanel.vue |     5 |        – |    4 |      2 |        – |     – |
| ManagePersonalDetailsPanel.vue   |    36 |        – |   35 |     33 |        – |     – |
| ManagePreferencesPanel.vue       |    14 |        2 |   10 |      2 |        4 |     – |
| ManageSessionsPanel.vue          |     5 |        – |    4 |      2 |        – |     – |
| ManageSubscriptionPanel.vue      |     5 |        – |    4 |      2 |        – |     – |
| ReviewActivityPanel.vue          |     5 |        – |    4 |      2 |        – |     – |
| SessionAccountPanel_.json        |    10 |        – |   10 |      – |        – |     – |
| SessionAccountPanel.vue          |   143 |       15 |  108 |     72 |       32 |     – |

### features/session/authPanel

| File                 | Total | Comments | Code | Script | Template | Style |
| :------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| LoginForm.vue        |    73 |        8 |   50 |     29 |       17 |     – |
| PasswordForm.vue     |    73 |        9 |   46 |     23 |       19 |     – |
| SessionAuthPanel.vue |   247 |       18 |  200 |    161 |       21 |    12 |

### features/studio

| File                  | Total | Comments | Code | Script | Template | Style |
| :-------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| StudioHomePanel_.json |    21 |        – |   21 |      – |        – |     – |
| StudioHomePanel.vue   |    70 |        9 |   52 |     19 |       29 |     – |

### features/studio/_components

| File                    | Total | Comments | Code | Script | Template | Style |
| :---------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| StudioDetailPanel.vue   |     5 |        – |    5 |      – |        3 |     – |
| StudioDocumentPanel.vue |    69 |       12 |   44 |     12 |       22 |     4 |
| StudioHeader.vue        |    44 |        7 |   31 |      4 |       23 |     – |
| StudioLayout.vue        |     5 |        – |    5 |      – |        3 |     – |
| StudioListPanel.vue     |     5 |        – |    5 |      – |        3 |     – |
| StudioPaneToggle.vue    |    20 |        3 |   13 |      6 |        3 |     – |

### features/studio/connectionPanel

| File                      | Total | Comments | Code | Script | Template | Style |
| :------------------------ | ----: | -------: | ---: | -----: | -------: | ----: |
| AddConnectionForm_.json   |    24 |        – |   24 |      – |        – |     – |
| AddConnectionForm.vue     |   113 |       42 |   54 |     18 |       32 |     – |
| ConnectionPanel_.json     |    10 |        – |   10 |      – |        – |     – |
| ConnectionPanel.vue       |   141 |       14 |  104 |     81 |       19 |     – |
| ManageConnectionPanel.vue |     5 |        – |    4 |      2 |        – |     – |

### features/studio/dataApps

| File               | Total | Comments | Code | Script | Template | Style |
| :----------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| DataAppsLayout.vue |    37 |        5 |   23 |     10 |        9 |     – |

### features/studio/dataViews

| File                | Total | Comments | Code | Script | Template | Style |
| :------------------ | ----: | -------: | ---: | -----: | -------: | ----: |
| DataViewList.vue    |   206 |       28 |  150 |    105 |       41 |     – |
| DataViewPanel.vue   |    29 |        4 |   20 |      7 |        9 |     – |
| DataViewsLayout.vue |   117 |       20 |   75 |     62 |        9 |     – |

### features/studio/dataViews/auditContent

| File                  | Total | Comments | Code | Script | Template | Style |
| :-------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| AuditContentPanel.vue |    34 |       12 |   12 |      4 |        4 |     – |

### features/studio/dataViews/exploreData

| File                     | Total | Comments | Code | Script | Template | Style |
| :----------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| ExploreDataPanel.vue     |    73 |       16 |   46 |      8 |       34 |     – |
| InvestigateDataPanel.vue |    45 |        4 |   34 |     29 |        1 |     – |
| TransformDataPanel.vue   |   685 |       67 |  558 |    173 |      353 |    26 |

### features/studio/dataViews/exploreData/transformData

| File                   | Total | Comments | Code | Script | Template | Style |
| :--------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| useSelectColumnSort.ts |    92 |        4 |   70 |      – |        – |     – |

### features/studio/dataViews/selectConnection

| File                      | Total | Comments | Code | Script | Template | Style |
| :------------------------ | ----: | -------: | ---: | -----: | -------: | ----: |
| SelectConnectionList.vue  |   190 |       23 |  138 |    112 |       22 |     – |
| SelectConnectionPanel.vue |   158 |       67 |   70 |     54 |       12 |     – |

### features/studio/dataViews/selectItem

| File                 | Total | Comments | Code | Script | Template | Style |
| :------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| SelectItemPanel.json |     9 |        – |    9 |      – |        – |     – |
| SelectItemPanel.vue  |   368 |       41 |  269 |    231 |       34 |     – |

### features/studio/eventQueries

| File                   | Total | Comments | Code | Script | Template | Style |
| :--------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| EventQueriesLayout.vue |   109 |       10 |   76 |     63 |        9 |     – |

### features/studio/options

| File                | Total | Comments | Code | Script | Template | Style |
| :------------------ | ----: | -------: | ---: | -----: | -------: | ----: |
| OptionBar.vue       |    94 |       40 |   45 |      4 |        9 |    26 |
| OptionPanel.vue     |   101 |       15 |   65 |     36 |       25 |     – |
| useStudioOptions.ts |    92 |        6 |   77 |      – |        – |     – |

### features/studio/presentations

| File                    | Total | Comments | Code | Script | Template | Style |
| :---------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| PresentationsLayout.vue |   178 |       19 |  126 |     94 |       23 |     3 |

### features/studio/setup

| File                 | Total | Comments | Code | Script | Template | Style |
| :------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| SetupHomePanel.vue   |    30 |        6 |   16 |      7 |        5 |     – |
| SetupLayout_.json    |     6 |        – |    6 |      – |        – |     – |
| SetupLayout.vue      |    76 |       10 |   54 |     32 |       18 |     – |
| useSetupOptions.ts   |    22 |        6 |    9 |      – |        – |     – |
| useSetupRoute.ts     |    31 |        6 |   18 |      – |        – |     – |
| useSetupSelection.ts |    43 |        6 |   28 |      – |        – |     – |

### features/studio/setup/_data

| File                    | Total | Comments | Code | Script | Template | Style |
| :---------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| setupOptionConfigs.json |    80 |        – |   80 |      – |        – |     – |

### features/studio/setup/context

| File                               | Total | Comments | Code | Script | Template | Style |
| :--------------------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| _context.ts                        |   126 |       12 |   99 |      – |        – |     – |
| ContextDimensionDiagramPanel_.json |     5 |        – |    5 |      – |        – |     – |
| ContextDimensionDiagramPanel.vue   |    47 |        6 |   34 |     29 |        1 |     – |
| ContextDimensionList_.json         |     7 |        – |    7 |      – |        – |     – |
| ContextDimensionList.vue           |    29 |        4 |   19 |      8 |        7 |     – |
| ContextEntityDiagramPanel_.json    |     5 |        – |    5 |      – |        – |     – |
| ContextEntityDiagramPanel.vue      |    63 |        8 |   47 |     42 |        1 |     – |
| ContextEntityList_.json            |    12 |        – |   12 |      – |        – |     – |
| ContextEntityList.vue              |   134 |       14 |   98 |     55 |       39 |     – |
| ContextModelList_.json             |     5 |        – |    5 |      – |        – |     – |
| ContextModelList.vue               |    73 |        8 |   54 |     37 |       13 |     – |
| ContextModelPanel_.json            |     7 |        – |    7 |      – |        – |     – |
| ContextModelPanel.vue              |   200 |       25 |  140 |     97 |       39 |     – |
| ContextSecondaryMeasureList_.json  |     6 |        – |    6 |      – |        – |     – |
| ContextSecondaryMeasureList.vue    |    19 |        3 |   11 |      6 |        1 |     – |

### features/studio/setup/context/_components

| File                          | Total | Comments | Code | Script | Template | Style |
| :---------------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| ContextDescriptorsPanel_.json |     6 |        – |    6 |      – |        – |     – |
| ContextDescriptorsPanel.vue   |    21 |        3 |   14 |      6 |        4 |     – |
| ContextDiagramPanel.vue       |    65 |       11 |   38 |     29 |        5 |     – |
| ContextDisclosure_.json       |     5 |        – |    5 |      – |        – |     – |
| ContextDisclosure.vue         |    59 |        9 |   40 |     11 |       25 |     – |
| ContextDocument.vue           |    56 |        7 |   36 |     13 |       19 |     – |

### features/studio/setup/context/_data

| File               | Total | Comments |  Code | Script | Template | Style |
| :----------------- | ----: | -------: | ----: | -----: | -------: | ----: |
| contextConfig.json |   444 |        – |   444 |      – |        – |     – |
| modelConfigs.json  | 1,083 |        – | 1,083 |      – |        – |     – |

### features/studio/setup/plugins

| File                       | Total | Comments | Code | Script | Template | Style |
| :------------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| PluginConnectorPanel_.json |     6 |        – |    6 |      – |        – |     – |
| PluginConnectorPanel.vue   |    73 |       13 |   46 |     31 |       11 |     – |
| PluginCookbookPanel.vue    |    25 |        6 |   14 |      8 |        2 |     – |
| PluginPresenterPanel.vue   |    25 |        6 |   14 |      8 |        2 |     – |
| PluginToolPanel.vue        |    25 |        6 |   14 |      8 |        2 |     – |

### features/studio/setup/plugins/_components

| File              | Total | Comments | Code | Script | Template | Style |
| :---------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| PluginList_.json  |     8 |        – |    8 |      – |        – |     – |
| PluginList.vue    |    81 |       10 |   55 |     32 |       19 |     – |
| PluginPanel_.json |     9 |        – |    9 |      – |        – |     – |
| PluginPanel.vue   |   112 |       15 |   79 |     39 |       36 |     – |

### observability

| File                   | Total | Comments | Code | Script | Template | Style |
| :--------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| accountMonitor.ts      |   216 |       31 |  156 |      – |        – |     – |
| configMonitor.ts       |   408 |       54 |  312 |      – |        – |     – |
| errorTracking.ts       |   162 |       24 |  118 |      – |        – |     – |
| eventTracking.ts       |    92 |       16 |   60 |      – |        – |     – |
| faultInjection.ts      |    69 |       36 |   23 |      – |        – |     – |
| performanceTracking.ts |    27 |        4 |   18 |      – |        – |     – |

### router

| File     | Total | Comments | Code | Script | Template | Style |
| :------- | ----: | -------: | ---: | -----: | -------: | ----: |
| index.ts |   225 |       52 |  144 |      – |        – |     – |

### services

| File                 | Total | Comments | Code | Script | Template | Style |
| :------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| retrievalReady.ts    |    23 |        9 |   11 |      – |        – |     – |
| useChatSession.ts    |   229 |       74 |  123 |      – |        – |     – |
| useConfigsReady.ts   |    13 |        6 |    5 |      – |        – |     – |
| useDataViewsReady.ts |    14 |        7 |    5 |      – |        – |     – |
| useEngine.ts         |   174 |      112 |   46 |      – |        – |     – |
| useMarkedTool.ts     |    74 |       21 |   40 |      – |        – |     – |

### state

| File                  | Total | Comments | Code | Script | Template | Style |
| :-------------------- | ----: | -------: | ---: | -----: | -------: | ----: |
| activeStudioOption.ts |    12 |        4 |    4 |      – |        – |     – |
| appLayout.ts          |   104 |       27 |   53 |      – |        – |     – |
| assistantLibrary.ts   |    93 |       24 |   53 |      – |        – |     – |
| dataViews.ts          |   260 |       23 |  201 |      – |        – |     – |
| dialogs.ts            |    87 |       25 |   47 |      – |        – |     – |
| errors.ts             |   209 |       83 |   97 |      – |        – |     – |
| locale.ts             |    44 |        5 |   30 |      – |        – |     – |
| session.ts            |   379 |       52 |  280 |      – |        – |     – |

### utilities

| File     | Total | Comments | Code | Script | Template | Style |
| :------- | ----: | -------: | ---: | -----: | -------: | ----: |
| index.ts |   167 |       55 |   84 |      – |        – |     – |

## Largest 20 files

| File                                                           |  Code |
| :------------------------------------------------------------- | ----: |
| `features/studio/setup/context/_data/modelConfigs.json`        | 1,083 |
| `features/studio/dataViews/exploreData/TransformDataPanel.vue` |   558 |
| `features/studio/setup/context/_data/contextConfig.json`       |   444 |
| `observability/configMonitor.ts`                               |   312 |
| `assets/main.css`                                              |   291 |
| `state/session.ts`                                             |   280 |
| `components/ui/scroll/ScrollThumb.vue`                         |   276 |
| `features/studio/dataViews/selectItem/SelectItemPanel.vue`     |   269 |
| `components/ui/table/Table.vue`                                |   224 |
| `__tests__/chatComposer.spec.ts`                               |   216 |
| `features/session/SessionMenu.vue`                             |   215 |
| `state/dataViews.ts`                                           |   201 |
| `features/session/authPanel/SessionAuthPanel.vue`              |   200 |
| `components/ui/error/ErrorNotice.vue`                          |   197 |
| `App.vue`                                                      |   191 |
| `features/assistant/chat/ChatPanel.vue`                        |   190 |
| `components/ui/PaneSplitter.vue`                               |   172 |
| `components/ui/text/TextEditor.vue`                            |   171 |
| `composables/useDataWindow.ts`                                 |   170 |
| `observability/accountMonitor.ts`                              |   156 |

## Build size

Production `vite build` of the same commit. Sizes are in KB (1,024 bytes); gzip is level 9, measured per file. Source maps are excluded.

| Group                                                            |   Files | Default (KB) |  Gzip (KB) |
| :--------------------------------------------------------------- | ------: | -----------: | ---------: |
| Initial load — `index.html` plus the scripts and styles it loads |      16 |       246.40 |      78.56 |
| Lazy-loaded JavaScript                                           |      79 |       634.68 |     205.47 |
| Lazy-loaded CSS                                                  |      10 |         5.42 |       2.09 |
| Fonts                                                            |       7 |       213.39 |     213.54 |
| Other static files — icons, images, manifest                     |      19 |       117.97 |      42.17 |
| **Client total**                                                 | **131** |  **1217.86** | **541.83** |
| Cloudflare Worker — `dpuse_app/index.js`, server side            |       1 |         0.30 |       0.22 |

### Chunks

Every JavaScript and CSS file, largest first. A chunk is named after its first module, so it may also hold library code; ● marks the initial load.

| Chunk                                    | Default (KB) | Gzip (KB) |
| :--------------------------------------- | -----------: | --------: |
| `ChatPanel.js`                           |       160.17 |     42.85 |
| ● `index.css`                            |        78.81 |     14.39 |
| `ContextDescriptorsPanel.js`             |        64.13 |     19.94 |
| ● `runtime-core.esm-bundler.js`          |        61.30 |     23.84 |
| `ExploreDataPanel.js`                    |        56.79 |     15.27 |
| ● `index.js`                             |        55.26 |     19.41 |
| `Table.js`                               |        52.12 |     13.63 |
| `ContextModelList.js`                    |        45.38 |     11.19 |
| `sdk.modern.js`                          |        27.59 |      8.02 |
| `useMarkedTool.js`                       |        27.02 |     10.73 |
| `useDataWindow.js`                       |        25.19 |      7.67 |
| ● `ActionWrapper.js`                     |        22.29 |      8.87 |
| `SessionAuthPanel.js`                    |        12.37 |      4.93 |
| `performanceTracking.js`                 |         8.60 |      3.21 |
| `AssistantLayout.js`                     |         8.21 |      3.31 |
| ● `ErrorNotice.js`                       |         7.87 |      3.10 |
| `LibraryPanel.js`                        |         7.72 |      3.03 |
| `SessionMenu.js`                         |         7.50 |      2.88 |
| `PluginConnectorPanel.js`                |         7.39 |      2.88 |
| `SelectItemPanel.js`                     |         6.55 |      2.84 |
| `SetupLayout.js`                         |         6.11 |      2.20 |
| `GridDetailPanel.js`                     |         5.90 |      2.48 |
| `ConnectionPanel.js`                     |         5.73 |      2.26 |
| ● `errors.js`                            |         5.67 |      2.47 |
| `ScrollArea.js`                          |         5.62 |      2.07 |
| `ConfigCard.js`                          |         5.24 |      1.85 |
| `SessionAccountPanel.js`                 |         5.13 |      1.95 |
| `DataViewList.js`                        |         4.74 |      2.04 |
| `PaneSplitter.js`                        |         4.54 |      1.95 |
| `SelectConnectionList.js`                |         4.20 |      1.80 |
| `PluginList.js`                          |         4.16 |      1.66 |
| `configMonitor.js`                       |         3.66 |      1.38 |
| `dataViews.js`                           |         3.56 |      1.20 |
| `useStudioOptions.js`                    |         3.54 |      1.25 |
| `DataViewsLayout.js`                     |         3.51 |      1.62 |
| `PluginPanel.js`                         |         3.46 |      1.54 |
| `StudioHomePanel.js`                     |         3.44 |      1.12 |
| `ScrollRow.js`                           |         3.32 |      1.54 |
| `OptionBar.js`                           |         3.22 |      1.60 |
| `PresentationsLayout.js`                 |         3.19 |      1.62 |
| `accountMonitor.js`                      |         2.88 |      1.11 |
| ● `createLucideIcon.js`                  |         2.48 |      1.25 |
| `EventQueriesLayout.js`                  |         2.26 |      1.14 |
| ● `ErrorNotice.css`                      |         2.13 |      0.58 |
| `GitHubLogo.js`                          |         2.05 |      1.10 |
| `TextInput.js`                           |         2.03 |      1.15 |
| `StudioDocumentPanel.js`                 |         1.77 |      0.96 |
| `ContextEntityDiagramPanel.js`           |         1.69 |      0.61 |
| `ScrollArea.css`                         |         1.66 |      0.50 |
| `ItemButton.js`                          |         1.38 |      0.58 |
| ● `CloseButton.js`                       |         1.35 |      0.74 |
| `Breadcrumbs.js`                         |         1.34 |      0.74 |
| `dpuse-shared-utilities.es.js`           |         1.34 |      0.66 |
| `StudioLayout.js`                        |         1.31 |      0.75 |
| `EmptyPlaceholder.js`                    |         1.29 |      0.71 |
| `ManagePersonalDetailsPanel.js`          |         1.26 |      0.33 |
| ● `locale.js`                            |         1.14 |      0.56 |
| `ContextDiagramPanel.js`                 |         1.11 |      0.67 |
| `ChatPanel.css`                          |         1.03 |      0.40 |
| `useEngine.js`                           |         1.00 |      0.53 |
| `SelectPlaceholder.js`                   |         0.98 |      0.59 |
| `OptionBar.css`                          |         0.97 |      0.22 |
| ● `eventTracking.js`                     |         0.96 |      0.52 |
| ● `useApi-BPuI6ZR9.js`                   |         0.96 |      0.52 |
| `DataAppsLayout.js`                      |         0.89 |      0.54 |
| `ContextDimensionDiagramPanel.js`        |         0.80 |      0.44 |
| ● `action.js`                            |         0.79 |      0.30 |
| `SetupHomePanel.js`                      |         0.72 |      0.48 |
| `Tag.js`                                 |         0.69 |      0.39 |
| `dpuse-shared-componentModuleTool.es.js` |         0.63 |      0.39 |
| ● `RectangleButton.js`                   |         0.57 |      0.39 |
| `Separator.js`                           |         0.54 |      0.32 |
| `ManagePreferencesPanel.js`              |         0.53 |      0.36 |
| `SessionMenu.css`                        |         0.52 |      0.21 |
| `AuditContentPanel.js`                   |         0.51 |      0.37 |
| `ExploreDataPanel.css`                   |         0.49 |      0.23 |
| `useSetupSelection.js`                   |         0.48 |      0.32 |
| `PluginPresenterPanel.js`                |         0.45 |      0.25 |
| `PluginCookbookPanel.js`                 |         0.45 |      0.26 |
| `PluginToolPanel.js`                     |         0.44 |      0.25 |
| `dpuse-shared-component.es.js`           |         0.44 |      0.24 |
| `useSetupRoute.js`                       |         0.36 |      0.26 |
| `useElementIsWide.js`                    |         0.33 |      0.25 |
| `ManageSubscriptionPanel.js`             |         0.32 |      0.25 |
| `ManageDataServiceTokensPanel.js`        |         0.31 |      0.25 |
| `house.js`                               |         0.31 |      0.24 |
| `GenerateTokenPanel.js`                  |         0.30 |      0.25 |
| `ManageSessionsPanel.js`                 |         0.30 |      0.25 |
| `ReviewActivityPanel.js`                 |         0.30 |      0.25 |
| `DeleteAccountPanel.js`                  |         0.30 |      0.25 |
| `ManageAccessPanel.js`                   |         0.30 |      0.25 |
| `useConfigsReady.js`                     |         0.26 |      0.21 |
| `SessionAuthPanel.css`                   |         0.25 |      0.14 |
| `Table.css`                              |         0.24 |      0.11 |
| `search.js`                              |         0.19 |      0.18 |
| `arrow-left.js`                          |         0.18 |      0.17 |
| `arrow-right.js`                         |         0.18 |      0.17 |
| `GridDetailPanel.css`                    |         0.17 |      0.14 |
| `plus.js`                                |         0.17 |      0.16 |
| `chevron-left.js`                        |         0.15 |      0.16 |
| `chevron-right.js`                       |         0.15 |      0.15 |
| ● `_plugin-vue_export-helper.js`         |         0.08 |      0.10 |
| `StudioDocumentPanel.css`                |         0.05 |      0.07 |
| `PresentationsLayout.css`                |         0.04 |      0.06 |
