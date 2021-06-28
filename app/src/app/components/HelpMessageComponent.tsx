import * as React from 'react';
import { CSSProperties } from 'react';
import { isMobile } from '../util';
import { ITheme } from '../types/Themes';

export interface IHelpMessageComponentProps {
	show: boolean;
	theme: ITheme;
	hide?: (pref: boolean) => void;
}

export interface IHelpMessageComponentLocalProps {
	message: JSX.Element;
	video?: any;
}

/**
 * Loads inline help videos demonstrating the process of creating a new note to the user
 */
export default class HelpMessageComponent extends React.Component<IHelpMessageComponentProps & IHelpMessageComponentLocalProps> {
	render() {
		if (isMobile()) return <div />;
		const { message, video, show, hide, theme } = this.props;
		if (!show) return null;

		const containerStyle: CSSProperties = {
			position: 'fixed',
			backgroundColor: theme.chrome,
			borderRadius: '10px',
			right: 25,
			top: 150,
			padding: '5px',
			width: '400px',
			minHeight: '100px',
			transition: 'background-color .3s',
			whiteSpace: 'normal'
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

				<br /><span>(<a style={{ textDecoration: 'underline' }} href="#!" onClick={() => {
					hide!(false);
					M.toast({ html: `You can get the videos to appear again by opening the help notepad`, displayLength: 5000 });
				}}>Don't show me these again</a>)</span>
			</div>
		);
	}
}
