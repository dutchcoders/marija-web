import { createBrowserHistory } from 'history';
import * as React from 'react';
import { render } from 'react-dom';
import { connect, Provider } from 'react-redux';
import { Route, Router } from 'react-router';
import { routerReducer, syncHistoryWithStore } from 'react-router-redux';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import createWorkerMiddleware from 'redux-worker-middleware';

import { webSocketMiddleware } from '../connection/helpers/webSocketMiddleware';
import { defaultContextMenuState } from '../contextMenu/contextMenuReducer';
import { defaultDatasourcesState } from '../datasources/datasourcesReducer';
import { defaultFieldsState } from '../fields/fieldsReducer';
import { defaultGraphState } from '../graph/graphReducer';
import { defaultStatsState } from '../stats/statsReducer';
import { defaultTableState } from '../table/tableReducer';
import { defaultUiState } from '../ui/uiReducer';
import ResumeSession from './components/ResumeSession';
import RootView from './components/RootView';
import StateCapturer from './components/StateCapturer';
import persistState from './helpers/persistState';
import { AppState } from './interfaces/appState';
import root from './rootReducer';

require('../../scss/app.scss');
require('../../images/logo.png');
require('../../images/favicon.png');

const GraphWorker = require('worker-loader!../graph/helpers/graphWorker');
const graphWorker = new GraphWorker();
const graphWorkerMiddleware = createWorkerMiddleware(graphWorker);

const defaultState: AppState = {
    graph: defaultGraphState,
    datasources: defaultDatasourcesState,
    contextMenu: defaultContextMenuState,
    fields: defaultFieldsState,
    ui: defaultUiState,
    stats: defaultStatsState,
    table: defaultTableState
};

function configureStore() {
    return createStore(
        root,
        defaultState,
        composeWithDevTools(
            persistState(),
            applyMiddleware(
                webSocketMiddleware,
                thunk,
                graphWorkerMiddleware
            )
        )
    );
}

const store = configureStore();
const history = syncHistoryWithStore(createBrowserHistory(), store);

class App extends React.Component<any, any> {
    render() {
        return (
            <div className="applicationWrapper">
                <StateCapturer store={store}/>
                <Provider store={store}>
                    <Router history={history}>
                        <div className="routerWrapper">
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

