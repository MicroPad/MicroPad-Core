import * as React from 'react';
import { isMobile } from '../../util';
import { Button, Icon } from 'react-materialize';
import { ITheme } from '../../types/Themes';

export interface IZoomComponentProps {
	update: (newZoom: number) => void;
	theme: ITheme;
}

export default class ZoomComponent extends React.Component<IZoomComponentProps> {
	render() {
		const { update, theme } = this.props;
		if (!isMobile()) return <div />;

		const buttonStyle: React.CSSProperties = {
			backgroundColor: theme.chrome,
			transition: 'background-color .3s'
		};

		return (
			<div style={{
				position: 'absolute',
				bottom: 5,
				right: 5
			}}>
				<Button style={buttonStyle} waves="light" onClick={() => update(-0.09)}><Icon>zoom_out</Icon></Button>
				<Button style={buttonStyle} waves="light" onClick={() => update(0.09)}><Icon>zoom_in</Icon></Button>
			</div>
		);
	}
}
