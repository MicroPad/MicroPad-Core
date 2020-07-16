import * as React from 'react';
import { distanceInWordsStrict } from 'date-fns';
import { generateGuid } from '../../util';
import { RestoreJsonNotepadAndLoadNoteAction } from '../../types/ActionTypes';
import { DueItem } from '../../services/DueDates';

export interface IDueDateListComponentProps {
	currentTitle?: string;
	isLoading: boolean;
	dueItems: DueItem[];
	loadNote?: (data: RestoreJsonNotepadAndLoadNoteAction, currentNotepadTitle?: string) => void;
}

export default class DueDateListComponent extends React.Component<IDueDateListComponentProps> {
	render() {
		const { currentTitle, isLoading, dueItems, loadNote } = this.props;
		if ((dueItems.length < 1 && !isLoading) || !loadNote) return null;

		return (
			<div className="due-date-list">
				<span>
					<strong>Upcoming due dates</strong>
					{isLoading ? <em>(Recalculating…)</em> : <React.Fragment />}
				</span>
				<ol>
					{
						dueItems.map(item =>
							<li key={generateGuid()}>
								{item.notepadTitle} > <a
									href="#!"
									onClick={() => loadNote({
										notepadTitle: item.notepadTitle,
										noteRef: item.note.internalRef
									}, currentTitle)}
									style={{
										textDecoration: 'underline'
									}}>
									{item.note.title}
								</a> ({distanceInWordsStrict(new Date(), item.date)})
							</li>
						)
					}
				</ol>
			</div>
		);
	}
}
