import * as React from 'react';
import { connect } from 'react-redux';
import { EventEmitter } from 'fbemitter';
import Notifications from './notifications/notifications';

import {
    Header, ConfigurationView, Timeline,
    GraphPixi, Pane, Icon, Nodes, Navigation
} from './index';
import Filter from "../modules/graph/components/Filter";
import ContextMenu from '../modules/contextMenu/contextMenu';
import Stats from '../modules/stats/stats';
import Circle from '../modules/chordDiagram/chordDiagram';
import {AppState} from "../interfaces/appState";
import {webSocketConnect} from "../utils/utilsActions";
import Table from '../modules/table/table';

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
        const { dispatch } = this.props;

        dispatch(webSocketConnect());
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
                    />

                    <Stats />

                    <ContextMenu />

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
                        <Circle />
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
        errors: state.graph.errors,
        nodes: state.graph.nodes,
        links: state.graph.links,
        panes: state.utils.panes
    };
};
export default connect(select)(RootView);
