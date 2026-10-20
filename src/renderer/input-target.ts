/** A noneditable component inside a rich editor is not itself a text input. */
export function isTextInput(target:EventTarget|null){const el=target as Element|null;return !!el?.closest?.('input,textarea,select')||el?.closest?.('[contenteditable]')?.getAttribute('contenteditable')==='true';}
