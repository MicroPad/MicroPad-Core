import React from 'react';
import { Button as MButton, ButtonProps } from 'react-materialize';

export const Button2 = (props: ButtonProps) => (
	<MButton {...props} onClick={e => {
		props.onClick?.(e);
		e.currentTarget.blur();
	}} />
);

export default Button2;
