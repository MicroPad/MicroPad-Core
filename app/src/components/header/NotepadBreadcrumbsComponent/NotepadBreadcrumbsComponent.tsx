import * as React from 'react';
import { CSSProperties } from 'react';
import './NotepadBreadcrumbsComponent.css';
import { Breadcrumb, MenuItem } from 'react-materialize';
import { generateGuid } from '../../../util';
import { ThemeName } from '../../../types/Themes';

export interface INotepadBreadcrumbsProps {
	themeName: ThemeName;
	breadcrumbs: string[];
	noteTime?: string;
}

export default class NotepadBreadcrumbsComponent extends React.Component<INotepadBreadcrumbsProps> {
	private readonly timeStyle = {
		paddingLeft: '20px',
		fontFamily: 'Roboto',
		fontWeight:  200 as 200
	};

	render() {
		const { themeName, breadcrumbs, noteTime } = this.props;

		const breadcrumbStyle: CSSProperties = {
			position: 'fixed',
			width: '100%',
			top: '64px'
		};

		const crumbs: JSX.Element[] = [];
		(breadcrumbs || []).forEach((title: string, i: number) =>
			crumbs.push(
				<MenuItem key={generateGuid()}>
					{title} {i === breadcrumbs.length - 1 && !!noteTime && <span style={this.timeStyle}>{noteTime}</span>}
				</MenuItem>
			));

		return (
			<div id="breadcrumb-holder" style={breadcrumbStyle}>
				<Breadcrumb className={themeName}>
					{crumbs}
				</Breadcrumb>
			</div>
		);
	}
}
