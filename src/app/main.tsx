import ResumeSession from "./components/Misc/ResumeSession";

require('../scss/app.scss');
require('../images/logo.png');
require('../images/favicon.png');

import * as React from 'react';
import { render } from 'react-dom';
import { compose, createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { Router, Route } from 'react-router';
import { createBrowserHistory } from 'history';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import { RootView, StateCapturer, Websocket } from './components/index';
import { defaultEntriesState, root } from './reducers/index';
import { persistState } from './helpers/index';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import {defaultUtilsState} from "./reducers/utils";
import {defaultDatasourcesState} from './reducers/datasources';
import {defaultContextMenuState} from './modules/contextMenu/contextMenuReducer';
import createWorkerMiddleware from 'redux-worker-middleware';
import {defaultStatsState} from './modules/stats/statsReducer';
import {AppState} from "./interfaces/appState";
import {defaultFieldsState} from "./reducers/fields";

const GraphWorker = require('worker-loader!./modules/graph/graphWorker');
const graphWorker = new GraphWorker();
const graphWorkerMiddleware = createWorkerMiddleware(graphWorker);

const defaultState: AppState = {
    entries: defaultEntriesState,
    datasources: defaultDatasourcesState,
    contextMenu: defaultContextMenuState,
    fields: defaultFieldsState,
    utils: defaultUtilsState,
    stats: defaultStatsState
};

function configureStore() {
    return createStore(
        root,
        defaultState,
        composeWithDevTools(
            persistState(),
            applyMiddleware(thunk, graphWorkerMiddleware)
        )
    );
}

const store = configureStore();
const history = syncHistoryWithStore(createBrowserHistory(), store);

class App extends React.Component {
    render() {
        return (
            <div className="applicationWrapper">
                <Websocket store={store}/>
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

