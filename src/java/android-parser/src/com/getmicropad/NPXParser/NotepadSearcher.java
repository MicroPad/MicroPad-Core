package com.getmicropad.NPXParser;

import java.util.ArrayList;
import java.util.List;

public class NotepadSearcher {
	private Notepad notepad;
	private List<Note> searchResults;
	private List<Integer> tree;

	public NotepadSearcher(Notepad notepad) {
		this.notepad = notepad;
		this.searchResults = new ArrayList<>();
		this.tree = new ArrayList<>();
	}

	public List<Note> search(String query) {
		this.searchResults.clear();
//		this.notepad.getSections().forEach(section -> this.searchResults.addAll(searchSection(section, query, this.notepad)));
		for (int i = 0; i < this.notepad.getSections().size(); i++) this.searchResults.addAll(searchSection(this.notepad.getSections().get(i), query, this.notepad));

		return this.searchResults;
	}

	private List<Note> searchSection(Section section, String query, Parent parent) {
		section.setParent(parent);
		List<Note> res = new ArrayList<>();
		if (section.notes != null) {
			for (Note note : section.notes) {
				note.setParent(section);
				Note searchRes = note.search(query);
				if (searchRes != null) res.add(searchRes);
			}
		}

		if (section.getSections() != null) {
			for (Section s : section.getSections()) {
				this.searchResults.addAll(searchSection(s, query, section));
			}
		}

		return res;
	}

	public List<Integer> getTree(Object baseObj) {
		if (baseObj == null || baseObj instanceof Notepad) {
			return this.tree;
		}

		Parent parent = null;

		if (baseObj instanceof Note) {
			this.tree.clear();
			parent = ((Note)baseObj).getParent();
			this.tree.add(0, ((Section)parent).notes.indexOf(baseObj));
		}
		else if (baseObj instanceof Section) {
			parent = ((Section)baseObj).getParent();

			this.tree.add(0, parent.getSections().indexOf(baseObj));
		}

		getTree(parent);
		return this.tree;
	}
}
