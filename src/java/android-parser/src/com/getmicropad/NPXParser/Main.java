package com.getmicropad.NPXParser;

import org.simpleframework.xml.Serializer;
import org.simpleframework.xml.core.Persister;
import org.simpleframework.xml.stream.Format;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

public class Main {

    public static void main(String[] args) {
        Serializer serializer = new Persister(new NPXMatcher(), new Format("<?xml version=\"1.0\" encoding= \"UTF-8\" ?>"));
        Notepad notepad = new Notepad("Test");

        Section s1 = new Section("test section");
        Note n1 = new Note("Blarghh");
	    List<String> addonList = new ArrayList<>();
	    addonList.add("asciimath");
	    addonList.add("teast");
        n1.setAddons(addonList);
        Note n2 = new Note("More");
	    BasicElement be = new ImageElement("base64", "image1", "10px", "10px", "400px", "400px");
        n2.elements.add(be);
        n2.elements.add(new MarkdownElement("This is some\n\nescaped text", "markdown1", "10px", "10px", "400px", "400px", "16px"));
        s1.notes.add(n1);
	    s1.notes.add(n2);
        notepad.sections.add(s1);
	    notepad.sections.add(new Section("More"));

	    ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
	    try {
		    serializer.write(notepad, byteArrayOutputStream);
		    System.out.println(byteArrayOutputStream.toString());
	    } catch (Exception e) {
		    e.printStackTrace();
	    }
    }
}
