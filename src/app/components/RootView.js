import React, { Component } from 'react';
import { connect } from 'react-redux';
import { EventEmitter } from 'fbemitter';

import {
    Header, Record, TableView, ConfigurationView, Histogram, Queries,
    GraphPixi, Pane, Icon, Nodes, Navigation
} from './index';
import Filter from "./Graphs/Filter";

class RootView extends Component {
    zoomEvents = new EventEmitter();

    constructor(props) {
        super(props);

        this.state = {
            currentNode: null,
            mounted: false
        };
    }

    handleMouseOver(node) {
        this.setState({currentNode: node});
    }

    componentDidMount() {
        this.setState({
            mounted: true
        });
    }

    render() {
        const { panes, dispatch, nodes} = this.props;
        const { mounted } = this.state;

        let mainContent = null;
        const selectedNodes = nodes.filter(node => node.selected).length;

        if (mounted) {
            mainContent = (
                <div className="mainInner">
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
                        config={panes.configuration}
                        dispatch={dispatch}
                        container={this.main}>
                        <ConfigurationView ref="configurationView"/>
                    </Pane>

                    <Pane
                        name="Selected nodes"
                        description={selectedNodes + '/' + nodes.length}
                        handle="nodes"
                        config={panes.nodes}
                        dispatch={dispatch}
                        container={this.main}>
                        <Nodes />
                    </Pane>

                    <Pane
                        name="Table"
                        description={'data for ' + selectedNodes + ' selected nodes'}
                        handle="table"
                        config={panes.table}
                        dispatch={dispatch}
                        container={this.main}>
                        <TableView />
                    </Pane>

                    <Pane
                        name="Histogram"
                        handle="histogram"
                        config={panes.histogram}
                        dispatch={dispatch}
                        container={this.main}>
                        <Histogram
                            width="1600"
                            height="200"
                            className="histogram"
                        />
                    </Pane>

                    <Pane
                        name="Filter"
                        handle="filter"
                        config={panes.filter}
                        dispatch={dispatch}
                        container={this.main}>
                        <Filter />
                    </Pane>
                </div>
            );
        }

        return (
            <div className="rootView">
                <Header/>

                <main className="main" ref={main => this.main = main}>
                    {mainContent}
                </main>
            </div>
        );
    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        errors: state.entries.errors,
        nodes: state.entries.nodes,
        links: state.entries.links,
        panes: state.utils.panes
    };
};
export default connect(select)(RootView);
