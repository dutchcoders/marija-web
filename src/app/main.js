import ResumeSession from "./components/Misc/ResumeSession";

require('../index.html');
require('../scss/app.scss');
require('../images/logo.png');
require('../images/favicon.png');

import React, { Component } from 'react';
import { render } from 'react-dom';
import { dispatch, compose, createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';
import { Router, Route } from 'react-router';
import { createBrowserHistory } from 'history';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import { Intl }  from 'react-intl-es6';
import { RootView, StateCapturer, Websocket } from './components/index';
import { entries, enableBatching, utils, servers, indices, fields, defaultState } from './reducers/index';
import { persistState } from './helpers/index';
import { i18n } from './config';
import { composeWithDevTools } from 'redux-devtools-extension';

function configureStore() {
    return createStore(
        enableBatching(
            combineReducers({
                entries,
                utils,
                servers,
                indices,
                fields,
                routing: routerReducer
            })
        ), {
            servers: [
                "http://127.0.0.1:9200/"
            ],
            entries: {
                    ...defaultState
            },
            indices: {
                activeIndices: []
            },
            fields: {
                availableFields: []
            },
            utils: {
                panes: [
                    {name: 'configuration', state: false},
                    {name: 'histogram', state: false},
                    {name: 'table', state: false},
                    {name: 'nodes', state: true},
                    {name: 'queries', state: true }
                ]
            }
        },
        composeWithDevTools(persistState())
    );
}

const store = configureStore();
const history = syncHistoryWithStore(createBrowserHistory(), store);

class App extends Intl {
    constructor() {
        super(i18n.locales, i18n.messages);
    }

    componentDidMount() {}

    render() {
        return (
            <div>
                <Websocket store={store}/>
                <StateCapturer store={store}/>
                <Provider store={store}>
                    <Router history={history}>
                        <div>
                            <Route path='*' component={RootView} />
                            <Route path='*' component={ResumeSession} />
                        </div>
                    </Router>
                </Provider>
            </div>
        );
    }
}

render((
    <App/>
), document.getElementById('root'));

