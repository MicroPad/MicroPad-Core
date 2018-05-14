import * as React from 'react';
import * as enzyme from 'enzyme';
import AppNameComponent from './AppNameComponent';

describe(`version number tests`, () => {
	const statusToSymbol = {
		dev: 'ρ',
		alpha: 'α',
		beta: 'β',
		stable: ''
	};

	it('should display correctly for stable status', () => {
		// Arrange
		const component = enzyme.shallow(<AppNameComponent major={1} minor={2} patch={3} status={'stable'}/>);

		// Assert
		expect(component.find('.AppNameComponent__version').text()).toEqual(statusToSymbol.stable);
		expect(component.find('.AppNameComponent__version').props().title).toEqual('v1.2.3-stable');
	});

	it('should display correctly for beta status', () => {
		// Arrange
		const component = enzyme.shallow(<AppNameComponent major={1} minor={2} patch={3} status={'beta'}/>);

		// Assert
		expect(component.find('.AppNameComponent__version').text()).toEqual(statusToSymbol.beta);
		expect(component.find('.AppNameComponent__version').props().title).toEqual('v1.2.3-beta');
	});

	it('should display correctly for alpha status', () => {
		// Arrange
		const component = enzyme.shallow(<AppNameComponent major={1} minor={2} patch={3} status={'alpha'}/>);

		// Assert
		expect(component.find('.AppNameComponent__version').text()).toEqual(statusToSymbol.alpha);
		expect(component.find('.AppNameComponent__version').props().title).toEqual('v1.2.3-alpha');
	});

	it('should display correctly for dev status', () => {
		// Arrange
		const component = enzyme.shallow(<AppNameComponent major={1} minor={2} patch={3} status={'dev'}/>);

		// Assert
		expect(component.find('.AppNameComponent__version').text()).toEqual(statusToSymbol.dev);
		expect(component.find('.AppNameComponent__version').props().title).toEqual('v1.2.3-dev');
	});
});
