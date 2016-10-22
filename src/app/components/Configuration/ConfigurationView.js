import React, { Component } from 'react';
import { connect } from 'react-redux';
import { map } from 'lodash';


import { addField, deleteField, addIndex, deleteIndex } from '../../modules/data/index';

class ConfigurationView extends React.Component {
    constructor(props) {
        super(props);

        this.show = this.show.bind(this);
    }

    handleAddField(e) {
        e.preventDefault();

        const { field } = this.refs;
        const { dispatch } = this.props;

        dispatch(addField(field.value));
    }

    handleDeleteField(e, field) {
        e.preventDefault();

        const { dispatch } = this.props;
        dispatch(deleteField(field));
    }

    handleAddIndex(e) {
        e.preventDefault();
        const index = this.refs.index.value;

        const { dispatch } = this.props;
        dispatch(addIndex(index));
    }

    handleDeleteIndex(e, field) {
        e.preventDefault();

        const { dispatch } = this.props;
        dispatch(deleteIndex(field));
    }

    renderFields(fields) {
        const options = map(fields || [], (field) => {
            return (
                <li key={field} value={ field }>{ field }
                    <button onClick={() => this.handleDeleteField(field) }>x</button>
                </li>
            );
        });

        return (
            <div>
                <ul>{ options }</ul>
                <form onSubmit={() => this.handleAddField()}>
                    <input type="text" ref="field"/>
                </form>
            </div>
        );
    }

    renderIndices(indices) {
        const options = map(indices, (index) => {
            return <li key={index} value={index}>{ index }
                <button onClick={(e) => this.handleDeleteIndex(e, index) }>x</button>
            </li>;
        });

        return (
            <div>
                <ul>{options}</ul>
            </div>
        );
    }

    render() {
        const { fields, indexes } = this.props;
        return (
            <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-1 col-xs-10 col-sm-8 col-md-8 col-lg-6">
                <div className="form-group">
                    <h2>Indexes</h2>
                    { this.renderIndices(indexes) }
                </div>
                <div className="form-group">
                    <form onSubmit={() => this.handleAddIndex()}>
                        <input type="text" ref="index"/>
                    </form>
                </div>
                <h2>Fields</h2>
                <div className="form-group">
                    { this.renderFields(fields) }
                </div>
            </div>
        );

    }
}


function select(state) {
    return {
        fields: state.entries.fields,
        indexes: state.entries.indexes
    };
}


export default connect(select)(ConfigurationView);