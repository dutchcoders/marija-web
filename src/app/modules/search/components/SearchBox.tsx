import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import Tooltip from 'rc-tooltip';
import SkyLight from 'react-skylight';
import SketchPicker from 'react-color';
import {Query, Icon, Loader} from "../../../components/index";
import {editSearch} from "../actions";
import {Search} from "../../../interfaces/search";
import {Node} from "../../../interfaces/node";

interface Props {
    onSubmit: Function;
    dispatch: Dispatch<any>;
    connected: boolean;
    enabled: boolean;
    searches: Search[];
    nodes: Node[];
}

interface State {
    query: string;
    editSearchValue: Search;
    searchAroundOpen: boolean;
}

class SearchBox extends React.Component<Props, State> {
    state: State = {
        query: '',
        editSearchValue: null,
        searchAroundOpen: false
    };
    refs: any;

    handleSubmit(e) {
        e.preventDefault();

        const { query } = this.state;

        if (query === '') {
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

    handleChangeQueryColorComplete(color) {
        const { dispatch } = this.props;
        const search: any = Object.assign({}, this.state.editSearchValue);

        search.color = color.hex;

        dispatch(editSearch(search.q, {
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

    render() {
        const { connected, enabled, searches, nodes } = this.props;
        const { query, editSearchValue, searchAroundOpen } = this.state;

        let tooltipStyles: any = {};

        if (enabled) {
            tooltipStyles.visibility = 'hidden';
        }

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
                <Query search={search} key={search.q} nodes={nodes} handleEdit={() => this.handleEditSearch(search)}/>
            );

        const searchAroundQueries = searches
            .filter(search => search.aroundNodeId !== null)
            .map(search =>
                <Query search={search} key={search.q} nodes={nodes} handleEdit={() => this.handleEditSearch(search)}/>
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

                    <form onSubmit={this.handleSubmit.bind(this)}>
                        <Tooltip
                            overlay="Select at least one datasource and one field"
                            placement="bottomLeft"
                            overlayStyle={tooltipStyles}
                            arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                            <input
                                className="queryInput"
                                placeholder="Search"
                                value={ query }
                                onChange={this.handleQueryChange.bind(this)}
                                disabled={ !enabled }
                            />
                        </Tooltip>
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
        nodes: state.entries.nodes.filter(node => node.isNormalizationParent || node.normalizationId === null)
    };
};

export default connect(select)(SearchBox);