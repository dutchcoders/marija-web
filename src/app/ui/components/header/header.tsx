import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Datasource } from '../../../datasources/interfaces/datasource';
import { Field } from '../../../fields/interfaces/field';
import { AppState } from '../../../main/interfaces/appState';
import { searchRequest } from '../../../search/searchActions';
import SearchBox from '../../../search/components/searchBox';
import { getSelectedFields } from '../../../fields/fieldsSelectors';
import DatasourceActivation from '../../../datasources/components/datasourceActivation/datasourceActivation';
import { getActiveNonLiveDatasources } from '../../../datasources/datasourcesSelectors';
import * as styles from './header.scss';
const logo = require('../../../../images/logo.png');
import WorkspaceList from '../workspaceList/workspaceList';

interface Props {
    connected: boolean;
    datasources: Datasource[];
    fields: Field[];
	experimentalFeatures: boolean;
    dispatch: Dispatch<any>;
}

interface State {
}

class Header extends React.Component<Props, State> {
    onSearchSubmit(q, dateFilter) {
        const { dispatch } = this.props;

        dispatch(searchRequest(q, dateFilter));
    }

    render() {
        const { connected, fields, datasources, experimentalFeatures } = this.props;

        let errors = null;

        return (
            <header className={styles.header}>
                <div className={styles.topBar}>
					<img
						className={styles.logo + (connected ? '' : ' ' + styles.notConnected)}
						src={logo}
						title={connected ? "Marija is connected to the backendservice" : "No connection to Marija backend available" }
					/>
					<DatasourceActivation/>

					{experimentalFeatures && <WorkspaceList/>}
                </div>

                <SearchBox
                    onSubmit={(q, dateFilter) => this.onSearchSubmit(q, dateFilter)}
                    connected={connected}
                    enabled={fields.length > 0 && datasources.length > 0}
                />
                { errors }
            </header>
        );
    }
}

function select(state: AppState, ownProps) {
    return {
        ...ownProps,
        connected: state.connection.connected,
        fields: getSelectedFields(state),
        datasources: getActiveNonLiveDatasources(state),
		experimentalFeatures: state.ui.experimentalFeatures
    };
}


export default connect(select)(Header);
