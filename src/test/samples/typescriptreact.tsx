import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Hello from './containers/Hello';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { enthusiasm } from './reducers/index';
import { StoreState } from './types/index';

import './index.css';

/**
 * ^ Some comments here
 * ! to alert
 * * to highlight
 * ? to question
 */

 /*
  ~ and the other format
 */

// & finally
// ! Single line Comments

const store = createStore<StoreState>(enthusiasm,
{
  enthusiasmLevel: 1,
  languageName: 'TypeScript',
});

ReactDOM.render(
  <Provider store={store}>
    <Hello />
  </Provider>,
  document.getElementById('root') as HTMLElement
);