import React, { Component } from 'react';
import { connect } from 'react-redux';
import { map, includes } from 'lodash';

import { requestIndices } from '../../modules/indices/index';
import { fieldAdd, fieldDelete, dateFieldAdd, dateFieldDelete, normalizationAdd, normalizationDelete, indexAdd, indexDelete } from '../../modules/data/index';
import { serverAdd, serverRemove } from '../../modules/servers/index';
import { activateIndex, deActivateIndex} from '../../modules/indices/index';
import { getFields } from '../../modules/fields/index'
import { Icon } from '../index';

class ConfigurationView extends React.Component {
    constructor(props) {
        super(props);


        this.state = {
            normalization_error: ''
        };
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

    handleAddDateField(e) {
        e.preventDefault();

        const { date_field } = this.refs;
        const { dispatch } = this.props;

        if (date_field.value === '') {
            return;
        }

        dispatch(dateFieldAdd({
            path: date_field.value
        }));
    }

    handleAddNormalization(e) {
        e.preventDefault();

        const { regex, replaceWith  } = this.refs;
        const { dispatch } = this.props;

        if (regex.value === '') {
            return;
        }

        try {
            new RegExp(regex.value, "i");
        } catch (e) {
            this.setState({'normalization_error': e.message});
            return;
        }

        this.setState({'normalization_error': null});

        dispatch(normalizationAdd({
            regex: regex.value,
            replaceWith: replaceWith.value
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
        dispatch(activateIndex(index.value));
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

    handleDeleteDateField(field) {
        const { dispatch } = this.props;
        dispatch(dateFieldDelete(field));
    }

    handleDeleteNormalization(normalization) {
        const { dispatch } = this.props;
        dispatch(normalizationDelete(normalization));
    }

    handleDeleteIndex(field) {
        const { dispatch } = this.props;
        dispatch(indexDelete(field));
        dispatch(deActivateIndex(field));
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

        let no_servers = null;

        if (servers.length == 0) {
            no_servers = <div className='text-warning'>No servers configured.</div>;
        }

        return (
            <div>
                <ul>{ options }</ul>
                { no_servers }
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
        );
    }

    renderDateFields(fields) {
        const options = map(fields, (field) => {
            return (
                <li key={field.path} value={ field.path }>
                    <i className="glyphicon">{ field.icon }</i>{ field.path }
                    <Icon onClick={() => this.handleDeleteDateField(field)} name="ion-ios-trash-outline"/>
                </li>
            );
        });

        let no_date_fields = null;

        if (fields.length == 0) {
            no_date_fields = <div className='text-warning'>No date fields configured.</div>;
        }

        return (
            <div>
                <ul>{ options }</ul>
                { no_date_fields } 
                <form onSubmit={this.handleAddDateField.bind(this)}>
                    <div className="row">
                        <div className="col-xs-10">
                            <input className="form-control" type="text" ref="date_field" placeholder="New date field"/>
                        </div>
                        <div className="col-xs-1">
                            <Icon onClick={this.handleAddDateField.bind(this)} name="ion-ios-add-circle-outline add"/>
                        </div>
                    </div>
                </form>
            </div>
        );
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

        let no_fields = null;

        if (fields.length == 0) {
            no_fields = <div className='text-warning'>No fields configured.</div>;
        }

        return (
            <div>
                <ul>{ options }</ul>
                { no_fields }
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


    renderNormalizations(normalizations) {
        const { normalization_error } = this.state;

        const options = map(normalizations, (normalization) => {
            return (
                <li key={normalization.path} value={ normalization.path }>
                    <span dangerouslySetInnerHTML={{ __html: `Regex '<b>${normalization.regex}</b>' will be replaced with value '<b>${normalization.replaceWith}</b>'.`}}></span>
                    <Icon onClick={() => this.handleDeleteNormalization(normalization)} name="ion-ios-trash-outline"/>
                </li>
            );
        });

        let no_normalizations = null;

        if (normalizations.length == 0) {
            no_normalizations = <div className='text-warning'>No normalizations configured.</div>;
        }

        return (
            <div>
                <ul>{ options }</ul>
                { no_normalizations }
                <form onSubmit={this.handleAddNormalization.bind(this)}>
                    <div className="row">
                        <span className='text-danger'>{ normalization_error }</span>
                    </div>
                    <div className="row">
                        <div className="col-xs-10">
                            <input className="form-control" type="text" ref="regex" placeholder="regex"/>
                            <input className="form-control" type="text" ref="replaceWith" placeholder="replace value"/>
                        </div>
                        <div className="col-xs-1">
                            <Icon onClick={this.handleAddNormalization.bind(this)} name="ion-ios-add-circle-outline add"/>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    renderIndices(indices) {
        const { dispatch,activeIndices } = this.props;

        const options = map(indices, (index) => {
            const indexName = index;

            return (
                <li key={index} value={index}>
                    <div className="index-name" title={index}>
                        { index }
                    </div>

                    {includes(activeIndices, indexName) ?
                        <Icon onClick={() => dispatch(deActivateIndex(indexName)) } name="ion-ios-eye"/>
                        :
                        <Icon onClick={() => dispatch(activateIndex(indexName)) } name="ion-ios-eye-off"/>
                    }

                    <Icon onClick={() => this.handleDeleteIndex(index)} name="ion-ios-trash-outline"/>
                </li>
            );
        });

        let no_indices = null;

        if (indices.length == 0) {
            no_indices = <div className='text-warning'>No indices configured.</div>;
        }
        return (
            <div>
                <ul>{options}</ul>
                { no_indices }
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
        const { fields, date_fields, normalizations, indexes, servers,dispatch } = this.props;


        return (
            <div>
                <div className="form-group">
                    <h2>Servers</h2>
                    <p>Add the elasticsearch servers you want to discover here.</p>
                    { this.renderServers(servers) }
                </div>

                <div className="form-group">
                    <h2>Indices</h2>
                    <p>Select and add the indices to query.</p>
                    { this.renderIndices(indexes) }
                </div>

                <div className="form-group">
                    <h2>Fields</h2>
                    <Icon onClick={() => dispatch(getFields(indexes))} name="ion-ios-refresh"/>
                    <p>The fields are used as node id.</p>
                    { this.renderFields(fields) }
                </div>

                <div className="form-group">
                    <h2>Date fields</h2>
                    <p>The date fields are being used for the histogram.</p>
                    { this.renderDateFields(date_fields) }
                </div>

                <div className="form-group">
                    <h2>Normalizations</h2>
                    <p>Normalizations are regular expressions being used to normalize the node identifiers and fields.</p>
                    { this.renderNormalizations(normalizations) }
                </div>
            </div>
        );
    }
}


function select(state) {
    return {
        fields: state.entries.fields,
        date_fields: state.entries.date_fields,
        indexes: state.entries.indexes,
        normalizations: state.entries.normalizations,
        activeIndices: state.indices.activeIndices,
        servers: state.servers
    };
}


export default connect(select)(ConfigurationView);
