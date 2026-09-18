# Lines of Code & Build Size

Measures `src/` and the production build while dpuse-app moves to VueUse. **Baseline** is fixed: 2026-09-18, commit `032efb0c`, before VueUse. **Current** is after VueUse migration steps 1–13, measured 2026-09-18. **Change** is current minus baseline. Current and change are recalculated after each modification; baseline never changes.

- **Total** — every line in the file.
- **Code** — total minus blank lines and lines that hold only a comment. A comment trailing code counts as code.
- **–** — the file or chunk does not exist on that side.

## Summary

| Type    | Files baseline | Files current | Files change | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------ | -------------: | ------------: | -----------: | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| .vue    |            124 |           124 |            0 |         10,860 |        10,688 |         −172 |         7,421 |        7,275 |        −146 |
| .ts     |             62 |            61 |           −1 |          6,031 |         5,535 |         −496 |         3,910 |        3,555 |        −355 |
| .json   |             23 |            23 |            0 |          1,781 |         1,781 |            0 |         1,781 |        1,781 |           0 |
| .css    |              1 |             1 |            0 |            344 |           344 |            0 |           291 |          291 |           0 |
| **All** |            210 |           209 |           −1 |         19,016 |        18,348 |         −668 |        13,403 |       12,902 |        −501 |

## By folder

| Folder                                                | Files baseline | Files current | Files change | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------------------------------------------- | -------------: | ------------: | -----------: | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| `src`                                                 |              3 |             3 |            0 |            483 |           456 |          −27 |           252 |          247 |          −5 |
| `__tests__`                                           |             14 |            13 |           −1 |          1,362 |         1,228 |         −134 |         1,018 |          912 |        −106 |
| `assets`                                              |              1 |             1 |            0 |            344 |           344 |            0 |           291 |          291 |           0 |
| `components/branding`                                 |              6 |             6 |            0 |            119 |           119 |            0 |           109 |          109 |           0 |
| `components/icons`                                    |              4 |             4 |            0 |             46 |            46 |            0 |            40 |           40 |           0 |
| `components/ui`                                       |             10 |            10 |            0 |            559 |           554 |           −5 |           395 |          391 |          −4 |
| `components/ui/action`                                |              8 |             8 |            0 |            252 |           252 |            0 |           172 |          172 |           0 |
| `components/ui/config`                                |              3 |             3 |            0 |            177 |           177 |            0 |           123 |          123 |           0 |
| `components/ui/dialog`                                |              2 |             2 |            0 |            163 |           163 |            0 |           102 |          102 |           0 |
| `components/ui/error`                                 |              4 |             4 |            0 |            675 |           675 |            0 |           359 |          359 |           0 |
| `components/ui/grid`                                  |              3 |             3 |            0 |            290 |           287 |           −3 |           197 |          194 |          −3 |
| `components/ui/placeholder`                           |              3 |             3 |            0 |             74 |            74 |            0 |            53 |           53 |           0 |
| `components/ui/scroll`                                |              4 |             4 |            0 |            693 |           668 |          −25 |           514 |          484 |         −30 |
| `components/ui/table`                                 |              5 |             5 |            0 |            510 |           481 |          −29 |           372 |          353 |         −19 |
| `components/ui/text`                                  |              4 |             4 |            0 |            410 |           408 |           −2 |           291 |          286 |          −5 |
| `composables`                                         |              4 |             3 |           −1 |            496 |           430 |          −66 |           265 |          229 |         −36 |
| `features/assistant/_components`                      |              5 |             5 |            0 |            417 |           379 |          −38 |           259 |          231 |         −28 |
| `features/assistant/chat`                             |              7 |             7 |            0 |            709 |           691 |          −18 |           444 |          430 |         −14 |
| `features/assistant/chat/tools`                       |              8 |             8 |            0 |            308 |           308 |            0 |           239 |          239 |           0 |
| `features/assistant/library`                          |              4 |             4 |            0 |            426 |           426 |            0 |           251 |          251 |           0 |
| `features/session`                                    |              2 |             2 |            0 |            513 |           499 |          −14 |           354 |          342 |         −12 |
| `features/session/accountPanel`                       |             11 |            11 |            0 |            238 |           238 |            0 |           191 |          191 |           0 |
| `features/session/authPanel`                          |              3 |             3 |            0 |            393 |           393 |            0 |           296 |          296 |           0 |
| `features/studio`                                     |              2 |             2 |            0 |             91 |            91 |            0 |            73 |           73 |           0 |
| `features/studio/_components`                         |              6 |             6 |            0 |            148 |           148 |            0 |           103 |          103 |           0 |
| `features/studio/connectionPanel`                     |              5 |             5 |            0 |            293 |           293 |            0 |           196 |          196 |           0 |
| `features/studio/dataApps`                            |              1 |             1 |            0 |             37 |            37 |            0 |            23 |           23 |           0 |
| `features/studio/dataViews`                           |              3 |             3 |            0 |            352 |           352 |            0 |           245 |          245 |           0 |
| `features/studio/dataViews/auditContent`              |              1 |             1 |            0 |             34 |            34 |            0 |            12 |           12 |           0 |
| `features/studio/dataViews/exploreData`               |              3 |             3 |            0 |            803 |           801 |           −2 |           638 |          636 |          −2 |
| `features/studio/dataViews/exploreData/transformData` |              1 |             1 |            0 |             92 |            92 |            0 |            70 |           70 |           0 |
| `features/studio/dataViews/selectConnection`          |              2 |             2 |            0 |            348 |           348 |            0 |           208 |          208 |           0 |
| `features/studio/dataViews/selectItem`                |              2 |             2 |            0 |            377 |           367 |          −10 |           278 |          269 |          −9 |
| `features/studio/eventQueries`                        |              1 |             1 |            0 |            109 |           109 |            0 |            76 |           76 |           0 |
| `features/studio/options`                             |              3 |             3 |            0 |            287 |           264 |          −23 |           187 |          171 |         −16 |
| `features/studio/presentations`                       |              1 |             1 |            0 |            178 |           178 |            0 |           126 |          126 |           0 |
| `features/studio/setup`                               |              6 |             6 |            0 |            208 |           208 |            0 |           131 |          131 |           0 |
| `features/studio/setup/_data`                         |              1 |             1 |            0 |             80 |            80 |            0 |            80 |           80 |           0 |
| `features/studio/setup/context`                       |             15 |            15 |            0 |            738 |           739 |           +1 |           549 |          550 |          +1 |
| `features/studio/setup/context/_components`           |              6 |             6 |            0 |            212 |           212 |            0 |           139 |          139 |           0 |
| `features/studio/setup/context/_data`                 |              2 |             2 |            0 |          1,527 |         1,527 |            0 |         1,527 |        1,527 |           0 |
| `features/studio/setup/plugins`                       |              5 |             5 |            0 |            154 |           154 |            0 |            94 |           94 |           0 |
| `features/studio/setup/plugins/_components`           |              4 |             4 |            0 |            210 |           210 |            0 |           151 |          151 |           0 |
| `observability`                                       |              6 |             7 |           +1 |            974 |           772 |         −202 |           687 |          531 |        −156 |
| `router`                                              |              1 |             1 |            0 |            225 |           226 |           +1 |           144 |          145 |          +1 |
| `services`                                            |              6 |             6 |            0 |            527 |           520 |           −7 |           230 |          224 |          −6 |
| `state`                                               |              8 |             8 |            0 |          1,188 |         1,144 |          −44 |           765 |          727 |         −38 |
| `utilities`                                           |              1 |             1 |            0 |            167 |           146 |          −21 |            84 |           70 |         −14 |

