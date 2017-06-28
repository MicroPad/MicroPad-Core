package com.getmicropad.micropad;

import com.getmicropad.NPXParser.Notepad;

public class InteropSingleton {
	private static InteropSingleton instance = new InteropSingleton();

	public static InteropSingleton getInstance() {
		if (instance == null) instance = new InteropSingleton();
		return instance;
	}

	private InteropSingleton() {
	}

	private Notepad notepad;

	public Notepad getNotepad() {
		return notepad;
	}

	public void setNotepad(Notepad notepad) {
		this.notepad = notepad;
	}
}
