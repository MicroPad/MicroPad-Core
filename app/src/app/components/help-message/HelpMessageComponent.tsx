import './HelpMessageComponent.css';
import React from 'react';
import { isMobile } from '../../util';
import { ConnectedProps } from 'react-redux';
import { helpMessageConnector } from './HelpMessageContainer';

export interface IHelpMessageComponentLocalProps {
	message: JSX.Element;
	video?: any;
}

type Props = ConnectedProps<typeof helpMessageConnector> & IHelpMessageComponentLocalProps;

/**
 * Loads inline help videos demonstrating the process of creating a new note to the user
 */
const HelpMessageComponent = (props: Props) => {
	if (!props.show || isMobile()) return null;

	const { message, video, hide } = props;

	return (
		<div className="HelpMessage__container">
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

export default HelpMessageComponent;
