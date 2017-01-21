package getmicropad.com.micropad;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.util.Base64;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ProgressBar;

import com.getmicropad.NPXParser.ImageElement;
import com.getmicropad.NPXParser.MarkdownElement;
import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.NoteElement;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parent;
import com.getmicropad.NPXParser.Parser;
import com.getmicropad.NPXParser.Section;
import com.mikepenz.iconics.context.IconicsContextWrapper;

import java.io.File;
import java.text.NumberFormat;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class BaseActivity extends AppCompatActivity {
	Notepad notepad;
	Section section;
	Note note;
	List<Integer> parentTree = new ArrayList<>();
	FilesystemManager filesystemManager = new FilesystemManager();
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

	protected void loadNote(Note note) {
		this.setNote(note);
		FrameLayout noteContainer = (FrameLayout)findViewById(R.id.note_container);
		noteContainer.setVisibility(View.GONE);

		FrameLayout viewer = (FrameLayout)findViewById(R.id.viewer);
		if (note.elements.size() > 0) viewer.setBackgroundResource(0);

		/* Elements */
		for (NoteElement element : note.elements) {
			if (element instanceof  MarkdownElement) {

			}
			else if (element instanceof ImageElement) {
				byte[] decoded = Base64.decode(element.getContent().split(",")[1], Base64.DEFAULT);
				Bitmap decodedBmp = BitmapFactory.decodeByteArray(decoded, 0, decoded.length);

				ImageView imageView = new ImageView(this);
				imageView.setImageBitmap(decodedBmp);
				imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
				imageView.setAdjustViewBounds(true);
				imageView.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
				try {
					if (element.getWidth().endsWith("px")) imageView.getLayoutParams().width = this.getIntFromString(element.getWidth());
					if (element.getHeight().endsWith("px")) imageView.getLayoutParams().height = this.getIntFromString(element.getHeight());
					imageView.setX(this.getIntFromString(element.getX()));
					imageView.setY(this.getIntFromString(element.getY()));
				}
				catch (ParseException e) {
					e.printStackTrace();
				}
				noteContainer.addView(imageView);
				resizeCanvas(noteContainer, imageView);
			}
		}

		noteContainer.setVisibility(View.VISIBLE);
	}

	protected void resizeCanvas(FrameLayout canvas, View view) {
		float newWidth = (view.getX()+view.getWidth()+1000);
		float newHeight = (view.getY()+view.getHeight()+1000);

		if (canvas.getWidth() < newWidth) canvas.getLayoutParams().width = (int)newWidth;
		if (canvas.getHeight() < newHeight) canvas.getLayoutParams().height = (int)newHeight;
	}

	public int getIntFromString(String str) throws ParseException {
		return (NumberFormat.getInstance().parse(str)).intValue();
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
		NotepadSaver notepadSaver = new NotepadSaver();
		notepadSaver.execute(this.getNotepad());
	}

	protected class NotepadSaver extends AsyncTask<Object, String, Boolean> {
		private CharSequence oldTitle;

		@Override
		protected void onPreExecute() {
			//Show progress bar
			this.oldTitle = getTitle();
			setTitle(oldTitle+" (Saving...)");
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
