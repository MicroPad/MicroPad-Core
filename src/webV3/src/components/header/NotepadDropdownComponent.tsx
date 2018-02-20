import * as React from 'react';
import { SYNC_NAME } from '../../types';
// @ts-ignore
import { Dropdown, Icon, NavItem } from 'react-materialize';
import UploadNotepadsComponent from '../../containers/header/UploadNotepadsContainer';

export interface INotepadDropdownComponent {
	notepadTitles: string[];
}

export default class NotepadDropdownComponent extends React.Component<INotepadDropdownComponent> {
	render() {
		const { notepadTitles } = this.props;

		const notepadNavItems: JSX.Element[] = [];
		(notepadTitles || []).forEach((title: string, i: number) => notepadNavItems.push(<NavItem key={title} href="#!">{title}</NavItem>));

		return (
			<li>
				<Dropdown trigger={
					<ul>
						<NavItem>
							<Icon left={true}>collections_bookmark</Icon> Notepads <Icon right={true}>arrow_drop_down</Icon>
						</NavItem>
					</ul>
				}>
					<NavItem href="#!"><Icon left={true}>add</Icon> New</NavItem>
					<NavItem href="#!"><Icon left={true}>cloud_download</Icon> Open ({SYNC_NAME})</NavItem>
					<UploadNotepadsComponent />
					<NavItem href="#!"><Icon left={true}>file_download</Icon> Export All</NavItem>

					{/* User's notepads from here */}
					<NavItem divider={true} />
					{notepadNavItems}
				</Dropdown>
			</li>
		);
	}
}
