package getmicropad.com.micropad;

import android.content.Context;
import android.support.v7.app.AppCompatActivity;
import android.view.View;

import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.Notepad;
import com.getmicropad.NPXParser.Parent;
import com.getmicropad.NPXParser.Section;
import com.mikepenz.iconics.context.IconicsContextWrapper;

import java.util.ArrayList;
import java.util.List;

public class BaseActivity extends AppCompatActivity {
	Notepad notepad;
	Section section;
	Note note;
	List<Integer> parentTree = new ArrayList<>();

	@Override
	protected void attachBaseContext(Context newBase) {
		super.attachBaseContext(IconicsContextWrapper.wrap(newBase));
	}

	protected void updateParentTree(View view, NLevelAdapter adapter, int position) {
		this.parentTree.clear();
		String t = view.getTag(R.id.TAG_OBJECT_PATH).toString();
		NLevelItem parentItem = (NLevelItem)adapter.getItem(position).getParent();
		Parent p = (Parent)parentItem.getWrappedObject();
		while (p != null) {
			this.parentTree.add(0, Integer.parseInt(t));

			if (p.getClass() == Notepad.class) {
				break;
			}

			t = parentItem.getView().getTag(R.id.TAG_OBJECT_PATH).toString();
			parentItem = (NLevelItem)parentItem.getParent();
			p = (Parent)parentItem.getWrappedObject();
		}
	}

	protected void updateNotepad(Section section, List<Section> parentList, int parentTreeIndex) {
		if (parentTreeIndex == this.parentTree.size()-1) {
			//We're at the section we want to update
			if (section != null) {
				parentList.set(parentTreeIndex, section);
			}
			else {
				parentList.remove((int)this.parentTree.get(parentTreeIndex));
			}
			return;
		}
		if (parentTreeIndex == this.parentTree.size()) return;

		parentTreeIndex++;
		updateNotepad(section, parentList.get(this.parentTree.get(parentTreeIndex)).getSections(), parentTreeIndex);
	}

	protected void updateNotepad(Note note, List<Section> parentList, int parentTreeIndex) {
		if (parentTreeIndex == this.parentTree.size()-2) {
			if (note != null) {
				parentList.get(parentTreeIndex).notes.set(parentTreeIndex + 1, note);
			}
			else {
				parentList.get(parentTreeIndex).notes.remove(parentTreeIndex + 1);
			}
			return;
		}

		if (parentTreeIndex == this.parentTree.size()) return;

		parentTreeIndex++;
		updateNotepad(note, parentList.get(parentTreeIndex).getSections(), parentTreeIndex);
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
	}

	protected Note getNote() {
		return this.note;
	}
}
