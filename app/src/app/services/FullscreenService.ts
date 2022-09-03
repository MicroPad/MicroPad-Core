export const NAV_HEIGHT = 45;

export function getOffset(isFullScreen: boolean): number {
	return isFullScreen ? NAV_HEIGHT : NAV_HEIGHT * 2;
}
