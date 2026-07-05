/**
 * Shared bits for drag-and-drop of sections/notes in the notepad explorer.
 *
 * The live drag payload is held in component state rather than read from
 * `dataTransfer` because `getData()` is blocked during `dragover` events
 * ("protected mode"). `setData()` is still called with this MIME type so that
 * Firefox starts the drag and so other drop targets (like the note viewer's
 * file drop) can recognise and ignore explorer drags via `dataTransfer.types`.
 */
export const EXPLORER_DRAG_MIME = 'application/x-micropad-move';

export type ExplorerDragItem = {
	type: 'section' | 'note',
	internalRef: string
};
