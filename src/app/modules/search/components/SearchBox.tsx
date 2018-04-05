import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import Tooltip from 'rc-tooltip';
import SkyLight from 'react-skylight';
import SketchPicker from 'react-color';
import {Query, Icon, Loader} from "../../../components/index";
import {editSearch} from "../actions";
import {Search} from "../../../interfaces/search";
import {Node} from "../../../interfaces/node";
import {Datasource} from "../../../interfaces/datasource";
import * as styles from './searchBox.scss';
import {FormEvent} from "react";
import {
    datasourceActivated,
    datasourceDeactivated
} from "../../datasources/actions";
import {Field} from "../../../interfaces/field";
import Url from "../../../domain/Url";

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
    clickHandlerRef;

    onInputFocus() {
        this.setState({
            formExpanded: true
        });

        this.clickHandlerRef = this.collapseForm.bind(this);

        window.addEventListener('click', this.clickHandlerRef)
    }

    collapseForm(e) {
        if (!this.searchForm.contains(e.target)) {
            // User clicked outside the search form, close it
            this.setState({
                formExpanded: false
            });

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

                    let content = (
                        <div>
                            <input
                                name="datasource"
                                type="checkbox"
                                className={styles.datasourceCheckbox}
                                checked={datasource.active}
                                onChange={event => this.handleDatasourceChange(event, datasource)}
                                disabled={disabled}
                            />
                            {datasource.name}
                        </div>
                    );

                    if (disabled) {
                        content = (
                            <Tooltip
                                overlay={'First select fields for this datasource in the configuration'}
                                placement="bottom"
                                mouseLeaveDelay={0}
                                arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                                {content}
                            </Tooltip>
                        );
                    }

                    return (
                        <label key={datasource.id} className={styles.datasourceLabel}>
                            {content}
                        </label>
                    );
                })}
            </div>
        );
    }

    render() {
        const { connected, searches, nodes } = this.props;
        const { query, editSearchValue, searchAroundOpen } = this.state;

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
                    <img className={`logo ${connected ? 'connected' : 'not-connected'}`} src="/images/logo.png" title={connected ? "Marija is connected to the backendservice" : "No connection to Marija backend available" } />
                </div>
                <div className="queriesContainer">
                    {searchAroundContainer}
                    {userQueries}

                    <form onSubmit={this.handleSubmit.bind(this)} className={styles.form} ref={form => this.searchForm = form}>
                        <input
                            className={styles.queryInput}
                            placeholder="Search"
                            value={ query }
                            onChange={this.handleQueryChange.bind(this)}
                            onFocus={this.onInputFocus.bind(this)}
                        />
                        {this.renderDatasourceForm()}
                    </form>
                </div>
                <SkyLight dialogStyles={editQueryDialogStyles} hideOnOverlayClicked ref="editDialog" title="Update query" >
                    { edit_query }
                </SkyLight>
            </nav>
        );
    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        searches: state.entries.searches,
        datasources: state.datasources.datasources,
        nodes: state.entries.nodes.filter(node => node.isNormalizationParent || node.normalizationId === null),
        fields: state.entries.fields
    };
};

export default connect(select)(SearchBox);