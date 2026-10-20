# Document and tool protocol

The authoritative runtime schemas are `src/protocol.ts`, `src/ui/blocks.ts`, and `src/host/tool-schema.ts`.

Public tools: `canvas_publish`, `canvas_read`, `canvas_question`, `document_publish`, `document_read`, `ui_publish`, `math_publish`, `music_publish`, `text_publish`, `ui_simulate`, `renderer_help`, and `creation_decide`.

A canvas contains geometry, text, images, math, UI and music objects. Shared fields are `id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `opacity`, `z`. Larger z paints above smaller z; later insertion wins on equal z. Selecting an object does not change its saved z. Historical table data remains readable as ordinary tables; new enhanced table components are retired.

Math uses `spec.items[].expression`. UI uses `document.pages`, state and programs; UI programs run in an isolated QuickJS context. New UI pages have a transparent background until explicitly styled. Use `renderer_help` for full examples and event shapes. Simulation checks logic, not visual quality.

Plain `textBox` nodes retain text and line breaks only. Writing boxes use `attrs.variant="writing"` and retain rich formatting. Rich envelopes and native attachment references preserve structured editing data. Editable copies receive new outer identities; sent messages remain read-only.

Snapshots and documents are local data under the Harness storage directory. Migrating a conversation also requires its referenced snapshot/document files and native attachments. Removing the plugin does not delete existing conversation content or drafts.
