import * as React from 'react';
import './NotepadBreadcrumbsComponent.css';
// @ts-ignore
import { Breadcrumb, MenuItem } from 'react-materialize';
import { generateGuid } from '../../../util';

export interface INotepadBreadcrumbsProps {
	breadcrumbs: string[];
}

export default class NotepadBreadcrumbsComponent extends React.Component<INotepadBreadcrumbsProps> {
	private readonly breadcrumbStyle = {
		position: 'fixed',
		width: '100%',
		top: '64px'
	};

	render() {
		const { breadcrumbs } = this.props;
		const crumbs: JSX.Element[] = [];
		(breadcrumbs || []).forEach(title => crumbs.push(<MenuItem key={generateGuid()}>{title}</MenuItem>));

		return (
			<div id="breadcrumb-holder" style={this.breadcrumbStyle as any}>
				<Breadcrumb className="blue-grey">
					{crumbs}
				</Breadcrumb>
			</div>
		);
	}
}
