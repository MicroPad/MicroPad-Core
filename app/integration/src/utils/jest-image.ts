import { MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';

export const IMG_SNAPSHOT_OPTS: MatchImageSnapshotOptions = {
	diffDirection: 'vertical',
	// useful on CI (no need to retrieve the diff image, copy/paste image content from logs)
	dumpDiffToConsole: true,
	// use SSIM to limit false positive
	// https://github.com/americanexpress/jest-image-snapshot#recommendations-when-using-ssim-comparison
	comparisonMethod: 'ssim',
	failureThresholdType: 'percent',
	failureThreshold: 0.03
};

expect.extend({ toMatchImageSnapshot });
