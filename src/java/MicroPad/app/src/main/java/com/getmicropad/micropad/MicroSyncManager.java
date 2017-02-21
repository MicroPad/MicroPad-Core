package com.getmicropad.micropad;

import com.google.gson.Gson;

import org.json.JSONObject;

import okhttp3.HttpUrl;
import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Query;

public class MicroSyncManager {
	private HttpUrl syncUri;
	private JSONObject oldMap;
	private Gson gson;
	private Retrofit retrofit;
	public MicroSyncService service;

	public MicroSyncManager(String syncUri) {
		this.syncUri = HttpUrl.parse(syncUri);
		this.oldMap = new JSONObject();
		this.gson = new Gson();
		this.retrofit = new Retrofit.Builder()
				.baseUrl(this.syncUri)
//				.addConverterFactory(GsonConverterFactory.create())
				.addConverterFactory(new StringConverterFactory())
				.build();
		this.service = this.retrofit.create(MicroSyncService.class);
	}

	public JSONObject getOldMap() {
		return this.oldMap;
	}

	public void setOldMap(JSONObject oldMap) {
		this.oldMap = oldMap;
	}

	public interface MicroSyncService {
		@FormUrlEncoded
		@POST("login.php")
		Call<String> login(@Field("username") String username, @Field("password") String password);

		@FormUrlEncoded
		@POST("signup.php")
		Call<String> signup(@Field("username") String username, @Field("password") String password);

		@FormUrlEncoded
		@POST("hasAddedNotepad.php")
		Call<String> hasAddedNotepad(@Field("token") String token, @Field("filename") String filename);

		@FormUrlEncoded
		@POST("addNotepad.php")
		Call<String> addNotepad(@Field("token") String token, @Field("filename") String filename, @Field("lastModified") String lastModified);

		@FormUrlEncoded
		@POST("sync.php")
		Call<String> sync(@Field("token") String token, @Field("filename") String filename, @Field("lastModified") String lastModified, @Field("method") String method);

		@FormUrlEncoded
		@POST("getChunkUpload.php")
		Call<String> getChunkUpload(@Field("token") String token, @Field("filename") String filename, @Field("index") String index, @Field("md5") String lineNumberMD5);

		@FormUrlEncoded
		@POST("getChunkDownload.php")
		Call<String> getChunkDownload(@Field("token") String token, @Field("filename") String filename, @Field("index") String index, @Field("md5") String lineNumberMD5);

		@FormUrlEncoded
		@POST("getMapUpload.php")
		Call<String> getMapUpload(@Field("token") String token, @Field("filename") String filename);

		@GET("getNotepads.php")
		Call<String> getNotepads(@Query("token") String token);

		@GET("getFreeSlots.php")
		Call<String> getFreeSlots(@Query("token") String token);
	}
}
