# Sentence Eater Engine

Isolated staging migration from Educational-Games/main/sentence-games-release-candidate/eater/index.html, blob b155a17c6c7fd0b6a35cc207b752ff687804d0c4.

Run `node scripts/build-preview.mjs`. Cloudflare Pages uses `dist-preview`, root blank. Open the preview and explicitly choose Play sample. The fixed Spanish sample is for isolated gameplay review; this artifact does not load or publish shared sets.

Preserved: 33×19 desktop and 15×25 portrait mazes, central solid chamber, held-direction keyboard/D-pad and portrait swipe controls, five word ghosts, ordered collection, wrong-ghost life penalty, dots/power pellets, freeze, word flash and last-word/full-sentence completion.

Changed: one centered title and top action row (Pause, Restart, Main Menu, Sound), removed duplicate teacher menus/catalog/API access and integration badge, explicit sample start, cleanup on exit, hidden-tab pause, touch landscape controls. No production routing or backend changes.

Source comparisons: legacy Sentence-Eater/main/index.html blob 8ced6abb0e59ede6a0fe8c1d13a2629c44ee8be2 (36,966 chars), Educational-Games/main/sentence-eater/index.html blob ed7bd53c73d53988b3a696fb0504edd81e976bcd (44,336 chars), selected integrated baseline 44,770 chars. The integrated baseline includes central chamber collision/rendering and current portrait controls. The three copies are distinct; the integrated candidate remains authoritative for this migration.

Temporary isolation boundary: built-in Spanish fixture and device speech remain solely for this preview. Shared set adapter, central pronunciation and same-set return are the next integration gate. Do not treat the sample menu or local speech as a production shared-interface implementation. No production cutover authorized.

CI injects deterministic collision hooks only into its HTTP fixture; they are absent from dist-preview. Tests cover desktop, portrait and landscape sizing, keyboard motion, pause, restart, wrong/correct collection, pellets, sentence audio order, maze transition, sound and menu exit with external requests denied. Physical-device audio and user gameplay acceptance remain separate.
