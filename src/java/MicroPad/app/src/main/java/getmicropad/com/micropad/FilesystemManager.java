package getmicropad.com.micropad;

import android.os.Build;
import android.os.Environment;

import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parser;

import java.io.File;
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
		File[] contents = this.workingDirectory.listFiles((File file, String name) -> name.toLowerCase().endsWith(".npx"));
		return contents;
	}
}
