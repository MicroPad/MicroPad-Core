// MIT http://rem.mit-license.org

type Bound = {
	top: number | null,
	left: number | null,
	right: number | null,
	bottom: number | null,
}

export function trim(c) {
	const ctx = c.getContext('2d');
	const copy = document.createElement('canvas').getContext('2d')!;
	const pixels = ctx.getImageData(0, 0, c.width, c.height);
	const l = pixels.data.length;
	const bound: Bound = {
		top: null,
		left: null,
		right: null,
		bottom: null
	};
	let i: number;
	let x: number;
	let y: number;

	for (i = 0; i < l; i += 4) {
		if (pixels.data[i + 3] !== 0) {
			x = (i / 4) % c.width;
			y = ~~((i / 4) / c.width);

			if (bound.top === null) {
				bound.top = y;
			}

			if (bound.left === null) {
				bound.left = x;
			} else if (x < bound.left) {
				bound.left = x;
			}

			if (bound.right === null) {
				bound.right = x;
			} else if (bound.right < x) {
				bound.right = x;
			}

			if (bound.bottom === null) {
				bound.bottom = y;
			} else if (bound.bottom < y) {
				bound.bottom = y;
			}
		}
	}
	bound.bottom!++;
	bound.right!++;

	const trimHeight = bound.bottom! - bound.top!,
		trimWidth = bound.right! - bound.left!,
		trimmed = ctx.getImageData(bound.left!, bound.top!, trimWidth, trimHeight);

	copy.canvas.width = trimWidth;
	copy.canvas.height = trimHeight;
	copy.putImageData(trimmed, 0, 0);

	// open new window with trimmed image:
	return copy.canvas;
}
