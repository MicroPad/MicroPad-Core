$('#new-notepad-title').keydown(e => {
	if (e.which === 13) {
		e.preventDefault();
		newNotepad();
		$('#new-notepad').modal('close');
	}
});

$('#new-section-title').keydown(e => {
	if (e.which === 13) {
		e.preventDefault();
		newSection();
		$('#new-section').modal('close');
	}
});

$('#new-note-title').keydown(e => {
	if (e.which === 13) {
		e.preventDefault();
		newNote();
		$('#new-note').modal('close');
	}
});
