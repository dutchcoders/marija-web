import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Socket } from '../utils/index';

import { Header, Record, TableView, ConfigurationView, Histogram, Graph, Pane, Icon, Nodes } from './index';
import { Searches} from '../modules/search/index';
import { ErrorStatus } from '../modules/status/index';

class RootView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentNode: null
        };
    }

    componentWillMount() {
	const { dispatch } = this.props;
        Socket.startWS(dispatch);
    }

    componentWillReceiveProps(nextProps) {
    }

    handleChange(e) {
        this.setState({selectValue: e.target.value});
    }

    handleMouseOver(node) {
        this.setState({currentNode: node});
    }


    render() {
        const { items, panes, dispatch, node } = this.props;

        return (
            <div className="container-fluid">
                <Header/>
                <div className="row">
                    <div className="col-xs-12">
                        <div className="row" style={{'height': 'calc(100vh - 74px)'}}>
                            <Graph
                                className="graph"
                                handleMouseOver={ () => this.handleMouseOver() }
                            />
                        </div>
                    </div>
                </div>

                <Pane name="Configuration" handle="configuration" panes={panes} dispatch={dispatch} icon="ion-ios-arrow-forward">
                    <ConfigurationView ref="configurationView"/>
                </Pane>

                <Pane name={`Queries (${items.length})`} handle="queries" panes={panes} dispatch={dispatch} icon="ion-ios-arrow-forward">
                    <Searches/>
                </Pane>

                <Pane name={`Nodes (${node.length})`} handle="nodes" panes={panes} dispatch={dispatch} icon="ion-ios-arrow-back">
                    <Nodes />
                </Pane>

                <Pane name="Table" count={items.length} handle="table" panes={panes} dispatch={dispatch} icon="ion-ios-arrow-back">
                    <TableView />
                </Pane>

                <Pane name="Histogram" handle="histogram" panes={panes} dispatch={dispatch} icon="ion-ios-arrow-up">
                    <Histogram
                        width="1600"
                        height="200"
                        className="histogram"
                    />
                </Pane>
            </div>
        );
    }
}

/*
 <ul>
 {this.renderSelected()}
 </ul>
 */


/*
 <div className="col-xs-3 col-sm-3">
 <div className="row">
 <b>Records:</b> { this.props.items.length }
 </div>
 <div className="row">
 <Searches/>
 </div>
 <div className="row">

 </div>
 </div>
 */

/*

 <div>

 </div>
 */


const select = (state, ownProps) => {
    return {
        ...ownProps,
        errors: state.entries.errors,
        items: state.entries.items,
        node: state.entries.node,
        nodes: state.entries.nodes,
        links: state.entries.links,
        panes: state.utils.panes
    };
};
export default connect(select)(RootView);
