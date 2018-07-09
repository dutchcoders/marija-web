import { createBrowserHistory } from 'history';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Route, Router } from 'react-router';
import { routerReducer, syncHistoryWithStore } from 'react-router-redux';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import { webSocketMiddleware } from '../connection/helpers/webSocketMiddleware';
import { defaultContextMenuState } from '../contextMenu/contextMenuReducer';
import { defaultDatasourcesState } from '../datasources/datasourcesReducer';
import { defaultFieldsState } from '../fields/fieldsReducer';
import { defaultGraphState } from '../graph/graphReducer';
import { defaultStatsState } from '../stats/statsReducer';
import { defaultTableState } from '../table/tableReducer';
import { defaultUiState } from '../ui/uiReducer';
import RootView from './components/rootView';
import { AppState } from './interfaces/appState';
import root from './rootReducer';
import {defaultConnectionState} from "../connection/connectionReducer";
import {
	setBackendUri,
	webSocketConnect
} from "../connection/connectionActions";
import { createWorkerMiddleware } from './helpers/createWorkerMiddleware';
import { workspaceMiddleware } from '../ui/helpers/workspaceMiddleware';
import Url from './helpers/url';
import { requestWorkspace } from '../ui/uiActions';
import { queryMiddleware } from '../search/helpers/queryMiddleware';

require('../../scss/app.scss');
require('../../images/favicon.png');

const GraphWorker = require('../graph/helpers/graphWorker.worker');
const graphWorker = new GraphWorker();
const graphWorkerMiddleware = createWorkerMiddleware(graphWorker);

const defaultState: AppState = {
    graph: defaultGraphState,
    datasources: defaultDatasourcesState,
    contextMenu: defaultContextMenuState,
    fields: defaultFieldsState,
    ui: defaultUiState,
    stats: defaultStatsState,
    table: defaultTableState,
    connection: defaultConnectionState
};

function configureStore() {
    return createStore(
        root,
        defaultState,
        compose(
			applyMiddleware(
				webSocketMiddleware,
				workspaceMiddleware,
				queryMiddleware,
				thunk,
				graphWorkerMiddleware
			)
        )
    );
}

const store = configureStore();
const history = syncHistoryWithStore(createBrowserHistory(), store);

interface Props {
    backendUri?: string;
}

interface State {
}

class App extends React.Component<Props, State> {
    componentWillMount() {
        const { backendUri } = this.props;

        store.dispatch(setBackendUri(backendUri));
        store.dispatch(webSocketConnect(backendUri));

        const workspaceId = Url.getWorkspaceId();

        if (workspaceId) {
			store.dispatch(requestWorkspace(workspaceId));
		}
    }

    render() {
        return (
            <div className="applicationWrapper">
                <Provider store={store}>
                    <Router history={history}>
                        <div className="routerWrapper">
                            <Route path='*' component={RootView} />
                        </div>
                    </Router>
                </Provider>
            </div>
        );
    }
}

export default App;

