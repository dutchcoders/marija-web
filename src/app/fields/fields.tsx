import { saveAs } from 'file-saver';
import { isEqual, map } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Datasource } from '../datasources/interfaces/datasource';
import { AppState } from '../main/interfaces/appState';
import Loader from '../ui/components/loader';
import FieldRow from './components/fieldRow/fieldRow';
import * as styles from './fields.scss';
import { Field } from './interfaces/field';
import {
	getNonDateFields,
	selectTypeLabels,
	TypeLabel
} from './fieldsSelectors';
import FieldList from './components/fieldList/fieldList';
import { selectDatasourcesInData } from '../datasources/datasourcesSelectors';

interface Props {
    dispatch: Dispatch<any>;
    availableFields: Field[];
    datasources: Datasource[];
    fieldsFetching: boolean;
    typeLabels: TypeLabel[];
}

interface State {
	query: string;
	currentDateFieldSearchValue: string;
	searchTypes: any[];
	iconSelectorField: string | null;
	datasourceFilter: string | null;
}

class Fields extends React.Component<Props, State> {
    searchInput: HTMLElement;
    state: State = {
        query: '',
        currentDateFieldSearchValue: '',
        searchTypes: [],
        iconSelectorField: null,
        datasourceFilter: null
    };

    handleFieldSearchChange(event) {
        this.setState({
            query: event.currentTarget.value
        });
    }

    handleTypeChange(e, type) {
        this.setState({
            searchTypes: type
        });
    }

    renderTypeFilter() {
        const { typeLabels } = this.props;
        const { searchTypes } = this.state;

        return (
            <div className={'row ' + styles.filter}>
                <div className="col-xs-12">
                    <div className={styles.filterContent}>
                        {typeLabels.map(type => {
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
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    handleDatasourceChange(datasource: string) {
        this.setState({
            datasourceFilter: datasource
        });
    }

    renderDatasourceFilter() {
        const { datasources } = this.props;
        const { datasourceFilter } = this.state;

        const normalDatasources = datasources.filter(datasource => datasource.type !== 'live');

        if (normalDatasources.length < 2) {
            return null;
        }

        const options = [{
            label: 'all datasources',
            id: null
        }].concat(normalDatasources.map(datasource => ({
            label: datasource.name,
            id: datasource.id
        })));

        return (
            <div className={'row ' + styles.filter}>
                <div className="col-xs-12">
                    <div className={styles.filterContent}>
                        {options.map(option=> {
                            const key = 'datasources_' + option.id;

                            return (
                                <div className="form-check form-check-inline" key={key}>
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        name="datasource"
                                        id={key}
                                        checked={option.id === datasourceFilter}
                                        onChange={() => this.handleDatasourceChange(option.id)}
                                    />
                                    <label
                                        className="form-check-label"
                                        htmlFor={key}>
                                        {option.label}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { fieldsFetching } = this.props;
        const { query, datasourceFilter, searchTypes } = this.state;

        return (
            <div>
				<h2>
					Fields
                    <Loader show={fieldsFetching} />
                </h2>

				<div className="form-group">
					<form>
						<div className="row">
							<div className="col-xs-12">
								<input
									className="form-control searchInput"
									ref={searchInput => this.searchInput = searchInput}
									value={this.state.query}
									onChange={this.handleFieldSearchChange.bind(this)} type="text"
									placeholder={'Search fields'} />
							</div>
						</div>
						<div className={styles.filters}>
							{this.renderTypeFilter()}
							{this.renderDatasourceFilter()}
						</div>
					</form>

                	<FieldList query={query} types={searchTypes} datasourceId={datasourceFilter}/>
				</div>
            </div>
        );
    }
}


function select(state: AppState) {
    return {
        availableFields: getNonDateFields(state),
		typeLabels: selectTypeLabels(state),
        fieldsFetching: state.fields.fieldsFetching,
        datasources: selectDatasourcesInData(state)
    };
}

export default connect(select)(Fields);
