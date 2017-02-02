package com.getmicropad.NPXParser;

import java.util.ArrayList;
import java.util.List;

public class NotepadSearcher {
	private Notepad notepad;
	private List<Note> searchResults;

	public NotepadSearcher(Notepad notepad) {
		this.notepad = notepad;
		this.searchResults = new ArrayList<>();
	}

	public List<Note> search(String query) {
		this.searchResults.clear();
		for (Section section : this.notepad.getSections()) {
			this.searchResults.addAll(searchSection(section, query));
		}

		return this.searchResults;
	}

	private List<Note> searchSection(Section section, String query) {
		List<Note> res = new ArrayList<>();
		if (section.notes != null) {
			for (Note note : section.notes) {
				Note searchRes = note.search(query);
				if (searchRes != null) res.add(searchRes);
			}
		}

		if (section.getSections() != null) {
			for (Section s : section.getSections()) {
				this.searchResults.addAll(searchSection(s, query));
			}
		}

		return res;
	}
}
