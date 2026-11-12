# Portrait people templates

Public exports: `peopleRenderers` and `peopleDemos` from `../groups/people.tsx`.
The renderers consume the confirmed portrait schema, with `at` already converted to local seconds. They draw a 360×640 logical canvas; the external PortraitCanvas owns scaling.

## Image preparation

`prepare.py` uses Pillow, NumPy and OpenCV. It is an asset preparation step, never a video renderer.

- `crop INPUT OUTPUT.png`: crop transparent item artwork to its alpha bounds (V01_005).
- `intro INPUT OUTPUT.png`: V04_001 source portrait resize and fixed lower-body displacement; assign output to `_prepared.portraitImage`.
- `flash INPUT OUTPUT_DIRECTORY`: V11_001 crop to alpha bounds and compute static source-dependent highlight, edge, glow, wake and alpha maps. Assign `OUTPUT_DIRECTORY/flash.json` to `_prepared.flashData` and keep its sibling `flash.bin`. The binary is little-endian Uint16 planes, range encoded by JSON. Runtime dequantizes to Float32, applies original flash curves and per-frame Gaussian exposure trailing, and composites normal + additive light layers.

These `_prepared` fields are internal, excluded from FC schemas. No content timing, visual override, animation video or pre-rendered animation frame is hidden in them.

## Fixed source-derived details

- Item cards: original 231×173 geometry, double rim, diagonal translucent gradient and two placements; content appears exactly at its cue.
- Comment panels: four-corner projective transformation, opposing entry, two-card merge, upward travel and tall-card perspective. The content card is live HTML. Null authors/avatars are omitted; no invented platform metadata, counts, dates or anonymized names are drawn.
- Relation diagram: original node bounds and three-column arrow geometry. The confirmed schema replaces source-specific flag/pole background with a neutral sky texture. Each node's media clock begins at its own cue.
- Collage: original frame-by-frame opposed translation, lower feather masks, procedural glass fragments/haze and timed spark bursts. No source competition footage or scoreboard is built into the renderer.
- Profile: neutral dark stage, original portrait overshoot samples, card fade/exit, original smoke-texture remapping formulas and title motion samples. Card exit/smoke timing is tied to headline, not absolute source-film time.
- Flash: original 16-sample body/shutter/edge/highlight curves and image-derived spatial fields. The source film's first 39 frames and its later unrelated background fade/change are omitted.

## Asset provenance

Source implementation paths are recorded in `scratch/portrait-mg/people/DONE.md`. Original Python outputs are used solely for reference comparisons outside public assets.

Original independent material is reused: generated clothing icons and avatars; generated fictional athlete/person alpha cutouts; generated smoke texture; independent training/speaker footage. V03/V04 source projects identify the training video as 裴洛阳《补档 20171101赛前训练》, CC BY 2.5, https://commons.wikimedia.org/wiki/File:%E8%A1%A5%E6%A1%A3_20171101%E8%B5%9B%E5%89%8D%E8%AE%AD%E7%BB%83.webm . The V04 card art combines independent training footage with generated trophy artwork. V11 person and background were independently generated without reference images; original provenance is `D:/MG_Work/V11_001/versions/v014/template/assets/sources.json`.

`preview-background.mp4` contains only trimmed independent base media, never template overlays, reference-film crops or MG rendered frames. All formal component animations are implemented in TSX/Canvas. The flag-texture image in the relation demo is supplied explicitly as node content; the renderer never inserts a flag automatically.
