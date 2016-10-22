import React, { Component } from 'react';
import { connect } from 'react-redux';

import { SearchBox, requestItems } from '../modules/search/index'
import { ConnectionStatus } from '../modules/status/index'

import { generateColour } from '../helpers/index'

class Header extends Component {

    constructor(props) {
        super(props);

    }

    getColour(str) {
        return generateColour(str);
    }

    onSearchSubmit(q, index) {
        const { dispatch } = this.props;

        dispatch(requestItems({
            query: q,
            index: index,
            color: this.getColour(q)
        }));
    }

    render() {
        const { connected, isFetching, total, indexes } = this.props;

        return (
            <header>
                <ConnectionStatus connected={connected}/>
                <SearchBox
                    isFetching={isFetching}
                    total={total}
                    onSubmit={(q, index) => this.onSearchSubmit(q, index)}
                    indexes={indexes}
                />
            </header>
        )
    }
}


function select(state) {
    return {
        isFetching: state.entries.isFetching,
        connected: state.entries.connected,
        indexes: state.entries.indexes,
        total: state.entries.total
    };
}


export default connect(select)(Header);