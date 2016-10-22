import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Header, Record, TableView, ConfigurationView, Histogram, Graph } from './index'
import { Searches} from '../modules/search/index'
import { ErrorStatus } from '../modules/status/index'

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

    render() {
        return (
            <div className="container-fluid">
                <Header/>

                <div className="row">
                    <div className="col-xs-9 col-sm-9">
                        <div className="row">
                            <section>
                                <button onClick={() => this.refs['configurationView'].show()}>Configure</button>
                            </section>
                            <section>
                                <ErrorStatus error={this.props.errors}/>
                            </section>
                        </div>
                        <div className="row">
                            <Graph
                                width="1600"
                                height="800"
                                className="graph"
                                handleMouseOver={ () => this.handleMouseOver() }
                            />
                        </div>
                        <div>
                            <Histogram
                                width="1600"
                                height="200"
                                className="histogram"
                            />
                        </div>
                    </div>
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
                </div>
                <ConfigurationView ref="configurationView"/>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        ...ownProps,
        errors: state.entries.errors,
        items: state.entries.items,
    }
}
export default connect(mapStateToProps)(RootView)
