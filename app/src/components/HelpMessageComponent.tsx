import * as React from 'react';
import { CSSProperties } from 'react';
import { isMobile } from '../util';

export interface IHelpMessageComponent {
	message: string;
	video?: any;
}

/**
 * Loads inline help videos demonstrating the process of creating a new note to the user
 */
export default class HelpMessageComponent extends React.Component<IHelpMessageComponent> {
	render() {
		if (isMobile()) return <div />;
		const { message, video } = this.props;

		const containerStyle: CSSProperties = {
			position: 'fixed',
			backgroundColor: '#607d8b',
			borderRadius: '10px',
			right: 310,
			top: 140,
			padding: '5px',
			width: '400px',
			minHeight: '100px'
		};

		return (
			<div style={containerStyle}>
				{message}<br />

				{
					!!video &&
					<video
						src={video}
						autoPlay={true}
						controls={true}
						loop={true}
						muted={true}
						playsInline={true}
						width="390px" />
				}
			</div>
		);
	}
}
