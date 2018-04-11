import ResumeSession from "./components/ResumeSession";

require('../../scss/app.scss');
require('../../images/logo.png');
require('../../images/favicon.png');

import * as React from 'react';
import { render } from 'react-dom';
import { compose, createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { Router, Route } from 'react-router';
import { createBrowserHistory } from 'history';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import { RootView, StateCapturer } from './components/index';
import root from './rootReducer';
import { persistState } from './helpers/index';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import {defaultUiState} from "../ui/uiReducer";
import {defaultDatasourcesState} from '../datasources/datasourcesReducer';
import {defaultContextMenuState} from '../contextMenu/contextMenuReducer';
import createWorkerMiddleware from 'redux-worker-middleware';
import {defaultStatsState} from '../stats/statsReducer';
import {AppState} from "./interfaces/appState";
import {defaultFieldsState} from "../fields/fieldsReducer";
import {webSocketMiddleware} from '../connection/helpers/webSocketMiddleware';
import {defaultGraphState} from "../graph/graphReducer";
import {defaultTableState} from "../table/tableReducer";

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

