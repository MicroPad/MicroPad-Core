package com.getmicropad.NPXParser;

import org.simpleframework.xml.Attribute;
import org.simpleframework.xml.Text;

public class MarkdownElement extends BasicElement {
	@Attribute
	private String fontSize;

	public MarkdownElement(String content, String id, String x, String y, String width, String height, String fontSize) {
		super(content, id, x, y, width, height);
		this.fontSize = fontSize;
	}

	public String getFontSize() {
		return this.fontSize;
	}

	public void setFontSize(String fontSize) {
		this.fontSize = fontSize;
	}
}
