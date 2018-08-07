import { createBrowserHistory } from 'history';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { Route } from 'react-router-dom';
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
import CreateCustomDatasource
	from '../datasources/components/createCustomDatasource/createCustomDatasource';
import { getHistory } from './helpers/getHistory';
import ErrorPage from './components/errorPage/errorPage';
import { errorMiddleware } from './helpers/errorMiddleware';
import ErrorBoundary, { ErrorDetails } from './components/errorBoundary/errorBoundary';
import Translate from './components/translate/translate';

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
				thunk,
				graphWorkerMiddleware,
				errorMiddleware()
			)
        )
    );
}

const store = configureStore();
const history = getHistory();

interface Props {
    backendUri?: string;
}

interface State {
	errorDetails: ErrorDetails
}

class App extends React.Component<Props, State> {
	state: State = {
		errorDetails: null
	};

    componentWillMount() {
        const { backendUri } = this.props;

        store.dispatch(setBackendUri(backendUri));
        store.dispatch(webSocketConnect(backendUri));

        const workspaceId = Url.getWorkspaceId();

        if (workspaceId) {
			store.dispatch(requestWorkspace(workspaceId));
		}
    }

    onError(errorDetails: ErrorDetails) {
    	this.setState({
			errorDetails
		});
	}

    render() {
    	const { errorDetails } = this.state;

    	if (errorDetails) {
    		return (
    			<ErrorPage errorDetails={errorDetails} />
			);
		}

        return (
            <div className="applicationWrapper">
				<Provider store={store}>
					<ErrorBoundary onError={this.onError.bind(this)}>
						<Translate>
							<Router history={history}>
								<div className="routerWrapper">
									<Route path='/create-custom-datasource' component={CreateCustomDatasource} />
									<Route path='*' component={RootView} />
								</div>
							</Router>
						</Translate>
					</ErrorBoundary>
				</Provider>
            </div>
        );
    }
}

export default App;

