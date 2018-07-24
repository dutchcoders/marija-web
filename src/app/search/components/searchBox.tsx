import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Datasource } from '../../datasources/interfaces/datasource';
import { Node } from '../../graph/interfaces/node';
import { AppState } from '../../main/interfaces/appState';
import Icon from '../../ui/components/icon';
import { Search } from '../interfaces/search';
import Query from './query';
import * as styles from './searchBox.scss';
import { getActiveNonLiveDatasources } from '../../datasources/datasourcesSelectors';
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
	noDatasourcesError: boolean;
}

class SearchBox extends React.Component<Props, State> {
    state: State = {
        query: '',
        searchAroundOpen: false,
        noDatasourcesError: false
    };
    searchForm: HTMLFormElement;
    queryInput: HTMLTextAreaElement;
    clickHandlerRef;

    setNoDatasourcesError(datasources: Datasource[]) {
        const { query } = this.state;

        this.setState({
            noDatasourcesError: !!query && datasources.length === 0
        });
    }

    onInputFocus() {
        this.clickHandlerRef = this.collapseForm.bind(this);
        this.adjustInputHeight();

        window.addEventListener('click', this.clickHandlerRef)
    }

    adjustInputHeight() {
		const maxHeight = 300;

		this.queryInput.style.height = 'auto';
		requestAnimationFrame(() => {
			this.queryInput.style.height = Math.min(this.queryInput.scrollHeight, maxHeight) + 'px';
		});
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

        const trimmed = query.trim();

        if (trimmed === '' || datasources.length === 0) {
            return;
        }

        this.setState({query: ''});
		this.adjustInputHeight();
        this.props.onSubmit(trimmed);
    }

    handleQueryChange(event) {
    	const { datasources } = this.props;

		this.setState({
			query: event.target.value,
			noDatasourcesError: !!event.target.value && datasources.length === 0
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

    componentWillReceiveProps(nextProps: Props) {
		this.setNoDatasourcesError(nextProps.datasources);
	}

    render() {
        const { connected, searches, nodes } = this.props;
        const { query, searchAroundOpen, noDatasourcesError } = this.state;

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
                <div className={styles.queriesContainer}>
                    <div className={styles.formWrapper}>
                        <form onSubmit={this.handleSubmit.bind(this)} className={styles.form + ' ' + styles.formCollapsed} ref={form => this.searchForm = form}>
							<textarea
								ref={ref => this.queryInput = ref}
								className={styles.queryInput + (noDatasourcesError ? ' ' + styles.noDatasources : '')}
								placeholder="Search"
								rows={1}
								value={ query }
								onChange={this.handleQueryChange.bind(this)}
								onKeyDown={this.handleQueryKeyDown.bind(this)}
								onFocus={this.onInputFocus.bind(this)}
							/>
							<Icon name="ion-ios-search" className={'ion-ios-search ' + styles.searchIcon} />
							{noDatasourcesError && (
								<span className={styles.noDatasourcesMessage}>First select a datasource in the config</span>
							)}
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
        datasources: getActiveNonLiveDatasources(state),
        nodes: state.graph.nodes.filter(node => node.isNormalizationParent || node.normalizationId === null),
    };
};

export default connect(select)(SearchBox);