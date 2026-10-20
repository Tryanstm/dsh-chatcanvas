# Integration

ChatCanvas provides the existing `enhancedRenderer` client service for compatibility. A caller owns the session and branch, passes stable native message keys, and disposes mounts when its view closes. The service exposes `mount`, `registerReasoningDecorator`, rich transport and canvas submission functions. Inspect `src/host/client.tsx` for current exports.

On the host, the optional `chatCanvasTools` catalog exposes `owns(definition): boolean`. It compares the actual registered implementation identity. It does not grant permission or intercept execution. Consumers remain responsible for their own policy. ChatCanvas runs independently when no consumer exists.

Document envelopes, `dser-*` data attributes, snapshot storage paths and the `dsh-visual-questions` Skill name remain stable so existing submitted documents and integrations continue to load. Install ChatCanvas in place of the previous renderer; running both presentation plugins in the same profile is unsupported.
