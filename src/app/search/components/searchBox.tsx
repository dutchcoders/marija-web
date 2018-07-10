import * as React from 'react';
import SketchPicker from 'react-color';
import { connect, Dispatch } from 'react-redux';
import SkyLight from 'react-skylight';
import { Datasource } from '../../datasources/interfaces/datasource';
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
}

interface State {
    query: string;
    searchAroundOpen: boolean;
}

class SearchBox extends React.Component<Props, State> {
    state: State = {
        query: '',
        searchAroundOpen: false
    };
    searchForm: HTMLFormElement;
    queryInput: HTMLTextAreaElement;
    clickHandlerRef;

    onInputFocus() {
        this.clickHandlerRef = this.collapseForm.bind(this);
        this.adjustInputHeight();

        window.addEventListener('click', this.clickHandlerRef)
    }

    adjustInputHeight() {
		const maxHeight = 300;

		this.queryInput.style.height = 'auto';
		this.queryInput.style.height = Math.min(this.queryInput.scrollHeight, maxHeight) + 'px';
    }

    resetInputHeight() {
		this.queryInput.style.height = 'auto';
    }

    collapseForm(e) {
        if (!this.searchForm.contains(e.target)) {
            // User clicked outside the search form, close it
            this.queryInput.blur();
            this.resetInputHeight();

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

        const trimmed = query.trim();

        if (trimmed === '' || activeDatasources.length === 0) {
            return;
        }

        this.setState({query: ''});
		this.adjustInputHeight();
        this.props.onSubmit(trimmed);
    }

    handleQueryChange(event) {
		this.setState({
			query: event.target.value
		});

		this.adjustInputHeight();
    }

    handleQueryKeyDown(event) {
		if (event.keyCode === 13 && !event.shiftKey) {
			this.handleSubmit(event);
			return;
		}
    }

    toggleSearchAroundContainer() {
        const { searchAroundOpen } = this.state;

        this.setState({
            searchAroundOpen: !searchAroundOpen
        });
    }

    render() {
        const { connected, searches, nodes } = this.props;
        const { query, searchAroundOpen } = this.state;

        const userQueries = searches
            .filter(search => search.aroundNodeId === null)
            .map(search =>
                <Query search={search} key={search.searchId} nodes={nodes} />
            );

        const searchAroundQueries = searches
            .filter(search => search.aroundNodeId !== null)
            .map(search =>
                <Query search={search} key={search.searchId} nodes={nodes} />
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
                        <form onSubmit={this.handleSubmit.bind(this)} className={styles.form + ' ' + styles.formCollapsed} ref={form => this.searchForm = form}>
                            <textarea
								ref={ref => this.queryInput = ref}
                                className={styles.queryInput}
                                placeholder="Search"
                                rows={1}
                                value={ query }
                                onChange={this.handleQueryChange.bind(this)}
                                onKeyDown={this.handleQueryKeyDown.bind(this)}
                                onFocus={this.onInputFocus.bind(this)}
                            />
							<Icon name="ion-ios-search" className={'ion-ios-search ' + styles.searchIcon} />
                        </form>
                    </div>

                    {searchAroundContainer}
                    {userQueries}
                </div>
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
    };
};

export default connect(select)(SearchBox);