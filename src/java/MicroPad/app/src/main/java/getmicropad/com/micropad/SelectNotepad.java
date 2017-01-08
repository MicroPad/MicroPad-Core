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
					"<notepad xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"https://getmicropad.com/schema.xsd\" title=\"Test\" lastModified=\"2017-01-03T02:32:55+13:00\">\n" +
					"  <section title=\"test section\">\n" +
					"    <note title=\"Blarghh\" time=\"2017-01-03T01:33:13+13:00\">\n" +
					"      <addons>\n" +
					"        <import>teast</import>\n" +
					"        <import>asciimath</import>\n" +
					"      </addons>\n" +
					"      <bibliography>\n" +
					"        <source id=\"1\" item=\"markdown1\">https://example.com</source>\n" +
					"      </bibliography>\n" +
					"      <markdown id=\"markdown1\" x=\"135px\" y=\"128px\" width=\"auto\" height=\"auto\" fontSize=\"16px\">Yolo</markdown>\n" +
					"    </note>\n" +
					"    <note title=\"More\" time=\"2017-01-03T01:33:13+13:00\">\n" +
					"      <addons/>\n" +
					"      <bibliography/>\n" +
					"      <markdown id=\"markdown1\" x=\"10px\" y=\"10px\" width=\"201px\" height=\"auto\" fontSize=\"16px\">This is some\n" +
					"\n" +
					"escaped text</markdown>\n" +
					"      <image id=\"image1\" x=\"243px\" y=\"11px\" width=\"400px\" height=\"400px\">data:image/gif;base64,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</image>\n" +
					"    </note>\n" +
					"  </section>\n" +
					"  <section title=\"More\">\n" +
					"    <section title=\"Inception\"/>\n" +
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

	protected void updateNotepad(Section section, List<Section> parentList, int parentTreeIndex, LayoutInflater inflater) {
		super.updateNotepad(section, parentList, parentTreeIndex);
		List<Notepad> notepads = new ArrayList<>();
		notepads.add(this.getNotepad());
		updateList(inflater, notepads);
	}

	protected void updateNotepad(Note note, List<Section> parentList, int parentTreeIndex, LayoutInflater inflater) {
		super.updateNotepad(note, parentList, parentTreeIndex);
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
			if (Parent.class.isInstance(selectedObj)) menu.add(0, 0, 0, "New Section");
			if (Section.class.isInstance(selectedObj)) menu.add(0, 0, 0, "New Note");

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
									updateNotepad((Section)null, ((Parent)((NLevelItem)selItem.getParent()).getWrappedObject()).getSections(), 0, getLayoutInflater());
								}).setNegativeButton(android.R.string.no, null).show();
						return true;
					case "note":
						updateParentTree(info.targetView, this.adapter, info.position);
						new AlertDialog.Builder(this)
								.setTitle("Confirm Deletion")
								.setMessage("Are you sure you want to delete this?")
								.setIcon(new IconicsDrawable(this).icon(GoogleMaterial.Icon.gmd_delete_forever))
								.setPositiveButton(android.R.string.yes, (dialogInterface, whichButton) -> {
									updateNotepad((Note)null, ((Section)((NLevelItem)selItem.getParent()).getWrappedObject()).getSections(), 0, getLayoutInflater());
								}).setNegativeButton(android.R.string.no, null).show();
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
					int colour = Color.parseColor("#"+Integer.toHexString(hashcode));

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
							int colour = Color.parseColor("#" + Integer.toHexString(hashcode));

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

	private void updateListFake(LayoutInflater inflater) {
		this.list.clear();
		for (int i = 0; i < 5; i++) {
			NLevelItem notepadItem = new NLevelItem(new Notepad("Notepad " + i), null, (NLevelItem item) -> {
				View view = inflater.inflate(R.layout.notepad_list_item, null);
				String name = ((Notepad)item.getWrappedObject()).getTitle();
				TextView titleText = (TextView)view.findViewById(R.id.title_text);
				if (item.isExpanded()) titleText.setTypeface(null, Typeface.BOLD);
				titleText.setText(name);
				return view;
			});
			this.list.add(notepadItem);

			for (int j = 0; j < 3; j++) {
				NLevelItem sectionItem = new NLevelItem(new Section("Section " + j), notepadItem, (NLevelItem item) -> {
					View view = inflater.inflate(R.layout.section_list_item, null);
					String name = ((Section)item.getWrappedObject()).getTitle();

					/** Generate a colour for the level of nesting */
					String levelStr = ((Notepad)notepadItem.getWrappedObject()).getTitle();
					int hashcode = levelStr.hashCode() % 16777216;
					int colour = Color.parseColor("#"+Integer.toHexString(hashcode));

					View indentBar = view.findViewById(R.id.indent_bar);
					indentBar.setBackgroundColor(colour);

					TextView titleText = (TextView)view.findViewById(R.id.title_text);
					if (item.isExpanded()) titleText.setTypeface(null, Typeface.BOLD);
					titleText.setText(name);
					return view;
				});
				this.list.add(sectionItem);

				for (int k = 0; k < 10; k++) {
					NLevelItem noteItem = new NLevelItem(new Note("Note " + k), sectionItem, (NLevelItem item) -> {
						if (item.isExpanded()) item.toggle();
						View view = inflater.inflate(R.layout.section_list_item, null);
						String name = ((Note)item.getWrappedObject()).getTitle();

						/** Generate a colour for the level of nesting */
						String levelStr = ((Notepad)notepadItem.getWrappedObject()).getTitle()+":"+((Section)sectionItem.getWrappedObject()).getTitle();
						int hashcode = levelStr.hashCode() % 16777216;
						int colour = Color.parseColor("#"+Integer.toHexString(hashcode));

						View indentBar = view.findViewById(R.id.indent_bar);
						indentBar.setBackgroundColor(colour);

						TextView titleText = (TextView)view.findViewById(R.id.title_text);
						titleText.setText(name);
						return view;
					});
					this.list.add(noteItem);
				}
			}
		}
		((NLevelAdapter)mainList.getAdapter()).getFilter().filter();
	}
}
