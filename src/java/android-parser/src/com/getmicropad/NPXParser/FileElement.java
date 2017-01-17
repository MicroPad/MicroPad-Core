package com.getmicropad.NPXParser;

import org.simpleframework.xml.Attribute;

public class FileElement extends BasicElement {
	@Attribute
	private String filename;

	public FileElement() {};

	public FileElement(String content, String id, String x, String y, String width, String height, String filename) {
		super(content, id, x, y, width, height);
		this.filename = filename;
	}

	public String getFilename() {
		return this.filename;
	}

	public void setFilename(String filename) {
		this.filename = filename;
	}
}
