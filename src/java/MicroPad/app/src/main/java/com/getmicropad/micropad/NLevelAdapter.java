package com.getmicropad.micropad;

import android.os.AsyncTask;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;

import java.util.ArrayList;
import java.util.List;

public class NLevelAdapter extends BaseAdapter {
	List<NLevelItem> list;
	List<NLevelListItem> filtered;
	public void setFiltered(ArrayList<NLevelListItem> filtered) {
		this.filtered = filtered;

	}
	public NLevelAdapter(List<NLevelItem> list) {
		this.list = list;
		this.filtered = filterItems();
	}

	@Override
	public int getCount() {
		return filtered.size();
	}

	@Override
	public NLevelListItem getItem(int arg0) {
		return filtered.get(arg0);
	}

	@Override
	public long getItemId(int arg0) {
		return 0;
	}

	@Override
	public View getView(int arg0, View arg1, ViewGroup arg2) {
		return getItem(arg0).getView();
	}

	public NLevelFilter getFilter() {
		return new NLevelFilter();
	}


	class NLevelFilter {

		public void filter() {
			new AsyncFilter().execute();
		}

		class AsyncFilter extends AsyncTask<Void, Void, ArrayList<NLevelListItem>> {

			@Override
			protected ArrayList<NLevelListItem> doInBackground(Void... arg0) {

				return (ArrayList<NLevelListItem>) filterItems();
			}

			@Override
			protected void onPostExecute(ArrayList<NLevelListItem> result) {
				setFiltered(result);
				NLevelAdapter.this.notifyDataSetChanged();
			}
		}
	}

	public List<NLevelListItem> filterItems() {
		List<NLevelListItem> tempfiltered = new ArrayList<>();
		//TODO: Fix/Catch exception that can (seemingly randomly) occur here
		try {
			OUTER:
			for (NLevelListItem item : list) {
				//add expanded items and top level items
				//if parent is null then its a top level item
				if (item.getParent() == null) {
					tempfiltered.add(item);
				} else {
					//go through each ancestor to make sure they are all expanded
					NLevelListItem parent = item;
					while ((parent = parent.getParent()) != null) {
						if (!parent.isExpanded()) {
							//one parent was not expanded
							//skip the rest and continue the OUTER for loop
							continue OUTER;
						}
					}
					tempfiltered.add(item);
				}
			}
		}
		catch (Exception e) {
			tempfiltered = filterItems();
		}

		return tempfiltered;
	}

	public void toggle(int arg2) {
		filtered.get(arg2).toggle();
	}
}
