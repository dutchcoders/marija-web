import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { find, sortBy, map, slice, uniq, concat, isEqual } from 'lodash';
import { normalizationAdd, normalizationDelete, viaDelete, viaAdd } from '../../modules/data/index';
import { Icon } from '../index';
import {Workspaces} from "../../domain/index";
import {saveAs} from 'file-saver';
import {exportData, importData} from "../../modules/import/actions";
import {Normalization} from "../../interfaces/normalization";
import {Datasource} from "../../interfaces/datasource";
import Fields from '../../modules/fields/fields';
import {Via} from "../../interfaces/via";
import Url from "../../domain/Url";
import {AppState} from "../../interfaces/appState";

interface State {
    normalization_error: string;
    selectedFrom: string;
    selectedVia: string;
    selectedTo: string;
    viaError: string | null;
}

interface Props {
    dispatch: Dispatch<any>;
    fields: any;
    normalizations: Normalization[];
    via: Via[];
    datasources: Datasource[];
    fieldsFetching: boolean;
}

class ConfigurationView extends React.Component<Props, State> {
    refs: any;
    state: State = {
        normalization_error: '',
        selectedFrom: '',
        selectedVia: '',
        selectedTo: '',
        viaError: null,
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
     * Check if the via isn't also one of the endpoints, that wouldnt work.
     *
     * @param via
     * @returns {boolean}
     */
    checkViaUniqueFields(via: Via): boolean {
        return uniq([via.from, via.via, via.to]).length === 3;
    }

    /**
     * Check if we're not trying to configure a from/to field which is already
     * used as a via. Returns an array of invalid fields, or an empty array
     * when everything is okay.
     *
     * @param viaData
     * @returns {string[]}
     */
    getInvalidViaFields(viaData: Via): string[] {
        const { via } = this.props;

        if (!via) {
            return;
        }

        const allLabels = via.map(viaItem => viaItem.via);
        const invalid: string[] = []

        if (allLabels.indexOf(viaData.from) !== -1) {
            invalid.push(viaData.from);
        }

        if (allLabels.indexOf(viaData.to) !== -1) {
            invalid.push(viaData.to);
        }

        return invalid;
    }

    checkViaExists(viaData: Via): boolean {
        const { via } = this.props;

        const existingVia = via.find(viaItem =>
            viaItem.via === viaData.via
            && viaItem.from === viaData.from
            && viaItem.to === viaData.to
        );

        return typeof existingVia !== 'undefined';
    }

    handleAddVia() {
        const { selectedFrom, selectedVia, selectedTo } = this.state;
        const { dispatch } = this.props;

        const viaData: Via = {
            from: selectedFrom,
            to: selectedTo,
            via: selectedVia
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

        Url.addVia(viaData);
        dispatch(viaAdd(viaData));
    }

    handleDeleteVia(viaData) {
        const { dispatch } = this.props;

        Url.removeVia(viaData);
        dispatch(viaDelete(viaData));
    }

    handleDeleteNormalization(normalization) {
        const { dispatch } = this.props;
        dispatch(normalizationDelete(normalization));
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
                <option
                    key={field.path}
                    value={field.path}>
                    {field.path}
                </option>
            );
        });

        return (
            <select
                className="form-control"
                defaultValue={value}
                onChange={(event) => changeHandler(event)}>
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
            const viaItems = map(via, (viaItem: Via) => {
                return (
                    <li key={JSON.stringify(viaItem)}>
                        <ol>
                            <li>{viaItem.from}</li>
                            <li>{viaItem.via}</li>
                            <li>{viaItem.to}</li>
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
        const { normalizations } = this.props;

        return (
            <div>
                <Fields />

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


function select(state: AppState) {
    return {
        fields: state.graph.fields,
        normalizations: state.graph.normalizations,
        via: state.graph.via,
        datasources: state.datasources.datasources,
        fieldsFetching: state.fields.fieldsFetching
    };
}


export default connect(select)(ConfigurationView);
