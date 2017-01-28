package getmicropad.com.micropad;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.percent.PercentFrameLayout;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ProgressBar;

import com.annimon.stream.Stream;
import com.getmicropad.NPXParser.BasicElement;
import com.getmicropad.NPXParser.DrawingElement;
import com.getmicropad.NPXParser.ImageElement;
import com.getmicropad.NPXParser.MarkdownElement;
import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.NoteElement;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parent;
import com.getmicropad.NPXParser.Parser;
import com.getmicropad.NPXParser.Section;
import com.mikepenz.iconics.context.IconicsContextWrapper;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.text.NumberFormat;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BaseActivity extends AppCompatActivity {
	Notepad notepad;
	Section section;
	Note note;
	List<Integer> parentTree = new ArrayList<>();
	FilesystemManager filesystemManager = new FilesystemManager();
	Map<String, WebView> webviews = new HashMap<>();
	static final int PERMISSION_REQ_FILESYSTEM = 0;

	@Override
	protected void attachBaseContext(Context newBase) {
		super.attachBaseContext(IconicsContextWrapper.wrap(newBase));
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

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
		this.setNote(note);
		WebView noteContainer = (WebView)findViewById(R.id.note_webview);
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
				try {
					for (NoteElement element : note.elements) {
						String extraArgs = "{}";
						String content = element.getContent();
						if (element instanceof MarkdownElement) {
							extraArgs = String.format("{fontSize: \"%s\"}", ((MarkdownElement) element).getFontSize());
							content = URLEncoder.encode(content, "UTF-8").replace("+", "%20");
						}
						else if (element instanceof DrawingElement) {
							try {
								byte[] decoded = Base64.decode(element.getContent().split(",")[1], Base64.DEFAULT);
								Bitmap decodedBmp = Helpers.TrimBitmap(BitmapFactory.decodeByteArray(decoded, 0, decoded.length));
								ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
								decodedBmp.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
								content = "data:image/png;base64," + Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.DEFAULT);
							}
							catch (Exception e) {}
						}

						noteContainer.evaluateJavascript(String.format("displayElement(\"%s\", \"%s\", \"%s\", \"%s\", \"%s\", \"%s\", %s)", element.getId(), content, element.getX(), element.getY(), element.getWidth(), element.getHeight(), extraArgs), (s) -> {});
					}
				}
				catch (UnsupportedEncodingException e) {}
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
		new AsyncTask<Object, String, Boolean>() {
			private CharSequence oldTitle;

			@Override
			protected void onPreExecute() {
				//Show progress bar
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
				setTitle(oldTitle);

				if (!res) new AlertDialog.Builder(BaseActivity.this)
						.setTitle("Error")
						.setMessage("Error saving notepad")
						.setCancelable(true)
						.setPositiveButton("Close", (dialog, which) -> {})
						.show();
			}
		}.execute(this.getNotepad());
	}

	protected void setNotepad(Notepad notepad) {
		this.notepad = notepad;
	}

	protected Notepad getNotepad(){
		return this.notepad;
	}

	protected void setSection(Section section) {
		this.section = section;
	}

	protected Section getSection() {
		return this.section;
	}

	protected void setNote(Note note) {
		this.note = note;
		setTitle(this.note.getTitle());
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
			progressBar.setVisibility(View.GONE);

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
}
