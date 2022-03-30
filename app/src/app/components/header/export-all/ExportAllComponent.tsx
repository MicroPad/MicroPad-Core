import './ExportAllComponent.css';
import React from 'react';
import { Col, Icon, NavItem, ProgressBar, Row } from 'react-materialize';
import { DEFAULT_MODAL_OPTIONS } from '../../../util';
import SingletonModalComponent from '../../singleton-modal/SingletonModalContainer';
import NpxIcon from '../../../assets/npx.png';
import MarkdownIcon from '../../../assets/md.svg';
import { ConnectedProps } from 'react-redux';
import { exportAllConnector } from './ExportAllContainer';

const ICON_STYLES = {
	width: '6rem',
	height: 'auto',
	marginLeft: 'calc(50% - 3rem)'
};

const ExportAllComponent = (props: ConnectedProps<typeof exportAllConnector>) => (
	<SingletonModalComponent
		id="export-all-notepads-modal"
		key="export-all-notepads-modal"
		header="Export All Notepads"
		trigger={<NavItem href="#!"><Icon left={true}>file_download</Icon> Export All</NavItem>}
		options={DEFAULT_MODAL_OPTIONS}>
		<Row>
			<Col s={12} m={6} style={{ cursor: 'pointer' }}>
				<a href="#!" onClick={e => {
					e.preventDefault();
					props.exportAll();
					return false;
				}}>
					<img src={NpxIcon} style={ICON_STYLES} title="Export notepads as a zip archive of NPX files" alt="" />
					<p style={{ textAlign: 'center' }}>Export notepads as a zip archive of NPX files</p>
				</a>
			</Col>
			<Col s={12} m={6} style={{ cursor: 'pointer' }}>
				<a href="#!" onClick={e => {
					e.preventDefault();
					props.exportToMarkdown();
					return false;
				}}>
					<img src={MarkdownIcon} className="export-all__md-icon" style={{
						...ICON_STYLES,
						filter: props.theme.text !== '#000' ? 'invert(100%)' : undefined
					}} title="Export notepads as a zip archive of markdown files" alt="" />
					<p style={{ textAlign: 'center' }}>Export notepads as a zip archive of markdown files</p>
				</a>
			</Col>
			{props.isExporting && <ProgressBar className="export-all__progress" />}
		</Row>
	</SingletonModalComponent>
)

export default ExportAllComponent;
