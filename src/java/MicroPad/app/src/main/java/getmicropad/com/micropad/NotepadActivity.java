package getmicropad.com.micropad;

import android.Manifest;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.view.ContextMenu;
import android.view.LayoutInflater;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;

import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parent;
import com.getmicropad.NPXParser.Parser;
import com.getmicropad.NPXParser.Section;
import com.mikepenz.google_material_typeface_library.GoogleMaterial;
import com.mikepenz.iconics.IconicsDrawable;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class NotepadActivity extends BaseActivity {
	List<Notepad> notepads = new ArrayList<>();
	List<NLevelItem> list;
	ListView mainList;
	NLevelAdapter adapter;
	Random rng = new Random();
	static final int PERMISSION_REQ_FILESYSTEM = 0;
	FilesystemManager filesystemManager;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);

		this.mainList = (ListView)findViewById(R.id.main_list);
		this.list = new ArrayList<>();

		this.adapter = new NLevelAdapter(list);
		this.mainList.setAdapter(this.adapter);

		/* Request permissions */
		if ((ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) | ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)) != PackageManager.PERMISSION_GRANTED)  {
			ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQ_FILESYSTEM);
		}
		else {
			this.filesystemManager = new FilesystemManager();
			this.getNotepads();
		}



		this.mainList.setOnItemClickListener((AdapterView<?> parent, View view, int position, long id) -> {
			this.adapter.toggle(position);
			this.adapter.getFilter().filter();
			Object item = ((NLevelItem)((NLevelAdapter)this.mainList.getAdapter()).getItem(position)).getWrappedObject();

			switch (view.getTag(R.id.TAG_OBJECT_TYPE).toString()) {
				case "notepad":
					this.setNotepad((Notepad)item);
					return;

				case "section":
					this.setSection((Section)item);
					this.updateParentTree(view, this.adapter, position);
					return;

				case "note":
					NLevelItem parentSectionItem = (NLevelItem)adapter.getItem(position).getParent();
					this.setSection((Section)parentSectionItem.getWrappedObject());
					this.setNote((Note)item);
					this.updateParentTree(view, this.adapter, position);
					if ((getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK) != Configuration.SCREENLAYOUT_SIZE_LARGE && (getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK) != Configuration.SCREENLAYOUT_SIZE_XLARGE) {
						//Phone
					}
					else {
						//Tablet
					}
			}
		});

		this.mainList.setLongClickable(true);
		registerForContextMenu(this.mainList);

		FloatingActionButton newNotepadBtn = (FloatingActionButton)findViewById(R.id.add_notepad_btn);
		newNotepadBtn.setOnClickListener(view -> {
			EditText titleInput = new EditText(this);
			new AlertDialog.Builder(this)
					.setView(titleInput)
					.setTitle("New Notepad")
					.setPositiveButton("Create", (dialogInterface, whichButton) -> {
						//TODO: Filesystem
					}).setNegativeButton(android.R.string.cancel, null).show();
		});
	}

	protected void updateNotepad(Section section, LayoutInflater inflater) {
		super.updateNotepad(section);
		List<Notepad> notepads = new ArrayList<>();
		notepads.add(this.getNotepad());
		updateList(inflater, notepads);
	}

	protected void updateNotepad(Note note, LayoutInflater inflater) {
		super.updateNotepad(note);
		List<Notepad> notepads = new ArrayList<>();
		notepads.add(this.getNotepad());
		updateList(inflater, notepads);
	}

	protected void addToNotepad(LayoutInflater inflater) {
		super.addToNotepad();
		List<Notepad> notepads = new ArrayList<>();
		notepads.add(this.getNotepad());
		updateList(inflater, notepads);
	}

	@Override
	public void onCreateContextMenu(ContextMenu menu, View v, ContextMenu.ContextMenuInfo menuInfo) {
		super.onCreateContextMenu(menu, v, menuInfo);
		if (v.getId() == R.id.main_list) {
			AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo)menuInfo;
			Object selectedObj = ((NLevelItem)this.adapter.getItem(info.position)).getWrappedObject();
			if (Parent.class.isInstance(selectedObj)) menu.add(0, R.id.new_section_context, 0, "New Section");
			if (Section.class.isInstance(selectedObj)) menu.add(0, R.id.new_note_context, 0, "New Note");

			MenuInflater inflater = getMenuInflater();
			inflater.inflate(R.menu.list_context, menu);
		}
	}

	@Override
	public boolean onContextItemSelected(MenuItem item) {
		AdapterView.AdapterContextMenuInfo info = (AdapterView.AdapterContextMenuInfo)item.getMenuInfo();
		NLevelItem selItem = ((NLevelItem)this.adapter.getItem(info.position));
		switch (item.getItemId()) {
			case R.id.delete_context:
				switch (info.targetView.getTag(R.id.TAG_OBJECT_TYPE).toString()) {
					case "notepad":
						new AlertDialog.Builder(this)
								.setTitle("Confirm Deletion")
								.setMessage("Are you sure you want to delete this?")
								.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
								.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
									//TODO: Delete notepad from storage and reload
									List<Notepad> notepads = new ArrayList<>();
									updateList(getLayoutInflater(), notepads);
								}).setNegativeButton(android.R.string.no, null).show();
						return true;
					case "section":
						updateParentTree(info.targetView, this.adapter, info.position);
						new AlertDialog.Builder(this)
								.setTitle("Confirm Deletion")
								.setMessage("Are you sure you want to delete this?")
								.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
								.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
									updateNotepad((Section)null, getLayoutInflater());
								}).setNegativeButton(android.R.string.no, null).show();
						return true;
					case "note":
						updateParentTree(info.targetView, this.adapter, info.position);
						new AlertDialog.Builder(this)
								.setTitle("Confirm Deletion")
								.setMessage("Are you sure you want to delete this?")
								.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
								.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
									updateNotepad((Note)null, getLayoutInflater());
								}).setNegativeButton(android.R.string.no, null).show();
						return true;
				}
				return true;

			case R.id.new_section_context:
				updateParentTree(info.targetView, this.adapter, info.position);
				EditText renameInput = new EditText(this);
				new AlertDialog.Builder(this)
						.setView(renameInput)
						.setTitle("New Section")
						.setPositiveButton("Create", (dialogInterface, whichButton) -> {
							List<Section> parentSections = ((Parent)selItem.getWrappedObject()).getSections();
							if (parentSections == null) {
								((Parent) selItem.getWrappedObject()).setSections(new ArrayList<>());
								parentSections = ((Parent)selItem.getWrappedObject()).getSections();
							}
							parentSections.add(new Section(renameInput.getText().toString()));
							addToParentTree(parentSections.size()-1);
							addToNotepad(getLayoutInflater());
						}).setNegativeButton(android.R.string.cancel, null).show();
				return true;

			case R.id.new_note_context:
				updateParentTree(info.targetView, this.adapter, info.position);
				renameInput = new EditText(this);
				new AlertDialog.Builder(this)
						.setView(renameInput)
						.setTitle("New Note")
						.setPositiveButton("Create", (dialogInterface, whichButton) -> {
							Section parentSection = ((Section) selItem.getWrappedObject());
							List<Note> parentNoteList = parentSection.notes;
							if (parentNoteList == null) {
								parentSection.notes = new ArrayList<>();
								parentNoteList = parentSection.notes;
							}
							parentNoteList.add(new Note(renameInput.getText().toString()));
							addToParentTree(parentNoteList.size()-1);
							addToNotepad(getLayoutInflater());
						}).setNegativeButton(android.R.string.cancel, null).show();
				return true;

			case R.id.rename_context:
				switch (info.targetView.getTag(R.id.TAG_OBJECT_TYPE).toString()) {
					case "notepad":
						renameInput = new EditText(this);
						new AlertDialog.Builder(this)
								.setView(renameInput)
								.setTitle("Rename Notepad")
								.setPositiveButton("Rename", (dialogInterface, whichButton) -> {
									//TODO: Rename in the FS
									Notepad notepad = this.getNotepad();
									notepad.setTitle(renameInput.getText().toString());
									List<Notepad> notepads = new ArrayList<>();
									notepads.add(this.getNotepad());
									updateList(getLayoutInflater(), notepads);
								}).setNegativeButton(android.R.string.cancel, null).show();
						return true;

					case "section":
						updateParentTree(info.targetView, this.adapter, info.position);
						renameInput = new EditText(this);
						new AlertDialog.Builder(this)
								.setView(renameInput)
								.setTitle("Rename Section")
								.setPositiveButton("Rename", (dialogInterface, whichButton) -> {
									Section section = (Section)selItem.getWrappedObject();
									section.setTitle(renameInput.getText().toString());
									updateNotepad(section, getLayoutInflater());
								}).setNegativeButton(android.R.string.cancel, null).show();
						return true;

					case "note":
						updateParentTree(info.targetView, this.adapter, info.position);
						renameInput = new EditText(this);
						new AlertDialog.Builder(this)
								.setView(renameInput)
								.setTitle("Rename Note")
								.setPositiveButton("Rename", (dialogInterface, whichButton) -> {
									Note note = (Note)selItem.getWrappedObject();
									note.setTitle(renameInput.getText().toString());
									updateNotepad(note, getLayoutInflater());
								}).setNegativeButton(android.R.string.cancel, null).show();
						return true;
				}
				return true;

			default:
				return super.onContextItemSelected(item);
		}
	}

	Map<String, List<Integer>> parentMap = new HashMap<>();
	List<Integer> path = new ArrayList<>();
	private void addToPath(int pos, int val) {
		if (this.path.size() <= depth) {
			this.path.add(pos, val);
		}
		else {
			this.path.set(pos, val);
		}
	}

	int depth = 0;

	private void updateList(LayoutInflater inflater, List<Notepad> notepads) {
		this.list.clear();
		for (Notepad notepad : notepads) {
			NLevelItem notepadItem = new NLevelItem(notepad, null, (NLevelItem item) -> {
				View view = inflater.inflate(R.layout.notepad_list_item, null);
				String name = "{gmd-collections-bookmark} "+((Notepad)item.getWrappedObject()).getTitle();
				parentMap.put(name, new ArrayList<>());
				view.setTag(R.id.TAG_OBJECT_TYPE, "notepad");
				view.setTag(R.id.TAG_OBJECT_TITLE, name);
				TextView titleText = (TextView)view.findViewById(R.id.title_text);
				if (item.isExpanded()) titleText.setTypeface(null, Typeface.BOLD);
				titleText.setText(name);
				return view;
			});
			this.list.add(notepadItem);

			addSectionToList(inflater, notepadItem);
		}
		this.path.clear();
		((NLevelAdapter)mainList.getAdapter()).getFilter().filter();
	}
	private void addSectionToList(LayoutInflater inflater, NLevelItem parentItem) {
		if (((Parent)parentItem.getWrappedObject()).getSections() != null) {
			for (int i = 0; i < ((Parent)parentItem.getWrappedObject()).getSections().size(); i++) {
				Section section = ((Parent)parentItem.getWrappedObject()).getSections().get(i);

				int finalI = i;
				NLevelItem sectionItem = new NLevelItem(section, parentItem, (NLevelItem item) -> {
					View view = inflater.inflate(R.layout.section_list_item, null);
					String name = "{gmd-book} "+((Section)item.getWrappedObject()).getTitle();
					view.setTag(R.id.TAG_OBJECT_TYPE, "section");
					view.setTag(R.id.TAG_OBJECT_TITLE, name);

					addToPath(depth, finalI);
					String pathStr = "";
					for (Integer index : this.path) {
						if (pathStr.length() > 0) pathStr += ":";
						pathStr += index.toString();
					}
					view.setTag(R.id.TAG_OBJECT_PATH, pathStr);

					/** Generate a colour for the level of nesting */
					String levelStr = ((Parent)parentItem.getWrappedObject()).getTitle();
					int hashcode = levelStr.hashCode() % 16777216;
					String hexHashCode = Integer.toHexString(hashcode);
					while (hexHashCode.length() < 6) hexHashCode += "0";
					int colour = Color.parseColor("#"+hexHashCode);

					View indentBar = view.findViewById(R.id.indent_bar);
					indentBar.setBackgroundColor(colour);

					TextView titleText = (TextView)view.findViewById(R.id.title_text);
					if (item.isExpanded()) titleText.setTypeface(null, Typeface.BOLD);
					titleText.setText(name);
					return view;
				});
				this.list.add(sectionItem);

				this.depth++;
				if (section.getSections() != null && section.getSections().size() > 0) {
					addSectionToList(inflater, sectionItem);
				}

				if (section.notes != null) {
					for (int j = 0; j < section.notes.size(); j++) {
						Note note = section.notes.get(j);

						int finalJ = j;
						NLevelItem noteItem = new NLevelItem(note, sectionItem, (NLevelItem item) -> {
							if (item.isExpanded()) item.toggle();
							View view = inflater.inflate(R.layout.section_list_item, null);
							String name = "{gmd-note} "+((Note) item.getWrappedObject()).getTitle();
							view.setTag(R.id.TAG_OBJECT_TYPE, "note");
							view.setTag(R.id.TAG_OBJECT_TITLE, name);

							addToPath(this.depth, finalJ);
							String pathStr = "";
							for (Integer index : this.path) {
								if (pathStr.length() > 0) pathStr += ":";
								pathStr += index.toString();
							}
							view.setTag(R.id.TAG_OBJECT_PATH, pathStr);

							/** Generate a colour for the level of nesting */
							String levelStr = ((Parent) parentItem.getWrappedObject()).getTitle() + ":" + ((Section) sectionItem.getWrappedObject()).getTitle();
							int hashcode = levelStr.hashCode() % 16777216;
							String hexHashCode = Integer.toHexString(hashcode);
							while (hexHashCode.length() < 6) hexHashCode += "0";
							int colour = Color.parseColor("#"+hexHashCode);

							View indentBar = view.findViewById(R.id.indent_bar);
							indentBar.setBackgroundColor(colour);

							TextView titleText = (TextView) view.findViewById(R.id.title_text);
							titleText.setText(name);
							return view;
						});
						this.list.add(noteItem);
					}
				}
				this.depth--;
//				this.path.remove(this.path.size()-1);
			}
		}
	}

	private void getNotepads() {
		File notpadFile = (File)getIntent().getExtras().get("NOTEPAD_FILE");
		NpxReader npxReader = new NpxReader();
		npxReader.execute(notpadFile, 1);
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
		switch (requestCode) {
			case PERMISSION_REQ_FILESYSTEM:
				if (grantResults.length > 1 && (grantResults[0] | grantResults[1]) == PackageManager.PERMISSION_GRANTED) {
					this.filesystemManager = new FilesystemManager();
					this.getNotepads();
				}
				else {
					new AlertDialog.Builder(this)
							.setTitle("Permission Denied")
							.setMessage("Error accessing the device's storage")
							.setPositiveButton("Close", (dialog, which) -> {
								System.exit(0);
							})
							.show();
				}
				return;
		}
	}

	private class NpxReader extends AsyncTask<Object, String, Notepad> {
		private Notepad res;
		private int totalFiles = 0;

		@Override
		protected void onPreExecute() {
			//TODO: Show progress bar
		}

		@Override
		protected Notepad doInBackground(Object... params) {
			totalFiles = (int)params[1];

			try {
				res = Parser.parseNpx((File)params[0]);
			} catch (Exception e) {
				res = null;
			}
			return res;
		}

		@Override
		protected void onPostExecute(Notepad notepad) {
			//TODO: Hide progress bar
			if (notepad == null) {
				totalFiles--;
				new AlertDialog.Builder(getApplicationContext())
						.setTitle("Error")
						.setMessage("Error parsing notepad")
						.setCancelable(true)
						.setPositiveButton("Close", (dialog, which) -> {})
						.show();
			}
			else {
				notepads.add(notepad);
				if (notepads.size() == totalFiles) updateList(getLayoutInflater(), notepads);
			}
		}
	}
}