## By file

### src

| File        | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| App.vue     |            302 |           298 |           −4 |           191 |          186 |          −5 |
| main.ts     |            125 |           102 |          −23 |            59 |           59 |           0 |
| template.ts |             56 |            56 |            0 |             2 |            2 |           0 |

### **tests**

| File                    | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| App.spec.ts             |             16 |            16 |            0 |            14 |           14 |           0 |
| Dialog.spec.ts          |             33 |            33 |            0 |            22 |           22 |           0 |
| ErrorBoundary.spec.ts   |             83 |            83 |            0 |            64 |           64 |           0 |
| assistantChat.spec.ts   |             37 |            37 |            0 |            29 |           29 |           0 |
| asyncPanel.spec.ts      |            141 |           141 |            0 |           107 |          107 |           0 |
| chatComposer.spec.ts    |            285 |           285 |            0 |           216 |          216 |           0 |
| chatModelSwitch.spec.ts |             75 |            75 |            0 |            59 |           59 |           0 |
| dialogs.spec.ts         |             72 |            72 |            0 |            46 |           46 |           0 |
| elementIsWide.spec.ts   |            134 |             – |         −134 |           106 |            – |        −106 |
| errorReporting.spec.ts  |            137 |           137 |            0 |           103 |          103 |           0 |
| errors.spec.ts          |            170 |           170 |            0 |           128 |          128 |           0 |
| scratchToggle.spec.ts   |             50 |            50 |            0 |            33 |           33 |           0 |
| setup.ts                |             66 |            66 |            0 |            46 |           46 |           0 |
| splitPanes.spec.ts      |             63 |            63 |            0 |            45 |           45 |           0 |

### assets

| File     | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| main.css |            344 |           344 |            0 |           291 |          291 |           0 |

### components/branding

| File              | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| AppleLogo.vue     |             11 |            11 |            0 |             9 |            9 |           0 |
| AssistantLogo.vue |             15 |            15 |            0 |            13 |           13 |           0 |
| DPUseLogo.vue     |             21 |            21 |            0 |            21 |           21 |           0 |
| GitHubLogo.vue    |             20 |            20 |            0 |            18 |           18 |           0 |
| GoogleLogo.vue    |             39 |            39 |            0 |            37 |           37 |           0 |
| MicrosoftLogo.vue |             13 |            13 |            0 |            11 |           11 |           0 |

### components/icons

| File                             | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ContextIconPENDING.vue           |              7 |             7 |            0 |             7 |            7 |           0 |
| HomeIconPENDING.vue              |             13 |            13 |            0 |            11 |           11 |           0 |
| MousePointerClickRotatedIcon.vue |             15 |            15 |            0 |            13 |           13 |           0 |
| StudioHomeIcon.vue               |             11 |            11 |            0 |             9 |            9 |           0 |

### components/ui

| File                 | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| Breadcrumbs.vue      |             61 |            61 |            0 |            43 |           43 |           0 |
| BusyBar.vue          |             22 |            22 |            0 |            19 |           19 |           0 |
| ListFieldPENDING.vue |             31 |            31 |            0 |            17 |           17 |           0 |
| PaneSplitter.vue     |            247 |           242 |           −5 |           172 |          168 |          −4 |
| PaneSplitter_.json   |              7 |             7 |            0 |             7 |            7 |           0 |
| Pill.vue             |             41 |            41 |            0 |            28 |           28 |           0 |
| Separator.vue        |             18 |            18 |            0 |            14 |           14 |           0 |
| TabBar.vue           |             36 |            36 |            0 |            26 |           26 |           0 |
| Tag.vue              |             33 |            33 |            0 |            25 |           25 |           0 |
| TaskBar.vue          |             63 |            63 |            0 |            44 |           44 |           0 |

### components/ui/action

| File                | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------ | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ActionWrapper.vue   |             27 |            27 |            0 |            20 |           20 |           0 |
| CloseButton.vue     |             20 |            20 |            0 |            13 |           13 |           0 |
| IconButton.vue      |             40 |            40 |            0 |            28 |           28 |           0 |
| ItemButton.vue      |             44 |            44 |            0 |            34 |           34 |           0 |
| PillButton.vue      |             28 |            28 |            0 |            21 |           21 |           0 |
| RectangleButton.vue |             26 |            26 |            0 |            17 |           17 |           0 |
| ToggleButton.vue    |             36 |            36 |            0 |            24 |           24 |           0 |
| action.ts           |             31 |            31 |            0 |            15 |           15 |           0 |

### components/ui/config

