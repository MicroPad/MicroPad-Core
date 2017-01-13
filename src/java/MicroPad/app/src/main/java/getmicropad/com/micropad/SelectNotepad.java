package getmicropad.com.micropad;

import android.content.DialogInterface;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.ContextMenu;
import android.view.LayoutInflater;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;

import com.getmicropad.NPXParser.BasicElement;
import com.getmicropad.NPXParser.ImageElement;
import com.getmicropad.NPXParser.MarkdownElement;
import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parent;
import com.getmicropad.NPXParser.Parser;
import com.getmicropad.NPXParser.Section;
import com.getmicropad.NPXParser.Source;
import com.mikepenz.google_material_typeface_library.GoogleMaterial;
import com.mikepenz.iconics.IconicsDrawable;

import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class SelectNotepad extends BaseActivity {
	Notepad notepad;
	List<NLevelItem> list;
	ListView mainList;
	NLevelAdapter adapter;
	Random rng = new Random();

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);

		this.mainList = (ListView)findViewById(R.id.main_list);
		this.list = new ArrayList<>();
		LayoutInflater inflater = LayoutInflater.from(this);


		this.adapter = new NLevelAdapter(list);
		this.mainList.setAdapter(this.adapter);
//		updateListFake(inflater);
		List<Notepad> notepads = new ArrayList<>();
		try {
			notepads.add(Parser.parseNpx("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n" +
					"<notepad xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"https://getmicropad.com/schema.xsd\" title=\"Uni 2017\" lastModified=\"2017-01-04T00:51:32+13:00\">\n" +
					"  <section title=\"T1\">\n" +
					"    <section title=\"ENGR101\"/>\n" +
					"    <section title=\"ENGR142\"/>\n" +
					"    <section title=\"PHYS122\"/>\n" +
					"    <section title=\"POLS111\"/>\n" +
					"    <note title=\"Timetable (T1)\" time=\"2017-01-04T00:15:10+13:00\">\n" +
					"      <addons>\n" +
					"        <import>asciimath</import>\n" +
					"      </addons>\n" +
					"      <bibliography/>\n" +
					"      <markdown id=\"markdown1\" x=\"10px\" y=\"10px\" width=\"auto\" height=\"auto\" fontSize=\"16px\">| Time | Monday | Tuesday | Wednesday | Thursday | Friday |\n" +
					"|--|--|\n" +
					"| 9:00am | ENGR121 |  | ENGR121 | ENGR121 | ENGR121 |\n" +
					"| 10:00am | | PHYS122 | PHYS122 | | PHYS122 |\n" +
					"| 11:00am | ENGR101 | | ENGR101 | | ENGR101 |\n" +
					"| 12:00pm | POLS111 | | POLS111 | | POLS111 |</markdown>\n" +
					"    </note>\n" +
					"  </section>\n" +
					"  <section title=\"T2\">\n" +
					"    <section title=\"COMP103\"/>\n" +
					"    <section title=\"ENGR110\"/>\n" +
					"    <section title=\"ENGR123\"/>\n" +
					"    <section title=\"PHIL105\"/>\n" +
					"    <note title=\"Timetable (T2)\" time=\"2017-01-04T00:34:39+13:00\">\n" +
					"      <addons>\n" +
					"        <import>asciimath</import>\n" +
					"      </addons>\n" +
					"      <bibliography/>\n" +
					"      <markdown id=\"markdown1\" x=\"10px\" y=\"10px\" width=\"auto\" height=\"auto\" fontSize=\"16px\">| Time | Monday | Tuesday | Wednesday | Thursday | Friday |\n" +
					"|--|--|\n" +
					"| 10:00am | ENGR123 | | ENGR123 | ENGR123 |\n" +
					"| 11:00am | COMP103 | | COMP103 | COMP103 |\n" +
					"| 12:00pm || ENGR110 | ENGR110 |\n" +
					"| 1:10pm | PHIL105 | | PHIL105 | | PHIL105 |\n" +
					"| 2:10pm | | ENGR123 |</markdown>\n" +
					"    </note>\n" +
					"  </section>\n" +
					"</notepad>"));
		} catch (Exception e) {
			e.printStackTrace();
		}
		updateList(inflater, notepads);

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
}
