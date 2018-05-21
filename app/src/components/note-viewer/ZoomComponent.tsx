import * as React from 'react';
import { isMobile } from '../../util';
import { Button, Icon } from 'react-materialize';

export interface IZoomComponentProps {
	update: (newZoom: number) => void;
}

export default class ZoomComponent extends React.Component<IZoomComponentProps> {
	render() {
		const { update } = this.props;
		if (!isMobile()) return <div />;

		return (
			<div style={{
				position: 'absolute',
				bottom: 5,
				right: 5
			}}>
				<Button className="blue-grey" waves="light" onClick={() => update(-0.09)}><Icon>zoom_out</Icon></Button>
				<Button className="blue-grey" waves="light" onClick={() => update(0.09)}><Icon>zoom_in</Icon></Button>
			</div>
		);
	}
}
