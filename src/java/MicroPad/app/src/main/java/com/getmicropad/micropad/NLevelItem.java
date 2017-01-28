package com.getmicropad.micropad;

import android.view.View;

public class NLevelItem implements NLevelListItem {
	private Object wrappedObject;
	private NLevelItem parent;
	private NLevelView nLevelView;
	private boolean isExpanded = false;

	public NLevelItem(Object wrappedObject, NLevelItem parent, NLevelView nLevelView) {
		this.wrappedObject = wrappedObject;
		this.parent = parent;
		this.nLevelView = nLevelView;
	}

	public Object getWrappedObject() {
		return this.wrappedObject;
	}

	@Override
	public boolean isExpanded() {
		return this.isExpanded;
	}

	@Override
	public void toggle() {
		this.isExpanded = !this.isExpanded;
	}

	@Override
	public NLevelListItem getParent() {
		return this.parent;
	}

	@Override
	public View getView() {
		return this.nLevelView.getView(this);
	}
}
