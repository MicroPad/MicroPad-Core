package com.getmicropad.NPXParser;

import org.simpleframework.xml.Serializer;
import org.simpleframework.xml.core.Persister;
import org.simpleframework.xml.stream.Format;

import java.io.*;

public class Parser {
	private static Serializer serializer = new Persister(new NPXMatcher(), new Format(0, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>"));

	public static Notepad parseNpx(File in) throws Exception {
		return serializer.read(Notepad.class, in);
	}

	public static Notepad parseNpx(InputStream in) throws Exception {
		return serializer.read(Notepad.class, in);
	}

	public static Notepad parseNpx(Reader in) throws Exception {
		return serializer.read(Notepad.class, in);
	}

	public static Notepad parseNpx(String in) throws Exception {
		return serializer.read(Notepad.class, in);
	}

	public static Note parseNpxn(File in) throws Exception {
		return serializer.read(Note.class, in);
	}

	public static Note parseNpxn(InputStream in) throws Exception {
		return serializer.read(Note.class, in);
	}

	public static Note parseNpxn(Reader in) throws Exception {
		return serializer.read(Note.class, in);
	}

	public static Note parseNpxn(String in) throws Exception {
		return serializer.read(Note.class, in);
	}

	public static void toXml(Notepad notepad, File out) throws Exception {
		serializer.write(notepad, out);
	}

	public static void toXml(Notepad notepad, OutputStream out) throws Exception {
		serializer.write(notepad, out);
	}

	public static String toXml(Notepad notepad) throws Exception {
		ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
		serializer.write(notepad, byteArrayOutputStream);
		byteArrayOutputStream.close();
		return byteArrayOutputStream.toString();
	}

	public static String toNpxn(Note note) throws Exception {
		ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
		serializer.write(note, byteArrayOutputStream);
		byteArrayOutputStream.close();
		return byteArrayOutputStream.toString();
	}
}
