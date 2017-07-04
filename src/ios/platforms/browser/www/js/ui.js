function newNotepad() {
	navigator.notification.prompt("Notepad Title:", (results) => {
		var title = results.input1;
		notepad = parser.createNotepad(title);

		var demoNote = parser.createNote("Example Note", ['asciimath']);
		var demoSection = parser.createSection("Example Section");
		demoSection.addNote(demoNote);
		notepad.addSection(demoSection);

		//TODO: Load notepad and save
	}, "New Notepad", ["Add", "Cancel"]);
}