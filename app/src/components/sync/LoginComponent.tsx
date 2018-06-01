import * as React from 'react';
import { Modal, NavItem, Row } from 'react-materialize';

export interface ILoginComponent {
	trigger: JSX.Element;
	login: (username: string, password: string) => void;
	register: (username: string, password: string) => void;
}

export default class LoginComponent extends React.Component {

}
