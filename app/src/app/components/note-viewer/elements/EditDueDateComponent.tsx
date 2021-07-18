import React from 'react';
import { NoteElement } from 'upad-parse/dist/Note';
import { ITheme } from '../../../types/Themes';
import { format, formatDistanceStrict } from 'date-fns';

export const DueInMessageComponent = (props: { dueDate: Date }) => {
	const { dueDate } = props;

	const distance = formatDistanceStrict(dueDate, new Date());
	return <span>{(dueDate.getTime() < new Date().getTime()) ? `Was due ${distance} ago` : `Due in ${distance}`}</span>;
};

export interface IEditDueDateComponentProps {
	element: NoteElement;
	theme: ITheme;
	updateElement?: (id: string, changes: NoteElement, newAsset?: Blob) => void;
}

export class EditDueDateComponent extends React.Component<IEditDueDateComponentProps> {
	private datePicker!: HTMLInputElement;
	private timePicker!: HTMLInputElement;

	render() {
		const { element, theme } = this.props;
		const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

		const dueDate = !!element.args.dueDate ? new Date(parseInt(element.args.dueDate, 10)) : undefined;

		return (
			<div style={{
				color: theme.text
			}}>
				<span style={{ marginRight: '5px' }}>Due Date:</span>
				<input
					ref={e => this.datePicker = e!}
					type="date"
					style={{ width: !isFirefox ? 'min-content' : '-moz-max-content' }}
					onChange={this.updateDueDate}
					defaultValue={!!dueDate ? dueDate.toISOString().substr(0, 10) : undefined} />

				<input
					ref={e => this.timePicker = e!}
					type="time"
					style={{ width: !isFirefox ? 'min-content' : '-moz-max-content' }}
					onChange={this.updateDueDate}
					defaultValue={!!dueDate ? format(dueDate, 'HH:mm') : undefined} />

				{
					!!dueDate &&
					<span style={{ marginLeft: '5px' }}>(<DueInMessageComponent dueDate={dueDate} />)</span>
				}
			</div>
		);
	}

	private updateDueDate = (_event: React.ChangeEvent<HTMLInputElement>): void => {
		const { element, updateElement } = this.props;
		if (!updateElement) return;

		const date: Date | null = this.datePicker.valueAsDate;
		const time: Date | null = this.timePicker.valueAsDate;
		if (!date || !time) {
			// Clear due date
			updateElement(element.args.id, {
				...element,
				args: {
					...element.args,
					dueDate: undefined
				}
			});
			return;
		}

		// Set the new due date
		date.setHours(time.getUTCHours());
		date.setMinutes(time.getUTCMinutes());
		updateElement(element.args.id, {
			...element,
			args: {
				...element.args,
				dueDate: date.getTime().toString(10)
			}
		});
	}
}
