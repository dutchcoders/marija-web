import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { FormEvent } from 'react';
import SketchPicker from 'react-color';
import { connect, Dispatch } from 'react-redux';
import SkyLight from 'react-skylight';

import { datasourceActivated, datasourceDeactivated } from '../../datasources/datasourcesActions';
import { Datasource } from '../../datasources/interfaces/datasource';
import { Field } from '../../fields/interfaces/field';
import { Node } from '../../graph/interfaces/node';
import { AppState } from '../../main/interfaces/appState';
import Icon from '../../ui/components/icon';
import { Search } from '../interfaces/search';
import { editSearch } from '../searchActions';
import Query from './query';
import * as styles from './searchBox.scss';
const logo = require('../../../images/logo.png');

interface Props {
    onSubmit: Function;
    dispatch: Dispatch<any>;
    connected: boolean;
    enabled: boolean;
    searches: Search[];
    nodes: Node[];
    datasources: Datasource[];
    fields: Field[];
}

interface State {
    query: string;
    editSearchValue: Search;
    searchAroundOpen: boolean;
    formExpanded: boolean;
}

class SearchBox extends React.Component<Props, State> {
    state: State = {
        query: '',
        formExpanded: false,
        editSearchValue: null,
        searchAroundOpen: false
    };
    refs: any;
    searchForm: HTMLFormElement;
    queryInput: HTMLInputElement;
    clickHandlerRef;

    onInputFocus() {
        this.setState({
            formExpanded: true
        });

        this.clickHandlerRef = this.collapseForm.bind(this);

        window.addEventListener('click', this.clickHandlerRef)
    }

    onInputBlur() {
		this.setState({
			formExpanded: false
		});
	}

