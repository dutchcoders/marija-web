import React, { Component } from 'react';
import { connect } from 'react-redux';
import { map } from 'lodash';


import { addField, deleteField, addIndex, deleteIndex } from '../../modules/data/index';
import { Pane, Icon } from '../index';

class ConfigurationView extends React.Component {
    constructor(props) {
        super(props);

    }

    handleAddField(e) {
        e.preventDefault();

        const { field } = this.refs;
        const { dispatch } = this.props;

        dispatch(addField(field.value));
    }

    handleAddIndex(e) {
        e.preventDefault();
        const index = this.refs.index.value;

        const { dispatch } = this.props;
        dispatch(addIndex(index));
    }

    handleDeleteField(field) {
        const { dispatch } = this.props;
        dispatch(deleteField(field));
    }

    handleDeleteIndex(field) {
        const { dispatch } = this.props;
        dispatch(deleteIndex(field));
    }

    renderFields(fields) {
        const options = map(fields || [], (field) => {
            return (
                <li key={field} value={ field }>{ field }
                    <Icon onClick={() => this.handleDeleteField(field)} name="ion-ios-trash-outline"/>
                </li>
            );
        });

        return (
            <div>
                <ul>{ options }</ul>
                <form onSubmit={this.handleAddField.bind(this)}>
                    <div className="row">
                        <div className="col-xs-10">
                            <input className="form-control" type="text" ref="field" placeholder="New field"/>
                        </div>
                        <div className="col-xs-1">
                            <Icon onClick={this.handleAddField.bind(this)} name="ion-ios-add-circle-outline add"/>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    renderIndices(indices) {
        const options = map(indices, (index) => {
            return <li key={index} value={index}>
                { index }
                <Icon onClick={() => this.handleDeleteIndex(field)} name="ion-ios-trash-outline"/>
            </li>;
        });

        return (
            <div>
                <ul>{options}</ul>

                <div className="form-group">
                    <form onSubmit={this.handleAddIndex.bind(this)}>
                        <div className="row">
                            <div className="col-xs-10">
                                <input className="form-control" type="text" ref="index" placeholder="New index"/>
                            </div>
                            <div className="col-xs-1">
                                <Icon onClick={this.handleAddIndex.bind(this)} name="ion-ios-add-circle-outline add"/>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    render() {
        const { fields, indexes, panes, dispatch } = this.props;

        return (
            <Pane name="Configuration" handle="configuration" panes={panes} dispatch={dispatch}>
                <div className="form-group">
                    <h2>Indices</h2>
                    { this.renderIndices(indexes) }
                </div>

                <div className="form-group">
                    <h2>Fields</h2>
                    { this.renderFields(fields) }
                </div>
            </Pane>

        );

    }
}


function select(state) {
    return {
        fields: state.entries.fields,
        indexes: state.entries.indexes,
        panes: state.utils.panes
    };
}


export default connect(select)(ConfigurationView);