import React, { Component } from 'react';
import SketchPicker from 'react-color';
import { connect } from 'react-redux';

import { map } from 'lodash';

import { deleteSearch } from '../index';

class Searches extends Component {

    constructor(props) {
        super(props);

        this.state = {
            editSearchValue: null
        }
    }

    handleEditSearch(search, e) {
        e.preventDefault();
        this.setState({editSearchValue: search});
    }

    handleCancelEditSearch(search, e) {
        e.preventDefault();
        this.setState({editSearchValue: null});
    }

    handleDeleteSearch(search, e) {
        e.preventDefault();

        const { dispatch } = this.props;
        dispatch(deleteSearch({search: search}));
    }

    handleChangeSearchColorComplete(color) {
        let search = this.state.editSearchValue;

        search.color = color.hex;

        this.setState({editSearchValue: search});
    }

    render() {
        const { searches } = this.props;
        const { editSearchValue } = this.state;

        return (
            <div>
                {map(searches, (search) => {
                    var divStyle = {
                        color: search.color
                    };

                    if (editSearchValue === search) {
                        return (
                            <div key={search.q} style={ divStyle }>
                                <SketchPicker
                                    color={ search.color }
                                    onChangeComplete={ this.handleChangeSearchColorComplete() }/>

                                { search.q } ({search.count})

                                <button onClick={() => this.handleCancelEditSearch(search) }>cancel</button>
                            </div>
                        );
                    } else {
                        return <div key={search.q} style={ divStyle }>{ search.q } ({search.count})
                            <button onClick={() => this.handleEditSearch(search) }>edit</button>
                            <button onClick={() => this.handleDeleteSearch(search) }>delete</button>
                        </div>
                    }
                })}
            </div>
        )

    }
}

function select(state) {
    return {
        searches: state.entries.searches
    };
}


export default connect(select)(Searches);