package com.getmicropad.NPXParser;

import org.simpleframework.xml.Attribute;
import org.simpleframework.xml.Order;
import org.simpleframework.xml.Text;

@Order(attributes={"id", "x", "y", "height", "width", "fontSize"})
public class MarkdownElement implements NoteElement {
	@Text(data = true)
	private String content;

	@Attribute
	private String id;

	@Attribute
	private String x;

	@Attribute
	private String y;

	@Attribute
	private String width;

	@Attribute
	private String height;

	@Attribute
	private String fontSize;

	public MarkdownElement() {

	}

	public MarkdownElement(String content, String id, String x, String y, String width, String height, String fontSize) {
		this.content = content;
		this.id = id;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.fontSize = fontSize;
	}

	public String getFontSize() {
		return this.fontSize;
	}

	public void setFontSize(String fontSize) {
		this.fontSize = fontSize;
	}

	public String getContent() {
		return this.content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getId() {
		return this.id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getX() {
		return this.x;
	}

	public void setX(String x) {
		this.x = x;
	}

	public String getY() {
		return this.y;
	}

	public void setY(String y) {
		this.y = y;
	}

	public String getWidth() {
		return this.width;
	}

	public void setWidth(String width) {
		this.width = width;
	}

	public String getHeight() {
		return this.height;
	}

	public void setHeight(String height) {
		this.height = height;
	}
}
