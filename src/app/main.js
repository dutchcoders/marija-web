/*jshint esversion: 6 */

// http://bl.ocks.org/GerHobbelt/3071239
// http://bl.ocks.org/norrs/2883411

// change color, and icon of query
// change facet?
// change individual node (and name)
// load and save workspace
// create aliases / multiple. So node will have an id, and a mapping table with id, alias -> id
// meerdere indexen tegelijk zoeken
// notities kunnen toevoegen
// mini map
// facets per search kunnen wijzigen
// query zelf kunnen wijzigen
// combine highlight and results on same node, in correct color
// arc should show percentage, not equally

require('../index.html');
require('../scss/app.scss');

import React from 'react';
import ReactDOM from 'react-dom';
import { dispatch, compose, createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { connect } from 'react-redux';
import { browserHistory, Router, Route, Link } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import { Intl, FormattedDate, FormattedNumber }  from 'react-intl-es6';

import { ErrorStatus } from './modules/status/index'
import { receiveItems, RECEIVE_ITEMS, REQUEST_ITEMS } from './modules/search/index'
import { highlightNodes, deleteNodes, clearSelection, DELETE_NODES, HIGHLIGHT_NODES, SELECT_NODE, SELECT_NODES, CLEAR_SELECTION } from './modules/graph/index'
import { tableColumnAdd, tableColumnRemove, TABLE_COLUMN_ADD, TABLE_COLUMN_REMOVE } from './modules/data/index'

import { Header, Record, TableView } from './components/index';

import { fieldLocator, phone } from './helpers/index'

import ReactList from 'react-list';
import SkyLight from 'react-skylight';
import SketchPicker from 'react-color';
import Waypoint from 'react-waypoint';
import { Table, Column, Cell } from 'fixed-data-table';

import classNames from 'classnames/bind';

import _ from 'lodash';
import * as redux from 'redux';

import moment from 'moment';

const DELETE_SEARCH = 'DELETE_SEARCH';

const ADD_FIELD = 'ADD_FIELD';
const DELETE_FIELD = 'DELETE_FIELD';

const ADD_INDEX = 'ADD_INDEX';
const DELETE_INDEX = 'DELETE_INDEX';

const AUTH_CONNECTED = 'AUTH_CONNECTED';
const ERROR = 'ERROR';

import { network } from './config'
class Histogram extends React.Component {
    constructor(props) {
        super(props);

        this.draw = this.draw.bind(this);

        this.state = {};
    }

    componentDidMount() {
        this.canvas = this.refs.canvas;
        this.context = this.canvas.getContext('2d');

        this.draw();
    }

    componentDidUpdate(prevProps, prevState) {
        console.debug("componentDidUpdate (histogram");
        // group items to periods using lodash? complete set
        // have selection filter and drag timeline to select nodes
        //

        this.draw();
    }

    draw() {
        if (this.props.items.length === 0) {
            return;
        }

        let canvas = d3.select(this.canvas);
        let context = this.context;

        context.save();

        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = this.canvas.width - margin.left - margin.right,
            height = this.canvas.height - margin.top - margin.bottom;

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        var x = d3.scaleBand()
            .rangeRound([0, width])
            .padding(0.1);

        var y = d3.scaleLinear()
            .rangeRound([height, 0]);

        context.translate(margin.left, margin.top);

        let groupedResultsWeek = _.groupBy(this.props.items, (result) => {
            return moment(fieldLocator(result.fields, 'date')).startOf('isoWeek').week();
        });

        let groupedResults = _.groupBy(this.props.items, (result) => {
            return moment(fieldLocator(result.fields, 'date')).year() + '-' + moment(fieldLocator(result.fields, 'date')).month();
        });

        console.debug("year", groupedResults);

        let minX = _.reduce(this.props.items, (min, result) => {
            return (moment(fieldLocator(result.fields, 'date')) < min ? moment(fieldLocator(result.fields, 'date')) : min);
        }, moment());

        let maxX = _.reduce(this.props.items, (max, result) => {
            return (moment(fieldLocator(result.fields, 'date')) > max ? moment(fieldLocator(result.fields, 'date')) : max);
        }, 0);

        let periods = [];

        var year = minX.year();
        var month = minX.month();
        for (; year < maxX.year() || (year == maxX.year() && month < maxX.month());) {
            month++;
            if (month > 12) {
                year++;
                month = 1;
            }

            periods.push(year + "-" + month);
        }

        x.domain(periods);

        let maxValue = _.reduce(groupedResults, (max, n, m) => (n.length > max ? n.length : max), 0);
        y.domain([0, maxValue]);

        var yTickCount = 10,
            yTicks = y.ticks(yTickCount),
            yTickFormat = y.tickFormat(yTickCount);

        context.beginPath();
        x.domain().forEach(function (d) {
            context.moveTo(x(d) + x.bandwidth() / 2, height);
            context.lineTo(x(d) + x.bandwidth() / 2, height + 6);
        });

        context.strokeStyle = "black";
        context.stroke();

        context.textAlign = "center";
        context.textBaseline = "top";
        x.domain().forEach(function (d) {
            context.fillText(d, x(d) + x.bandwidth() / 2, height + 6);
        });

        context.beginPath();
        yTicks.forEach(function (d) {
            context.moveTo(0, y(d) + 0.5);
            context.lineTo(-6, y(d) + 0.5);
        });
        context.strokeStyle = "black";
        context.stroke();

        context.textAlign = "right";
        context.textBaseline = "middle";
        yTicks.forEach(function (d) {
            context.fillText(yTickFormat(d), -9, y(d));
        });

        context.beginPath();
        context.moveTo(-6.5, 0 + 0.5);
        context.lineTo(0.5, 0 + 0.5);
        context.lineTo(0.5, height + 0.5);
        context.lineTo(-6.5, height + 0.5);
        context.strokeStyle = "black";
        context.stroke();

        context.fillStyle = "steelblue";

        _.forEach(groupedResults, function (d, v) {
            context.fillRect(x(v), y(d.length), x.bandwidth(), height - y(d.length));

        });

        context.restore();

        // requestAnimationFrame(this.draw);
    }

    render() {
        let style = {
            position: 'fixed',
            bottom: '0px'
        };

        return <canvas style={ style } width={ this.props.width } height={ this.props.height } ref="canvas">
            histogram</canvas>;
    }
}

class Graph extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nodes: [],
            links: [],
            highlight_nodes: [],
            edges: [],
            clusters: {},
            start: new Date(),
            time: 0,
            n: {
                id: 'test',
            },
            ticks: 0
        };

    }

    componentDidMount() {
        network.onmouseclick = this.onMouseClick.bind(this);
        network.onmousemove = this.onMouseMove.bind(this);

        network.setup(this.refs["canvas"]);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }

    onPortMouseOver(link) {
    }

    onMouseClick(node) {
        //store.dispatch(selectNode({node:node}));
    }

    onMouseMove(node) {
        // store.dispatch(selectNode({node:node}));
    }

    onMouseOver(node) {
        // store.dispatch(selectNode({node:node}));
    }

    componentWillReceiveProps(nextProps) {
        // console.debug("will receive props", nextProps);
    }

    componentDidUpdate(prevProps, prevState) {
        network.graph.queries = this.props.queries;

        var {graph} = this.state;
        var {fields} = this.props;

        var nodes = [];
        var links = [];

        var removed = _.difference(prevProps.items, this.props.items);
        if (removed.length > 0) {
            var removed2 = [];
            _.forEach(removed, (d, i) => {
                _.forEach(fields, (field) => {
                    const value = fieldLocator(d.fields, field);

                    if (value) {
                        removed2.push(value);
                    }

                });
            });

            // this should be node id not packet
            network.removeNodes({
                nodes: removed2,
            });
        }


        if (this.props.items.length > 0) {
            // only new items!
            _.forEach(this.props.items, (d, i) => {
                // should we hash the id?
                _.forEach(fields, (field) => {
                    const value = fieldLocator(d.fields, field);
                    if (!value) return;

                    nodes.push({
                        id: phone(value),
                        query: d.q,
                        name: value,
                        color: d.color,
                        connections: 1
                    });
                });

                // create links of every possible source and target combination
                _.forEach(fields, (source) => {
                    const sourceValue = fieldLocator(d.fields, source);
                    if (!sourceValue) return;


                    _.forEach(fields, (target) => {
                        const targetValue = fieldLocator(d.fields, target);
                        if (!targetValue) return;

                        links.push({
                            source: phone(sourceValue),
                            target: phone(targetValue),
                        });
                    });
                });
            });

            network.addNodes({
                nodes: nodes,
                links: links,
            });
        }


        network.select(this.props.node);
        network.highlight(this.props.highlight_nodes);
    }

    render() {
        var style = {fontFamily: 'fontAwesome'};
        return <canvas style={style} ref='canvas' width={ this.props.width } height={ this.props.height } ref="canvas">
            histogram</canvas>;
    }
}

