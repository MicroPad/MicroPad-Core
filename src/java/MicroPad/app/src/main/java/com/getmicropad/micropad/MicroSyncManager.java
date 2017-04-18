package com.getmicropad.micropad;

import com.google.gson.Gson;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

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
	public MicroSyncService service;
	private Map<String, S3Url> s3UrlMap = new HashMap<>();


	public MicroSyncManager(String syncUri) {
		this.syncUri = HttpUrl.parse(syncUri);
		this.oldMap = new JSONObject();
		this.gson = new Gson();
		Retrofit retrofit = new Retrofit.Builder()
				.baseUrl(this.syncUri)
//				.addConverterFactory(GsonConverterFactory.create())
				.addConverterFactory(new StringConverterFactory())
				.build();
		this.service = retrofit.create(MicroSyncService.class);
		this.updateS3UrlMap();
	}

	public void updateS3UrlMap() {
		s3UrlMap.clear();
		s3UrlMap.put("getChunkUpload", new S3Url("getChunkUpload", service));
		s3UrlMap.put("getChunkDownload", new S3Url("getChunkDownload", service));
		s3UrlMap.put("getMapUpload", new S3Url("getMapUpload", service));
		s3UrlMap.put("getMapDownload", new S3Url("getMapDownload", service));
	}

	public Map<String, S3Url> getS3UrlMap() {
		return this.s3UrlMap;
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
		@POST("getChunkUpload.php")
		Call<String> getChunkUpload(@Field("token") String token, @Field("filename") String filename, @Field("index") String index, @Field("multidex") String diffIndexes, @Field("md5") String lineNumberMD5);

		@FormUrlEncoded
		@POST("getChunkDownload.php")
		Call<String> getChunkDownload(@Field("token") String token, @Field("filename") String filename, @Field("index") String index, @Field("multidex") String diffIndexes, @Field("md5") String lineNumberMD5);

		@FormUrlEncoded
		@POST("getMapUpload.php")
		Call<String> getMapUpload(@Field("token") String token, @Field("filename") String filename);

		@GET("getMapDownload.php")
		Call<String> getMapDownload(@Query("token") String token, @Query("filename") String filename);

		@GET("getNotepads.php")
		Call<String> getNotepads(@Query("token") String token);

		@GET("getFreeSlots.php")
		Call<String> getFreeSlots(@Query("token") String token);
	}
}
