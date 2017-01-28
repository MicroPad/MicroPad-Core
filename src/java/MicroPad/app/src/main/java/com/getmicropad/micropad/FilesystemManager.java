package com.getmicropad.micropad;

import android.os.Build;
import android.os.Environment;

import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parser;

import java.io.File;
import java.io.FilenameFilter;
import java.util.ArrayList;
import java.util.List;

public class FilesystemManager {
	private File workingDirectory;

	public FilesystemManager() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
			this.workingDirectory = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS).getAbsolutePath()+"/MicroPad Notepads");
		}
		else {
			this.workingDirectory = new File(Environment.getExternalStorageDirectory()+"/Documents/MicroPad Notepads");
		}

		if (!this.workingDirectory.exists()) this.workingDirectory.mkdirs();
	}

	public List<Notepad> getNotepads() throws Exception {
		List<Notepad> returnList = new ArrayList<>();

		File[] contents = this.workingDirectory.listFiles((dir, name) -> {
			return name.toLowerCase().endsWith(".npx");
		});

		for (File file : contents) {
			returnList.add(Parser.parseNpx(file));
		}

		return returnList;
	}

	public File[] getNotepadFiles() {
		return this.workingDirectory.listFiles(new FilenameFilter() {
			@Override
			public boolean accept(File file, String name) {
				return name.toLowerCase().endsWith(".npx");
			}
		});
	}

	public boolean saveNotepad(Notepad notepad) {
		try {
			File notepadFile = new File(this.workingDirectory.getAbsolutePath()+"/"+notepad.getTitle().replaceAll("/[^a-z0-9 ]/gi/", "")+".npx");
			if (!notepadFile.exists() && !notepadFile.createNewFile()) return false;

			Parser.toXml(notepad, notepadFile);
		} catch (Exception e) {
			return false;
		}

		return true;
	}
}
