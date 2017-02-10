package com.getmicropad.micropad;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.support.design.widget.Snackbar;
import android.support.percent.PercentFrameLayout;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v4.content.FileProvider;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Base64;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ListAdapter;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.androidnetworking.AndroidNetworking;
import com.androidnetworking.common.ANRequest;
import com.androidnetworking.common.Priority;
import com.androidnetworking.error.ANError;
import com.androidnetworking.interfaces.JSONObjectRequestListener;
import com.annimon.stream.Stream;
import com.getmicropad.NPXParser.DrawingElement;
import com.getmicropad.NPXParser.FileElement;
import com.getmicropad.NPXParser.ImageElement;
import com.getmicropad.NPXParser.MarkdownElement;
import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.NoteElement;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.NotepadSearcher;
import com.getmicropad.NPXParser.Parent;
import com.getmicropad.NPXParser.Parser;
import com.getmicropad.NPXParser.RecordingElement;
import com.getmicropad.NPXParser.Section;
import com.getmicropad.NPXParser.Source;
import com.google.gson.Gson;
import com.mikepenz.google_material_typeface_library.GoogleMaterial;
import com.mikepenz.iconics.IconicsDrawable;
import com.mikepenz.iconics.context.IconicsContextWrapper;
import com.nononsenseapps.filepicker.FilePickerActivity;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import top.oply.opuslib.OpusRecorder;

public class BaseActivity extends AppCompatActivity {
	static final int PERMISSION_REQ_FILESYSTEM = 0;
	static final int PERMISSION_REQ_RECORD = 1;
	static final int IMAGE_SELECTOR = 1;
	static final int FILE_SELECTOR = 2;
	boolean isSaving = false;
	boolean isSyncing = false;
	boolean isNotepadSyncing = false;
	Notepad notepad;
	Note note;
	List<Integer> parentTree = new ArrayList<>();
	FilesystemManager filesystemManager = new FilesystemManager();
	List<String> types;
	ListAdapter insertAdapter;
	NotepadSearcher notepadSearcher;
	MicroSyncManager syncer;
	SharedPreferences prefs;
	WebView noteContainer;
	ImageView syncBtn;

