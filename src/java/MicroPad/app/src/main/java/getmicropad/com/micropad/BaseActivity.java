package getmicropad.com.micropad;

import android.support.v7.app.AppCompatActivity;

import com.getmicropad.NPXParser.Note;
import com.getmicropad.NPXParser.Notepad;

import java.util.ArrayList;
import java.util.List;

public class BaseActivity extends AppCompatActivity {
	Notepad notepad;
	Note note;
	List<Integer> parentTree = new ArrayList<>();
}
