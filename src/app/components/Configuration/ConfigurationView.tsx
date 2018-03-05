import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { find, sortBy, map, slice, uniq, concat, isEqual } from 'lodash';
import { fieldAdd, fieldDelete, normalizationAdd, normalizationDelete, viaDelete, viaAdd } from '../../modules/data/index';
import { activateDatasource, deActivateDatasource } from '../../modules/datasources/index';
import { Field } from '../../modules/fields/index';
import { Icon } from '../index';
import Url from "../../domain/Url";
import Loader from "../Misc/Loader";
import {Workspaces} from "../../domain/index";
import {saveAs} from 'file-saver';
import {exportData, importData} from "../../modules/import/actions";
import {searchFieldsUpdate} from "../../modules/search/actions";
import {highlightNodes} from "../../modules/graph/actions";
import {Node} from "../../interfaces/node";
import {Normalization} from "../../interfaces/normalization";
import {Datasource} from "../../interfaces/datasource";

interface State {
    normalization_error: string;
    currentFieldSearchValue: string;
    currentDateFieldSearchValue: string;
    selectedFrom: string;
    selectedVia: string;
    selectedTo: string;
    viaError: string | null;
    searchTypes: any[],
    maxSearchResults: number;
}

interface Props {
    dispatch: Dispatch<any>;
    fields: any;
    availableFields: any;
    date_fields: any;
    normalizations: Normalization[];
    via: any;
    datasources: Datasource[];
    fieldsFetching: boolean;
    nodes: Node[];
}

class ConfigurationView extends React.Component<Props, State> {
    defaultMaxSearchResults = 10;
    searchInput: HTMLElement;
    refs: any;
    state: State = {
        normalization_error: '',
        currentFieldSearchValue: '',
        currentDateFieldSearchValue: '',
        selectedFrom: '',
        selectedVia: '',
        selectedTo: '',
        viaError: null,
        searchTypes: [],
        maxSearchResults: this.defaultMaxSearchResults
    };

    componentWillReceiveProps(nextProps) {
        const { selectedFrom, selectedVia, selectedTo } = this.state;
        const firstFieldPath = nextProps.fields[0] ? nextProps.fields[0].path : false;

        if (selectedFrom === '' && firstFieldPath) {
            this.setState({selectedFrom: firstFieldPath});
        }

        if (selectedVia === '' && firstFieldPath) {
            this.setState({selectedVia: firstFieldPath});
        }

        if (selectedTo === '' && firstFieldPath) {
            this.setState({selectedTo: firstFieldPath});
        }
    }

    handleAddField(field) {
        const { dispatch } = this.props;

        Url.addQueryParam('fields', field.path);

        dispatch(fieldAdd({
            path: field.path,
            type: field.type
        }));

        dispatch(searchFieldsUpdate());

        this.searchInput.focus();
    }

