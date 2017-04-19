package com.getmicropad.micropad;

import java.io.IOException;
import java.util.Calendar;
import java.util.Date;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class S3Url {
	private String url = "";
	private String filename = "";
	private String diffIndexes = "";
	private String request;
	private Date expireTime = new Date(0);
	private MicroSyncManager.MicroSyncService service;

	public S3Url(String request, MicroSyncManager.MicroSyncService service) {
		this.request = request;
		this.service = service;
	}

	public void getUrl(String token, String filename, String diffIndexes, S3Return callback) {
		Callback<String> reqCallback = new Callback<String>() {
			@Override
			public void onResponse(Call<String> call, Response<String> response) {
				if (response.isSuccessful()) {
					updateDate();
					url = response.body();
					callback.onResponse(url);
				}
				else {
					url = "";
					callback.onFailure();
				}
			}

			@Override
			public void onFailure(Call<String> call, Throwable t) {
				url = "";
				callback.onFailure();
			}
		};

		boolean notepadChanged = !(this.filename.equals(filename) && (diffIndexes.length() == 0 || this.diffIndexes.equals(diffIndexes)));
		if (notepadChanged) {
			this.filename = filename;
			this.diffIndexes = diffIndexes;
		}

		if (!notepadChanged && this.url.length() > 0 && new Date().before(this.expireTime)) {
			callback.onResponse(this.url);
		}
		else {
			switch (this.request) {
				case "getChunkUpload":
					service.getChunkUpload(token, filename, "0", diffIndexes, "m").enqueue(reqCallback);
					break;
				case "getChunkDownload":
					service.getChunkDownload(token, filename, "0", diffIndexes, "m").enqueue(reqCallback);
					break;
				case "getMapUpload":
					service.getMapUpload(token, filename).enqueue(reqCallback);
					break;
				case "getMapDownload":
					service.getMapDownload(token, filename).enqueue(reqCallback);
					break;
			}
		}
	}

	public void getUrl(String token, String filename, S3Return callback) {
		this.getUrl(token, filename, "", callback);
	}

	public String getUrl(String token, String filename, String diffIndexes) throws IOException {
		boolean notepadChanged = !(this.filename.equals(filename) && (diffIndexes.length() == 0 || this.diffIndexes.equals(diffIndexes)));
		if (notepadChanged) {
			this.filename = filename;
			this.diffIndexes = diffIndexes;
		}

		if (!notepadChanged && this.url.length() > 0 && new Date().before(this.expireTime)) {
			return this.url;
		}
		else {
			Response<String> res = null;
			switch (this.request) {
				case "getChunkUpload":
					res = service.getChunkUpload(token, filename, "0", diffIndexes, "m").execute();
					break;
				case "getChunkDownload":
					res = service.getChunkDownload(token, filename, "0", diffIndexes, "m").execute();
					break;
				case "getMapUpload":
					res = service.getMapUpload(token, filename).execute();
					break;
				case "getMapDownload":
					res = service.getMapDownload(token, filename).execute();
					break;
			}

			if (res != null && res.isSuccessful()) {
				this.updateDate();
				this.url = res.body();
			}
			else {
				this.url = "";
				throw new IOException();
			}
			return this.url;
		}
	}

	public String getUrl(String token, String filename) throws IOException {
		return this.getUrl(token, filename, "");
	}

	private void updateDate() {
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.MINUTE, 20);
		this.expireTime = calendar.getTime();
	}

	abstract static class S3Return {
		public abstract void onResponse(String url);
		public abstract void onFailure();
	}
}
