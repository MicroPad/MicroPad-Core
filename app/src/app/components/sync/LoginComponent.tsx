import * as React from 'react';
import { FormEvent } from 'react';
import { Button, Modal, TextInput } from 'react-materialize';
import { APP_NAME, MICROPAD_URL, SYNC_NAME } from '../../types';
import { SyncUser } from '../../types/SyncTypes';
import { Dialog } from '../../services/dialogs';
import { DEFAULT_MODAL_OPTIONS } from '../../util';

export interface ILoginComponentProps {
	syncUser?: SyncUser;
	login?: (username: string, password: string) => void;
}

export interface ILoginComponentLocalProps {
	trigger: JSX.Element;
	manageTrigger?: JSX.Element;
}

export default class LoginComponent extends React.Component<ILoginComponentProps & ILoginComponentLocalProps> {
	private username!: string;
	private password!: string;

	render() {
		const { trigger, manageTrigger, syncUser } = this.props;
		if (!!syncUser) return (!!manageTrigger) ? manageTrigger : null;

		return (
			<Modal
				header={`Connect to ${SYNC_NAME}`}
				actions={[
					<React.Fragment>
						<Button className="btn-flat modal-action" onClick={() => this.login()}>
							Login
						</Button>
						<Button className="btn-flat modal-action modal-close">Close</Button>
					</React.Fragment>
				]}
				trigger={trigger}
				fixedFooter={true}
				options={DEFAULT_MODAL_OPTIONS}>
				<React.Fragment>
					<div className="login-component__promo">
						<p>
							{SYNC_NAME} is the powerful, free, secure, and private sync service for {APP_NAME}.
						</p>
						<p>
							{SYNC_NAME} allows you to keep all of your notepads synced across all of your devices
							seamlessly. Notepads are encrypted using AES-256 encryption and we won't even make you
							type in your email address to sign up; {SYNC_NAME} cares about syncing your notes and
							absolutely nothing else.
						</p>
						<p>
							It's completely free for any notepad that's mostly text,
							and it costs less than a cup of coffee for up to twenty of your more advanced
							notepads. <a target="_blank" rel="noopener noreferrer nofollow" href={`${MICROPAD_URL}/sync`}>More information »</a>
						</p>
					</div>

					<p><a target="_blank" rel="noopener noreferrer nofollow" href={`${MICROPAD_URL}/sync/manage`}>Sign up here</a> or login below:</p>

					<form className="login-component__form" style={{ marginTop: '20px' }} action="#" onSubmit={this.login}>
						<TextInput s={12} label="Username" onChange={e => this.username = e.target.value} />
						<TextInput s={12} label="Password" type="password" onChange={e => this.password = e.target.value} />
						<button style={{ display: 'none' }} />
					</form>
				</React.Fragment>
			</Modal>
		);
	}

	private login = (event?: FormEvent<HTMLFormElement>) => {
		if (event) event.preventDefault();

		const { login } = this.props;
		if (!login) {
			throw new Error('Expected a login prop.');
		}

		if (!this.username || !this.password) {
			Dialog.alert(`Username and password are both required`);
			return;
		}

		login(this.username, this.password);
		this.closeModal();
	}

	private closeModal = () => {
		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}
}
