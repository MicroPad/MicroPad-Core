import { stabiliseMicroPad } from './utils/general-ui';
import { createNotebookUsingDropdown } from './utils/notebooks';
import { IMG_SNAPSHOT_OPTS } from './utils/jest-image';

describe(`Core Flows`, () => {
	beforeAll(async () => {
		await stabiliseMicroPad(); // Load MicroPad
	})

	it.jestPlaywrightSkip({ browsers: ['chromium'] }, `Create a notebook using the dropdown`, async () => {
		// Arrange
		await createNotebookUsingDropdown();

		// Act
		const explorer = (await page.$('.notepad-explorer'))!;
		expect(explorer).toBeDefined();

		const noteViewer = (await page.$('#note-viewer'))!;
		expect(noteViewer).toBeDefined();

		const breadcrumbsText = await page.$eval('#breadcrumb-holder', e => e?.textContent);

		// Assert
		expect(await explorer.isVisible()).toBe(true);
		expect(await explorer.screenshot()).toMatchImageSnapshot(IMG_SNAPSHOT_OPTS);

		expect(await noteViewer.isVisible()).toBe(true);
		expect(await noteViewer.screenshot()).toMatchImageSnapshot(IMG_SNAPSHOT_OPTS);

		expect(breadcrumbsText?.startsWith('Test Notebook My Notes Heya')).toBe(true);
	});
});
