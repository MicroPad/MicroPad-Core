import * as React from 'react';
import { CSSProperties } from 'react';
import './NotepadBreadcrumbsComponent.css';
import { Breadcrumb as MaterialBreadcrumb, MenuItem } from 'react-materialize';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import { generateGuid } from '../../../util';
import { ThemeName } from '../../../../core/types/Themes';

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
	private readonly timeStyle = {
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
		(breadcrumbs || []).forEach((crumb: Breadcrumb, i: number) =>
			crumbs.push(
				<MenuItem key={generateGuid()} href={!!crumb.ref ? '#!' : undefined} onClick={() => !!focusItem && focusItem(crumb.ref)}>
					{crumb.text} {i === breadcrumbs.length - 1 && !!noteTime && <span style={this.timeStyle}>{noteTime}</span>}
				</MenuItem>
			));

		// return (
		// 	<div id="breadcrumb-holder" style={breadcrumbStyle}>
		// 		<MaterialBreadcrumb className={themeName}>
		// 			{crumbs}
		// 		</MaterialBreadcrumb>
		// 	</div>
		// );

		return (
			<div id="breadcrumb-holder" style={breadcrumbStyle}>
				<Breadcrumbs separator="›" className={themeName}>
					<Link>yolo</Link>
					<Link>yeet</Link>
				</Breadcrumbs>
			</div>
		);
	}
}
