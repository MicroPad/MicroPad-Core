import * as React from 'react';
import { CSSProperties } from 'react';
import { isMobile } from '../util';
import * as Materialize from 'materialize-css/dist/js/materialize';

export interface IHelpMessageComponentProps {
	show: boolean;
	hide?: (pref: boolean) => void;
}

export interface IHelpMessageComponentLocalProps {
	message: string;
	video?: any;
}

/**
 * Loads inline help videos demonstrating the process of creating a new note to the user
 */
export default class HelpMessageComponent extends React.Component<IHelpMessageComponentProps & IHelpMessageComponentLocalProps> {
	render() {
		if (isMobile()) return <div />;
		const { message, video, show, hide } = this.props;
		if (!show) return null;

		const containerStyle: CSSProperties = {
			position: 'fixed',
			backgroundColor: '#607d8b',
			borderRadius: '10px',
			right: 310,
			top: 150,
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

				<span>(<a style={{ textDecoration: 'underline' }} href="#!" onClick={() => {
					hide!(false);
					Materialize.toast('You can get the videos to appear again by opening the help notepad', 5000);
				}}>Don't show me these again</a>)</span>
			</div>
		);
	}
}
