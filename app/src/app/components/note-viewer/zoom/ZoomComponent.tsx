import './ZoomComponent.css';
import React from 'react';
import { Button, Icon } from 'react-materialize';
import { ConnectedProps } from 'react-redux';
import { zoomConnector } from './ZoomContainer';

const ZoomComponent = (props: ConnectedProps<typeof zoomConnector>) => {
	if (!props.isFullScreen) return null;

	return (
		<div className="zoom__container">
			<Button waves="light" onClick={() => props.zoomOut()}><Icon>zoom_out</Icon></Button>
			<Button waves="light" onClick={() => props.zoomIn()}><Icon>zoom_in</Icon></Button>
		</div>
	);
}

export default ZoomComponent;