const i18n = {
    locales: ["en-US"],
    messages: {}
};

function entries(state = {
    isFetching: false,
    noMoreHits: false,
    didInvalidate: false,
    connected: false,
    total: 0,
    node: [],
    highlight_nodes: [],
    columns: [],
    errors: null,
    fields: [],
    indexes: [],
    items: [],
    searches: [],
}, action) {
    switch (action.type) {
        case CLEAR_SELECTION:
            return Object.assign({}, state, {
                node: [],
            })
        case ADD_INDEX:
            var indexes = _.concat(state.indexes, action.index);
            return Object.assign({}, state, {
                indexes: indexes,
            })
        case DELETE_INDEX:
            var indexes = _.without(state.indexes, action.index);
            return Object.assign({}, state, {
                indexes: indexes,
            })
        case DELETE_NODES:
            // we want to remove nodes, not items. So packet to node conversion should happen here, not in render / addnode
            var items = _.concat(state.items);
            _.remove(items, (p) => {
                return ( _.reduce(state.fields, (found, field) => {
                    found = found || _.find(action.nodes, (o) => {
                            return phone(fieldLocator(p.fields, field)) == o;
                        });
                    return found;
                }, false));
            });

            // todo remove highlighted node

            return Object.assign({}, state, {
                items: items
            })
        case DELETE_SEARCH:
            var searches = _.without(state.searches, action.search);

            // remove associated items from packet list
            var items = _.concat(state.items);
            _.remove(items, (p) => {
                return (p.q === action.search.q)
            });

            console.debug("DELETE_SEARCH", items);

            return Object.assign({}, state, {
                searches: searches,
                items: items
            })
        case TABLE_COLUMN_ADD:
            var columns = _.concat(state.columns, action.field);
            return Object.assign({}, state, {
                columns: columns,
            })
        case TABLE_COLUMN_REMOVE:
            var columns = _.without(state.columns, action.field);
            return Object.assign({}, state, {
                columns: columns,
            })
        case ADD_FIELD:
            var fields = _.concat(state.fields, action.field);
            return Object.assign({}, state, {
                fields: fields,
            })
        case DELETE_FIELD:
            var fields = _.without(state.fields, action.field);
            return Object.assign({}, state, {
                fields: fields,
            })
        case HIGHLIGHT_NODES:
            return Object.assign({}, state, {
                highlight_nodes: action.nodes,
            })
        case SELECT_NODES:
            var nodes = _.concat(action.nodes);
            return Object.assign({}, state, {
                node: nodes,
            })

        case SELECT_NODE:
            /*
             _.forEach(state.node, (d, i) => {
             if (
             action.node.id == state.node.id) {
             }
             if (state.node &&
             action.node &&
             action.node.id == state.node.id) {
             return state;
             }
             */
            var nodes = _.concat(state.node, action.node);

            return Object.assign({}, state, {
                node: nodes,
            })
        case ERROR:
            return Object.assign({}, state, {
                ...action
            })
        case AUTH_CONNECTED:
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false,
                ...action
            })
        case REQUEST_ITEMS:
            sock.ws.postMessage({query: action.query, index: action.index, color: action.color});

            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            })
        case RECEIVE_ITEMS:
            var searches = _.concat(state.searches, {
                q: action.items.query,
                color: action.items.color,
                count: action.items.results.hits.hits.length
            });

            // so we want nodes instead of items. we want to update the links and nodes here, not
            // in the graph code itself
            var nodes = _.concat(state.nodes, []);
            var links = [];

            var items = _.concat(state.items, []);
            _.forEach(action.items.results.hits.hits, (d, i) => {
                items.push({id: d._id, q: action.items.query, color: action.items.color, fields: d._source});
                nodes.push({id: d._id, q: action.items.query, color: action.items.color, fields: d._source, record: d});
            });

            // node -> heeft ook een package
            return Object.assign({}, state, {
                errors: null,
                nodes: nodes,
                items: items,
                searches: searches,
                isFetching: false,
                didInvalidate: false
            })
        default:
            return state
    }
}


