import React, { Component } from 'react';
import { connect } from 'react-redux';

import { SearchBox, searchRequest } from '../modules/search/index';
import { Icon } from '../components/index';

import { generateColour } from '../helpers/index';
import { openPane } from '../utils/index';
import Url from "../domain/Url";
import {error} from '../utils';

class Header extends Component {

    getColour(str) {
        return generateColour(str);
    }

    onSearchSubmit(q) {
        const { dispatch } = this.props;

        Url.addQueryParam('search', q);

        dispatch(searchRequest(q));
    }

    openPane() {
        const { dispatch } = this.props;
        dispatch(openPane('configuration'));
    }

    closeError() {
        const { dispatch } = this.props;
        dispatch(error(null));
    }

    render() {
        const { connected, total, fields, datasources } = this.props;

        let errors = null;

        if (this.props.errors) {
            errors = (
                <div className="alert alert-danger">
                    <strong>Error executing query: </strong>
                    { this.props.errors }
                    <Icon name="ion-ios-close" onClick={this.closeError.bind(this)} />
                </div>
            );
        }

        return (
            <header className="header">
                <SearchBox
                    total={total}
                    onSubmit={(q, index) => this.onSearchSubmit(q, index)}
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
        itemsFetching: state.entries.itemsFetching,
        connected: state.entries.connected,
        errors: state.entries.errors,
        datasources: state.datasources.datasources.filter(datasource => datasource.active),
        queries: state.entries.searches,
        total: state.entries.total,
        fields: state.entries.fields
    };
}


export default connect(select)(Header);
