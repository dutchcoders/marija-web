import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Header, Record, TableView, ConfigurationView, Histogram, Graph, Pane, Icon } from './index'
import { Searches} from '../modules/search/index'
import { ErrorStatus } from '../modules/status/index'
import { openPane } from '../utils/index'


class RootView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentNode: null
        }
    }

    componentDidMount() {
    }

    componentWillReceiveProps(nextProps) {
    }

    handleChange(e) {
        this.setState({selectValue: e.target.value});
    }

    handleMouseOver(node) {
        this.setState({currentNode: node});
    }

    openHistogram() {
        const { dispatch } = this.props;
        dispatch(openPane('histogram'));
    }

    render() {
        const { panes, dispatch } = this.props;

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

                <Pane name="Configuration" handle="configuration" panes={panes} dispatch={dispatch}>
                    <ConfigurationView ref="configurationView"/>
                </Pane>

                <Pane name="Histogram" handle="histogram" panes={panes} dispatch={dispatch}>
                    <div onClick={() => this.openHistogram()} className="open-tag">
                        <Icon name="ion-ios-arrow-up"/>
                    </div>

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
 <div className="row">
 <section>
 <button onClick={() => this.refs['configurationView'].show()}>Configure</button>
 </section>
 <section>
 <ErrorStatus error={this.props.errors}/>
 </section>
 </div>
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
 <TableView />
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
        panes: state.utils.panes
    }
}
export default connect(select)(RootView)
