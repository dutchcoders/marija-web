import React, { Component } from 'react';
import { connect } from 'react-redux';

import { SearchBox, requestItems } from '../modules/search/index'
import { ConnectionStatus } from '../modules/status/index'

import { nodeColors as colors } from '../config';

class Header extends Component {

    constructor(props) {
        super(props);

        this.state = {
            colorIndex: 0
        }
    }

    getColour() {
        const { colorIndex } = this.state;
        const currentColor = colors[colorIndex % (colors.length - 1)];

        this.setState({colorIndex: colorIndex + 1});

        return currentColor;
    }

    onSearchSubmit(q, index) {
        const { dispatch } = this.props;

        dispatch(requestItems({
            query: q,
            index: index,
            color: this.getColour()
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