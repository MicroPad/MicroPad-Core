package com.getmicropad.micropad;

import android.content.Context;
import android.os.Build;
import android.os.Environment;
import android.util.Base64;

import com.getmicropad.NPXParser.Asset;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parser;

import net.sf.jmimemagic.Magic;
import net.sf.jmimemagic.MagicException;
import net.sf.jmimemagic.MagicMatch;
import net.sf.jmimemagic.MagicMatchNotFoundException;
import net.sf.jmimemagic.MagicParseException;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;

public class FilesystemManager {
	public File workingDirectory;
	public File assetDirectory;

	public FilesystemManager(Context context) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
			this.workingDirectory = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS).getAbsolutePath()+"/MicroPad Notepads");
		}
		else {
			this.workingDirectory = new File(Environment.getExternalStorageDirectory()+"/Documents/MicroPad Notepads");
		}

		if (!this.workingDirectory.exists()) this.workingDirectory.mkdirs();

		//Clean cache if <500MB left on the device
		if (context.getCacheDir().getFreeSpace() < 500000000) for (File f : context.getCacheDir().listFiles()) f.delete();

		this.assetDirectory = new File(context.getCacheDir()+"/assets");
		if (!this.assetDirectory.exists()) this.assetDirectory.mkdirs();
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

			//Restore Assets
			ArrayList<Asset> assets = new ArrayList<>();
			for (String uuid : notepad.notepadAssets) assets.add(getAsset(uuid));
			notepad.setAssets(assets);

			Parser.toXml(notepad, notepadFile);
		} catch (Exception e) {
			return false;
		}
		finally {
			notepad.setAssets(new ArrayList<>());
		}

		return true;
	}

	public byte[] getAssetData(String uuid) {
		File assetFile = new File(this.assetDirectory+"/"+uuid);
		if (assetFile.exists()) {
			FileInputStream inputStream = null;
			try {
				inputStream = new FileInputStream(assetFile);
				byte[] tempStorage = new byte[1024];
				int bLength;
				ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
				while ((bLength = inputStream.read(tempStorage)) != -1) {
					byteArrayOutputStream.write(tempStorage, 0, bLength);
				}
				byteArrayOutputStream.flush();

				byte[] data = byteArrayOutputStream.toByteArray();
				byteArrayOutputStream.close();
				inputStream.close();

				return data;
			} catch (IOException e) {
				e.printStackTrace();
				if (inputStream != null) {
					try {
						inputStream.close();
					} catch (IOException e1) {}
				}
			}
		}

		return null;
	}

	public Asset getAsset(String uuid) {
		byte[] data = getAssetData(uuid);
		if (data == null) return null;

		//Get MIME type
		String mime;
		try {
			mime = Magic.getMagicMatch(data).getMimeType();
		} catch (MagicParseException | MagicMatchNotFoundException | MagicException e) {
			e.printStackTrace();
			mime = "application/octet-stream";
		}

		//Store as Base64
		String b64 = "data:"+mime+";base64," + Base64.encodeToString(data, Base64.NO_WRAP).replaceAll("(?:\\r\\n|\\n\\r|\\n|\\r)", "");
		return new Asset(uuid, b64);
	}

	public boolean setAsset(Asset asset, byte[] data) {
		try {
			FileOutputStream fileOutputStream = new FileOutputStream(this.assetDirectory+"/"+asset.getUuid());
			fileOutputStream.write(data);
			fileOutputStream.close();
			return true;
		} catch (java.io.IOException e) {
			e.printStackTrace();
			return false;
		}
	}

	public boolean setAsset(Asset asset) {
		try {
			FileOutputStream fileOutputStream = new FileOutputStream(this.assetDirectory+"/"+asset.getUuid());
			fileOutputStream.write(asset.getDataAsByteArray());
			fileOutputStream.close();
			return true;
		} catch (java.io.IOException e) {
			e.printStackTrace();
			return false;
		}
	}
}
