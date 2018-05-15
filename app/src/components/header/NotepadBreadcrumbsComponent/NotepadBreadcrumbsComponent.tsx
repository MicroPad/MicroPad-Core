import * as React from 'react';
import './NotepadBreadcrumbsComponent.css';
// @ts-ignore
import { Breadcrumb, MenuItem } from 'react-materialize';
import { generateGuid } from '../../../util';

export interface INotepadBreadcrumbsProps {
	breadcrumbs: string[];
	noteTime?: string;
}

export default class NotepadBreadcrumbsComponent extends React.Component<INotepadBreadcrumbsProps> {
	private readonly breadcrumbStyle = {
		position: 'fixed',
		width: '100%',
		top: '64px'
	};

	private readonly timeStyle = {
		paddingLeft: '20px',
		fontFamily: 'Roboto',
		fontWeight:  200 as 200
	};

	render() {
		const { breadcrumbs, noteTime } = this.props;

		const crumbs: JSX.Element[] = [];
		(breadcrumbs || []).forEach((title: string, i: number) =>
			crumbs.push(
				<MenuItem key={generateGuid()}>
					{title} {i === breadcrumbs.length - 1 && !!noteTime && <span style={this.timeStyle}>{noteTime}</span>}
				</MenuItem>
			));

		return (
			<div id="breadcrumb-holder" style={this.breadcrumbStyle as any}>
				<Breadcrumb className="blue-grey">
					{crumbs}
				</Breadcrumb>
			</div>
		);
	}
}
