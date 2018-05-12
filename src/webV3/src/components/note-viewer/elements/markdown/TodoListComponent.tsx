import * as React from 'react';
import Async, { Props as AsyncProps } from 'react-promise';

const ProgressAsync = Async as { new (props: AsyncProps<IProgressValues>): Async<IProgressValues> };

export interface ITodoListComponentProps {
	html: Promise<string>;
	toggle: () => void;
}

interface IProgressValues {
	done: number;
	all: number;
}

export default class TodoListComponent extends React.Component<ITodoListComponentProps> {
	render() {
		const { toggle } = this.props;

		const meterStyle = {
			width: '100%'
		};

		return (
			<ProgressAsync promise={this.getProgress()} then={(progressValues) =>
				<div style={{
					marginLeft: '5px',
					marginRight: '5px',
					textAlign: 'center',
					display: (progressValues.all > 0) ? undefined : 'none'
				}}>
					<meter
						value={progressValues.done}
						min={0}
						max={progressValues.all}
						style={meterStyle}>
						{Math.round((progressValues.done / progressValues.all) * 100)}%
					</meter>

					<br /><a href="#!" onClick={toggle}>Show/Hide Completed Items ({progressValues.done}/{progressValues.all})</a>
				</div>
			} />
		);
	}

	private getProgress: () => Promise<IProgressValues> = () => {
		const { html } = this.props;

		return new Promise<IProgressValues>(resolve => {
			html
				.then(htmlValue => {
					// Create virtual element of the html given
					const element = document.createElement('div');
					element.innerHTML = htmlValue;

					const done = element.querySelectorAll('.task-list-item input:checked').length;
					const all = element.querySelectorAll('.task-list-item').length;

					resolve({
						done,
						all
					});
				});
		});
	}
}
