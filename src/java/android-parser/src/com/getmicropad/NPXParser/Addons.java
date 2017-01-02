package com.getmicropad.NPXParser;

import org.simpleframework.xml.Element;
import org.simpleframework.xml.ElementList;

import java.util.ArrayList;
import java.util.List;

@Element
public class Addons {
	@ElementList(entry = "import", inline = true)
	public List<String> imports = new ArrayList<>();

	public Addons() {
	}

	public Addons(List<String> addons) {
		this.imports = addons;
	}
}
