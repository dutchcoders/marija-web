import { saveAs } from 'file-saver';
import { isEqual, map } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Datasource } from '../datasources/interfaces/datasource';
import { AppState } from '../main/interfaces/appState';
import * as styles from './fields.scss';
import { Field } from './interfaces/field';
import {
	getNonDateFields, selectFieldsInData,
	selectTypeLabels,
	TypeLabel
} from './fieldsSelectors';
import FieldList from './components/fieldList/fieldList';
import { selectDatasourcesInData } from '../datasources/datasourcesSelectors';
import { FormattedMessage, InjectedIntl, injectIntl } from 'react-intl';
import Icon from '../ui/components/icon';

interface Props {
    dispatch: Dispatch<any>;
    fields: Field[];
    datasources: Datasource[];
    typeLabels: TypeLabel[];
	intl: InjectedIntl;
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
            <div className={styles.filter}>
				{typeLabels.map(type => {
					const key = 'search_types_' + type.types.join(',');

					return (
						<label className={styles.filterLabel} key={key}>
							<input
								type="radio"
								name="type"
								className={styles.filterRadio}
								checked={isEqual(type.types, searchTypes)}
								onChange={(e) => this.handleTypeChange(e, type.types)}
							/>
							{type.label}
						</label>
					);
				})}
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
			<div className={styles.filter}>
				{options.map(option => {
					const key = 'datasources_' + option.id;

					return (
						<label className={styles.filterLabel} key={key}>
							<input
								type="radio"
								name="datasource"
								className={styles.filterRadio}
								defaultChecked={option.id === datasourceFilter}
								onChange={() => this.handleDatasourceChange(option.id)}
							/>
							{option.label}
						</label>
					);
				})}
			</div>
		);
    }

    render() {
        const { intl, fields } = this.props;
        const { query, datasourceFilter, searchTypes } = this.state;

        return (
            <div>
				<h2><FormattedMessage id="fields"/></h2>

				{fields.length > 0 && (
					<form className={styles.form}>
						<div className={styles.inputWrapper}>
							<input
								className={styles.input}
								ref={searchInput => this.searchInput = searchInput}
								value={this.state.query}
								onChange={this.handleFieldSearchChange.bind(this)} type="text"
								placeholder={intl.formatMessage({ id: 'search_fields' })}
							/>
							<Icon name={'ion-ios-search ' + styles.searchIcon} />
						</div>
						<div className={styles.filters}>
							{this.renderTypeFilter()}
							{this.renderDatasourceFilter()}
						</div>
					</form>
				)}

				<FieldList query={query} types={searchTypes} datasourceId={datasourceFilter}/>
            </div>
        );
    }
}


function select(state: AppState, ownProps) {
    return {
		...ownProps,
        fields: selectFieldsInData(state),
		typeLabels: selectTypeLabels(state),
        datasources: selectDatasourcesInData(state)
    };
}

export default injectIntl(connect(select)(Fields));
