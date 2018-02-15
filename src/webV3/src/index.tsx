import * as React from 'react';
import * as ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import './index.css';
import { IStoreState } from './types/index';
import { createStore } from 'redux';
import { BaseReducer } from './reducers/BaseReducer';
import HeaderComponent from './components/header/HeaderComponent';
import { Provider } from 'react-redux';
// Shell imports
import 'material-icons-font/material-icons-font.css';
import 'materialize-css/dist/css/materialize.min.css';
import 'jquery/dist/jquery.slim.js';
import 'materialize-css/dist/js/materialize.js';

const baseReducer: BaseReducer = new BaseReducer();
export const store = createStore<IStoreState>(
	baseReducer.reducer,
	baseReducer.initialState,
	(window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__());

ReactDOM.render(
	<Provider store={store}>
		<HeaderComponent />
	</Provider>,
	document.getElementById('root') as HTMLElement
);
registerServiceWorker();
