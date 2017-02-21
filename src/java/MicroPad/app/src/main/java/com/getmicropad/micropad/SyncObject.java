package com.getmicropad.micropad;

import org.json.JSONException;
import org.json.JSONObject;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

public class SyncObject {
	private JSONObject map = new JSONObject();
	private byte[][] chunks;

	public SyncObject(byte[] npxBytes, String lastModified) throws JSONException, NoSuchAlgorithmException {
		this.map.put("lastModified", lastModified);

		this.chunks = new byte[(int)Math.ceil((double)npxBytes.length/1000000)][1000000];
		int count = 0;
		int pos = 0;
		MessageDigest md5 = MessageDigest.getInstance("MD5");
		while (pos < npxBytes.length) {
			int newPos = Math.min(pos+1000000, npxBytes.length);
			this.chunks[count] = Arrays.copyOfRange(npxBytes, pos, newPos);
			pos = newPos;

			byte[] digest = md5.digest(this.chunks[count]);
			StringBuilder sb = new StringBuilder();
			for (int i = 0; i < digest.length; ++i) {
				sb.append(Integer.toHexString((digest[i] & 0xFF) | 0x100).substring(1,3));
			}
			JSONObject chunkMetadata = new JSONObject();
			chunkMetadata.put("md5", sb.toString());
			this.map.put(""+count, chunkMetadata);
			count++;
		}
	}

	public JSONObject getMap() {
		return this.map;
	}

	public byte[][] getChunks() {
		return this.chunks;
	}
}