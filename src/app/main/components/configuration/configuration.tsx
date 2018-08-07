import { saveAs } from 'file-saver';
import { concat, find, isEqual, map, slice, sortBy, uniq } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import { Datasource } from '../../../datasources/interfaces/datasource';
import Fields from '../../../fields/fields';
import {
	setFilterBoringNodes, setFilterSecondaryQueries, setGroupNodes,
	viaAdd,
	viaDelete
} from '../../../graph/graphActions';
import { Via } from '../../../graph/interfaces/via';
import Icon from '../../../ui/components/icon';
import { AppState } from '../../interfaces/appState';
import { exportData, importData } from '../../mainActions';
import { FormEvent } from 'react';
import DatasourceList from '../../../datasources/components/datasourceList/datasourceList';
import ConnectorList from '../../../fields/components/connectorList/connectorList';
import SuggestedConnectorList from '../../../fields/components/suggestedConnectorList/suggestedConnectorList';
import Version from '../version/version';
import { setExperimentalFeatures, setLang } from '../../../ui/uiActions';
import { Language } from '../../../ui/interfaces/uiState';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';

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
    via: Via[];
    datasources: Datasource[];
    filterBoringNodes: boolean;
    filterSecondaryQueries: boolean;
    experimentalFeatures: boolean;
    groupNodes: boolean;
    lang: Language;
}

class Configuration extends React.Component<Props, State> {
    refs: any;
    state: State = {
        normalization_error: '',
        selectedFrom: '',
        selectedVia: '',
        selectedTo: '',
        viaError: null,
    };

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

        // Url.addVia(viaData);
        dispatch(viaAdd(viaData));
    }

    handleDeleteVia(viaData) {
        const { dispatch } = this.props;

        // Url.removeVia(viaData);
        dispatch(viaDelete(viaData));
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

    onFilterBoringNodesChange(event: FormEvent<HTMLInputElement>) {
        const { dispatch } = this.props;

        dispatch(setFilterBoringNodes(event.currentTarget.checked));
    }

    onFilterSecondaryQueriesChange(event: FormEvent<HTMLInputElement>) {
        const { dispatch } = this.props;

        dispatch(setFilterSecondaryQueries(event.currentTarget.checked));
    }

    onGroupNodesChange(event: FormEvent<HTMLInputElement>) {
        const { dispatch } = this.props;

        dispatch(setGroupNodes(event.currentTarget.checked));
    }

    onExperimentalFeaturesChange(event: FormEvent<HTMLInputElement>) {
        const { dispatch } = this.props;

        dispatch(setExperimentalFeatures(event.currentTarget.checked));
    }

    onLangChange(event: FormEvent<HTMLInputElement>) {
    	const { dispatch } = this.props;

    	dispatch(setLang(event.currentTarget.value as Language));
	}

    render() {
        const { filterBoringNodes, filterSecondaryQueries, experimentalFeatures, groupNodes, lang } = this.props;

        return (
            <div>
				<DatasourceList />
				<ConnectorList />
                <SuggestedConnectorList />
                <Fields />

                {/*<div className="form-group">*/}
                    {/*<h2>Via</h2>*/}
                    {/*{ this.renderVia() }*/}
                {/*</div>*/}

				<h2><FormattedMessage id="options"/></h2>
                <div className="form-group">
                    <label className="graph-option">
                        <input type="checkbox" onChange={this.onFilterBoringNodesChange.bind(this)} defaultChecked={filterBoringNodes} />
						<FormattedMessage id="only_display_nodes_minimum_one_connection" />
                    </label>
					<label className="graph-option">
						<input type="checkbox" onChange={this.onFilterSecondaryQueriesChange.bind(this)} defaultChecked={filterSecondaryQueries} />
						<FormattedMessage id="only_display_nodes_related_first_query" />
					</label>
					<label className="graph-option">
						<input type="checkbox" onChange={this.onGroupNodesChange.bind(this)} defaultChecked={groupNodes} />
						<FormattedMessage id="group_similar_nodes" />
					</label>
                </div>

                <div>
                    <h2><FormattedMessage id="language"/></h2>
                    <div className="form-group">
                        <label className="graph-option">
                            <input type="radio" name="lang" onChange={this.onLangChange.bind(this)} defaultChecked={lang === 'en'} value={'en'} />
                            English
                        </label>
                        <label className="graph-option">
                            <input type="radio" name="lang" onChange={this.onLangChange.bind(this)} defaultChecked={lang === 'nl'} value={'nl'} />
                            Nederlands
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <button className="btn btn-primary" onClick={this.exportJson.bind(this)}><FormattedMessage id="export"/></button>
                    <input type="file" ref="importFile" className="importFile" onChange={this.importJson.bind(this)} />
                    <button className="btn btn-primary" onClick={this.chooseImportFile.bind(this)}><FormattedMessage id="import"/></button>
                </div>

                <div className="form-group">
                    <button className="btn btn-primary" onClick={this.resetConfig.bind(this)}><FormattedMessage id="reset_config"/></button>
                </div>

				<Version/>
                <div className="form-group">
                    <label className="graph-option">
                        <input type="checkbox" onChange={this.onExperimentalFeaturesChange.bind(this)} defaultChecked={experimentalFeatures} />
                        <FormattedMessage id="enable_experimental_features"/>
                    </label>
                </div>
            </div>
        );
    }
}


function select(state: AppState, ownProps) {
    return {
		...ownProps,
        via: state.graph.via,
        datasources: state.datasources.datasources,
        filterBoringNodes: state.graph.filterBoringNodes,
        filterSecondaryQueries: state.graph.filterSecondaryQueries,
        experimentalFeatures: state.ui.experimentalFeatures,
        groupNodes: state.graph.groupNodes,
		lang: state.ui.lang
    };
}


export default connect(select)(Configuration);
