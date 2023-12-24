export type ModalId =
	'quick-switch-modal'
	| 'export-all-notepads-modal'
	| 'whats-new-modal'
	| 'search-modal'
	| 'sync-pro-error-modal'
	| 'manage-microsync-modal'
	| 'microsync-login-modal'
	| `bib-modal-${string}-${string}`
	| `formatting-help-modal-${string}`
	| `notepad-edit-object-modal-${string}`
	| `np-title-${string}`
	| 'due-date-options-modal';
