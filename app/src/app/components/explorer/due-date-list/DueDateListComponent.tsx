import * as React from 'react';
import { distanceInWordsStrict } from 'date-fns';
import { generateGuid } from '../../../util';
import { dueDateListConnector } from './DueDateListContainer';
import { ConnectedProps } from 'react-redux';

type AllProps = ConnectedProps<typeof dueDateListConnector>;
const DueDateListComponent = (props: AllProps) => {
	const { currentTitle, isLoading, dueItems, loadNote } = props;
	if (dueItems.length < 1) return null;

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
						</a> ({distanceInWordsStrict(new Date(), item.date)})
						</li>
					)
				}
			</ol>
		</div>
	);
};

export default DueDateListComponent;
