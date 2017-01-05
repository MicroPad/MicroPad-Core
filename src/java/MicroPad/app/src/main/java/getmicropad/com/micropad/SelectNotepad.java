package getmicropad.com.micropad;

import android.graphics.Color;
import android.graphics.Typeface;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ListView;
import android.widget.TextView;

import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Section;

import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class SelectNotepad extends AppCompatActivity {
	List<NLevelItem> list;
	ListView mainList;
	Random rng = new Random();

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);

		this.mainList = (ListView)findViewById(R.id.main_list);
		this.list = new ArrayList<>();
		LayoutInflater inflater = LayoutInflater.from(this);


		NLevelAdapter adapter = new NLevelAdapter(list);
		this.mainList.setAdapter(adapter);
		updateList(inflater);
		this.mainList.setOnItemClickListener((AdapterView<?> arg0, View arg1, int arg2, long arg3) -> {
//			TextView titleText = (TextView)arg1.findViewById(R.id.title_text);
//			titleText.setTypeface(null, Typeface.BOLD);
			((NLevelAdapter)mainList.getAdapter()).toggle(arg2);
			((NLevelAdapter)mainList.getAdapter()).getFilter().filter();
		});
	}

	private void updateList(LayoutInflater inflater) {
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
