import React, { Component } from 'react';
import { connect } from 'react-redux';

import { SearchBox, requestItems } from '../modules/search/index'
import { ConnectionStatus } from '../modules/status/index'
import { Icon } from '../components/index'

import { generateColour } from '../helpers/index'
import { openPane } from '../utils/index'

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

    openPane() {
        const { dispatch } = this.props;
        dispatch(openPane('configuration'));
    }

    render() {
        const { connected, isFetching, total, indexes } = this.props;

        return (
            <header className="row">
                <SearchBox
                    isFetching={isFetching}
                    total={total}
                    onSubmit={(q, index) => this.onSearchSubmit(q, index)}
                    indexes={indexes}
                >
                    <Icon onClick={() => this.openPane()} name="ion-logo-buffer settings"/>
                    <ConnectionStatus connected={connected}/>
                </SearchBox>
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