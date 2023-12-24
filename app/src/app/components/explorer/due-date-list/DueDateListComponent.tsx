import React from 'react';
import { formatDistanceStrict, isAfter } from 'date-fns';
import { generateGuid } from '../../../util';
import { dueDateListConnector } from './DueDateListContainer';
import { ConnectedProps } from 'react-redux';
import DueDateOptionsComponent from './DueDateOptionsComponent';
import './DueDateListComponent.css';

type AllProps = ConnectedProps<typeof dueDateListConnector>;
const DueDateListComponent = (props: AllProps) => {
	const { currentTitle, isLoading, dueItems, loadNote } = props;
	if (dueItems.length < 1) return null;

	return (
		<div className="due-date-list">
				<span onContextMenu={handleOptsRightClick}>
					<strong>Upcoming due dates</strong>
					<DueDateOptionsComponent />
					{isLoading ? <em>(Recalculating…)</em> : <React.Fragment />}
				</span>
			<ol>
				{
					dueItems.map(item =>
						<li key={generateGuid()}>
							{item.notepadTitle} {'>'} <a
							href="#!"
							onClick={() => loadNote({
								notepadTitle: item.notepadTitle,
								noteRef: item.note.internalRef
							}, currentTitle)}
							style={{
								textDecoration: 'underline'
							}}>
							{item.note.title}
						</a> ({computeDistanceMessage(item.date)})
						</li>
					)
				}
			</ol>
		</div>
	);
};

function computeDistanceMessage(due: Date, currentDate: Date = new Date()): string {
	const baseMsg = formatDistanceStrict(due, currentDate);
	if (isAfter(due, currentDate)) {
		return baseMsg;
	}
	return baseMsg + ' ago';
}

function handleOptsRightClick(e: React.MouseEvent<HTMLElement, MouseEvent>): boolean {
	e.preventDefault();
	(e.target as Node).parentElement?.querySelector<HTMLAnchorElement>('.due-date-opts-trigger')?.click();
	return false;
}

export default DueDateListComponent;
