import * as React from 'react';
import { CSSProperties } from 'react';
import './NotepadBreadcrumbsComponent.css';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import Link from '@material-ui/core/Link';
import { generateGuid } from '../../../util';
import { ThemeName } from '../../../types/Themes';

export type Breadcrumb = {
	text: string;
	ref?: string;
};

export interface INotepadBreadcrumbsProps {
	themeName: ThemeName;
	breadcrumbs: Breadcrumb[];
	noteTime?: string;
	focusItem?: (ref?: string) => void;
}

export default class NotepadBreadcrumbsComponent extends React.Component<INotepadBreadcrumbsProps> {
	private readonly timeStyle: CSSProperties = {
		paddingLeft: '20px',
		fontFamily: 'Roboto',
		fontWeight:  200 as 200
	};

	render() {
		const { themeName, breadcrumbs, noteTime, focusItem } = this.props;

		const breadcrumbStyle: CSSProperties = {
			position: 'fixed',
			width: '100%',
			top: '64px'
		};

		const crumbs: JSX.Element[] = [];
		(breadcrumbs || []).forEach((crumb: Breadcrumb, i: number) => {
			const isLast = i === breadcrumbs.length - 1;

			crumbs.push(
				<Link
					key={generateGuid()}
					className="notepad-breadcrumbs__breadcrumb"
					href={!!crumb.ref ? '#!' : undefined}
					onClick={() => !!focusItem && focusItem(crumb.ref)}
					underline="none"
					style={isLast ? { color: 'white' } : { color: 'hsla(0,0%, 100%, .7)' }}>

					{crumb.text} {isLast && !!noteTime && <span style={this.timeStyle}>{noteTime}</span>}

				</Link>
			);
		});

		return (
			<div id="breadcrumb-holder" style={breadcrumbStyle}>
				<Breadcrumbs
					separator={<NavigateNextIcon fontSize="small" style={{ color: 'hsla(0,0%, 100%, .7)' }} />}
					className={themeName}
					style={{ paddingLeft: '10px', paddingRight: '10px' }}>

					{crumbs}

				</Breadcrumbs>
			</div>
		);
	}
}