function persistState(paths, config) {
    return (next) => (reducer, initialState, enhancer) => {
        if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
            enhancer = initialState
            initialState = {
                entries: {
                    fields: [],
                    colums: [],
                    indexes: [
                        "http://127.0.0.1:9200/",
                    ],
                }
            }
        }

        try {
            initialState.entries.fields = JSON.parse(localStorage.getItem("fields"))
        } catch (e) {
            console.warn('failed to retrieve initialize state from localstorage:', e)
        }

        try {
            initialState.entries.columns = JSON.parse(localStorage.getItem("columns"))
        } catch (e) {
            console.warn('failed to retrieve initialize state from localstorage:', e)
        }

        try {
            initialState.entries.indexes = _.concat(initialState.entries.indexes, JSON.parse(localStorage.getItem("indexes")));
        } catch (e) {
            console.warn('Failed to retrieve initialize state from localStorage:', e)
        }

        const store = next(reducer, initialState, enhancer)

        store.subscribe(() => {
            const state = store.getState();

            try {
                localStorage.setItem("columns", JSON.stringify(state.entries.columns))
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e)
            }

            try {
                localStorage.setItem("fields", JSON.stringify(state.entries.fields))
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e)
            }

            try {
                localStorage.setItem("indexes", JSON.stringify(state.entries.indexes))
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e)
            }
        })

        return store;
    }
}

