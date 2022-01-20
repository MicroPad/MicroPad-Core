import './InfoBannerComponent.css';
import React from 'react';
import { ConnectedProps } from 'react-redux';
import { infoBannerContainer } from './InfoBannerContainer';
import Button2 from '../../Button';
import { Icon } from 'react-materialize';

const InfoBannerComponent = (props: ConnectedProps<typeof infoBannerContainer>) => {
	if (!props.visible || !props.message) return null;

	return (
		<div className="info-banner">
			<div className="info-banner__container">
				<p className="info-banner__msg">
					<strong>{props.message.text}</strong>
					{props.message.cta
						&& <a
							className="info-banner__cta"
							target="_blank"
							rel="noopener noreferrer nofollow"
							href={props.message.cta}>
							Learn more.
						</a>
					}
				</p>
				<Button2 className="info-banner__close" flat onClick={props.dismiss}><Icon>close</Icon></Button2>
			</div>
		</div>
	);
};

export default InfoBannerComponent;

