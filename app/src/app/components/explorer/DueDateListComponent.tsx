import * as React from 'react';
import { Note } from 'upad-parse/dist';
import { distanceInWordsStrict } from 'date-fns';
import { generateGuid } from '../../util';

export type DueItem = {
	date: Date;
	note: Note;
};

export interface IDueDateListComponentProps {
	dueItems: DueItem[];
	loadNote?: (ref: string) => void;
}

export default class DueDateListComponent extends React.Component<IDueDateListComponentProps> {
	render() {
		const { dueItems, loadNote } = this.props;
		if (dueItems.length < 1 || !loadNote) return null;

		return (
			<div className="due-date-list">
				<strong>Upcoming due dates</strong>
				<ol>
					{
						dueItems.map(item =>
							<li key={generateGuid()}>
								<a href="#!" onClick={() => loadNote(item.note.internalRef)} style={{
									textDecoration: 'underline'
								}}>{item.note.title}</a> ({distanceInWordsStrict(new Date(), item.date)})
							</li>
						)
					}
				</ol>
			</div>
		);
	}
}
