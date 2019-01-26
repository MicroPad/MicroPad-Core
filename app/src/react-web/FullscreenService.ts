export namespace FullScreenService {
	export function getOffset(isFullScreen: boolean): number {
		return isFullScreen ? 64 : 128;
	}
}
