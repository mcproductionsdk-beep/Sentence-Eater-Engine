# Sentence Eater Engine

Isolated staging migration from Educational-Games/main/sentence-games-release-candidate/eater/index.html, blob b155a17c6c7fd0b6a35cc207b752ff687804d0c4.

Run `node scripts/build-preview.mjs`. Cloudflare Pages uses `dist-preview`, root blank. Open the preview and explicitly choose Play sample. The fixed Spanish sample is for isolated gameplay review; this artifact does not load or publish shared sets.

Preserved: 33×19 desktop and 15×25 portrait mazes, central solid chamber, held-direction keyboard/D-pad and portrait swipe controls, five word ghosts, ordered collection, wrong-ghost life penalty, dots/power pellets, freeze, word flash and last-word/full-sentence completion.

Changed: one centered title and top action row (Pause, Restart, Main Menu, Sound), removed duplicate teacher menus/catalog/API access and integration badge, explicit sample start, cleanup on exit, hidden-tab pause, touch landscape controls. No production routing or backend changes.

Source comparisons: legacy Sentence-Eater/main/index.html blob 8ced6abb0e59ede6a0fe8c1d13a2629c44ee8be2 (36,966 chars), Educational-Games/main/sentence-eater/index.html blob ed7bd53c73d53988b3a696fb0504edd81e976bcd (44,336 chars), selected integrated baseline 44,770 chars. The integrated baseline includes central chamber collision/rendering and current portrait controls. The three copies are distinct; the integrated candidate remains authoritative for this migration.

Temporary isolation boundary: built-in Spanish fixture and device speech remain solely for this preview. Shared set adapter, central pronunciation and same-set return are the next integration gate. Do not treat the sample menu or local speech as a production shared-interface implementation. No production cutover authorized.

CI injects deterministic collision hooks only into its HTTP fixture; they are absent from dist-preview. Tests cover desktop, portrait and landscape sizing, keyboard motion, pause, restart, wrong/correct collection, pellets, sentence audio order, maze transition, sound and menu exit with external requests denied. Physical-device audio and user gameplay acceptance remain separate.

## Shared staging integration — 11 November 2026

This section supersedes the earlier temporary-isolation status. The approved solid walls, two midline passages, safe ghost respawn, ghost separation, readable labels, and mobile slide/tap guide are retained.

The engine accepts validated English/target pairs and the explicit locale from the staging shell through bt-sentence-eater/1. It sends pronunciation, cancellation, sound and menu events to the shared service. It makes no catalog, sharing or database requests. The standalone fixed sample remains a labeled isolated review fixture, not a public launcher.

Pinned integrated artifact: https://d03f8878.bt-sentence-eater-preview.pages.dev/ ; build ID e6c00888c6ed61dddc85e293ad6e0e3b68f2ce101a2c7e8fddf934c49d17ef43. Shared shell commit 84702e33fd71b71552a6932e8e45f31a8d8da702 ; deployed review https://4083277b.bt-vocabulary-platform-staging.pages.dev/ . Previous shell/lock and standalone artifacts remain available for rollback. Production routing is unchanged.

Automated engine run 42997456860 passed: desktop/portrait/landscape regression plus exact iframe handshake, custom content, word/full-sentence speech messages and menu event across ES/DE/DA/FR/IT with network intercepted. Central contract run 42997829317 passed. Browser verified built-in Present tense selection (9 pairs), custom 2-pair sharing to isolated staging, fresh student launch, correct English prompt and return to the same SUKVLZ4TF snapshot. Physical-device audible shared pronunciation remains a separate user check. This is staging evidence, not production acceptance or public release.