function configureStore() {
    return createStore(
            combineReducers({
                entries,
                routing: routerReducer
            }),
            {
                entries: {
                    isFetching: false,
                    noMoreHits: false,
                    didInvalidate: false,
                    total: 0,
                    node: [],
                    highlight_nodes: [],
                    fields: [],
                    indexes: [],
                    items: [],
                    searches: [],
                },
            },
            compose(persistState(/*paths, config*/))
            )
}

const store = configureStore({});

function error(msg) {
    return {
        type: ERROR,
        receivedAt: Date.now(),
        errors: msg
    }
}

function authConnected(p) {
    return {
        type: AUTH_CONNECTED,
        receivedAt: Date.now(),
        ...p
    }
}

export default class FlowWS {
    constructor(url, token, dispatcher) {
        this.websocket = new WebSocket(url);

        this.websocket.onopen = function (event) {
            console.debug(event);
            store.dispatch(authConnected({connected: true}));
        }
        this.websocket.onclose = function (event) {
            console.debug(event);
            store.dispatch(authConnected({connected: false}));
        }
        this.websocket.onerror = function (event) {
            console.debug(event);
            store.dispatch(error('test'));
        }
        this.websocket.onmessage = function (event) {
            dispatcher(JSON.parse(event.data));
        }
    }

    postMessage(data) {
        this.websocket.send(
            JSON.stringify({
                event_type: 1,
                ...data,
            })
        );
    }

    close() {
        this.websocket.close();
    }
}