| File           | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ConfigCard.vue |            134 |           134 |            0 |           100 |          100 |           0 |
| ConfigIcon.vue |             26 |            26 |            0 |            16 |           16 |           0 |
| configCard.ts  |             17 |            17 |            0 |             7 |            7 |           0 |

### components/ui/dialog

| File             | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :--------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| Dialog.vue       |            154 |           154 |            0 |            96 |           96 |           0 |
| DialogHeader.vue |              9 |             9 |            0 |             6 |            6 |           0 |

### components/ui/error

| File                  | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :-------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ErrorBody.vue         |            165 |           165 |            0 |            89 |           89 |           0 |
| ErrorBoundary.vue     |             71 |            71 |            0 |            37 |           37 |           0 |
| ErrorNotice.vue       |            363 |           363 |            0 |           197 |          197 |           0 |
| LoadFailureNotice.vue |             76 |            76 |            0 |            36 |           36 |           0 |

### components/ui/grid

| File                | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------ | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| Grid.vue            |            158 |           154 |           −4 |           115 |          111 |          −4 |
| GridDetailPanel.vue |            113 |           114 |           +1 |            79 |           80 |          +1 |
| gridDetail.ts       |             19 |            19 |            0 |             3 |            3 |           0 |

### components/ui/placeholder

| File                        | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :-------------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ComponentLoadingSpinner.vue |             23 |            23 |            0 |            12 |           12 |           0 |
| EmptyPlaceholder.vue        |             33 |            33 |            0 |            28 |           28 |           0 |
| SelectPlaceholder.vue       |             18 |            18 |            0 |            13 |           13 |           0 |

### components/ui/scroll

| File            | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :-------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ScrollArea.vue  |            131 |           126 |           −5 |            93 |           88 |          −5 |
| ScrollRow.vue   |            204 |           197 |           −7 |           139 |          131 |          −8 |
| ScrollRow_.json |              6 |             6 |            0 |             6 |            6 |           0 |
| ScrollThumb.vue |            352 |           339 |          −13 |           276 |          259 |         −17 |

### components/ui/table

| File                  | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :-------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| Table.vue             |            311 |           305 |           −6 |           224 |          219 |          −5 |
| TableColumnPicker.vue |             63 |            52 |          −11 |            45 |           38 |          −7 |
| TableHeaderCell.vue   |            110 |            98 |          −12 |            86 |           79 |          −7 |
| TableRowCell.vue      |             12 |            12 |            0 |             9 |            9 |           0 |
| tableFeatures.ts      |             14 |            14 |            0 |             8 |            8 |           0 |

### components/ui/text

| File           | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| TextArea.vue   |             66 |            69 |           +3 |            46 |           47 |          +1 |
| TextEditor.vue |            235 |           230 |           −5 |           171 |          165 |          −6 |
| TextInput.vue  |             90 |            90 |            0 |            60 |           60 |           0 |
| TextViewer.vue |             19 |            19 |            0 |            14 |           14 |           0 |

### composables

| File                | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------ | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| useBreadcrumbs.ts   |             40 |            40 |            0 |            28 |           28 |           0 |
| useDataWindow.ts    |            331 |           325 |           −6 |           170 |          167 |          −3 |
| useElementIsWide.ts |             60 |             – |          −60 |            33 |            – |         −33 |
| useSplitPanes.ts    |             65 |            65 |            0 |            34 |           34 |           0 |

### features/assistant/_components

| File                    | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| AssistantHeader.vue     |             42 |            42 |            0 |            29 |           29 |           0 |
| AssistantLayout.vue     |            212 |           182 |          −30 |           127 |          105 |         −22 |
| AssistantModelMenu.vue  |             79 |            71 |           −8 |            52 |           46 |          −6 |
| AssistantPaneToggle.vue |             20 |            20 |            0 |            13 |           13 |           0 |
| PendingLabel.vue        |             64 |            64 |            0 |            38 |           38 |           0 |

### features/assistant/chat

| File               | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :----------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ChatEmptyState.vue |             42 |            42 |            0 |            25 |           25 |           0 |
| ChatInput.vue      |            158 |           149 |           −9 |            83 |           75 |          −8 |
| ChatMenu.vue       |             90 |            81 |           −9 |            53 |           47 |          −6 |
| ChatPaneToggle.vue |             28 |            28 |            0 |            10 |           10 |           0 |
| ChatPanel.vue      |            275 |           275 |            0 |           190 |          190 |           0 |
| assistantChat.ts   |             35 |            35 |            0 |            25 |           25 |           0 |
| modelConfigs.ts    |             81 |            81 |            0 |            58 |           58 |           0 |

### features/assistant/chat/tools

| File                    | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| getConnection.ts        |             18 |            18 |            0 |            14 |           14 |           0 |
| getConnector.ts         |             35 |            35 |            0 |            27 |           27 |           0 |
| getLocalTime.ts         |              9 |             9 |            0 |             7 |            7 |           0 |
| listConnections.ts      |             15 |            15 |            0 |            11 |           11 |           0 |
| listConnectorItems.ts   |             44 |            44 |            0 |            32 |           32 |           0 |
| listConnectors.ts       |             21 |            21 |            0 |            14 |           14 |           0 |
| previewConnectorItem.ts |             48 |            48 |            0 |            33 |           33 |           0 |
| tanstackClientTools.ts  |            118 |           118 |            0 |           101 |          101 |           0 |

### features/assistant/library

| File                     | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :----------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| LibraryDocumentPanel.vue |             82 |            82 |            0 |            45 |           45 |           0 |
| LibraryPaneToggle.vue    |             34 |            34 |            0 |            16 |           16 |           0 |
| LibraryPanel.vue         |            251 |           251 |            0 |           154 |          154 |           0 |
| LibrarySearchInput.vue   |             59 |            59 |            0 |            36 |           36 |           0 |

### features/session

| File              | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| SessionButton.vue |            201 |           201 |            0 |           139 |          139 |           0 |
| SessionMenu.vue   |            312 |           298 |          −14 |           215 |          203 |         −12 |

### features/session/accountPanel

