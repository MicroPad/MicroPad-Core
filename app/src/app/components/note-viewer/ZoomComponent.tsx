import * as React from 'react';
import { isMobile } from '../../util';
import { Button, Icon } from 'react-materialize';
import { ITheme } from '../../types/Themes';

export interface IZoomComponentProps {
	theme: ITheme;
	isFullScreen: boolean;
	update?: (newZoom: number) => void;
}

export default class ZoomComponent extends React.Component<IZoomComponentProps> {
	render() {
		const { update, theme, isFullScreen } = this.props;
		if (!isFullScreen) return <div />;

		const buttonStyle: React.CSSProperties = {
			backgroundColor: theme.chrome,
			transition: 'background-color .3s'
		};

		const offset = isMobile() ? 5 : 25;

		return (
			<div style={{
				position: 'absolute',
				bottom: offset,
				right: offset
			}}>
				<Button style={buttonStyle} waves="light" onClick={() => update!(-0.09)}><Icon>zoom_out</Icon></Button>
				<Button style={buttonStyle} waves="light" onClick={() => update!(0.09)}><Icon>zoom_in</Icon></Button>
			</div>
		);
	}
}
