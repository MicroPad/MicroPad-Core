import './ZoomComponent.css';
import React from 'react';
import { Icon } from 'react-materialize';
import { ConnectedProps } from 'react-redux';
import { zoomConnector } from './ZoomContainer';
import Button2 from '../../Button';

const ZoomComponent = (props: ConnectedProps<typeof zoomConnector>) => {
	if (!props.isFullScreen) return null;

	return (
		<div className="zoom__container">
			<Button2 waves="light" onClick={() => props.zoomOut()}><Icon>zoom_out</Icon></Button2>
			<Button2 waves="light" onClick={() => props.zoomIn()}><Icon>zoom_in</Icon></Button2>
		</div>
	);
}

export default ZoomComponent;
