const NAV_HEIGHT = 52;

export function getOffset(isFullScreen: boolean): number {
	return isFullScreen ? NAV_HEIGHT : NAV_HEIGHT * 2;
}
