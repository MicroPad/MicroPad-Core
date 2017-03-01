package com.getmicropad.micropad;

import android.content.Context;
import android.support.v7.app.AlertDialog;

import com.getmicropad.micropad.util.IabHelper;
import com.getmicropad.micropad.util.IabResult;
import com.getmicropad.micropad.util.Inventory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class IabManager {
	private IabHelper helper;
	private boolean iabEnabled = false;
	private Context context;

	public IabManager(Context context) {
		this.context = context;

		this.helper = new IabHelper(this.context, BuildConfig.IAB_KEY);
		this.helper.startSetup(res -> {
			if (res.isSuccess()) {
				iabEnabled = true;
			}
		});
	}

	public void destroy() {
		if (this.helper != null) try {
			this.helper.dispose();
		} catch (IabHelper.IabAsyncInProgressException e) {
			e.printStackTrace();
		}
		this.helper = null;
	}

	public void showPurchaseDialog() {
		List<String> subSkuList = new ArrayList<>();
		subSkuList.add("single_pack_2");
		subSkuList.add("study_pack");
		subSkuList.add("power_pack");

		try {
			this.helper.queryInventoryAsync(true, new ArrayList<>(), subSkuList, new IabHelper.QueryInventoryFinishedListener() {
				public void onQueryInventoryFinished(IabResult result, Inventory inventory) {
					if (result.isFailure()) {
						showError("Error getting data from Google Play");
						return;
					}

					//TODO: Show purchase dialog
				}
			});
		} catch (IabHelper.IabAsyncInProgressException e) {
			e.printStackTrace();
			showError("Error getting data from Google Play");
		}
	}

	public boolean getIabEnabled() {
		return this.iabEnabled;
	}

	private void showError(String msg) {
		new AlertDialog.Builder(context)
				.setTitle("Error")
				.setMessage(msg)
				.setCancelable(true)
				.setPositiveButton("Close", null)
				.show();
	}
}
