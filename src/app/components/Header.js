import React, { Component } from 'react';
import { connect } from 'react-redux';

import { SearchBox, requestItems } from '../modules/search/index';
import { ConnectionStatus } from '../modules/status/index';
import { Icon } from '../components/index';

import { generateColour } from '../helpers/index';
import { openPane } from '../utils/index';

class Header extends Component {

    constructor(props) {
        super(props);

    }

    getColour(str) {
        return generateColour(str);
    }

    onSearchSubmit(q, index) {
        const { dispatch, activeIndices } = this.props;

        dispatch(requestItems({
            query: q,
            index: activeIndices,
            color: this.getColour(q)
        }));
    }

    openPane() {
        const { dispatch } = this.props;
        dispatch(openPane('configuration'));
    }

    render() {
        const { connected, isFetching, total, indexes } = this.props;

        let errors = null;

        if (this.props.errors) {
            errors = <div className="alert alert-danger"><strong>Error executing query: </strong>{ this.props.errors }</div>;
        }

        return (
            <header className="row">
                <SearchBox
                    isFetching={isFetching}
                    total={total}
                    onSubmit={(q, index) => this.onSearchSubmit(q, index)}
                    indexes={indexes}
                >
                    <ConnectionStatus connected={connected}/>
                </SearchBox>
                { errors }
            </header>
        );
    }
}


function select(state) {
    return {
        isFetching: state.entries.isFetching,
        connected: state.entries.connected,
        errors: state.entries.errors,
        indexes: state.entries.indexes,
        activeIndices: state.indices.activeIndices,
        total: state.entries.total
    };
}


export default connect(select)(Header);