const sock = {
    ws: null,
    URL: 'ws://' + "127.0.0.1:8089" + '/ws',
    // URL: 'ws://' + location.host + '/ws',
    wsDispatcher: (msg) => {
        const { session } = store.getState();
        // check msg type, use correct dispacther
        if (msg.hits) {
            return store.dispatch(receiveItems(msg.hits));
        } else if (msg.error) {
            return store.dispatch(error(msg.error.message));
        } else {
            console.debug("unknown message type", msg);
        }
    },
    startWS: (session) => {
        if (!!sock.ws) {
            return;
        }

        try {
            sock.ws = new FlowWS(sock.URL, null, sock.wsDispatcher)
        } catch (e) {
            store.dispatch(error());
        }
    }
};

// timeout?
sock.startWS({});

function requestEntries(entries) {
    return {
        type: REQUEST_POSTS,
        receivedAt: Date.now()
    }
}

function receiveEntries(entries, opts = {
    from: 0
}) {
    return {
        type: RECEIVE_POSTS,
        from: opts.from,
        entries: entries,
        receivedAt: Date.now()
    }
}

function addIndex(index) {
    return {
        type: ADD_INDEX,
        receivedAt: Date.now(),
        index: index,
    }
}

function deleteIndex(index) {
    return {
        type: DELETE_INDEX,
        receivedAt: Date.now(),
        index: index,
    }
}

function addField(field) {
    return {
        type: ADD_FIELD,
        receivedAt: Date.now(),
        field: field,
    }
}

function deleteField(field) {
    return {
        type: DELETE_FIELD,
        receivedAt: Date.now(),
        field: field,
    }
}

function selectNode(opts) {
    return {
        type: SELECT_NODE,
        receivedAt: Date.now(),
        ...opts,
    }
}

function selectNodes(opts) {
    return {
        type: SELECT_NODES,
        receivedAt: Date.now(),
        ...opts,
    }
}

function deleteSearch(opts) {
    return {
        type: DELETE_SEARCH,
        receivedAt: Date.now(),
        ...opts,
    }
}


class App extends Intl {
    constructor() {
        super(i18n.locales, i18n.messages);
    }

    render() {
        return (
            <Provider store={store}>
                <Router history={history}>
                    <Route path='*' component={connect(mapStateToProps)(RootView)}/>
                </Router>
            </Provider>
        );
    }
}

class ConfigurationView extends React.Component {
    constructor(props) {
        super(props);

        this.show = this.show.bind(this);
    }

    handleAddField(e) {
        e.preventDefault();

        let field = this.refs.field.value;
        store.dispatch(addField(field));
    }

    handleDeleteField(field, e) {
        const { dispatch } = this.props;
        e.preventDefault();

        dispatch(deleteField(field));
    }

    handleAddIndex(e) {
        e.preventDefault();

        const index = this.refs.index.value;
        store.dispatch(addIndex(index));
    }

    handleDeleteIndex(e, field) {
        e.preventDefault();
        store.dispatch(deleteIndex(field));
    }

    show() {
        this.refs.dialogWithCallBacks.show();
    }

    render() {
        let fields = null;
        if (this.props.fields || []) {
            let options = _.map(this.props.fields || [], (field) => {
                return <li key={field} value={ field }>{ field }
                    <button onClick={this.handleDeleteField.bind(this, field) }>x</button>
                </li>;
            });
            fields = <div>
                <ul>{ options }</ul>
                <form onSubmit={this.handleAddField.bind(this)}>
                    <input type="text" ref="field"/>
                </form>
            </div>;
        }

        let indexes = null;
        if (this.props.indexes) {
            let options = _.map(this.props.indexes, (index) => {
                return <li key={index} value={index}>{ index }
                    <button onClick={(e) => this.handleDeleteIndex(e, index) }>x</button>
                </li>;
            });
            indexes = <div>
                <ul>{options}</ul>
            </div>;
        }

        return <SkyLight
            ref="dialogWithCallBacks"
            title="add Index">
            <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-1 col-xs-10 col-sm-8 col-md-8 col-lg-6">
                <div className="form-group">
                    <h2>Indexes</h2>
                    { indexes }
                </div>
                <div className="form-group">
                    <form onSubmit={this.handleAddIndex.bind(this)}>
                        <input type="text" ref="index"/>
                    </form>
                </div>
                <h2>Fields</h2>
                <div className="form-group">
                    { fields }
                </div>
            </div>
        </SkyLight>;
    }
}

