import React, { ReactElement, useState } from 'react';
import { Modal, ModalOptions } from 'react-materialize';
import { DEFAULT_MODAL_OPTIONS } from '../../util';
import { ConnectedProps } from 'react-redux';
import { singletonModalConnector } from './SingletonModalContainer';
import Button2 from '../Button';

export type SingletonModalProps = {
	children: React.ReactNode,
	id: string,
	trigger?: React.ReactNode,
	header?: string,
	fixedFooter?: boolean,
	options?: ModalOptions
	actions?: React.ReactNode[]
};

type Props = ConnectedProps<typeof singletonModalConnector> & SingletonModalProps;

const SingletonModalComponent = (props: Props) => {
	const [id] = useState<string>(props.id);

	const isOpen = id === props.currentModalId;
	if (!isOpen) {
		return props.trigger ? React.cloneElement((props.trigger as ReactElement), { onClick: () => props.openModal(id) }) : null;
	}

	return (
		<Modal
			id={id}
			fixedFooter={props.fixedFooter}
			header={props.header}
			trigger={props.trigger}
			actions={props.actions ?? [<Button2 className="btn-flat modal-action modal-close">Close</Button2>]}
			options={props.options ?? DEFAULT_MODAL_OPTIONS}>
			{props.children}
		</Modal>
	);
}
export default SingletonModalComponent;