| File                             | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| DeleteAccountPanel.vue           |              5 |             5 |            0 |             4 |            4 |           0 |
| GenerateTokenPanel.vue           |              5 |             5 |            0 |             4 |            4 |           0 |
| ManageAccessPanel.vue            |              5 |             5 |            0 |             4 |            4 |           0 |
| ManageDataServiceTokensPanel.vue |              5 |             5 |            0 |             4 |            4 |           0 |
| ManagePersonalDetailsPanel.vue   |             36 |            36 |            0 |            35 |           35 |           0 |
| ManagePreferencesPanel.vue       |             14 |            14 |            0 |            10 |           10 |           0 |
| ManageSessionsPanel.vue          |              5 |             5 |            0 |             4 |            4 |           0 |
| ManageSubscriptionPanel.vue      |              5 |             5 |            0 |             4 |            4 |           0 |
| ReviewActivityPanel.vue          |              5 |             5 |            0 |             4 |            4 |           0 |
| SessionAccountPanel.vue          |            143 |           143 |            0 |           108 |          108 |           0 |
| SessionAccountPanel_.json        |             10 |            10 |            0 |            10 |           10 |           0 |

### features/session/authPanel

| File                 | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| LoginForm.vue        |             73 |            73 |            0 |            50 |           50 |           0 |
| PasswordForm.vue     |             73 |            73 |            0 |            46 |           46 |           0 |
| SessionAuthPanel.vue |            247 |           247 |            0 |           200 |          200 |           0 |

### features/studio

| File                  | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :-------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| StudioHomePanel.vue   |             70 |            70 |            0 |            52 |           52 |           0 |
| StudioHomePanel_.json |             21 |            21 |            0 |            21 |           21 |           0 |

### features/studio/_components

| File                    | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| StudioDetailPanel.vue   |              5 |             5 |            0 |             5 |            5 |           0 |
| StudioDocumentPanel.vue |             69 |            69 |            0 |            44 |           44 |           0 |
| StudioHeader.vue        |             44 |            44 |            0 |            31 |           31 |           0 |
| StudioLayout.vue        |              5 |             5 |            0 |             5 |            5 |           0 |
| StudioListPanel.vue     |              5 |             5 |            0 |             5 |            5 |           0 |
| StudioPaneToggle.vue    |             20 |            20 |            0 |            13 |           13 |           0 |

### features/studio/connectionPanel

| File                      | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------------ | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| AddConnectionForm.vue     |            113 |           113 |            0 |            54 |           54 |           0 |
| AddConnectionForm_.json   |             24 |            24 |            0 |            24 |           24 |           0 |
| ConnectionPanel.vue       |            141 |           141 |            0 |           104 |          104 |           0 |
| ConnectionPanel_.json     |             10 |            10 |            0 |            10 |           10 |           0 |
| ManageConnectionPanel.vue |              5 |             5 |            0 |             4 |            4 |           0 |

### features/studio/dataApps

| File               | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :----------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| DataAppsLayout.vue |             37 |            37 |            0 |            23 |           23 |           0 |

### features/studio/dataViews

| File                | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------ | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| DataViewList.vue    |            206 |           206 |            0 |           150 |          150 |           0 |
| DataViewPanel.vue   |             29 |            29 |            0 |            20 |           20 |           0 |
| DataViewsLayout.vue |            117 |           117 |            0 |            75 |           75 |           0 |

### features/studio/dataViews/auditContent

| File                  | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :-------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| AuditContentPanel.vue |             34 |            34 |            0 |            12 |           12 |           0 |

### features/studio/dataViews/exploreData

| File                     | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :----------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ExploreDataPanel.vue     |             73 |            73 |            0 |            46 |           46 |           0 |
| InvestigateDataPanel.vue |             45 |            43 |           −2 |            34 |           32 |          −2 |
| TransformDataPanel.vue   |            685 |           685 |            0 |           558 |          558 |           0 |

### features/studio/dataViews/exploreData/transformData

| File                   | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :--------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| useSelectColumnSort.ts |             92 |            92 |            0 |            70 |           70 |           0 |

### features/studio/dataViews/selectConnection

| File                      | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------------ | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| SelectConnectionList.vue  |            190 |           190 |            0 |           138 |          138 |           0 |
| SelectConnectionPanel.vue |            158 |           158 |            0 |            70 |           70 |           0 |

### features/studio/dataViews/selectItem

| File                 | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| SelectItemPanel.json |              9 |             9 |            0 |             9 |            9 |           0 |
| SelectItemPanel.vue  |            368 |           358 |          −10 |           269 |          260 |          −9 |

### features/studio/eventQueries

| File                   | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :--------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| EventQueriesLayout.vue |            109 |           109 |            0 |            76 |           76 |           0 |

### features/studio/options

| File                | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------ | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| OptionBar.vue       |             94 |            94 |            0 |            45 |           45 |           0 |
| OptionPanel.vue     |            101 |            78 |          −23 |            65 |           49 |         −16 |
| useStudioOptions.ts |             92 |            92 |            0 |            77 |           77 |           0 |

### features/studio/presentations

| File                    | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| PresentationsLayout.vue |            178 |           178 |            0 |           126 |          126 |           0 |

### features/studio/setup

| File                 | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| SetupHomePanel.vue   |             30 |            30 |            0 |            16 |           16 |           0 |
| SetupLayout.vue      |             76 |            76 |            0 |            54 |           54 |           0 |
| SetupLayout_.json    |              6 |             6 |            0 |             6 |            6 |           0 |
| useSetupOptions.ts   |             22 |            22 |            0 |             9 |            9 |           0 |
| useSetupRoute.ts     |             31 |            31 |            0 |            18 |           18 |           0 |
| useSetupSelection.ts |             43 |            43 |            0 |            28 |           28 |           0 |

### features/studio/setup/_data

| File                    | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| setupOptionConfigs.json |             80 |            80 |            0 |            80 |           80 |           0 |

### features/studio/setup/context