    collapseForm(e) {
        if (!this.searchForm.contains(e.target)) {
            // User clicked outside the search form, close it
            this.setState({
                formExpanded: false
            });

            this.queryInput.blur();

            window.removeEventListener('click', this.clickHandlerRef);
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        const { query } = this.state;
        const { datasources } = this.props;

        const activeDatasources = datasources.filter(datasource =>
            datasource.active
        );

        if (query === '' || activeDatasources.length === 0) {
            return;
        }

        this.setState({query: ''});
        this.props.onSubmit(query);
    }

    handleQueryChange(e) {
        this.setState({query: e.target.value});
    }

    handleEditSearch(search) {
        this.setState({editSearchValue: search});
        this.refs.editDialog.show();
    }

    handleDatasourceChange(event: FormEvent<HTMLInputElement>, datasource: Datasource) {
        const { dispatch } = this.props;

        if (event.currentTarget.checked) {
            dispatch(datasourceActivated(datasource.id))
        } else {
            dispatch(datasourceDeactivated(datasource.id))
        }
    }

    handleChangeQueryColorComplete(color) {
        const { dispatch } = this.props;
        const search: any = Object.assign({}, this.state.editSearchValue);

        search.color = color.hex;

        dispatch(editSearch(search.searchId, {
            color: color.hex
        }));

        this.setState({editSearchValue: search});
    }

    toggleSearchAroundContainer() {
        const { searchAroundOpen } = this.state;

        this.setState({
            searchAroundOpen: !searchAroundOpen
        });
    }

    renderDatasourceForm() {
        const { datasources, fields } = this.props;
        const { formExpanded } = this.state;

        const className = styles.datasources + ' ' +
            (formExpanded ? '' : styles.datasourcesHidden);

        const queryDatasources = datasources.filter(datasource => datasource.type !== 'live');

        return (
            <div className={className}>
                {queryDatasources.map(datasource => {
                    const datasourceFields = fields.filter(field => field.datasourceId === datasource.id);
                    const disabled = datasourceFields.length === 0;

                    const label = (
						<label key={datasource.id} className={styles.datasourceLabel}>
							<input
								key={0}
								name="datasource"
								type="checkbox"
								className={styles.datasourceCheckbox}
								checked={datasource.active}
								onChange={event => this.handleDatasourceChange(event, datasource)}
								disabled={disabled}
							/>
							<span key={1}>{datasource.name}</span>
						</label>
                    );

                    if (disabled) {
                        return (
                            <Tooltip
                                key={datasource.id}
                                overlay={'First select fields for this datasource in the configuration'}
                                placement="bottom"
                                mouseLeaveDelay={0}
                                arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                                {label}
                            </Tooltip>
                        );
                    }

                    return label;
                })}
            </div>
        );
    }

    render() {
        const { connected, searches, nodes } = this.props;
        const { query, editSearchValue, searchAroundOpen, formExpanded } = this.state;

        const editQueryDialogStyles = {
            backgroundColor: '#fff',
            color: '#000',
            width: '400px',
            height: '400px',
            marginTop: '-200px',
            marginLeft: '-200px',
        };

        let edit_query = null;
        if (editSearchValue) {
            edit_query = <form>
                <SketchPicker
                    color={ editSearchValue.color }
                    onChangeComplete={(color) => this.handleChangeQueryColorComplete(color) }
                />
                <span className="colorBall" style={{backgroundColor: editSearchValue.color}}/>
                { `${editSearchValue.q} (${editSearchValue.items.length})` }
            </form>;
        }

        const userQueries = searches
            .filter(search => search.aroundNodeId === null)
            .map(search =>
                <Query search={search} key={search.searchId} nodes={nodes} handleEdit={() => this.handleEditSearch(search)}/>
            );

        const searchAroundQueries = searches
            .filter(search => search.aroundNodeId !== null)
            .map(search =>
                <Query search={search} key={search.searchId} nodes={nodes} handleEdit={() => this.handleEditSearch(search)}/>
            );

        const searchAroundLoading = searches
            .filter(
                search => !search.completed && search.aroundNodeId !== null
            ).length > 0
            && !searchAroundOpen;

        let searchAroundContainer = null;
        if (searchAroundQueries.length > 0) {
            searchAroundContainer = (
                <div className={
                        'searchAroundContainer'
                        + (searchAroundOpen ? ' opened' : '')}>
                    <div className={'loaderContainer' + (searchAroundLoading ? ' loading' : '')} />

                    <h1 onClick={this.toggleSearchAroundContainer.bind(this)}>
                        Search around
                        <span className="num">{searchAroundQueries.length}</span>
                        <Icon name={searchAroundOpen ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down'} />
                    </h1>

                    <div className={'queries' + (searchAroundOpen ? '' : ' hidden')}>
                        {searchAroundQueries}
                    </div>
                </div>
            );
        }

        return (
            <nav id="searchbox" className="[ navbar ][ navbar-bootsnipp animate ] row" role="navigation" ref="header">
                <div className="logoContainer">
                    <img className={`logo ${connected ? 'connected' : 'not-connected'}`} src={logo} title={connected ? "Marija is connected to the backendservice" : "No connection to Marija backend available" } />
                </div>
                <div className={styles.queriesContainer}>
                    <div className={styles.formWrapper}>
                        <form onSubmit={this.handleSubmit.bind(this)} className={styles.form + (formExpanded ? '' : ' ' + styles.formCollapsed)} ref={form => this.searchForm = form}>
                            <input
								ref={ref => this.queryInput = ref}
                                className={styles.queryInput}
                                placeholder="Search"
                                value={ query }
                                onChange={this.handleQueryChange.bind(this)}
                                onFocus={this.onInputFocus.bind(this)}
                            />
                            {this.renderDatasourceForm()}
                        </form>
                    </div>

                    {searchAroundContainer}
                    {userQueries}
                </div>
                <SkyLight dialogStyles={editQueryDialogStyles} hideOnOverlayClicked ref="editDialog" title="Update query" >
                    { edit_query }
                </SkyLight>
            </nav>
        );
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
        searches: state.graph.searches,
        datasources: state.datasources.datasources,
        nodes: state.graph.nodes.filter(node => node.isNormalizationParent || node.normalizationId === null),
        fields: state.graph.fields
    };
};

export default connect(select)(SearchBox);