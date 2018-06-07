import * as React from 'react';
import { Button, Input, Modal, NavItem } from 'react-materialize';
import { APP_NAME, MICROPAD_URL, SYNC_NAME } from '../../types';
import { SyncUser } from '../../types/SyncTypes';
import { Dialog } from '../../dialogs';
import ReCAPTCHA from 'react-google-recaptcha';

export interface ILoginComponentProps {
	syncUser?: SyncUser;
	login?: (username: string, password: string) => void;
	register?: (username: string, password: string, captcha: string) => void;
}

export interface ILoginComponentLocalProps {
	trigger: JSX.Element;
	manageTrigger?: JSX.Element;
}

export default class LoginComponent extends React.Component<ILoginComponentProps & ILoginComponentLocalProps> {
	private username: string;
	private password: string;
	private captcha: string;
	private captchaComponent: ReCAPTCHA;

	render() {
		const { trigger, manageTrigger, syncUser, login, register } = this.props;
		if (!!syncUser) return (!!manageTrigger) ? manageTrigger : null;

		return (
			<Modal
				header={`Connect to ${SYNC_NAME}`}
				actions={
					<React.Fragment>
						<Button className="btn-flat modal-action" onClick={() => {
							if (!this.username || !this.password) {
								Dialog.alert(`Username and password are both required`);
								return;
							}

							login!(this.username, this.password);
							this.closeModal();
						}}>
							Login
						</Button>
						<Button className="btn-flat modal-action" onClick={() => {
							if (!this.username || !this.password) {
								Dialog.alert(`Username and password are both required`);
								return;
							}
							register!(this.username, this.password, this.captcha);
							this.closeModal();
						}}>
							Create Account
						</Button>
						<Button className="btn-flat modal-action modal-close">Close</Button>
					</React.Fragment>
				}
				trigger={trigger}
				fixedFooter={true}>
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
							and only NZ$3/mth for up to twenty of your more advanced
							notepads. <a target="_blank" href={`${MICROPAD_URL}/sync/pricing`}>More information >></a>
						</p>
					</div>

					<div className="login-component__form">
						<h5>Login/Create Account</h5>
						<Input s={12} label="Username" onChange={(e, v) => this.username = v} />
						<Input s={12} label="Password" type="password" onChange={(e, v) => this.password = v} />

						<p>
							By creating an account you are agreeing to the <a target="_blank" href={`${MICROPAD_URL}/policy.php#terms`}>Terms and Conditions</a> and the <a target="_blank" href={`${MICROPAD_URL}/policy.php#privacy`}>Privacy Policy</a>
						</p>

						Fill this out if you're creating an account:<br />
						<ReCAPTCHA
							ref={e => this.captchaComponent = e!}
							sitekey="6LcNvV0UAAAAAGiRakxvLN5TAxO7Le120ARrhZ3H"
							onChange={token => this.captcha = token!}
						/>
					</div>

					<div>
						<p>
							Make sure to remember your password or use a password manger.<br />
							Because of our privacy measures, it may be difficult for a
							password reset to be done for you.
						</p>
					</div>
				</React.Fragment>
			</Modal>
		);
	}

	private closeModal = () => {
		if (!!this.captchaComponent) this.captchaComponent.reset();

		const overlay: HTMLElement | null = document.querySelector('.modal-overlay');
		if (!!overlay) overlay.click();
	}
}
