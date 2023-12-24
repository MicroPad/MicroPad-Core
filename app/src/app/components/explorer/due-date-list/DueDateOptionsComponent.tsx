import { connect, ConnectedProps } from 'react-redux';
import { Checkbox, Icon } from 'react-materialize';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import React from 'react';
import SingletonModalComponent from '../../singleton-modal/SingletonModalContainer';
import { ModalId } from '../../../types/ModalIds';
import { IStoreState } from '../../../types';
import { ThemeValues } from '../../../ThemeValues';
import { actions } from '../../../actions';
import './DueDateOptionsComponent.css';

const MODAL_ID: ModalId = 'due-date-options-modal';

type Props = ConnectedProps<typeof dueDateOptionsConnector>
export const DueDateOptionsComponent = (props: Props) => {
	return (<SingletonModalComponent
		id={MODAL_ID}
		key={MODAL_ID}
		header={`Options for upcoming due dates`}
		trigger={<a href="#!" className="due-date-opts-trigger" style={{ color: props.colour }} onContextMenu={e => {
			e.preventDefault();
			(e.target as Node).parentElement?.querySelector<HTMLAnchorElement>('.due-date-opts-trigger')?.click();
			return false;
		}}><Icon tiny={true} className="due-date-opts-trigger">settings</Icon></a>}
		options={DEFAULT_MODAL_OPTIONS}>
		<div className="due-date-opts__content">
			<Checkbox
				label="Show historical due dates"
				value="1"
				checked={props.showHistoricalDueDates}
				onChange={() => props.setShowHistoricalDueDates(!props.showHistoricalDueDates)}
				filledIn
			/>
		</div>
	</SingletonModalComponent>);
}

export const dueDateOptionsConnector = connect(
	(state: IStoreState) => ({
		colour: ThemeValues[state.app.theme].explorerContent,
		showHistoricalDueDates: state.dueDateSettings.showHistoricalDueDates ?? false,
	}),
	{
		setShowHistoricalDueDates: actions.setShowHistoricalDueDates,
	}
);
export default dueDateOptionsConnector(DueDateOptionsComponent);