    handleFieldSearchChange(event) {
        this.setState({
            currentFieldSearchValue: event.target.value,
            maxSearchResults: this.defaultMaxSearchResults
        });
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

    /**
     * Check if the label isn't also one of the endpoints, that wouldnt work.
     *
     * @param via
     * @returns {boolean}
     */
    checkViaUniqueFields(via) {
        return via.endpoints.indexOf(via.label) === -1;
    }

    /**
     * Check if we're not trying to configure a from/to field which is already
     * used as a label. Returns an array of invalid fields, or an empty array
     * when everything is okay.
     *
     * @param viaData
     * @returns {string[]}
     */
    getInvalidViaFields(viaData) {
        const { via } = this.props;

        if (!via) {
            return;
        }

        const allLabels = via.map(viaItem => viaItem.label);

        return  viaData.endpoints.filter(endpoint => allLabels.indexOf(endpoint) !== -1);
    }

    checkViaExists(viaData) {
        const { via } = this.props;

        const existingVia = via.find(viaItem =>
            viaItem.label === viaData.label
            && isEqual(concat([], viaItem.endpoints).sort(), concat([], viaData.endpoints).sort())
        );

        return typeof existingVia !== 'undefined';
    }

    handleAddVia() {
        const { selectedFrom, selectedVia, selectedTo } = this.state;
        const { dispatch } = this.props;

        const viaData = {
            endpoints: [selectedFrom, selectedTo],
            label: selectedVia
        };

        if (!this.checkViaUniqueFields(viaData)) {
            this.setState({viaError: 'Select 3 unique fields'});
            return;
        }

        const invalidViaFields = this.getInvalidViaFields(viaData);

        if (invalidViaFields.length > 0) {
            this.setState({viaError: 'The field ' + invalidViaFields.join(', ') + ' is already used as a label'});
            return;
        }

        if (this.checkViaExists(viaData)) {
            this.setState({viaError: 'This via configuration already exists'});
            return;
        }

        dispatch(viaAdd(viaData));
    }

    handleDeleteVia(viaData) {
        const { dispatch } = this.props;

        dispatch(viaDelete(viaData));
    }

    handleDeleteField(field) {
        const { dispatch } = this.props;

        Url.removeQueryParam('fields', field.path);

        dispatch(fieldDelete(field));
    }

    handleDeleteNormalization(normalization) {
        const { dispatch } = this.props;
        dispatch(normalizationDelete(normalization));
    }

    handleDatasourceChange(event, datasource: Datasource) {
        const { dispatch } = this.props;

        if (event.target.checked) {
            Url.addQueryParam('datasources', datasource.id);
            dispatch(activateDatasource(datasource));
        } else {
            Url.removeQueryParam('datasources', datasource.id);
            Url.removeQueryParam('search', datasource.id);
            dispatch(deActivateDatasource(datasource));
        }
    }

    types = [
        {
            label: 'yes/no',
            types: ['boolean']
        },
        {
            label: 'date',
            types: ['date']
        },
        {
            label: 'text',
            types: ['text', 'keyword']
        },
        {
            label: 'number',
            types: ['long', 'double']
        },
        {
            label: 'location',
            types: ['geo_point']
        },
    ];

    getTypes(fields) {
        const types = [];

        fields.forEach(field => {
            if (types.indexOf(field.type) === -1) {
                types.push(field.type);
            }
        });

        const typeItems = [];
        types.forEach(type => {
            const alreadyUsed = typeItems.reduce((prev, item) => prev.concat(item.types), []);

            if (alreadyUsed.indexOf(type) !== -1) {
                return;
            }

            const typeItem = this.types.find(search => search.types.indexOf(type) !== -1);

            if (typeItem) {
                typeItems.push(typeItem);
            } else {
                typeItems.push({
                    label: type,
                    types: [type]
                });
            }
        });

        return typeItems;
    }

    handleTypeChange(e, type) {
        this.setState({
            searchTypes: type
        });
    }

    handleMaxSearchResultsChange(max) {
        this.setState({
            maxSearchResults: max
        });
    }

    highlightNodes(field) {
        const { nodes, dispatch } = this.props;

        const highlight: Node[] = nodes.filter(node =>
            node.fields.indexOf(field) !== -1
        );

        dispatch(highlightNodes(highlight));
    }

    removeHighlightNodes() {
        const { dispatch } = this.props;

        dispatch(highlightNodes([]));
    }

    renderFields(fields, availableFields) {
        const { currentFieldSearchValue, searchTypes, maxSearchResults } = this.state;
        availableFields = availableFields.concat([]);

        const options = map(fields, (field: any) => {
            return (
                <li
                    key={'field_' + field.path}
                    value={ field.path }
                    onMouseEnter={() => this.highlightNodes(field.path)}>
                    { field.path }
                    <i className="fieldIcon">{ field.icon }</i>
                    <Icon onClick={() => this.handleDeleteField(field)} name="ion-ios-trash-outline"/>
                </li>
            );
        });

        const types = [{
            label: 'all types',
            types: []
        }].concat(this.getTypes(availableFields));

        // Filter by type, if we are searching on a certain type
        if (searchTypes.length > 0) {
            availableFields = availableFields.filter(item =>
                searchTypes.indexOf(item.type) !== -1
            );
        }

        // Only fields that have not already been added
        availableFields = availableFields.filter(field =>
            typeof fields.find(search => search.path === field.path) === 'undefined'
        );

        const search = (
            <form>
                <div className="row">
                    <div className="col-xs-12">
                        <input
                            className="form-control searchInput"
                            ref={searchInput => this.searchInput = searchInput}
                            value={this.state.currentFieldSearchValue}
                            onChange={this.handleFieldSearchChange.bind(this)} type="text"
                            placeholder={'Search ' + availableFields.length + ' fields'} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <div className="selectType">
                            {types.map(type => {
                                const key = 'search_types_' + type.types.join(',');

                                return (
                                    <div className="form-check form-check-inline" key={key}>
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            name="type"
                                            id={key}
                                            checked={isEqual(type.types, searchTypes)}
                                            onChange={(e) => this.handleTypeChange(e, type.types)}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={key}>
                                            {type.label}
                                        </label>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </form>
        );

        let searchResults = availableFields.concat([]);

        if (currentFieldSearchValue) {
            searchResults = [];

            availableFields.forEach((item) => {
                const copy = Object.assign({}, item);
                copy.occurrenceIndex = copy.path.toLowerCase().indexOf(currentFieldSearchValue.toLowerCase());

                if (copy.occurrenceIndex !== -1) {
                    searchResults.push(copy);
                }
            });

            // Sort by when the search term occurs in the field name (the earlier the better)
            searchResults.sort((a, b) => a.occurrenceIndex - b.occurrenceIndex);
        }

        let numMore = null;
        let showMore = null;
        if (searchResults.length > maxSearchResults) {
            numMore = (
                <p key={1}>
                    {searchResults.length - maxSearchResults} more fields
                </p>
            );

            showMore = (
                <button onClick={() => this.handleMaxSearchResultsChange(maxSearchResults + 20)} key={2}>
                    Show more
                </button>
            );
        }

        let showLess = null;
        if (maxSearchResults > this.defaultMaxSearchResults) {
            showLess = (
                <button
                    className="showLess"
                    onClick={() => this.handleMaxSearchResultsChange(this.defaultMaxSearchResults)}
                    key={3}>
                    Show less
                </button>
            );
        }

        let noResults = null;
        if (searchResults.length === 0) {
            noResults = (
                <p>No fields found</p>
            );
        }

        const firstX = searchResults.slice(0, maxSearchResults);
        const available = ([
            <ul key={1}>
                {firstX.map((item, i) => {
                    return (
                        <Field
                            key={'available_fields_' + item.path + i}
                            item={item} handler={() => this.handleAddField(item)}
                            icon={'ion-ios-plus'}
                        />
                    );
                })}
            </ul>,
            <div className="searchResultsFooter" key={2}>
                {numMore}
                {showMore}
                {showLess}
                {noResults}
            </div>
        ]);

        let selectDatasourceMessage = null;

        if (availableFields.length === 0 && fields.length === 0) {
            selectDatasourceMessage = <p>First select a datasource.</p>;
        }

        return (
            <div>
                <ul onMouseLeave={this.removeHighlightNodes.bind(this)}>{ options }</ul>
                { availableFields.length > 0 ? search : null }
                { availableFields.length > 0 ? available : null }
                { selectDatasourceMessage }
            </div>
        );
    }

    renderNormalizations(normalizations: Normalization[]) {
        const { normalization_error } = this.state;

        const options = map(normalizations, (normalization) => {
            return (
                <li key={normalization.replaceWith}>
                    <span>
                       Regex '<b>{normalization.regex}</b>' will be replaced with value '<b>{normalization.replaceWith}</b>'.
                    </span>
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
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-10">
                            <input className="form-control" type="text" ref="replaceWith" placeholder="replace value"/>
                        </div>
                        <div className="col-xs-2">
                            <Icon onClick={this.handleAddNormalization.bind(this)}
                                  name="ion-ios-plus add"/>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    renderDatasources() {
        const { datasources } = this.props;

        const options = map(sortBy(datasources, ["name"]), (datasource) => {
            const indexName = datasource.name;

            let live = null;
            if (datasource.type === 'live') {
                live = <span className="liveDatasource">Live</span>
            }

            return (
                <li key={ datasource.id } value={ indexName }>
                    <div className="datasourceName" title={indexName }>
                        { indexName }
                        {live}
                    </div>
                    <input type="checkbox" checked={datasource.active} onChange={(event) => this.handleDatasourceChange(event, datasource)} />
                </li>
            );
        });

        let no_datasources = null;
        if (datasources.length == 0) {
            no_datasources = <div className='text-warning'>No datasources configured.</div>;
        }

        return (
            <div>
                <ul>{options}</ul>
                { no_datasources }
            </div>
        );
    }

    handleFromChange(event) {
        this.setState({selectedFrom: event.target.value});
    }

    handleViaChange(event) {
        this.setState({selectedVia: event.target.value});
    }

    handleToChange(event) {
        this.setState({selectedTo: event.target.value});
    }

    renderFieldSelector(fields, changeHandler, value) {
        const options = map(fields, (field: any) => {
            return (
                <option key={field.path} value={field.path}>
                    {field.path}
                </option>
            );
        });

        return (
            <select className="form-control" onChange={(event) => changeHandler(event)} value={value}>
                {options}
            </select>
        );
    }

    renderVia() {
        const { fields, via } = this.props;
        const { selectedFrom, selectedVia, selectedTo, viaError } = this.state;

        let error;

        if (viaError) {
            error = (
                <div className="alert alert-danger">
                    {viaError}
                    <button className="close" onClick={() => this.setState({viaError: null})}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            );
        }

        let existing;

        if (via && via.length > 0) {
            const viaItems = map(via, (viaItem: any) => {
                return (
                    <li key={JSON.stringify(viaItem)}>
                        <ol>
                            <li>{viaItem.endpoints[0]}</li>
                            <li>{viaItem.label}</li>
                            <li>{viaItem.endpoints[1]}</li>
                        </ol>
                        <Icon onClick={() => this.handleDeleteVia(viaItem)} name="ion-ios-trash-outline"/>
                    </li>
                );
            });

            existing = (
                <ul>
                    {viaItems}
                </ul>
            );
        }

        const addNew = (
            <div>
                <div className="form-group row via-row">
                    <label className="col-xs-2 col-form-label">From</label>
                    <div className="col-xs-8">
                        { this.renderFieldSelector(fields, this.handleFromChange.bind(this), selectedFrom)}
                    </div>
                </div>
                <div className="form-group row via-row">
                    <label className="col-xs-2 col-form-label">Via</label>
                    <div className="col-xs-8">
                        { this.renderFieldSelector(fields, this.handleViaChange.bind(this), selectedVia)}
                    </div>
                </div>
                <div className="form-group row via-row">
                    <label className="col-xs-2 col-form-label">To</label>
                    <div className="col-xs-8">
                        { this.renderFieldSelector(fields, this.handleToChange.bind(this), selectedTo)}
                    </div>
                    <div className="col-xs-2">
                        <Icon onClick={this.handleAddVia.bind(this)}
                              name="ion-ios-plus add"/>
                    </div>
                </div>
            </div>
        );

        const addNewAllowed = fields.length >= 3;
        const selectFieldsMessage = <p>First select at least 3 fields.</p>;

        return (
            <div>
                {error}
                {existing}
                {addNewAllowed ? addNew : selectFieldsMessage}
            </div>
        );
    }

    getAtLeastOneAlert() {
        return (
            <span className="heading-alert">
                Select at least one
            </span>
        );
    }

    resetConfig() {
        Workspaces.deleteWorkspace();
        // Remove all data from url and refresh the page for simplicity
        window.location.href = '/';
    }

    exportJson() {
        const { dispatch } = this.props;

        dispatch(exportData());
    }

    chooseImportFile() {
        this.refs.importFile.click();
    }

    importJson(event) {
        const { dispatch } = this.props;

        const reader = new FileReader();

        reader.onload = function(){
            const store = JSON.parse(reader.result);

            dispatch(importData(store));
        };

        reader.readAsText(event.target.files[0]);
    }

    render() {
        const { fields, normalizations, datasources, availableFields, fieldsFetching } = this.props;

        return (
            <div>
                <div className="form-group">
                    <h2>
                        Datasources
                        {datasources.filter(datasource => datasource.active).length === 0 ? this.getAtLeastOneAlert() : null}
                    </h2>
                    { this.renderDatasources() }
                </div>

                <div className="form-group">
                    <h2>
                        Fields
                        <Loader show={fieldsFetching} />
                        {datasources.length > 0 && fields.length === 0 ? this.getAtLeastOneAlert() : null}
                    </h2>

                    { this.renderFields(fields, availableFields) }
                </div>

                <div className="form-group">
                    <h2>Normalizations</h2>
                    <p>Normalizations are regular expressions being used to normalize the node identifiers and
                        fields.</p>
                    { this.renderNormalizations(normalizations) }
                </div>

                <div className="form-group">
                    <h2>Via</h2>
                    { this.renderVia() }
                </div>

                <div className="form-group">
                    <button className="btn btn-primary" onClick={this.exportJson.bind(this)}>Export</button>
                    <input type="file" ref="importFile" className="importFile" onChange={this.importJson.bind(this)} />
                    <button className="btn btn-primary" onClick={this.chooseImportFile.bind(this)}>Import</button>
                </div>

                <div className="form-group">
                    <button className="btn btn-primary" onClick={this.resetConfig.bind(this)}>Reset config</button>
                </div>
            </div>
        );
    }
}


function select(state) {
    return {
        fields: state.entries.fields,
        availableFields: state.fields.availableFields,
        date_fields: state.entries.date_fields,
        normalizations: state.entries.normalizations,
        via: state.entries.via,
        datasources: state.datasources.datasources,
        fieldsFetching: state.fields.fieldsFetching,
        nodes: state.entries.nodes
    };
}


export default connect(select)(ConfigurationView);
