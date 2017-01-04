package getmicropad.com.micropad;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ListView;
import android.widget.TextView;

import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parser;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;

public class SelectNotepad extends AppCompatActivity {
	List<NLevelItem> list;
	ListView mainList;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_select_notepad);

		this.mainList = (ListView)findViewById(R.id.main_list);
		this.list = new ArrayList<>();
		final LayoutInflater inflater = LayoutInflater.from(this);

		for (int i = 0; i < 5; i++) {
			final NLevelItem notepadItem = new NLevelItem(new Notepad("Notepad " + i), null, (NLevelItem item) -> {
				View view = inflater.inflate(R.layout.notepad_list_item, null);
				TextView tv = (TextView)view.findViewById(R.id.textView);
				String name = ((Notepad)item.getWrappedObject()).getTitle();
				tv.setText(name);
				return view;
			});
			this.list.add(notepadItem);
		}

		NLevelAdapter adapter = new NLevelAdapter(list);
		this.mainList.setAdapter(adapter);
	}
}
