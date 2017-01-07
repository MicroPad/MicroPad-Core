package getmicropad.com.micropad;

import android.support.v7.app.AppCompatActivity;
import android.view.View;

import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parent;

import java.util.ArrayList;
import java.util.List;

public class BaseActivity extends AppCompatActivity {
	Notepad notepad;
	Note note;
	int notepadPos;
	int sectionPos;
	List<Integer> parentTree = new ArrayList<>();

	protected void updateParentTree(View view, NLevelAdapter adapter, int position) {
		this.parentTree.clear();
		String t = view.getTag(R.id.TAG_OBJECT_PATH).toString();
		NLevelItem parentItem = (NLevelItem)adapter.getItem(position).getParent();
		Parent p = (Parent)parentItem.getWrappedObject();
		while (p != null) {
			this.parentTree.add(0, Integer.parseInt(t));

			if (p.getClass() == Notepad.class) {
//				if (!this.getNotepad().getTitle().equals(p.getTitle())) {
//					this.updateParentTree(view, adapter, position);
//					return;
//				}
				break;
			}

			t = parentItem.getView().getTag(R.id.TAG_OBJECT_PATH).toString();
			parentItem = (NLevelItem)parentItem.getParent();
			p = (Parent)parentItem.getWrappedObject();
		}
	}

	protected void setNotepad(Notepad notepad) {
		this.notepad = notepad;
	}

	protected Notepad getNotepad(){
		return this.notepad;
	}
}
