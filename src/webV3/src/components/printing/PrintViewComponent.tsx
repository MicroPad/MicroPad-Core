import * as React from 'react';
import { INote } from '../../types/NotepadTypes';
import './PrintViewComponent.css';
import MarkdownElementComponent, { IMarkdownViewMessage } from '../note-viewer/elements/markdown/MarkdownElementComponent';
import { noop } from 'rxjs/util/noop';
import { generateGuid } from 'src/util';
import Async, { Props as AsyncProps } from 'react-promise';

const PageAsync = Async as { new (props: AsyncProps<JSX.Element[]>): Async<JSX.Element[]> };

export interface IPrintViewComponentProps {
	note: INote | undefined;
	noteAssets: object;
}

export default class PrintViewComponent extends React.Component<IPrintViewComponentProps> {
	render() {
		const { note, noteAssets } = this.props;
		if (!note) return <div />;

		// Generate simplified divs for every element on the page

		return (
			<PageAsync promise={this.getElements()} then={elements =>
				<div>
					<em>{note.title}</em>
					<hr />

					<div id="printed-elements">
						{elements}
					</div>
				</div>
			} />
		);
	}

	private getElements: () => Promise<JSX.Element[]> = () => {
		const { note, noteAssets } = this.props;
		const elements: JSX.Element[] = [];

		return new Promise<JSX.Element[]>(resolve => {

			setTimeout(() => {
				note!.elements.forEach(element => {
					switch (element.type) {
						case 'markdown':
							const printedId = generateGuid();
							const liveIframe = document.getElementById(`${element.args.id}-iframe`) as HTMLIFrameElement;
							const height = (!!liveIframe && !!liveIframe.style.height) ? liveIframe.style.height : '400px';

							elements.push((
								<MarkdownElementComponent key={printedId} element={{
									...element,
									args: {
										...element.args,
										id: printedId,
										width: '95%',
										height: height
									}
								}} elementEditing={''} noteAssets={{}} edit={noop} search={noop} isPrinting={true} />
							));
							break;

						case 'image':
							elements.push((
								<img key={generateGuid()} src={noteAssets[element.args.ext!]} style={{ width: element.args.width }} />
							));
							break;

						default:
							break;
					}
				});

				resolve(elements);
			}, 1000);
		});
	}
}
