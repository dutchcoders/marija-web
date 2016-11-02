import React, { Component } from 'react';
import { connect } from 'react-redux';
import { map } from 'lodash';


import { addField, deleteField, addIndex, deleteIndex } from '../../modules/data/index';
import { requestIndices } from '../../modules/indices/index';
import { Icon } from '../index';

class ConfigurationView extends React.Component {
    constructor(props) {
        super(props);

    }

    handleAddField(e) {
        e.preventDefault();

        const { field } = this.refs;
        const { dispatch } = this.props;

        if (field.value === '') {
            return;
        }

        dispatch(addField(field.value));
    }

    handleAddIndex(e) {
        e.preventDefault();
        const { index } = this.refs;
        const { dispatch } = this.props;

        if (index.value === '') {
            return;
        }

        dispatch(addIndex(index.value));
    }

    handleDeleteField(field) {
        const { dispatch } = this.props;
        dispatch(deleteField(field));
    }

    handleDeleteIndex(field) {
        const { dispatch } = this.props;
        dispatch(deleteIndex(field));
    }

    handleRequestIndices(server) {
        const { dispatch } = this.props;
        dispatch(requestIndices(server));
    }

    renderServers(servers) {
        const options = map(servers || [], (server) => {
            return (
                <li key={server} value={ server }>
                    { server }
                    <Icon onClick={() => this.handleRequestIndices(server) } name="ion-ios-cloud-download-outline"/>
                    <Icon name="ion-ios-trash-outline"/>
                </li>
            );
        });

        return (
            <div>
                <ul>{ options }</ul>
            </div>
        )
    }


    renderFields(fields) {
        const options = map(fields || [], (field) => {
            return (
                <li key={field} value={ field }>
                    { field }
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
                <Icon onClick={() => this.handleDeleteIndex(index)} name="ion-ios-trash-outline"/>
            </li>;
        });

        return (
            <div>
                <ul>{options}</ul>
            </div>
        );
    }

    render() {
        const { fields, indexes, servers } = this.props;

        return (
            <div>
                <div className="form-group">
                    <h2>Servers</h2>
                    { this.renderServers(servers) }
                </div>

                {indexes.length ?
                    <div className="form-group">
                        <h2>Indices</h2>
                        { this.renderIndices(indexes) }
                    </div> : null}

                {fields.length ?
                    <div className="form-group">
                        <h2>Fields</h2>
                        { this.renderFields(fields) }
                    </div> : null }
            </div>

        );
    }
}


function select(state) {
    return {
        fields: state.entries.fields,
        indexes: state.entries.indexes,
        servers: state.servers
    };
}


export default connect(select)(ConfigurationView);