| File                               | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :--------------------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ContextDimensionDiagramPanel.vue   |             47 |            47 |            0 |            34 |           34 |           0 |
| ContextDimensionDiagramPanel_.json |              5 |             5 |            0 |             5 |            5 |           0 |
| ContextDimensionList.vue           |             29 |            29 |            0 |            19 |           19 |           0 |
| ContextDimensionList_.json         |              7 |             7 |            0 |             7 |            7 |           0 |
| ContextEntityDiagramPanel.vue      |             63 |            63 |            0 |            47 |           47 |           0 |
| ContextEntityDiagramPanel_.json    |              5 |             5 |            0 |             5 |            5 |           0 |
| ContextEntityList.vue              |            134 |           134 |            0 |            98 |           98 |           0 |
| ContextEntityList_.json            |             12 |            12 |            0 |            12 |           12 |           0 |
| ContextModelList.vue               |             73 |            73 |            0 |            54 |           54 |           0 |
| ContextModelList_.json             |              5 |             5 |            0 |             5 |            5 |           0 |
| ContextModelPanel.vue              |            200 |           201 |           +1 |           140 |          141 |          +1 |
| ContextModelPanel_.json            |              7 |             7 |            0 |             7 |            7 |           0 |
| ContextSecondaryMeasureList.vue    |             19 |            19 |            0 |            11 |           11 |           0 |
| ContextSecondaryMeasureList_.json  |              6 |             6 |            0 |             6 |            6 |           0 |
| _context.ts                        |            126 |           126 |            0 |            99 |           99 |           0 |

### features/studio/setup/context/_components

| File                          | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| ContextDescriptorsPanel.vue   |             21 |            21 |            0 |            14 |           14 |           0 |
| ContextDescriptorsPanel_.json |              6 |             6 |            0 |             6 |            6 |           0 |
| ContextDiagramPanel.vue       |             65 |            65 |            0 |            38 |           38 |           0 |
| ContextDisclosure.vue         |             59 |            59 |            0 |            40 |           40 |           0 |
| ContextDisclosure_.json       |              5 |             5 |            0 |             5 |            5 |           0 |
| ContextDocument.vue           |             56 |            56 |            0 |            36 |           36 |           0 |

### features/studio/setup/context/_data

| File               | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :----------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| contextConfig.json |            444 |           444 |            0 |           444 |          444 |           0 |
| modelConfigs.json  |          1,083 |         1,083 |            0 |         1,083 |        1,083 |           0 |

### features/studio/setup/plugins

| File                       | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| PluginConnectorPanel.vue   |             73 |            73 |            0 |            46 |           46 |           0 |
| PluginConnectorPanel_.json |              6 |             6 |            0 |             6 |            6 |           0 |
| PluginCookbookPanel.vue    |             25 |            25 |            0 |            14 |           14 |           0 |
| PluginPresenterPanel.vue   |             25 |            25 |            0 |            14 |           14 |           0 |
| PluginToolPanel.vue        |             25 |            25 |            0 |            14 |           14 |           0 |

### features/studio/setup/plugins/_components

| File              | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :---------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| PluginList.vue    |             81 |            81 |            0 |            55 |           55 |           0 |
| PluginList_.json  |              8 |             8 |            0 |             8 |            8 |           0 |
| PluginPanel.vue   |            112 |           112 |            0 |            79 |           79 |           0 |
| PluginPanel_.json |              9 |             9 |            0 |             9 |            9 |           0 |

### observability

| File                   | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :--------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| accountMonitor.ts      |            216 |            41 |         −175 |           156 |           26 |        −130 |
| configMonitor.ts       |            408 |           241 |         −167 |           312 |          186 |        −126 |
| errorTracking.ts       |            162 |           162 |            0 |           118 |          118 |           0 |
| eventTracking.ts       |             92 |           100 |           +8 |            60 |           63 |          +3 |
| faultInjection.ts      |             69 |            69 |            0 |            23 |           23 |           0 |
| monitorSocket.ts       |              – |           132 |         +132 |             – |           97 |         +97 |
| performanceTracking.ts |             27 |            27 |            0 |            18 |           18 |           0 |

### router

| File     | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| index.ts |            225 |           226 |           +1 |           144 |          145 |          +1 |

### services

| File                 | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| retrievalReady.ts    |             23 |            16 |           −7 |            11 |            5 |          −6 |
| useChatSession.ts    |            229 |           229 |            0 |           123 |          123 |           0 |
| useConfigsReady.ts   |             13 |            13 |            0 |             5 |            5 |           0 |
| useDataViewsReady.ts |             14 |            14 |            0 |             5 |            5 |           0 |
| useEngine.ts         |            174 |           174 |            0 |            46 |           46 |           0 |
| useMarkedTool.ts     |             74 |            74 |            0 |            40 |           40 |           0 |

### state

| File                  | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :-------------------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| activeStudioOption.ts |             12 |            12 |            0 |             4 |            4 |           0 |
| appLayout.ts          |            104 |            69 |          −35 |            53 |           30 |         −23 |
| assistantLibrary.ts   |             93 |            93 |            0 |            53 |           53 |           0 |
| dataViews.ts          |            260 |           260 |            0 |           201 |          201 |           0 |
| dialogs.ts            |             87 |            87 |            0 |            47 |           47 |           0 |
| errors.ts             |            209 |           209 |            0 |            97 |           97 |           0 |
| locale.ts             |             44 |            44 |            0 |            30 |           30 |           0 |
| session.ts            |            379 |           370 |           −9 |           280 |          265 |         −15 |

### utilities

| File     | Total baseline | Total current | Total change | Code baseline | Code current | Code change |
| :------- | -------------: | ------------: | -----------: | ------------: | -----------: | ----------: |
| index.ts |            167 |           146 |          −21 |            84 |           70 |         −14 |

## Largest 20 files

Ranked by current code lines.

