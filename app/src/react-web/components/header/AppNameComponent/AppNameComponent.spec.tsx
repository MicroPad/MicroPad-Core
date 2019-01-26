import * as React from 'react';
import * as enzyme from 'enzyme';
import AppNameComponent from './AppNameComponent';
import { APP_NAME } from '../../../types';

describe(`version number tests`, () => {
	const statusToSymbol = {
		dev: 'ρ',
		alpha: 'α',
		beta: 'β',
		stable: ''
	};

	[
		'stable',
		'beta',
		'alpha',
		'dev'
	].forEach(status => {
		it(`should display correctly for ${status} status`, () => {
			// Arrange
			const component = enzyme.shallow(<AppNameComponent major={1} minor={2} patch={3} status={status as any}/>);

			// Assert
			expect(component.find('.AppNameComponent__version').text()).toEqual(statusToSymbol[status]);
			expect(component.find('.AppNameComponent__version').parent().props().title).toEqual(`${APP_NAME} v1.2.3-${status}`);
		});
	});
});
