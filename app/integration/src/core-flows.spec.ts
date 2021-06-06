import { stabiliseMicroPad } from './utils/general-ui';

describe(`Core Flows`, () => {
	beforeAll(async () => {
		await stabiliseMicroPad(); // Load MicroPad
	})

	it(`Create a notebook using the dropdown`, async () => {
		// Click text=collections_bookmark Notebooks arrow_drop_down
		await page.click('text=collections_bookmark Notebooks arrow_drop_down');
		// Click text=add New
		await page.click('text=add New');
		// Fill input[name="vex"]
		await page.fill('input[name="vex"]', 'Test Notebook');
		// Press Enter
		await page.press('input[name="vex"]', 'Enter');
		// Click text=edit Text (with markdown formatting)
		await page.click('text=edit Text (with markdown formatting)');
		// assert.equal(page.url(), 'http://localhost:3000/#!');
		// Fill textarea
		await page.fill('textarea', 'Hello!');
		// Press Escape
		await page.press('textarea', 'Escape');
		// Click :nth-match(:text("settings"), 3)
		await page.click(':nth-match(:text("settings"), 3)');
		// Click text=TitleRename notedelete_forever Delete noteExport/Print Note (PDF)Move noteTest N >> input[type="text"]
		await page.click('text=TitleRename notedelete_forever Delete noteExport/Print Note (PDF)Move noteTest N >> input[type="text"]', {
			modifiers: ['Control']
		});
		// Fill text=TitleRename notedelete_forever Delete noteExport/Print Note (PDF)Move noteTest N >> input[type="text"]
		await page.fill('text=TitleRename notedelete_forever Delete noteExport/Print Note (PDF)Move noteTest N >> input[type="text"]', 'Heya');
		// Click #modal_220 >> text=Rename note
		await page.click('text=Rename note');
		// Click text=add Section
		await page.click('text=add Section');
		// assert.equal(page.url(), 'http://localhost:3000/#!');
		// Fill input[name="vex"]
		await page.fill('input[name="vex"]', 'My Notes');
		// Click text=OKCancel >> button
		await page.click('text=OKCancel >> button');
		// Click :nth-match(i:has-text("settings"), 3)
		await page.click(':nth-match(i:has-text("settings"), 3)');
		// Press Enter
		await page.press('text=OKCancel >> button', 'Enter');
	});
});
