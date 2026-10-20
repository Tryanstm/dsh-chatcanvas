# Privacy and model usage

ChatCanvas is a third-party UI and structured-content plugin. It does not install an execution-review gate or change the host's permission preset. It has no plugin-owned analytics endpoint.

Editing, previewing and audio transcription use local code and packaged assets. Sending a message follows the host's normal message and attachment pipeline. Text recommendations, translations and recommendation quality checks call the model/provider configured in Harness and can incur additional usage. Selected text and relevant editing instructions are sent for these requests. UI preview programs cannot access arbitrary host files or the network.

AI-published documents and canvas snapshots, editor drafts and settings are stored locally. Do not include secrets, private chats or personal files in screenshots or bug reports. Use sanitized sample documents when reporting problems.
