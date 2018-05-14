import * as React from 'react';
import { INote } from '../../types/NotepadTypes';
import './PrintViewComponent.css';
import MarkdownElementComponent from '../note-viewer/elements/markdown/MarkdownElementComponent';
import { noop } from 'rxjs/util/noop';
import { dataURItoBlob, generateGuid } from 'src/util';
import Async, { Props as AsyncProps } from 'react-promise';
import { trim } from '../note-viewer/elements/drawing/trim-canvas';

const PageAsync = Async as { new (props: AsyncProps<JSX.Element[]>): Async<JSX.Element[]> };

export interface IPrintViewComponentProps {
	note: INote | undefined;
	noteAssets: object;
}

export default class PrintViewComponent extends React.Component<IPrintViewComponentProps> {
	render() {
		const { note } = this.props;
		if (!note) return <em>Open a note to print it</em>;

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

	private getElements = (): Promise<JSX.Element[]> => {
		const { note, noteAssets } = this.props;
		const elements: JSX.Element[] = [];

		return new Promise<JSX.Element[]>(resolve => {
			const drawingsToTrim: Promise<string>[] = [];

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

						case 'drawing':
							drawingsToTrim.push(this.getTrimmedDrawing(noteAssets[element.args.ext!]));
							break;

						default:
							break;
					}
				});

				Promise.all(drawingsToTrim)
					.then(drawingUris => drawingUris.forEach(uri =>
						elements.push(<img key={generateGuid()} src={uri} style={{ width: 'auto' }} />)
					))
					.then(() => resolve(elements));
			}, 1000);
		});
	}

	private getTrimmedDrawing = (assetUri: string): Promise<string> => {
		return new Promise<string>(resolve => {
			const img = new Image();

			img.onload = () => {
				const tmpCanvas: HTMLCanvasElement = document.createElement('canvas');
				tmpCanvas.setAttribute('width', img.naturalWidth.toString());
				tmpCanvas.setAttribute('height', img.naturalHeight.toString());

				const tmpContext = tmpCanvas.getContext('2d')!;
				tmpContext.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
				tmpContext.drawImage(img, 0, 0);

				resolve(URL.createObjectURL(dataURItoBlob(trim(tmpCanvas).toDataURL())));
			};

			img.src = assetUri;
		});
	}
}
