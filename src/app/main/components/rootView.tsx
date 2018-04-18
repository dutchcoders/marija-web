import { EventEmitter } from 'fbemitter';
import * as React from 'react';
import { connect } from 'react-redux';

import { webSocketConnect } from '../../connection/connectionActions';
import ContextMenu from '../../contextMenu/contextMenu';
import ChordDiagram from '../../graph/components/chordDiagram/chordDiagram';
import Filter from '../../graph/components/filter';
import Navigation from '../../ui/components/navigation/navigation';
import Nodes from '../../graph/components/nodes';
import Timeline from '../../graph/components/timeline';
import Graph from '../../graph/graph';
import Header from '../../search/components/header';
import Stats from '../../stats/stats';
import Table from '../../table/table';
import Notifications from '../../connection/components/notifications/notifications';
import Pane from '../../ui/components/pane';
import { AppState } from '../interfaces/appState';
import Configuration from './configuration/configuration';
import AdjacencyMatrix from "../../graph/components/adjacencyMatrix/adjacencyMatrix";

class RootView extends React.Component<any, any> {
    zoomEvents = new EventEmitter();
    exportTableEvents = new EventEmitter();
    main: any;

    constructor(props) {
        super(props);

        this.state = {
            mounted: false
        };
    }

    componentWillMount() {
        const { dispatch, backendUri } = this.props;

        dispatch(webSocketConnect(backendUri));
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

                    <Graph
                        className="graph"
                        zoomEvents={this.zoomEvents}
                    />

                    <Stats />

                    <ContextMenu />

                    <Pane
                        name="Configuration"
                        handle="configuration"
                        config={panes.configuration}
                        dispatch={dispatch}
                        container={this.main}>
                        <Configuration ref="configurationView"/>
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
                        buttonText="Export as CSV"
                        onButtonClick={() => this.exportTableEvents.emit('export')}
                        handle="table"
                        config={panes.table}
                        dispatch={dispatch}
                        container={this.main}>
                        <Table exportEvents={this.exportTableEvents} />
                    </Pane>

                    <Pane
                        name="Timeline"
                        handle="timeline"
                        config={panes.timeline}
                        dispatch={dispatch}
                        container={this.main}>
                        <Timeline
                            width="1600"
                            height="200"
                            className="timeline"
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

                    <Pane
                        name="Chord diagram"
                        handle="chordDiagram"
                        config={panes.chordDiagram}
                        dispatch={dispatch}
                        container={this.main}>
                        <ChordDiagram />
                    </Pane>

                    <Pane
                        name="Adjacency matrix"
                        handle="adjacencyMatrix"
                        config={panes.adjacencyMatrix}
                        dispatch={dispatch}
                        container={this.main}>
                        <AdjacencyMatrix />
                    </Pane>
                </div>
            );
        }

        return (
            <div className="rootView">
                <Header/>
                <Notifications />

                <main className="main" ref={main => this.main = main}>
                    {mainContent}
                </main>
            </div>
        );
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
        nodes: state.graph.nodes,
        links: state.graph.links,
        panes: state.ui.panes,
        backendUri: state.connection.backendUri
    };
};
export default connect(select)(RootView);
