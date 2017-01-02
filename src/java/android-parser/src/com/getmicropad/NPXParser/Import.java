package com.getmicropad.NPXParser;

import org.simpleframework.xml.Element;
import org.simpleframework.xml.Text;

@Element(name="import")
public class Import {
	@Text
	private String name;

	public Import() {}
	public Import(String name) {
		this.name = name;
	}

	public String getName() {
		return this.name;
	}

	public void setName(String name) {
		this.name = name;
	}
}