| File                                                           | Code baseline | Code current | Code change |
| :------------------------------------------------------------- | ------------: | -----------: | ----------: |
| `features/studio/setup/context/_data/modelConfigs.json`        |         1,083 |        1,083 |           0 |
| `features/studio/dataViews/exploreData/TransformDataPanel.vue` |           558 |          558 |           0 |
| `features/studio/setup/context/_data/contextConfig.json`       |           444 |          444 |           0 |
| `assets/main.css`                                              |           291 |          291 |           0 |
| `state/session.ts`                                             |           280 |          265 |         −15 |
| `features/studio/dataViews/selectItem/SelectItemPanel.vue`     |           269 |          260 |          −9 |
| `components/ui/scroll/ScrollThumb.vue`                         |           276 |          259 |         −17 |
| `components/ui/table/Table.vue`                                |           224 |          219 |          −5 |
| `__tests__/chatComposer.spec.ts`                               |           216 |          216 |           0 |
| `features/session/SessionMenu.vue`                             |           215 |          203 |         −12 |
| `state/dataViews.ts`                                           |           201 |          201 |           0 |
| `features/session/authPanel/SessionAuthPanel.vue`              |           200 |          200 |           0 |
| `components/ui/error/ErrorNotice.vue`                          |           197 |          197 |           0 |
| `features/assistant/chat/ChatPanel.vue`                        |           190 |          190 |           0 |
| `App.vue`                                                      |           191 |          186 |          −5 |
| `observability/configMonitor.ts`                               |           312 |          186 |        −126 |
| `components/ui/PaneSplitter.vue`                               |           172 |          168 |          −4 |
| `composables/useDataWindow.ts`                                 |           170 |          167 |          −3 |
| `components/ui/text/TextEditor.vue`                            |           171 |          165 |          −6 |
| `features/assistant/library/LibraryPanel.vue`                  |           154 |          154 |           0 |

## Build size

Production `vite build`. Sizes are in KB (1,024 bytes); gzip is level 9, measured per file. Source maps are excluded.

| Group                                                            | Files baseline | Files current | Files change | Default (KB) baseline | Default (KB) current | Default (KB) change | Gzip (KB) baseline | Gzip (KB) current | Gzip (KB) change |
| :--------------------------------------------------------------- | -------------: | ------------: | -----------: | --------------------: | -------------------: | ------------------: | -----------------: | ----------------: | ---------------: |
| Initial load — `index.html` plus the scripts and styles it loads |             16 |            13 |           −3 |                246.40 |               262.80 |              +16.40 |              78.56 |             83.93 |            +5.37 |
| Lazy-loaded JavaScript                                           |             79 |            79 |            0 |                634.68 |               626.38 |               −8.30 |             205.47 |            202.81 |            −2.66 |
| Lazy-loaded CSS                                                  |             10 |            10 |            0 |                  5.42 |                 5.42 |                   0 |               2.09 |              2.09 |                0 |
| Fonts                                                            |              7 |             7 |            0 |                213.39 |               213.39 |                   0 |             213.54 |            213.54 |                0 |
| Other static files — icons, images, manifest                     |             19 |            19 |            0 |                117.97 |               117.97 |                   0 |              42.17 |             42.17 |                0 |
| **Client total**                                                 |            131 |           128 |           −3 |              1,217.86 |             1,225.96 |               +8.10 |             541.83 |            544.55 |            +2.72 |
| Cloudflare Worker — `dpuse_app/index.js`, server side            |              1 |             1 |            0 |                  0.30 |                 0.30 |                   0 |               0.22 |              0.22 |                0 |
| **Grand total** — client and worker                              |            132 |           129 |           −3 |              1,218.16 |             1,226.27 |               +8.11 |             542.05 |            544.77 |            +2.72 |

### Chunks

Every JavaScript and CSS file, ranked by current size. A chunk is named after its first module, so it may also hold library code; ● marks the initial load.

