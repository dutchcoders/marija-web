require('../index.html');
require('../scss/app.scss');

import React, { Component } from 'react';
import { render } from 'react-dom';
import { dispatch, compose, createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';
import { browserHistory, Router, Route } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import { Intl }  from 'react-intl-es6';

import { RootView } from './components/index';
import { entries, utils, servers, defaultState } from './reducers/index'
import { persistState } from './helpers/index'
import { Socket } from './utils/index'
import { i18n } from './config'

function configureStore() {
    return createStore(
        combineReducers({
            entries,
            utils,
            servers,
            routing: routerReducer
        }), {
            entries: defaultState,
            servers: [
                "http://127.0.0.1:9200/"
            ]
        },
        compose(persistState())
    )
}

const store = configureStore({});
const history = syncHistoryWithStore(browserHistory, store);

Socket.startWS(store.dispatch);

class App extends Intl {
    constructor() {
        super(i18n.locales, i18n.messages);
    }

    render() {
        return (
            <Provider store={store}>
                <Router history={history}>
                    <Route path='*' component={RootView}/>
                </Router>
            </Provider>
        );
    }
}

render((
    <App/>
), document.getElementById('root'))

