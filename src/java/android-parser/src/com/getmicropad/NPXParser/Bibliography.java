package com.getmicropad.NPXParser;

import org.simpleframework.xml.ElementList;
import org.simpleframework.xml.Path;

import java.util.ArrayList;

public class Bibliography {
	@Path("note/bibliography")
	@ElementList(inline = true, entry = "source", type = Source.class)
	private ArrayList<Source> sources = new ArrayList<>();

	public ArrayList<Source> getBibliography() {
		return this.sources;
	}

	public void setBibliography(ArrayList<Source> sources) {
		this.sources = sources;
	}

	public void addSource(Source source) {
		this.sources.add(source);
	}
}