| Chunk                                    | Default (KB) baseline | Default (KB) current | Default (KB) change | Gzip (KB) baseline | Gzip (KB) current | Gzip (KB) change |
| :--------------------------------------- | --------------------: | -------------------: | ------------------: | -----------------: | ----------------: | ---------------: |
| `ChatPanel.js`                           |                160.17 |               159.47 |               −0.70 |              42.85 |             42.67 |            −0.18 |
| ● `index.css`                            |                 78.81 |                80.94 |               +2.13 |              14.39 |             14.77 |            +0.38 |
| ● `index.js`                             |                 55.26 |                64.01 |               +8.75 |              19.41 |             22.44 |            +3.03 |
| `ContextDescriptorsPanel.js`             |                 64.13 |                63.99 |               −0.14 |              19.94 |             19.89 |            −0.05 |
| ● `runtime-core.esm-bundler.js`          |                 61.30 |                62.40 |               +1.10 |              23.84 |             24.15 |            +0.31 |
| `ExploreDataPanel.js`                    |                 56.79 |                56.75 |               −0.04 |              15.27 |             15.23 |            −0.04 |
| `Table.js`                               |                 52.12 |                51.69 |               −0.43 |              13.63 |             13.55 |            −0.08 |
| `ContextModelList.js`                    |                 45.38 |                45.17 |               −0.21 |              11.19 |             11.12 |            −0.07 |
| `sdk.modern.js`                          |                 27.59 |                27.59 |                   0 |               8.02 |              8.02 |                0 |
| `useMarkedTool.js`                       |                 27.02 |                27.02 |                   0 |              10.73 |             10.74 |            +0.01 |
| `useDataWindow.js`                       |                 25.19 |                25.16 |               −0.03 |               7.67 |              7.67 |                0 |
| ● `ActionWrapper.js`                     |                 22.29 |                22.29 |                   0 |               8.87 |              8.87 |                0 |
| ● `dist.js`                              |                     – |                17.44 |              +17.44 |                  – |              6.79 |            +6.79 |
| `SessionAuthPanel.js`                    |                 12.37 |                12.21 |               −0.16 |               4.93 |              4.84 |            −0.09 |
| `performanceTracking.js`                 |                  8.60 |                 8.60 |                   0 |               3.21 |              3.21 |                0 |
| `AssistantLayout.js`                     |                  8.21 |                 7.88 |               −0.33 |               3.31 |              3.18 |            −0.13 |
| `LibraryPanel.js`                        |                  7.72 |                 7.67 |               −0.05 |               3.03 |              3.01 |            −0.02 |
| `PluginConnectorPanel.js`                |                  7.39 |                 7.39 |                   0 |               2.88 |              2.88 |                0 |
| `SessionMenu.js`                         |                  7.50 |                 6.86 |               −0.64 |               2.88 |              2.66 |            −0.22 |
| `SelectItemPanel.js`                     |                  6.55 |                 6.49 |               −0.06 |               2.84 |              2.82 |            −0.02 |
| `SetupLayout.js`                         |                  6.11 |                 6.07 |               −0.04 |               2.20 |              2.19 |            −0.01 |
| `GridDetailPanel.js`                     |                  5.90 |                 5.80 |               −0.10 |               2.48 |              2.42 |            −0.06 |
| ● `errors.js`                            |                  5.67 |                 5.67 |                   0 |               2.47 |              2.47 |                0 |
| `ConnectionPanel.js`                     |                  5.73 |                 5.66 |               −0.07 |               2.26 |              2.22 |            −0.04 |
| `SessionAccountPanel.js`                 |                  5.13 |                 5.37 |               +0.24 |               1.95 |              1.99 |            +0.04 |
| `ConfigCard.js`                          |                  5.24 |                 5.24 |                   0 |               1.85 |              1.85 |                0 |
| `ScrollArea.js`                          |                  5.62 |                 4.96 |               −0.66 |               2.07 |              1.93 |            −0.14 |
| `DataViewList.js`                        |                  4.74 |                 4.62 |               −0.12 |               2.04 |              1.99 |            −0.05 |
| `PaneSplitter.js`                        |                  4.54 |                 4.37 |               −0.17 |               1.95 |              1.90 |            −0.05 |
| `SelectConnectionList.js`                |                  4.20 |                 4.16 |               −0.04 |               1.80 |              1.78 |            −0.02 |
| `PluginList.js`                          |                  4.16 |                 3.88 |               −0.28 |               1.66 |              1.58 |            −0.08 |
| `useStudioOptions.js`                    |                  3.54 |                 3.54 |                   0 |               1.25 |              1.25 |                0 |
| `dataViews.js`                           |                  3.56 |                 3.53 |               −0.03 |               1.20 |              1.18 |            −0.02 |
| `DataViewsLayout.js`                     |                  3.51 |                 3.48 |               −0.03 |               1.62 |              1.61 |            −0.01 |
| `PluginPanel.js`                         |                  3.46 |                 3.46 |                   0 |               1.54 |              1.54 |                0 |
| `StudioHomePanel.js`                     |                  3.44 |                 3.41 |               −0.03 |               1.12 |              1.11 |            −0.01 |
| `ScrollRow.js`                           |                  3.32 |                 3.14 |               −0.18 |               1.54 |              1.49 |            −0.05 |
| `PresentationsLayout.js`                 |                  3.19 |                 3.07 |               −0.12 |               1.62 |              1.57 |            −0.05 |
| `OptionBar.js`                           |                  3.22 |                 2.78 |               −0.44 |               1.60 |              1.37 |            −0.23 |
| ● `createLucideIcon.js`                  |                  2.48 |                 2.48 |                   0 |               1.25 |              1.24 |            −0.01 |
| `EventQueriesLayout.js`                  |                  2.26 |                 2.15 |               −0.11 |               1.14 |              1.09 |            −0.05 |
| `GitHubLogo.js`                          |                  2.05 |                 2.05 |                   0 |               1.10 |              1.10 |                0 |
| `TextInput.js`                           |                  2.03 |                 2.00 |               −0.03 |               1.15 |              1.13 |            −0.02 |
| `configMonitor.js`                       |                  3.66 |                 1.89 |               −1.77 |               1.38 |              0.86 |            −0.52 |
| `StudioDocumentPanel.js`                 |                  1.77 |                 1.74 |               −0.03 |               0.96 |              0.94 |            −0.02 |
| `ContextEntityDiagramPanel.js`           |                  1.69 |                 1.69 |                   0 |               0.61 |              0.61 |                0 |
| `ScrollArea.css`                         |                  1.66 |                 1.66 |                   0 |               0.50 |              0.50 |                0 |
| `monitorSocket.js`                       |                     – |                 1.63 |               +1.63 |                  – |              0.84 |            +0.84 |
| `ItemButton.js`                          |                  1.38 |                 1.38 |                   0 |               0.58 |              0.59 |            +0.01 |
| `dpuse-shared-utilities.es.js`           |                  1.34 |                 1.34 |                   0 |               0.66 |              0.66 |                0 |
| `Breadcrumbs.js`                         |                  1.34 |                 1.33 |               −0.01 |               0.74 |              0.75 |            +0.01 |
| `EmptyPlaceholder.js`                    |                  1.29 |                 1.29 |                   0 |               0.71 |              0.71 |                0 |
| `StudioLayout.js`                        |                  1.31 |                 1.26 |               −0.05 |               0.75 |              0.73 |            −0.02 |
| `ManagePersonalDetailsPanel.js`          |                  1.26 |                 1.24 |               −0.02 |               0.33 |              0.32 |            −0.01 |
| `ContextDiagramPanel.js`                 |                  1.11 |                 1.08 |               −0.03 |               0.67 |              0.65 |            −0.02 |
| `ChatPanel.css`                          |                  1.03 |                 1.03 |                   0 |               0.40 |              0.40 |                0 |
| ● `eventTracking.js`                     |                  0.96 |                 1.03 |               +0.07 |               0.52 |              0.58 |            +0.06 |
| `useEngine.js`                           |                  1.00 |                 1.00 |                   0 |               0.53 |              0.54 |            +0.01 |
| `SelectPlaceholder.js`                   |                  0.98 |                 0.98 |                   0 |               0.59 |              0.59 |                0 |
| `OptionBar.css`                          |                  0.97 |                 0.97 |                   0 |               0.22 |              0.22 |                0 |
| ● `useApi-BPuI6ZR9.js`                   |                  0.96 |                 0.96 |                   0 |               0.52 |              0.53 |            +0.01 |
| `DataAppsLayout.js`                      |                  0.89 |                 0.89 |                   0 |               0.54 |              0.54 |                0 |
| `ContextDimensionDiagramPanel.js`        |                  0.80 |                 0.80 |                   0 |               0.44 |              0.45 |            +0.01 |
| ● `action.js`                            |                  0.79 |                 0.79 |                   0 |               0.30 |              0.30 |                0 |
| `SetupHomePanel.js`                      |                  0.72 |                 0.72 |                   0 |               0.48 |              0.48 |                0 |
| `Tag.js`                                 |                  0.69 |                 0.69 |                   0 |               0.39 |              0.40 |            +0.01 |
| `dpuse-shared-componentModuleTool.es.js` |                  0.63 |                 0.63 |                   0 |               0.39 |              0.39 |                0 |
| `Separator.js`                           |                  0.54 |                 0.54 |                   0 |               0.32 |              0.32 |                0 |
| `SessionMenu.css`                        |                  0.52 |                 0.52 |                   0 |               0.21 |              0.22 |            +0.01 |
| `AuditContentPanel.js`                   |                  0.51 |                 0.51 |                   0 |               0.37 |              0.37 |                0 |
| `ExploreDataPanel.css`                   |                  0.49 |                 0.49 |                   0 |               0.23 |              0.23 |                0 |
| `ManagePreferencesPanel.js`              |                  0.53 |                 0.48 |               −0.05 |               0.36 |              0.33 |            −0.03 |
| `useSetupSelection.js`                   |                  0.48 |                 0.48 |                   0 |               0.32 |              0.32 |                0 |
| `accountMonitor.js`                      |                  2.88 |                 0.46 |               −2.42 |               1.11 |              0.33 |            −0.78 |
| `PluginPresenterPanel.js`                |                  0.45 |                 0.45 |                   0 |               0.25 |              0.25 |                0 |
| `PluginCookbookPanel.js`                 |                  0.45 |                 0.45 |                   0 |               0.26 |              0.26 |                0 |
| `PluginToolPanel.js`                     |                  0.44 |                 0.44 |                   0 |               0.25 |              0.25 |                0 |
| `dpuse-shared-component.es.js`           |                  0.44 |                 0.44 |                   0 |               0.24 |              0.24 |                0 |
| `useSetupRoute.js`                       |                  0.36 |                 0.36 |                   0 |               0.26 |              0.27 |            +0.01 |
| `house.js`                               |                  0.31 |                 0.31 |                   0 |               0.24 |              0.24 |                0 |
| `ManageSubscriptionPanel.js`             |                  0.32 |                 0.30 |               −0.02 |               0.25 |              0.24 |            −0.01 |
| `ManageDataServiceTokensPanel.js`        |                  0.31 |                 0.29 |               −0.02 |               0.25 |              0.24 |            −0.01 |
| `GenerateTokenPanel.js`                  |                  0.30 |                 0.28 |               −0.02 |               0.25 |              0.23 |            −0.02 |
| `ManageSessionsPanel.js`                 |                  0.30 |                 0.28 |               −0.02 |               0.25 |              0.23 |            −0.02 |
| `ReviewActivityPanel.js`                 |                  0.30 |                 0.28 |               −0.02 |               0.25 |              0.23 |            −0.02 |
| `DeleteAccountPanel.js`                  |                  0.30 |                 0.28 |               −0.02 |               0.25 |              0.23 |            −0.02 |
| `ManageAccessPanel.js`                   |                  0.30 |                 0.28 |               −0.02 |               0.25 |              0.23 |            −0.02 |
| `SessionAuthPanel.css`                   |                  0.25 |                 0.25 |                   0 |               0.14 |              0.14 |                0 |
| `Table.css`                              |                  0.24 |                 0.24 |                   0 |               0.11 |              0.11 |                0 |
| `search.js`                              |                  0.19 |                 0.19 |                   0 |               0.18 |              0.18 |                0 |
| `useConfigsReady.js`                     |                  0.26 |                 0.18 |               −0.08 |               0.21 |              0.16 |            −0.05 |
| `arrow-left.js`                          |                  0.18 |                 0.18 |                   0 |               0.17 |              0.17 |                0 |
| `arrow-right.js`                         |                  0.18 |                 0.18 |                   0 |               0.17 |              0.17 |                0 |
| `GridDetailPanel.css`                    |                  0.17 |                 0.17 |                   0 |               0.14 |              0.14 |                0 |
| ● `x.js`                                 |                     – |                 0.17 |               +0.17 |                  – |              0.16 |            +0.16 |
| `plus.js`                                |                  0.17 |                 0.17 |                   0 |               0.16 |              0.16 |                0 |
| `chevron-left.js`                        |                  0.15 |                 0.15 |                   0 |               0.16 |              0.16 |                0 |
| `chevron-right.js`                       |                  0.15 |                 0.15 |                   0 |               0.15 |              0.15 |                0 |
| ● `chevron-down.js`                      |                     – |                 0.14 |               +0.14 |                  – |              0.15 |            +0.15 |
| `StudioDocumentPanel.css`                |                  0.05 |                 0.05 |                   0 |               0.07 |              0.07 |                0 |
| `PresentationsLayout.css`                |                  0.04 |                 0.04 |                   0 |               0.06 |              0.06 |                0 |
| ● `ErrorNotice.js`                       |                  7.87 |                    – |               −7.87 |               3.10 |                 – |            −3.10 |
| ● `ErrorNotice.css`                      |                  2.13 |                    – |               −2.13 |               0.58 |                 – |            −0.58 |
| ● `CloseButton.js`                       |                  1.35 |                    – |               −1.35 |               0.74 |                 – |            −0.74 |
| ● `locale.js`                            |                  1.14 |                    – |               −1.14 |               0.56 |                 – |            −0.56 |
| ● `RectangleButton.js`                   |                  0.57 |                    – |               −0.57 |               0.39 |                 – |            −0.39 |
| `useElementIsWide.js`                    |                  0.33 |                    – |               −0.33 |               0.25 |                 – |            −0.25 |
| ● `_plugin-vue_export-helper.js`         |                  0.08 |                    – |               −0.08 |               0.10 |                 – |            −0.10 |
| **Initial load total** — the ● chunks    |                241.66 |               258.33 |              +16.67 |              77.04 |             82.46 |            +5.42 |
| **Total**                                |                881.75 |               890.14 |               +8.39 |             284.57 |            287.36 |            +2.79 |
