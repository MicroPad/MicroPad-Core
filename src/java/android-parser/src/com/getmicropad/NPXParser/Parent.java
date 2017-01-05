package com.getmicropad.NPXParser;

import java.util.List;

public interface Parent {
	String getTitle();
	void setTitle(String title);
	List<Section> getSections();
	void setSections(List<Section> sections);
}
