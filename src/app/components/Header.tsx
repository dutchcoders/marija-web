import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import { SearchBox, searchRequest } from '../modules/search/index';
import Url from "../domain/Url";
import {error} from '../utils';
import {Datasource} from "../interfaces/datasource";
import {Field} from "../interfaces/field";

interface Props {
    connected: boolean;
    datasources: Datasource[];
    fields: Field[];
    dispatch: Dispatch<any>;
}

interface State {
}

class Header extends React.Component<Props, State> {
    onSearchSubmit(q) {
        const { dispatch, datasources } = this.props;

        const datasourceIds: string[] = datasources.map(datasource => datasource.id);

        Url.addSearch(q, datasourceIds);
        dispatch(searchRequest(q, datasourceIds));
    }

    render() {
        const { connected, fields, datasources } = this.props;

        let errors = null;

        return (
            <header className="header">
                <SearchBox
                    onSubmit={q => this.onSearchSubmit(q)}
                    connected={connected}
                    enabled={fields.length > 0 && datasources.length > 0}
                />
                { errors }
            </header>
        );
    }
}

function select(state) {
    return {
        connected: state.entries.connected,
        datasources: state.datasources.datasources.filter(datasource => datasource.active),
        fields: state.entries.fields
    };
}


export default connect(select)(Header);
