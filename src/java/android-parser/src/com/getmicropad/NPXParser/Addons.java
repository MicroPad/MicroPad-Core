package com.getmicropad.NPXParser;

import org.simpleframework.xml.Element;
import org.simpleframework.xml.ElementList;
import org.simpleframework.xml.Path;
import org.simpleframework.xml.Root;

import java.util.ArrayList;
import java.util.List;

@Root
public class Addons {
	@Path("note/addons")
	@ElementList(name = "addons", entry = "import", inline = true, type = Import.class)
	public List<Import> imports = new ArrayList<>();

	public Addons() {
	}

	public Addons(List<Import> addons) {
		this.imports = addons;
	}
}
