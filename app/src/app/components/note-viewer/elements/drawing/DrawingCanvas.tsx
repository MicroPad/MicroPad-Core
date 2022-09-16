import React from 'react';

export type DrawingCanvasProps = React.DetailedHTMLProps<React.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;

export default class DrawingCanvas extends React.Component<DrawingCanvasProps> {
	public inner: HTMLCanvasElement | null = null;

	override render() {
		return <canvas {...this.props} ref={e => this.inner = e} />;
	};

	override shouldComponentUpdate(nextProps: Readonly<DrawingCanvasProps>, nextState: Readonly<{}>, nextContext: any): boolean {
		return false;
	}
}
