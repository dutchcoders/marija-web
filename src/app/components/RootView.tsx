import * as React from 'react';
import { connect } from 'react-redux';
import { EventEmitter } from 'fbemitter';

import {
    Header, Record, TableView, ConfigurationView, Timeline,
    GraphPixi, Pane, Icon, Nodes, Navigation
} from './index';
import Filter from "./Graphs/Filter";
import ContextMenu from '../modules/contextMenu/contextMenu';
import Stats from '../modules/stats/stats';

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
                        <TableView exportEvents={this.exportTableEvents} />
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
