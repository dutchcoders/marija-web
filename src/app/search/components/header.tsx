import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Datasource } from '../../datasources/interfaces/datasource';
import { Field } from '../../fields/interfaces/field';
import { AppState } from '../../main/interfaces/appState';
import { searchRequest } from '../searchActions';
import SearchBox from './searchBox';
import { getSelectedFields } from '../../fields/fieldsSelectors';
import DatasourceActivation from '../../datasources/components/datasourceActivation/datasourceActivation';

interface Props {
    connected: boolean;
    datasources: Datasource[];
    fields: Field[];
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
        const { connected, fields, datasources } = this.props;

        let errors = null;

        return (
            <header className="header">
                <DatasourceActivation/>
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
        datasources: state.datasources.datasources.filter(datasource => datasource.active)
    };
}


export default connect(select)(Header);
