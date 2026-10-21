# Privacy and model usage

ChatCanvas is a third-party UI and structured-content plugin. It does not install an execution-review gate or change the host's permission preset. It has no plugin-owned analytics endpoint.

Editing, previewing and audio transcription use local code and packaged assets. Sending a message follows the host's normal message and attachment pipeline. Text recommendations, translations and recommendation quality checks call the model/provider configured in Harness and can incur additional usage. Selected text and relevant editing instructions are sent for these requests. UI preview programs cannot access arbitrary host files or the network.

For a new conversation whose first user message contains rich content, automatic title generation can make an additional request to the configured model/provider. That request includes a shortened description of the message and its visual content (up to 4,000 characters), rather than the structured transport envelope or runtime code. It can also incur model usage.

AI-published documents and canvas snapshots, editor drafts and settings are stored locally. Do not include secrets, private chats or personal files in screenshots or bug reports. Use sanitized sample documents when reporting problems.

With the default host data directory, this plugin's settings are in `storages/chatcanvas-preferences.json`. Published content keeps the compatible `storages/dsh-enhanced-renderer/` location; editor drafts use host browser storage. The old identifier is a compatibility detail, not an additional installed plugin. Back up the host's conversation and attachment data together with these files when migrating.
