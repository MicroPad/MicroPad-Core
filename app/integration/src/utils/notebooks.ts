import { getCurrentModal } from './general-ui';

export async function createNotebookUsingDropdown() {
	// Click text=collections_bookmark Notebooks arrow_drop_down
	await page.click('#notepad-dropdown');
	// Click text=add New
	await page.click('text=add New');
	// Fill input[name="vex"]
	await page.waitForSelector('input[name="vex"]');
	await page.fill('input[name="vex"]', 'Test Notebook');
	// Press Enter
	await page.press('input[name="vex"]', 'Enter');
	// Click text=edit Text (with markdown formatting)
	await page.click('#insert-element a:nth-child(1)');
	// Fill textarea
	await page.fill('textarea', 'Hello!');
	// Wait for md to render
	await page.waitForTimeout(1000);
	// Press Escape
	await page.press('textarea', 'Escape');

	// Click :nth-match(:text("settings"), 3)
	await page.click(':nth-match(:text("settings"), 3)');
	let modal = await getCurrentModal();
	let modalId = `#${await modal.getAttribute('id')}`;

	// Click text=TitleRename notedelete_forever Delete noteExport/Print Note (PDF)Move noteTest N >> input[type="text"]
	await page.click(`${modalId} >> text=TitleRename notedelete_forever Delete noteExport/Print Note (PDF)Move noteTest N >> input[type="text"]`);
	// Fill text=TitleRename notedelete_forever Delete noteExport/Print Note (PDF)Move noteTest N >> input[type="text"]
	await page.fill(`${modalId} >> text=TitleRename notedelete_forever Delete noteExport/Print Note (PDF)Move noteTest N >> input[type="text"]`, 'Heya');
	// Click #modal_220 >> text=Rename note
	await page.click(`${modalId} >> text=Rename note`);
	// Click text=add Section
	await page.click('text=add Section');
	// Fill input[name="vex"]
	await page.fill('input[name="vex"]', 'My Notes');
	// Click text=OKCancel >> button
	await page.click('text=OKCancel >> button');
	// Open the note settings
	await page.click(':nth-match(i:has-text("settings"), 3)');
	modal = await getCurrentModal();
	modalId = `#${await modal.getAttribute('id')}`;

	// Move the note into the new section
	await page.selectOption(`${modalId} >> .explorer-options-modal__path-change >> select`, { label: 'Test Notebook > My Notes' });

	// Open the old section's settings
	await page.click(':nth-match(i:has-text("settings"), 2)');
	modal = await getCurrentModal();
	modalId = `#${await modal.getAttribute('id')}`;

	// Delete the section
	await page.click(`${modalId} >> text=delete_forever Delete section`);
	// Press Enter
	await page.press('text=OKCancel >> button', 'Enter');
	// Wait for animations, etc
	await page.waitForTimeout(1000);
}
