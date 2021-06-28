import * as React from 'react';
import './NotepadBreadcrumbsComponent.css';
import { Breadcrumb as MaterialBreadcrumb, Icon } from 'react-materialize';

export type Breadcrumb = {
	text: string;
	ref?: string;
};

export interface INotepadBreadcrumbsProps {
	breadcrumbs: Breadcrumb[];
	hasNotebookOpen?: boolean;
	noteTime?: string;
	focusItem?: (ref?: string) => void;
}

export default class NotepadBreadcrumbsComponent extends React.Component<INotepadBreadcrumbsProps> {
	render() {
		const { breadcrumbs, hasNotebookOpen, noteTime, focusItem } = this.props;

		const crumbs: JSX.Element[] = [];
		breadcrumbs.forEach((crumb: Breadcrumb, i: number) => {
			const isLast = i === breadcrumbs.length - 1;

			crumbs.push(
				<a
					key={`${crumb.ref ?? 'np'}-${crumb.text}`}
					className="notepad-breadcrumbs__breadcrumb"
					href={hasNotebookOpen ? '#!' : undefined}
					onClick={() => hasNotebookOpen && !!focusItem && focusItem(crumb.ref)}
					style={{
						opacity: isLast ? 1 : 0.7
					}}>

					{crumb.text} {isLast && !!noteTime && <span className="notepad-breadcrumbs__timestamp">
						<Icon className="notepad-breadcrumbs__timestamp-icon" left>schedule</Icon> {noteTime}
					</span>}
				</a>
			);
		});

		return (
			<div id="breadcrumb-holder">
				<MaterialBreadcrumb>
					{crumbs}
				</MaterialBreadcrumb>
			</div>
		);
	}
}
