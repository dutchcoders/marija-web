import React, { Component } from 'react';
import { connect } from 'react-redux';
import { map } from 'lodash';

import { requestIndices } from '../../modules/indices/index';
import { fieldAdd, fieldDelete, indexAdd, indexDelete } from '../../modules/data/index';
import { serverAdd, serverRemove } from '../../modules/servers/index';

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

        const icons = ["\u20ac", "\ue136", "\ue137", "\ue138", "\ue139", "\ue140", "\ue141", "\ue142", "\ue143"];

        const icon = icons[Math.floor((Math.random() * icons.length))];

        dispatch(fieldAdd({
            icon: icon,
            path: field.value
        }));
    }

    handleAddIndex(e) {
        e.preventDefault();
        const { index } = this.refs;
        const { dispatch } = this.props;

        if (index.value === '') {
            return;
        }

        dispatch(indexAdd(index.value));
    }

    handleAddServer(e) {
        e.preventDefault();

        const { server } = this.refs;
        const { dispatch } = this.props;

        if (server.value === '') {
            return;
        }

        dispatch(serverAdd(server.value));
    }

    handleDeleteServer(server) {
        const { dispatch } = this.props;
        dispatch(serverRemove(server));
    }

    handleDeleteField(field) {
        const { dispatch } = this.props;
        dispatch(fieldDelete(field));
    }

    handleDeleteIndex(field) {
        const { dispatch } = this.props;
        dispatch(indexDelete(field));
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
                    <Icon onClick={() => this.handleDeleteServer(server)} name="ion-ios-trash-outline"/>
                </li>
            );
        });

        return (
            <div>
                <ul>{ options }</ul>
                <form onSubmit={this.handleAddServer.bind(this)}>
                    <div className="row">
                        <div className="col-xs-10">
                            <input className="form-control" type="text" ref="server" placeholder="New server"/>
                        </div>
                        <div className="col-xs-1">
                            <Icon onClick={this.handleAddServer.bind(this)} name="ion-ios-add-circle-outline add"/>
                        </div>
                    </div>
                </form>
            </div>
        )
    }


    renderFields(fields) {
        const options = map(fields, (field) => {
            return (
                <li key={field.path} value={ field.path }>
                    <i className="glyphicon">{ field.icon }</i>{ field.path }
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


                <div className="form-group">
                    <h2>Indices</h2>
                    { this.renderIndices(indexes) }
                </div>

                <div className="form-group">
                    <h2>Fields</h2>
                    { this.renderFields(fields) }
                </div>
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
