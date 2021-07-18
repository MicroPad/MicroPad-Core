import React from 'react';
import './PrintViewComponent.css';
import MarkdownElementComponent from '../note-viewer/elements/markdown/MarkdownElementComponent';
import { Note } from 'upad-parse/dist';
import { NoteElement } from 'upad-parse/dist/Note';
import { ITheme } from '../../types/Themes';
import { ThemeValues } from '../../ThemeValues';

export interface IPrintViewComponentProps {
	note?: Note;
	printElement: NoteElement;
	clearPrintView: () => void;
}

export interface IAppProps {
	theme: ITheme;
	themeName: string;
}

export default class PrintViewOrAppContainerComponent extends React.Component<IPrintViewComponentProps & IAppProps> {
	render() {
		const { note, printElement, theme, themeName } = this.props;
		if (!note || !printElement) {
			// Render the real app
			return (
				<div
					style={{
						backgroundColor: theme.background,
						transition: 'background-color .3s',
						width: '100vw',
						height: '100vh'
					}}
					className={`theme-${themeName}`}>
						{this.props.children}
				</div>
			);
		}

		return (
			<div id="printed-elements">
				<em>{note.title}</em>
				<hr />
				<MarkdownElementComponent
					element={{
						...printElement,
						args: {
							...printElement.args,
							width: '180mm'
						}
					}}
					elementEditing=""
					noteAssets={{}}
					theme={ThemeValues.Classic}
					edit={() => { return; }}
					search={() => { return; }} />
			</div>
		);
	}

	componentDidUpdate() {
		const { printElement, clearPrintView } = this.props;
		if (!printElement) return;

		setTimeout(() => {
			window.print();
			clearPrintView();
		}, 1000);
	}
}