class Searches extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editSearchValue: null,
        }
    }

    handleEditSearch(search, e) {
        e.preventDefault();
        this.setState({editSearchValue: search});
    }

    handleCancelEditSearch(search, e) {
        e.preventDefault();
        this.setState({editSearchValue: null});
    }

    handleDeleteSearch(search, e) {
        e.preventDefault();

        store.dispatch(deleteSearch({search: search}));
    }

    handleChangeSearchColorComplete(color) {
        let search = this.state.editSearchValue;
        search.color = color.hex;
        this.setState({editSearchValue: search});
    }

    render() {
        var that = this;


        let searches = _.map(this.props.searches, (search) => {
            var divStyle = {
                color: search.color,
            };

            if (that.state.editSearchValue === search) {
                return <div key={search.q} style={ divStyle }><SketchPicker color={ search.color }
                                                                            onChangeComplete={ that.handleChangeSearchColorComplete.bind(that) }/> { search.q }
                    ({search.count})
                    <button onClick={that.handleCancelEditSearch.bind(that, search) }>cancel</button>
                </div>
            } else {
                return <div key={search.q} style={ divStyle }>{ search.q } ({search.count})
                    <button onClick={that.handleEditSearch.bind(that, search) }>edit</button>
                    <button onClick={that.handleDeleteSearch.bind(that, search) }>delete</button>
                </div>
            }
        });

        return <div>{searches}</div>;
    }
}

class RootView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            docs: [],
            error: null,
            searches: [],
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
        if (this.state.error != null) {
            return <div>{this.state.error.code}</div>
        }

        var that = this;

        return <div className="container-fluid">

            <Header/>

            <div className="row">
                <div className="col-xs-9 col-sm-9">
                    <div className="row">
                        <section>
                            <button onClick={() => this.refs.configurationView.show()}>Configure</button>
                        </section>
                        <section>
                            <ErrorStatus error={this.props.errors}/>
                        </section>
                    </div>
                    <div className="row">
                        <Graph width="1600" height="800" node={this.props.node} queries={this.props.searches}
                               fields={this.props.fields} items={this.props.items}
                               highlight_nodes={this.props.highlight_nodes} className="graph"
                               handleMouseOver={ this.handleMouseOver.bind(this) }/>
                    </div>
                    <div>
                        <Histogram width="1600" height="200" node={this.props.node} queries={this.props.searches}
                                   fields={this.props.fields} items={this.props.items}
                                   highlight_nodes={this.props.highlight_nodes} className="histogram"/>
                    </div>
                </div>
                <div className="col-xs-3 col-sm-3">
                    <div className="row">
                        <b>Records:</b> { this.props.items.length }
                    </div>
                    <div className="row">
                        <Searches searches={this.props.searches}/>
                    </div>
                    <div className="row">
                        <TableView nodes={this.props.nodes} items={this.props.items} fields={this.props.fields}
                                   columns={this.props.columns} node={this.props.node}/>
                    </div>
                </div>
            </div>
            <ConfigurationView ref="configurationView" fields={this.props.fields} indexes={this.props.indexes}/>
            <footer></footer>
        </div>;
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        ...ownProps,
        noMoreHits: state.entries.noMoreHits,
        hits: state.entries.hits,
        node: state.entries.node,
        errors: state.entries.errors,
        items: state.entries.items,
        indexes: state.entries.indexes,
        fields: state.entries.fields,
        columns: state.entries.columns,
        searches: state.entries.searches,
        highlight_nodes: state.entries.highlight_nodes,
        aggs: state.entries.aggs,
        total: state.entries.total
    }
}

const history = syncHistoryWithStore(browserHistory, store);

ReactDOM.render((
    <App/>
), document.getElementById('root'))

