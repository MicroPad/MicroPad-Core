import * as React from 'react';
import { IFileElementComponent } from './FileElementComponent';
import { BAD_BROWSER_AUDIO } from '../../../types';

export default class RecordingElementComponent extends React.Component<IFileElementComponent> {
	render() {
		const { element, noteAssets, downloadAsset } = this.props;

		return (
			<div style={{padding: '5px', width: 'max-content'}}>
				<p>
					<a title={BAD_BROWSER_AUDIO} href="#!" onClick={() => downloadAsset(element.args.filename!, element.args.ext!)}>
						<em>{element.args.filename}</em>
					</a>
				</p>
				<audio controls={true} src={noteAssets[element.args.ext!]} />
			</div>
		);
	}
}
