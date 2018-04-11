import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import { SearchBox, searchRequest } from '../index';
import Url from "../../../helpers/Url";
import {Datasource} from "../../datasources/interfaces/datasource";
import {Field} from "../../fields/interfaces/field";
import {AppState} from "../../../interfaces/appState";

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

function select(state: AppState) {
    return {
        connected: state.graph.connected,
        datasources: state.datasources.datasources.filter(datasource => datasource.active),
        fields: state.graph.fields
    };
}


export default connect(select)(Header);
