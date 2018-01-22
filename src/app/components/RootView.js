import React, { Component } from 'react';
import { connect } from 'react-redux';
import { EventEmitter } from 'fbemitter';

import {
    Header, Record, TableView, ConfigurationView, Histogram, Queries, Graph,
    GraphPixi, Pane, Icon, Nodes, Navigation
} from './index';

class RootView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentNode: null
        };
    }

    handleChange(e) {
        this.setState({selectValue: e.target.value});
    }

    handleMouseOver(node) {
        this.setState({currentNode: node});
    }

    zoomEvents = new EventEmitter();

    render() {
        const { panes, dispatch, node, nodes} = this.props;

        return (
            <div className="rootView">
                <Header/>

                <main className="main">
                    <Navigation
                        zoomIn={() => this.zoomEvents.emit('zoomIn')}
                        zoomOut={() => this.zoomEvents.emit('zoomOut')}
                    />

                    <GraphPixi
                        className="graph"
                        zoomEvents={this.zoomEvents}
                        handleMouseOver={ () => this.handleMouseOver() }
                    />

                    <Pane
                        name="Configuration"
                        handle="configuration"
                        panes={panes}
                        dispatch={dispatch}
                        icon="ion-ios-arrow-forward">
                        <ConfigurationView ref="configurationView"/>
                    </Pane>

                    <Pane
                        name="Selected nodes"
                        description={node.length + '/' + nodes.length}
                        handle="nodes"
                        panes={panes}
                        dispatch={dispatch}
                        icon="ion-ios-arrow-back">
                        <Nodes />
                    </Pane>

                    <Pane name="Table" description={'data for ' + node.length + ' selected nodes'} handle="table" panes={panes} dispatch={dispatch} icon="ion-ios-arrow-back">
                        <TableView />
                    </Pane>

                    <Pane name="Histogram" handle="histogram" panes={panes} dispatch={dispatch} icon="ion-ios-arrow-up">
                        <Histogram
                            width="1600"
                            height="200"
                            className="histogram"
                        />
                    </Pane>
                </main>

            </div>
        );
    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        errors: state.entries.errors,
        node: state.entries.node,
        nodes: state.entries.nodes,
        links: state.entries.links,
        panes: state.utils.panes
    };
};
export default connect(select)(RootView);