	@Override
	protected void attachBaseContext(Context newBase) {
		super.attachBaseContext(IconicsContextWrapper.wrap(newBase));
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		this.prefs = PreferenceManager.getDefaultSharedPreferences(this);
		this.syncer = new MicroSyncManager("https://getmicropad.com/sync/api/");
		AndroidNetworking.initialize(getApplicationContext());

		/* Request permissions */
		if ((ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) | ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)) != PackageManager.PERMISSION_GRANTED)  {
			ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQ_FILESYSTEM);
		}
		else {
			this.filesystemManager = new FilesystemManager();
		}
	}

	@SuppressLint("SetJavaScriptEnabled")
	protected void loadNote(Note note) {
		if (note.bibliography == null) note.bibliography = new ArrayList<>();
		if (note.addons == null) note.addons = new ArrayList<>();
		this.setNote(note);

		new Thread(() -> {
			types = new ArrayList<>();
			types.add("Text (Markdown)");
			types.add("Image");
			types.add("File");
			types.add("Recording");
			insertAdapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, types);

			runOnUiThread(() -> {
				ListView insertList = (ListView)findViewById(R.id.insert_list);
				insertList.setAdapter(insertAdapter);
			});
		}).start();

		noteContainer = (WebView)findViewById(R.id.note_webview);
		noteContainer.getSettings().setJavaScriptEnabled(true);
		noteContainer.addJavascriptInterface(this, "Native");
		noteContainer.getSettings().setSupportZoom(true);
		noteContainer.getSettings().setBuiltInZoomControls(true);
		noteContainer.getSettings().setDisplayZoomControls(false);
		noteContainer.setWebChromeClient(new WebChromeClient() {
			@Override
			public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
				Log.wtf("m3k", consoleMessage.message() + " -- From line "
						+ consoleMessage.lineNumber() + " of "
						+ consoleMessage.sourceId());
				return super.onConsoleMessage(consoleMessage);
			}
		});

		noteContainer.setWebViewClient(new WebViewClient() {
			public void onPageFinished(WebView view, String url) {
				for (NoteElement element : note.elements) {
					displayElement(element);
				}
				refreshBilbiography();

				new Thread(() -> {
					try {
						Thread.sleep(1000);

						runOnUiThread(() -> {
							findViewById(R.id.progress).setVisibility(View.GONE);
							noteContainer.setVisibility(View.VISIBLE);
						});
					} catch (InterruptedException e) { }
				}).start();
			}

			@Override
			public boolean shouldOverrideUrlLoading(WebView view, String url) {
				if (url != null) {
					handleURI(Uri.parse(url));
					return true;
				}
				return false;
			}

			@Override
			public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
					handleURI(request.getUrl());
					return true;
				}
				return false;
			}

			private void handleURI(final Uri uri) {
				Intent intent = new Intent(Intent.ACTION_VIEW, uri);
				startActivity(intent);
			}
		});
		noteContainer.loadUrl("file:///android_asset/www/viewer.html");
	}

	protected void displayElement(NoteElement element) {
		String extraArgs = "{}";
		String content = element.getContent();
		if (element instanceof MarkdownElement) {
			extraArgs = String.format("{fontSize: \"%s\"}", ((MarkdownElement) element).getFontSize());
			try {
				content = URLEncoder.encode(content, "UTF-8").replace("+", "%20");
			} catch (UnsupportedEncodingException e) {
				e.printStackTrace();
				return;
			}
		}
		else if (element instanceof DrawingElement) {
			try {
				byte[] decoded = Base64.decode(element.getContent().split(",")[1], Base64.DEFAULT);
				Bitmap decodedBmp = Helpers.TrimBitmap(BitmapFactory.decodeByteArray(decoded, 0, decoded.length));
				ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
				decodedBmp.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
				content = "data:image/png;base64," + Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP).replaceAll("(?:\\r\\n|\\n\\r|\\n|\\r)", "");
			}
			catch (Exception e) {
				return;
			}
		}
		else if (element instanceof FileElement) {
			content = ((FileElement) element).getFilename();
		}

		noteContainer.evaluateJavascript(String.format("displayElement(\"%s\", \"%s\", \"%s\", \"%s\", \"%s\", \"%s\", %s)", element.getId(), content, element.getX(), element.getY(), element.getWidth(), element.getHeight(), extraArgs), (s) -> {});
	}

	protected void refreshBilbiography() {
		for (Source source : note.bibliography) {
			noteContainer.evaluateJavascript(String.format("displaySource(\"%s\", \"%s\", \"%s\")", source.getId(), source.getItem(), source.getUrl()), (s) -> {});
		}
	}

	protected NoteElement updateElement(NoteElement element, String content, String width, String height, String source) {
		this.getNote().elements.remove(element);
		element.setContent(content);
		element.setWidth(width);
		element.setHeight(height);

		boolean hasSet = false;
		Source[] res = Stream.of(this.getNote().bibliography).filter(s -> s.getItem().equals(element.getId())).toArray(Source[]::new);
		if (res.length > 0) {
			Source s = res[0];
			if (s.getUrl() == null || s.getUrl().length() == 0) {
				if (source.length() > 0) {
					s.setUrl(source);
					hasSet = true;
				}
				else {
					this.getNote().bibliography.remove(s);
				}
			}
			else {
				if (source.length() > 0) {
					s.setUrl(source);
					hasSet = true;
				}
				else {
					this.getNote().bibliography.remove(s);
				}
			}

			if (hasSet) {
				this.getNote().bibliography.remove(s);
				this.getNote().bibliography.add(s);
			}
		}
		if (!hasSet && source.length() > 0) {
			this.getNote().bibliography.add(new Source(getNote().bibliography.size()+1, element.getId(), source));
		}

		this.getNote().elements.add(element);
		runOnUiThread(() -> updateNotepad(this.getNote()));
		return element;
	}

	String currentContent;
	View dialogView;
	String newFilename;
	@JavascriptInterface
	public void openEditor(String id) {
		runOnUiThread(() -> Stream.of(getNote().elements).filter(element -> element.getId().equals(id)).forEach(element -> {
				AlertDialog.Builder builder = new AlertDialog.Builder(this)
						.setTitle("Edit Element")
						.setCancelable(true);
				LayoutInflater inflater = this.getLayoutInflater();

				if (element instanceof MarkdownElement) {
					dialogView = inflater.inflate(R.layout.markdown_editor, null);
					builder.setView(dialogView);

					EditText markdownInput = (EditText)dialogView.findViewById(R.id.markdown_input);
					EditText sourceInput = (EditText)dialogView.findViewById(R.id.source_input);
					EditText fontInput = (EditText)dialogView.findViewById(R.id.font_input);
					EditText widthInput = (EditText)dialogView.findViewById(R.id.width_input);
					EditText heightInput = (EditText)dialogView.findViewById(R.id.height_input);

					markdownInput.setText(element.getContent());
					fontInput.setText(((MarkdownElement) element).getFontSize());
					widthInput.setText(element.getWidth());
					heightInput.setText(element.getHeight());
					Stream.of(getNote().bibliography).filter(source -> source.getItem().equals(id)).forEach(source -> {
						if (source.getUrl() == null || source.getUrl().length() == 0) {
							getNote().bibliography.remove(source);
							return;
						}
						sourceInput.setText(source.getUrl());
					});

					//TODO: Handle formatting bar

					builder.setPositiveButton("Save", (dialog, which) -> {
						((MarkdownElement) element).setFontSize(fontInput.getText().toString());
						displayElement(updateElement(element, markdownInput.getText().toString(), widthInput.getText().toString(), heightInput.getText().toString(), sourceInput.getText().toString()));
						refreshBilbiography();
					});
				}
				else if (element instanceof DrawingElement) {
					dialogView = inflater.inflate(R.layout.drawing_editor, null);
					builder.setView(dialogView);

					EditText sourceInput = (EditText)dialogView.findViewById(R.id.source_input);

					Stream.of(getNote().bibliography).filter(source -> source.getItem().equals(id)).forEach(source -> {
						if (source.getUrl() == null || source.getUrl().length() == 0) {
							getNote().bibliography.remove(source);
							return;
						}
						sourceInput.setText(source.getUrl());
					});

					builder.setPositiveButton("Save", (dialog, which) -> {
						displayElement(updateElement(element, element.getContent(), element.getWidth(), element.getHeight(), sourceInput.getText().toString()));
						refreshBilbiography();
					});
				}
				else if (element instanceof ImageElement) {
					dialogView = inflater.inflate(R.layout.image_editor, null);
					builder.setView(dialogView);

					EditText sourceInput = (EditText)dialogView.findViewById(R.id.source_input);
					EditText widthInput = (EditText)dialogView.findViewById(R.id.width_input);
					EditText heightInput = (EditText)dialogView.findViewById(R.id.height_input);

					widthInput.setText(element.getWidth());
					heightInput.setText(element.getHeight());
					Stream.of(getNote().bibliography).filter(source -> source.getItem().equals(id)).forEach(source -> {
						if (source.getUrl() == null || source.getUrl().length() == 0) {
							getNote().bibliography.remove(source);
							return;
						}
						sourceInput.setText(source.getUrl());
					});

					currentContent = element.getContent();

					//Handle 'browse' button
					dialogView.findViewById(R.id.browse_button).setOnClickListener(v -> {
						Intent intent = new Intent();
						intent.setType("image/*");
						intent.setAction(Intent.ACTION_PICK);
						startActivityForResult(intent, IMAGE_SELECTOR);
					});

					builder.setPositiveButton("Save", (dialog, which) -> {
						displayElement(updateElement(element, currentContent, widthInput.getText().toString(), heightInput.getText().toString(), sourceInput.getText().toString()));
						currentContent = null;
						refreshBilbiography();
					});
				}
				else if (element instanceof RecordingElement) {
					dialogView = inflater.inflate(R.layout.recording_editor, null);
					builder.setView(dialogView);

					EditText sourceInput = (EditText)dialogView.findViewById(R.id.source_input);

					Stream.of(getNote().bibliography).filter(source -> source.getItem().equals(id)).forEach(source -> {
						if (source.getUrl() == null || source.getUrl().length() == 0) {
							getNote().bibliography.remove(source);
							return;
						}
						sourceInput.setText(source.getUrl());
					});

					currentContent = element.getContent();
					newFilename = ((FileElement) element).getFilename();

					//Handle 'record' button
					Button recordBtn = (Button)dialogView.findViewById(R.id.recording_button);
					Button stopRecordBtn = (Button)dialogView.findViewById(R.id.stop_recording_button);
					OpusRecorder opusRecorder = OpusRecorder.getInstance();

					recordBtn.setOnClickListener(v -> {
						if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)  {
							ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, PERMISSION_REQ_RECORD);
						}
						else {
							recordBtn.setVisibility(View.GONE);
							stopRecordBtn.setVisibility(View.VISIBLE);

							newFilename = this.getNote().getTitle()+" "+android.text.format.DateFormat.format("yyyy-MM-dd hh:mm:ss a", new Date())+".ogg";
							opusRecorder.startRecording(getCacheDir().getAbsolutePath()+"/"+newFilename);
						}
					});
					stopRecordBtn.setOnClickListener(v -> {
						stopRecordBtn.setVisibility(View.GONE);
						recordBtn.setVisibility(View.VISIBLE);

						opusRecorder.stopRecording();

						FileInputStream inputStream = null;
						try {
							inputStream = new FileInputStream(new File(getCacheDir().getAbsolutePath()+"/"+newFilename));
							byte[] tempStorage = new byte[1024];
							int bLength;
							ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
							while ((bLength = inputStream.read(tempStorage)) != -1) {
								byteArrayOutputStream.write(tempStorage, 0, bLength);
							}
							byteArrayOutputStream.flush();

							currentContent = "data:audio/ogg;base64," + Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP).replaceAll("(?:\\r\\n|\\n\\r|\\n|\\r)", "");
							byteArrayOutputStream.close();
							inputStream.close();
						} catch (IOException e) {
							e.printStackTrace();
							if (inputStream != null) {
								try {
									inputStream.close();
								} catch (IOException e1) {}
							}
						}
					});

					builder.setPositiveButton("Save", (dialog, which) -> {
						((RecordingElement) element).setFilename(newFilename);
						displayElement(updateElement(element, currentContent, "auto", "auto", sourceInput.getText().toString()));
						currentContent = null;
						newFilename = null;
						opusRecorder.release();
						refreshBilbiography();
					});
				}
				else if (element instanceof FileElement) {
					dialogView = inflater.inflate(R.layout.file_editor, null);
					builder.setView(dialogView);

					EditText sourceInput = (EditText)dialogView.findViewById(R.id.source_input);

					Stream.of(getNote().bibliography).filter(source -> source.getItem().equals(id)).forEach(source -> {
						if (source.getUrl() == null || source.getUrl().length() == 0) {
							getNote().bibliography.remove(source);
							return;
						}
						sourceInput.setText(source.getUrl());
					});

					currentContent = element.getContent();
					newFilename = ((FileElement) element).getFilename();

					//Handle 'browse' button
					dialogView.findViewById(R.id.browse_button).setOnClickListener(v -> {
						Intent intent = new Intent(this, FilePickerActivity.class);
						intent.putExtra(FilePickerActivity.EXTRA_START_PATH, Environment.getExternalStorageDirectory().getPath());
						startActivityForResult(intent, FILE_SELECTOR);
					});

					builder.setPositiveButton("Save", (dialog, which) -> {
						((FileElement) element).setFilename(newFilename);
						displayElement(updateElement(element, currentContent, "auto", "auto", sourceInput.getText().toString()));
						currentContent = null;
						newFilename = null;
						refreshBilbiography();
					});
				}

				builder.setNegativeButton("Delete", (dialog, which) -> {
					new AlertDialog.Builder(this)
							.setTitle("Confirm Deletion")
							.setMessage("Are you sure you want to delete this?")
							.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
							.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
								getNote().elements.remove(element);
								noteContainer.evaluateJavascript(String.format("removeElement(\"%s\")", element.getId()), s -> {});
								updateNotepad(getNote());
							}).setNegativeButton(android.R.string.no, null).show();
				});

				AlertDialog dialog = builder.create();
				dialog.show();
			}));
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		ProgressDialog dialog = new ProgressDialog(this);
		runOnUiThread(() -> {
			dialog.setProgressStyle(ProgressDialog.STYLE_SPINNER);
			dialog.setMessage("Getting Data...\nThis may take a while");
			dialog.setIndeterminate(true);
			dialog.setCanceledOnTouchOutside(false);
			dialog.show();
		});
		new Thread(() -> {
			switch (requestCode) {
				case IMAGE_SELECTOR:
					if (data != null && resultCode == RESULT_OK) {
						Uri selFile = data.getData();

						try {
							Bitmap bitmap = MediaStore.Images.Media.getBitmap(getContentResolver(), selFile);
							ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
							bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
							currentContent = "data:image/png;base64," + Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP).replaceAll("(?:\\r\\n|\\n\\r|\\n|\\r)", "");
							runOnUiThread(() -> {
								((TextView)dialogView.findViewById(R.id.filename_text)).setText(getFilenameFromUri(selFile));
								dialog.dismiss();
							});

						} catch (IOException e) {
							e.printStackTrace();
						}
					}
					break;

				case FILE_SELECTOR:
					if (resultCode == RESULT_OK) {
						Uri selFile = data.getData();
						InputStream inputStream = null;
						try {
							inputStream = getContentResolver().openInputStream(selFile);
							byte[] tempStorage = new byte[1024];
							int bLength;
							ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
							while ((bLength = inputStream.read(tempStorage)) != -1) {
								byteArrayOutputStream.write(tempStorage, 0, bLength);
							}
							byteArrayOutputStream.flush();

							newFilename = URLDecoder.decode(new File(selFile.toString()).getName(), "UTF-8");
							String mime = URLConnection.guessContentTypeFromName(newFilename);
							if (mime == null) mime = URLConnection.guessContentTypeFromStream(inputStream);
							if (mime == null) mime = "*/*";
							currentContent = "data:"+mime+";base64," + Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP).replaceAll("(?:\\r\\n|\\n\\r|\\n|\\r)", "");
							byteArrayOutputStream.close();
							inputStream.close();
							runOnUiThread(() -> {
								((TextView)dialogView.findViewById(R.id.filename_text)).setText(newFilename);
								dialog.dismiss();
							});
						} catch (IOException e) {
							e.printStackTrace();
							if (inputStream != null) {
								try {
									inputStream.close();
								} catch (IOException e1) {}
							}
						}
					}
			}
			dialog.dismiss();
		}).start();
	}

	@JavascriptInterface
	public void updateElementPosition(String id, String x, String y, String width, String height) {
		new AsyncTask<Object, Void, Void>() {
			@Override
			protected Void doInBackground(Object... params) {
				Stream.of(getNote().elements).filter(element -> element.getId().equals(params[0])).forEach(element -> {
					element.setX((String)params[1]);
					element.setY((String)params[2]);
					element.setWidth((String)params[3]);
					element.setHeight((String)params[4]);
				});
				return null;
			}

			@Override
			protected void onPostExecute(Void v) {
				updateNotepad(getNote());
			}
		}.execute(id, x, y, width, height);
	}

	@JavascriptInterface
	public void downloadElement(String id) {
		Stream.of(getNote().elements).filter(element -> element.getId().equals(id)).forEach(element -> {
			for (File f : getCacheDir().listFiles()) f.delete();
			String path = getCacheDir().getAbsolutePath()+"/"+((FileElement)element).getFilename();
			String mime = element.getContent().split("base64")[0];
			mime = mime.substring(5, mime.length()-1);

			byte[] decoded = Base64.decode(element.getContent().split(",")[1], Base64.DEFAULT);
			try (OutputStream stream = new FileOutputStream(path)) {
				stream.write(decoded);

				Intent intent = new Intent();
				intent.setAction(Intent.ACTION_VIEW);
				intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
				intent.setDataAndType(FileProvider.getUriForFile(this, this.getApplicationContext().getPackageName()+".fileprovider", new File(path)), mime);
				startActivity(intent);
			}
			catch (IOException e) {
				e.printStackTrace();
			}
		});
	}

	boolean insertMenuOpen = false;
	@JavascriptInterface
	public void openInsertMenu(int x, int y) {
		runOnUiThread(() -> {
			Animation slideUp = AnimationUtils.loadAnimation(this, R.anim.slide_up);
			Animation slideDown = AnimationUtils.loadAnimation(this, R.anim.slide_down);
			PercentFrameLayout insertContainer = (PercentFrameLayout)findViewById(R.id.insert_container);

			if (insertMenuOpen) {
				insertMenuOpen = false;
				insertContainer.setAnimation(slideDown);
				insertContainer.setVisibility(View.GONE);
				return;
			}
			insertMenuOpen = true;

			ListView list = (ListView)findViewById(R.id.insert_list);
			list.setOnItemClickListener((AdapterView<?> parent, View view, int position, long id) -> {
				int mdCount = 1;
				int imgCount = 1;
				int fileCount = 1;
				int recCount = 1;
				for (NoteElement element : this.getNote().elements) {
					if (element instanceof MarkdownElement) mdCount++;
					if (element instanceof ImageElement) imgCount++;
					if (element instanceof FileElement && !(element instanceof RecordingElement)) fileCount++;
					if (element instanceof RecordingElement) recCount++;
				}

				NoteElement newElement = null;
				switch (this.types.get(position)) {
					case "Text (Markdown)":
						newElement = new MarkdownElement();
						((MarkdownElement)newElement).setFontSize("16px");
						newElement.setId("markdown"+mdCount);
						break;

					case "Image":
						newElement = new ImageElement();
						newElement.setId("image"+imgCount);
						break;

					case "File":
						newElement = new FileElement();
						((FileElement)newElement).setFilename("");
						newElement.setId("file"+fileCount);
						break;

					case "Recording":
						newElement = new RecordingElement();
						((RecordingElement)newElement).setFilename("");
						newElement.setId("recording"+recCount);
						break;
				}
				//Close the view
				insertMenuOpen = false;
				insertContainer.setAnimation(slideDown);
				insertContainer.setVisibility(View.GONE);

				if (newElement == null) return;
				newElement.setX(x+"px");
				newElement.setY(y+"px");
				newElement.setWidth("auto");
				newElement.setHeight("auto");
				newElement.setContent("");
				this.getNote().elements.add(newElement);
				displayElement(newElement);
				updateNotepad(this.getNote());
				openEditor(newElement.getId());
			});

			insertContainer.startAnimation(slideUp);
			insertContainer.setVisibility(View.VISIBLE);
			insertContainer.bringToFront();
		});
	}

	protected String getFilenameFromUri(Uri contentURI) {
		String uriString = contentURI.toString();
		File myFile = new File(uriString);

		if (uriString.startsWith("content://")) {
			Cursor cursor = null;
			try {
				cursor = getContentResolver().query(contentURI, null, null, null, null);
				if (cursor != null && cursor.moveToFirst()) {
					return cursor.getString(cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME));
				}
			} finally {
				cursor.close();
			}
		} else if (uriString.startsWith("file://")) {
			return myFile.getName();
		}
		return "file.ext";
	}

	protected void updateParentTree(View view, NLevelAdapter adapter, int position) {
		this.parentTree.clear();
		String t = view.getTag(R.id.TAG_OBJECT_PATH).toString();
		NLevelItem parentItem = (NLevelItem)adapter.getItem(position).getParent();
		Parent p;
		if (parentItem != null) {
			p = (Parent)parentItem.getWrappedObject();
		}
		else {
			p = this.getNotepad();
		}

		while (p != null) {
			this.parentTree.add(0, Integer.parseInt(t));

			if (p.getClass() == Notepad.class) {
				break;
			}

			t = parentItem.getView().getTag(R.id.TAG_OBJECT_PATH).toString();
			parentItem = (NLevelItem)parentItem.getParent();
			if (parentItem != null) {
				p = (Parent)parentItem.getWrappedObject();
			}
			else {
				p = this.getNotepad();
			}
		}
	}

	protected void addToParentTree(int toAdd) {
		this.parentTree.add(toAdd);
	}

	protected void updateNotepad(Section section) {
		List<Section> parentList = getNotepad().getSections();
		for (int i = 0; i < this.parentTree.size(); i++) {
			if (i == this.parentTree.size() - 1) {
				if (section != null) {
					parentList.set(this.parentTree.get(i), section);
				}
				else {
					parentList.remove((int)this.parentTree.get(i));
				}
				this.saveNotepad();
				return;
			}

			parentList = parentList.get(this.parentTree.get(i)).getSections();
		}
	}

	protected void updateNotepad(Note note) {
		List<Section> parentList = this.getNotepad().getSections();
		for (int i = 0; i < this.parentTree.size(); i++) {
			if (i == this.parentTree.size() - 2) {
				if (note != null) {
					parentList.get(this.parentTree.get(i)).notes.set(this.parentTree.get(i+1), note);
				}
				else {
					parentList.get(this.parentTree.get(i)).notes.remove((int)this.parentTree.get(i+1));
				}
				this.saveNotepad();
				return;
			}

			parentList = parentList.get(this.parentTree.get(i)).getSections();
		}
	}

	protected void addToNotepad() {
		List<Section> parentList = this.getNotepad().getSections();
		for (int i = 0; i < this.parentTree.size(); i++) {
			if (i == this.parentTree.size() - 1) {
				this.saveNotepad();
				return;
			}

			parentList = parentList.get(this.parentTree.get(i)).getSections();
		}
	}

	protected Note getNoteFromPath() {
		List<Section> parentList = this.getNotepad().getSections();
		for (int i = 0; i < getParentTree().size(); i++) {
			if (i == getParentTree().size() - 2) {
				return parentList.get(getParentTree().get(i)).notes.get(getParentTree().get(i+1));
			}

			parentList = parentList.get(getParentTree().get(i)).getSections();
		}
		return null;
	}

	protected void saveNotepad() {
		getNotepad().setLastModified(new Date());
		new AsyncTask<Object, String, Boolean>() {
			private CharSequence oldTitle;

			@Override
			protected void onPreExecute() {
				isSaving = true;
				this.oldTitle = getNotepad().getTitle();
				if (getNote() != null) this.oldTitle = getNote().getTitle();
				setTitle(this.oldTitle+" (Saving...)");
			}

			@Override
			protected Boolean doInBackground(Object... params) {
				return filesystemManager.saveNotepad((Notepad)params[0]);
			}

			@Override
			protected void onPostExecute(Boolean res) {
				isSaving = false;
				setTitle(oldTitle);

				if (res) {
					syncNotepad();
				}
				else {
					new AlertDialog.Builder(BaseActivity.this)
							.setTitle("Error")
							.setMessage("Error saving notepad")
							.setCancelable(true)
							.setPositiveButton("Close", (dialog, which) -> {})
							.show();
				}
			}
		}.execute(this.getNotepad());
	}

	protected void setNotepad(Notepad notepad) {
		notepadSearcher = new NotepadSearcher(notepad);
		this.notepad = notepad;
		runOnUiThread(this::initNotepadSync);
	}

	protected Notepad getNotepad(){
		return this.notepad;
	}

	protected void setNote(Note note) {
		this.note = note;
		if (note != null) setTitle(this.note.getTitle());
	}

	protected Note getNote() {
		return this.note;
	}

	protected List<Integer> getParentTree() {
		return this.parentTree;
	}

	protected void setParentTree(List<Integer> tree) {
		this.parentTree = tree;
	}

	protected class NoteLoader extends AsyncTask<Object, String, Notepad> {
		private Notepad res;
		private Note note;
		private ProgressBar progressBar;

		@Override
		protected void onPreExecute() {
			//Show progress bar
			progressBar = (ProgressBar)findViewById(R.id.progress);
			progressBar.setIndeterminate(true);
			progressBar.setVisibility(View.VISIBLE);
		}

		@Override
		protected Notepad doInBackground(Object... params) {
			try {
				this.res = Parser.parseNpx((File)params[0]);
				setNotepad(this.res);

			} catch (Exception e) {
				return null;
			}
			setParentTree((ArrayList<Integer>)params[1]);
			this.note = getNoteFromPath();
//				this.note = Parser.parseNpx((String)params[1]).getSections().get(0).notes.get(0);

			return this.res;
		}

		@Override
		protected void onPostExecute(Notepad notepad) {
			if (notepad == null) {
				new AlertDialog.Builder(BaseActivity.this)
						.setTitle("Error")
						.setMessage("Error parsing notepad")
						.setCancelable(true)
						.setPositiveButton("Close", (dialog, which) -> {})
						.show();
			}
			else {
				loadNote(this.note);
			}
		}
	}

	protected void syncNotepad() {
		String token = prefs.getString("token", null);
		if (token == null || !isNotepadSyncing) return;

		Animation rotate = AnimationUtils.loadAnimation(getBaseContext(), R.anim.rotate);
		rotate.setRepeatCount(Animation.INFINITE);
		this.syncBtn.startAnimation(rotate);

		ProgressDialog progressDialog = new ProgressDialog(this);
		progressDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
		progressDialog.setMessage("Syncing...\nThis may take a while");
		progressDialog.setIndeterminate(false);
		progressDialog.setCanceledOnTouchOutside(false);

		this.isSyncing = true;
		this.syncer.service.sync(token, Helpers.getFilename(this.getNotepad().getTitle()), this.getNotepad().getLastModified().toXMLFormat(), "block").enqueue(new Callback<String>() {
			@Override
			public void onResponse(Call<String> call, Response<String> response) {
				if (response.isSuccessful()) {
					if (response.body().length() == 0) {
						syncBtn.clearAnimation();
						isSyncing = false;
						return;
					}
					Gson gson = new Gson();
					HashMap<String, String> res = new HashMap<>();
					res = gson.fromJson(response.body(), res.getClass());
					final HashMap<String, String> data = res;

					new Thread(() -> {
						try {
							byte[] npxBytes = Parser.toXml(getNotepad()).getBytes(StandardCharsets.UTF_8);

							if (npxBytes.length > 1000000000) {
								syncBtn.clearAnimation();
								isSyncing = false;

								new AlertDialog.Builder(BaseActivity.this)
										.setTitle("Error")
										.setMessage("Wowza! Your notepad is so big we can't store it. It might be a good idea to split up your notepad.")
										.setPositiveButton("Close", (dialog, which) -> {})
										.show();
								return;
							}

							JSONObject localMap = new JSONObject();
							localMap.put("lastModified", getNotepad().getLastModified().toXMLFormat());
							byte[][] chunks = new byte[(int)Math.ceil((double)npxBytes.length/1000000)][1000000];
							int count = 0;
							int pos = 0;
							MessageDigest md5 = MessageDigest.getInstance("MD5");
							while (pos < npxBytes.length) {
								int newPos = Math.min(pos+1000000, npxBytes.length);
								chunks[count] = Arrays.copyOfRange(npxBytes, pos, newPos);
								pos = newPos;

								byte[] digest = md5.digest(chunks[count]);
								StringBuilder sb = new StringBuilder();
								for (int i = 0; i < digest.length; ++i) {
									sb.append(Integer.toHexString((digest[i] & 0xFF) | 0x100).substring(1,3));
								}
								JSONObject chunkMetadata = new JSONObject();
								chunkMetadata.put("md5", sb.toString());
								localMap.put(""+count, chunkMetadata);
							}

							switch (data.get("type")) {
								case "upload":
									if (localMap.toString().equals(syncer.getOldMap().toString())) {
										runOnUiThread(() -> {
											syncBtn.clearAnimation();
											isSyncing = false;
										});
									}
									syncer.setOldMap(localMap);

									AndroidNetworking.get(data.get("url"))
											.setPriority(Priority.IMMEDIATE)
											.build()
											.getAsJSONObject(new JSONObjectRequestListener() {
												@Override
												public void onResponse(JSONObject remoteMap) {
													new Thread(() -> {
//														if (((XMLGregorianCalendar)remoteMap.get("lastModified")).toGregorianCalendar().compareTo(((XMLGregorianCalendar)localMap.get("lastModified")).toGregorianCalendar()) > 0 || remoteMap.toString().equals(localMap.toString())) {
//															runOnUiThread(() -> {
//																syncBtn.clearAnimation();
//																isSyncing = false;
//															});
//															return;
//														}

														for (int i = 0; i < localMap.names().length(); i++) {
															try {
																String lineNumber = localMap.names().getString(i);
																if (lineNumber.equals("lastModified")) continue;
																if (remoteMap.isNull(lineNumber) || !((JSONObject)localMap.get(lineNumber)).get("md5").equals(((JSONObject)remoteMap.get(lineNumber)).get("md5"))) {
																	//Upload Chunk
																	try {
																		Response<String> chunkURL = syncer.service.getChunkUpload(token, Helpers.getFilename(getNotepad().getTitle()), lineNumber, (String)((JSONObject)localMap.get(lineNumber)).get("md5")).execute();
																		if (chunkURL.isSuccessful()) {
																			AndroidNetworking.put(chunkURL.body())
																					.setPriority(Priority.IMMEDIATE)
																					.setContentType("text/plain")
																					.addStringBody(new String(chunks[Integer.parseInt(lineNumber)], "UTF-8"))
																					.build()
																					.executeForString();

																		}
																	} catch (IOException e) {
																		e.printStackTrace();
																	}
																}
															} catch (JSONException e) {
																runOnUiThread(() -> {
																	syncBtn.clearAnimation();
																	isSyncing = false;
																});
																e.printStackTrace();
																return;
															}
														}

														try {
															Response<String> mapUploadUrl = syncer.service.getMapUpload(token, Helpers.getFilename(getNotepad().getTitle())).execute();
															if (mapUploadUrl.isSuccessful()) {
																AndroidNetworking.put(mapUploadUrl.body())
																		.setPriority(Priority.IMMEDIATE)
																		.setContentType("text/plain")
																		.addJSONObjectBody(localMap)
																		.build()
																		.executeForString();
															}
															else {
																runOnUiThread(() -> {
																	syncBtn.clearAnimation();
																	isSyncing = false;
																});
															}
														} catch (IOException e) {
															e.printStackTrace();
															runOnUiThread(() -> {
																syncBtn.clearAnimation();
																isSyncing = false;
															});
														}

														runOnUiThread(() -> {
															progressDialog.dismiss();
															syncBtn.clearAnimation();
															isSyncing = false;
														});
													}).start();
												}

												@Override
												public void onError(ANError anError) {
													runOnUiThread(() -> {
														syncBtn.clearAnimation();
														isSyncing = false;
													});
												}
											});
									break;

								case "download":
									runOnUiThread(() -> new AlertDialog.Builder(BaseActivity.this)
											.setTitle("Sync")
											.setMessage("A newer version of this notepad is available. Do you want to get it?")
											.setIcon(new IconicsDrawable(BaseActivity.this).icon(GoogleMaterial.Icon.gmd_cloud_download))
											.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> AndroidNetworking.get(data.get("url"))
													.setPriority(Priority.IMMEDIATE)
													.build()
													.getAsJSONObject(new JSONObjectRequestListener() {
														@Override
														public void onResponse(JSONObject remoteMap) {
															new Thread(() -> {
																String newNotepadXml = "";
																for (int i = 0; i < remoteMap.names().length(); i++) {
																	try {
																		String lineNumber = remoteMap.names().getString(i);
																		if (lineNumber.equals("lastModified")) continue;
																		if (localMap.isNull(lineNumber) || !((JSONObject)remoteMap.get(lineNumber)).get("md5").equals(((JSONObject)localMap.get(lineNumber)).get("md5"))) {
																			runOnUiThread(() -> {
																				progressDialog.setProgress(0);
																				progressDialog.show();
																			});

																			//Download Chunk
																			try {
																				Response<String> chunkURL = syncer.service.getChunkDownload(token, Helpers.getFilename(getNotepad().getTitle()), lineNumber, (String)((JSONObject)remoteMap.get(lineNumber)).get("md5")).execute();
																				if (chunkURL.isSuccessful()) {
																					ANRequest chunkReq = AndroidNetworking.get(chunkURL.body())
																							.setPriority(Priority.IMMEDIATE)
																							.build();
																					newNotepadXml += chunkReq.executeForString().getResult();
																					runOnUiThread(() -> progressDialog.setProgress((Integer.parseInt(lineNumber)/(remoteMap.names().length()-1))*100));
																				}
																			} catch (IOException e) {
																				e.printStackTrace();
																			}
																		}
																	} catch (JSONException e) {
																		runOnUiThread(() -> {
																			syncBtn.clearAnimation();
																			isSyncing = false;
																		});
																		e.printStackTrace();
																		return;
																	}
																}

																if (newNotepadXml.length() > 0) {
																	try {
																		Notepad newNotepad = Parser.parseNpx(newNotepadXml);
																		syncer.setOldMap(remoteMap);
																		runOnUiThread(() -> {
																			setNotepad(newNotepad);
																			saveNotepad();
																		});
																	} catch (Exception e) {
																		e.printStackTrace();
																	}
																}

																runOnUiThread(() -> {
																	progressDialog.dismiss();
																	syncBtn.clearAnimation();
																	isSyncing = false;
																});
															}).start();
														}

														@Override
														public void onError(ANError error) {
															Log.e("m3k", error.getErrorBody());
														}
													})).setNegativeButton(android.R.string.no, (d, w) -> {
												syncBtn.clearAnimation();
												isSyncing = false;
											}).show());
							}
						} catch (Exception e) {
							e.printStackTrace();
							runOnUiThread(() -> {
								syncBtn.clearAnimation();
								isSyncing = false;
							});
						}
					}).start();
				}
				else {
					isSyncing = false;
					syncBtn.clearAnimation();
					initNotepadSync();
				}
			}

			@Override
			public void onFailure(Call<String> call, Throwable t) {
				isSyncing = false;
				syncBtn.clearAnimation();
				new AlertDialog.Builder(BaseActivity.this)
						.setTitle("Error")
						.setMessage("There was an error completing this request. Are you online?")
						.setPositiveButton("Close", (dialog, which) -> {})
						.show();
			}
		});
	}

	protected void initNotepadSync() {
		this.isNotepadSyncing = false;
		this.syncer.setOldMap(new JSONObject());
		String token = prefs.getString("token", null);
		if (token == null) return;

		Animation rotate = AnimationUtils.loadAnimation(getBaseContext(), R.anim.rotate);
		rotate.setRepeatCount(Animation.INFINITE);
		this.syncBtn.startAnimation(rotate);

		this.syncer.service.hasAddedNotepad(token, Helpers.getFilename(this.getNotepad().getTitle())).enqueue(new Callback<String>() {
			@Override
			public void onResponse(Call<String> call, Response<String> response) {
				syncBtn.clearAnimation();
				if (response.isSuccessful()) {
					if (response.body().equals("true")) {
						isNotepadSyncing = true;
						syncNotepad();
					}
					else {
						//TODO: Ask if they want to add the notepad
					}
				}
				else {
					prefs.edit().remove("token").apply();
					Snackbar.make(findViewById(android.R.id.content), "Logged out of MicroSync (expired token)", Snackbar.LENGTH_LONG).show();
				}
			}

			@Override
			public void onFailure(Call<String> call, Throwable t) {
				syncBtn.clearAnimation();
			}
		});
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
		super.onRequestPermissionsResult(requestCode, permissions, grantResults);

		switch (requestCode) {
			case PERMISSION_REQ_FILESYSTEM:
				if (grantResults.length < 1 || (grantResults[0]) != PackageManager.PERMISSION_GRANTED) {
					new AlertDialog.Builder(this)
							.setTitle("Permission Denied")
							.setMessage("Error accessing the device's storage")
							.setPositiveButton("Close", (dialog, which) -> System.exit(0))
							.show();
				}
		}
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		MenuInflater inflater = getMenuInflater();
		inflater.inflate(R.menu.notepad_menu, menu);

		Animation rotate = AnimationUtils.loadAnimation(getBaseContext(), R.anim.rotate);
		rotate.setRepeatCount(Animation.INFINITE);
		this.syncBtn = (ImageView)menu.findItem(R.id.app_bar_sync).getActionView();
		syncBtn.setImageResource(android.R.drawable.stat_notify_sync);
		syncBtn.setOnClickListener(v -> {
			String token = prefs.getString("token", null);
			if (token != null) {
				initNotepadSync();
			}
			else {
				AlertDialog.Builder builder = new AlertDialog.Builder(this)
						.setTitle("Login/Register")
						.setNegativeButton("Close", (d, w) -> {})
						.setCancelable(true);
				LayoutInflater loginInflater = this.getLayoutInflater();
				View view = loginInflater.inflate(R.layout.login, null);
				builder.setView(view);

				builder.setPositiveButton("Login", (d, w) -> {
					syncBtn.startAnimation(rotate);
					String username = ((EditText)view.findViewById(R.id.username_input)).getText().toString();
					String password = ((EditText)view.findViewById(R.id.password_input)).getText().toString();

					syncer.service.login(username, password).enqueue(new Callback<String>() {
						@Override
						public void onResponse(Call<String> call, Response<String> response) {
							syncBtn.clearAnimation();
							if (response.isSuccessful()) {
								prefs.edit().putString("token", response.body()).apply();
								Snackbar.make(findViewById(android.R.id.content), "Logged into MicroSync as "+username, Snackbar.LENGTH_SHORT).show();
							}
							else {
								new AlertDialog.Builder(BaseActivity.this)
										.setTitle("Error")
										.setMessage("There was an error completing this request. Is your username and password correct?")
										.setPositiveButton("Close", (dialog, which) -> {})
										.show();
							}
						}

						@Override
						public void onFailure(Call<String> call, Throwable t) {
							syncBtn.clearAnimation();
							new AlertDialog.Builder(BaseActivity.this)
									.setTitle("Error")
									.setMessage("There was an error completing this request. Are you online?")
									.setPositiveButton("Close", (dialog, which) -> {})
									.show();
						}
					});
				});

				AlertDialog dialog = builder.create();
				dialog.show();
			}
		});
		return true;
	}

	public boolean onOptionsItemSelected(MenuItem item) {
		switch (item.getItemId()) {
			case R.id.app_bar_search:
				AlertDialog.Builder builder = new AlertDialog.Builder(this)
						.setTitle("Search")
						.setPositiveButton("Close", (d, w) -> {})
						.setCancelable(true);
				LayoutInflater inflater = this.getLayoutInflater();
				View view = inflater.inflate(R.layout.search_layout, null);
				builder.setView(view);
				AlertDialog dialog = builder.create();

				((EditText)view.findViewById(R.id.search_input)).addTextChangedListener(new TextWatcher() {
					@Override
					public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

					@Override
					public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

					@Override
					public void afterTextChanged(Editable editable) {
						List<Note> res = notepadSearcher.search(editable.toString());

						ListAdapter searchAdapter = new ArrayAdapter<>(getApplicationContext(), android.R.layout.simple_list_item_1, res);
						runOnUiThread(() -> {
							ListView searchList = (ListView)view.findViewById(R.id.search_list);
							searchList.setAdapter(searchAdapter);

							searchList.setOnItemClickListener((adapterView, v, pos, a4) -> {
								Note resNote = (Note)adapterView.getItemAtPosition(pos);
								setParentTree(notepadSearcher.getTree(resNote));
								loadNote(resNote);
								dialog.dismiss();
							});
						});
					}
				});

				dialog.show();
				return true;

			default:
				return super.onOptionsItemSelected(item);
		}
	}

	@Override
	public void onBackPressed() {
		if (insertMenuOpen) {
			Animation slideDown = AnimationUtils.loadAnimation(this, R.anim.slide_down);
			PercentFrameLayout insertContainer = (PercentFrameLayout)findViewById(R.id.insert_container);
			insertMenuOpen = false;
			insertContainer.setAnimation(slideDown);
			insertContainer.setVisibility(View.GONE);
			return;
		}

		if (this.isSaving || this.isSyncing) {
			new AlertDialog.Builder(this)
					.setTitle("Saving...")
					.setMessage("Your cannot exit until your notepad has finished saving/syncing")
					.setPositiveButton("Close", (dialog, which) -> {})
					.show();
			return;
		}

		if (this.getNote() != null && ((getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK) != Configuration.SCREENLAYOUT_SIZE_LARGE && (getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK) != Configuration.SCREENLAYOUT_SIZE_XLARGE)) {
			this.setNote(null);
			setTitle(this.getNotepad().getTitle());
		}
		super.onBackPressed();
	}
}
