// http://bl.ocks.org/GerHobbelt/3071239
// http://bl.ocks.org/norrs/2883411
//
import React from 'react';
import ReactDOM from 'react-dom';
import {Table, Column, Cell} from 'fixed-data-table';
import _ from 'lodash';
import { browserHistory, Router, Route, Link } from 'react-router'
import { Provider } from 'react-redux'
import { dispatch, createStore, combineReducers, applyMiddleware } from 'redux'
import { connect } from 'react-redux'
import * as redux from 'redux'
import {Intl,FormattedDate, FormattedNumber}  from 'react-intl-es6'
import { syncHistoryWithStore, routerReducer } from 'react-router-redux'
import ReactList from 'react-list';

import ipaddr from "ipaddr.js";

import Waypoint from 'react-waypoint';


import classNames from 'classnames/bind';

// import thunk from 'redux-thunk'
//import api from '../middleware/api'
//import rootReducer from '../reducers'

import d3 from 'd3';

const REQUEST_POSTS = 'REQUEST_POSTS';
const RECEIVE_POSTS = 'RECEIVE_POSTS';
const REQUEST_PACKETS = 'REQUEST_PACKETS';
const AUTH_CONNECTED = 'AUTH_CONNECTED';
const RECEIVE_PACKETS = 'RECEIVE_PACKETS';

var Line = React.createClass({
    render: function() {
        return <line {...this.props}>{this.props.children}</line>;
    }
});

var Rectangle = React.createClass({
    render: function() {
        return <rect {...this.props}>{this.props.children}</rect>;
    }
});

class Graph extends React.Component {

  static propTypes = {
    packets: React.PropTypes.array.isRequired
  }


  constructor(props) {
    super(props);

    // this.tick =this.tick.bind(this);

    this.state = {
            nodes: [],
            links: [],
            edges: [],
            clusters: {},
            start: new Date(),
            time: 0,
            ticks: 0
    };

  }
  // http://formidable.com/blog/2015/05/21/react-d3-layouts/
  /*
    getInitialState() {
        return {
            nodes: [],
            links: [],
            edges: []
        };
    }*/
    componentDidMount() {
        console.debug("nodes", this.props);
        console.debug("state", this.state);
        console.debug("componentDidMount", this.refs["graph"]);

        this.state.graph = new myGraph(this.refs["graph"]);

        return;
        console.debug("componentdidmount", this.state);

        var edges = [];

        /*
        _.map(graph.links, function(e, index) {
            var sourceNode = graph.nodes.filter(function(n) { return n.name === e.source; })[0],
                targetNode = graph.nodes.filter(function(n) { return n.name === e.target; })[0];

            edges.push({source: sourceNode, target: targetNode, value: e.value, id: sourceNode.name + targetNode.name + e.value + index});
        });
        */

        this.state.edges = []; //edges;
        this.state.links = []; //graph.links;
        this.state.nodes = []; //graph.nodes;

        let that = this;

        this.force = d3.layout.force()
            .size([this.props.width, this.props.height])
            .nodes(that.state.nodes)
            .links(that.state.edges)
            .charge(-120)
            .linkDistance(300)
            .on('tick', this.tick)
            .start();

        /*
        this.force.on('end', function(){
            var totalTime = new Date() - that.state.start;
            console.log('Total Time:', totalTime);
            console.log('Render Time:', that.state.time);
            console.log('Ticks:', that.state.ticks);
            console.log('Average Time:', totalTime / that.state.ticks);
        });*/

        this.color = d3.scale.category20();
    }
    shouldComponentUpdate(nextProps, nextState) {
        // console.debug("shouldComponentUpdate", nextProps);
      return true; //this.props.packets.length + 500 > nextProps.packets.length;
    }
    onPortMouseOver(link) {
        console.debug(link);
    }

    onMouseOver(node) {
        console.debug(node);
    }
    onDragStart(node, e) {
        console.debug("onDragStart", node, e);
    }
    onDragStop(node, e) {
        console.debug("onDragStop", node, e);
    }
    onDrop(node, e) {
        console.debug("onDrop", node, e);
        node.x = e.client.x;
        node.y = e.client.y;
        this.force.stop().start();
    }

    colorLink(link) {
        switch (link.value) {
            case 80:
                return ("blue");
            case 389:
                return ("green");
            case 1433:
                return ("orange");
            case 3390:
                return ("pink");
            case 443:
                return ("yellow");
        }

        return ("#787878");
    }
    colorNode(node) {
        
        if (node.group == 0) {
        return ("blue");
        } else {

        }
        return ("red");
    }
    componentWillReceiveProps(nextProps) {
        console.debug("will receive props", nextProps);
    }
    componentDidUpdate(prevProps, prevState) {

        console.debug("updated", this.props.packets);
    // componentWillReceiveProps(nextProps) {
        var {graph} = this.state;

        // only new packets!
        _.forEach(this.props.packets, (d, i) => {
            graph.addNode(d.document.GetaptTelnr);
            graph.addNode(d.document.Gekozennummer);
            graph.addLink(d.document.GetaptTelnr, d.document.Gekozennummer);
        });

        this.state.graph.update();
    }
    render() {
        //console.debug("render graph");
        return <div ref="graph">loading graph</div>;

        const { nodes, links, edges } = this.state;

        var $this = this;

        // console.debug("render", this.state);
        // console.debug(this.props);
// console.debug("BLA", this.state.store.packets);

        /*
        handlePortMouseOver = function(e) {
            console.debug(e.value);
        }
        */

        // console.debug("nodes", nodes);

        var lines = _.map(edges, function (link, index) {
            var divStyle = {
                strokeWidth: 1,
                stroke: $this.colorLink(link),
            };

            return (
                    <line key={index} markerEnd="url(#markerArrow1)" onMouseOver={$this.onPortMouseOver.bind(null, link)} className="link" style={divStyle} y1={ link.source.y } y2={ link.target.y } x1={ link.source.x } x2={ link.target.x }></line>
            );
        });

        var labels = _.map(nodes, function (node, index) {
            var divStyle = {
                fill: '#000',
                stroke: '#000',
            };

            return (
                    <text key={index} className="nodeLabel" style={divStyle} y={ node.y } x={ node.x }>{node.key}</text>
            );
        });

        var circles = _.map(nodes, function (node, index) {
            var divStyle = {
                fill: $this.colorNode(node),
            };

            // console.debug(node);

            return (
                    <circle key={index} onDragStart={$this.onDragStart.bind(null, node)} onDragStop={$this.onDragStop.bind(null, node)} onDrop={$this.onDrop.bind(null, node)} onMouseOver={$this.props.handleMouseOver.bind(null, node)} style={divStyle} className="node" r="5" cx={node.x} cy={node.y}></circle>
            );
        });
        return (
                <div>
                    <svg {...this.props}>
                    {lines}
                    {circles}
                    {labels}
                    </svg>
                </div>
       );
    }
}

const i18n = {
    locales: ["en-US"],
    messages: {
    }
};


class SearchBox extends React.Component {
    constructor(props){
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = { q: props.q };
    }
    handleSubmit(e) {
        e.preventDefault();

        let q = this.refs.q.value;
        this.props.onChange(q);
    }
    componentDidUpdate(prevProps, prevState) {
        /*
        if (this.state.q !== this.props.q) {
            this.setState({q:this.props.q});
        }
        */
    }
    /*
    onChange(event) {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        let props = this.props;

        const q = event.target.value;
        this.timer = setTimeout(function() {
            props.onChange(q);
        }, 200);

        this.setState({q: q});
    }
    */
    render() {
        let loader = classNames({ 'sk-search-box__loader': true, 'sk-spinning-loader': true, 'is-hidden': !this.props.isFetching });
        return <div className="sk-search-box">
                    <form onSubmit={this.handleSubmit}>
                         <div className="sk-search-box__icon glyphicon glyphicon-search" ></div>
                         <input ref="q" className="" placeholder="query" /*onChange={this.onChange.bind(this)}*/ value={ this.state.q }/>
                        <div data-qa="loader" className={loader}></div>
                    </form>
                </div>
    }
}

class Aggregration extends React.Component {
    constructor(props){
        super(props);
    }
    render() {
        const aggs = this.props.aggs;

        const items = _.map(aggs, (item) => {
            const checked = (_.indexOf(this.props.items, item.key ) >= 0);
            return <div className="sk-item-list-option sk-item-list__item" key={ item.key }>
                        <input className="sk-item-list-option__checkbox" type="checkbox" value={ item.key } onChange={ this.props.onChange } checked={checked}/>
                        <div className="sk-item-list-option__text">{item.key}</div>
                        <div className="sk-item-list-option__count">{item.doc_count}</div>
                    </div>;
        });

        return <div className="sk-panel">
                <div className="sk-panel__header">{this.props.text}</div>
                <div className="sk-panel__content">
                    <div className="sk-item-list">{ items }</div>
                </div>
            </div>;
    }
}

class Entry extends React.Component {
    constructor(props){
        super(props);
    }
    render() {
        if (!this.props.doc) {
            return <div>no</div>;
        }

        const entry = this.props.doc._source;

        let summary = entry.Summary;
        if (this.props.doc.highlight && this.props.doc.highlight.Summary) {
            summary = this.props.doc.highlight.Summary;
        }


        return <tr key={entry.CveID} className="instance">
                <td><a href={ 'https://web.nvd.nist.gov/view/vuln/detail?vulnId=' + entry.CveID}>{ entry.CveID }</a></td>
                <td dangerouslySetInnerHTML={{ __html: summary }} ></td>
                <td className="align-right">{ (entry.Cvss ? entry.Cvss.Score : entry.Severity) }</td>
                <td className="align-right"><FormattedDate value={ entry.PublishedDatetime }></FormattedDate></td>
                <td className="align-right"><FormattedDate value={ entry.LastModifiedDatetime }></FormattedDate></td>
            </tr>       
    }
}

function entries(state = {
    isFetching: false,
    noMoreHits: false,
    didInvalidate: false,
    total: 0,
    packets: [],
}, action) {
    console.debug("entries", action, action.type);

    switch (action.type) {
        case REQUEST_PACKETS:
            console.debug("sock request packets", action);
            sock.ws.postMessage({query: action.query});
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            })
        case AUTH_CONNECTED:
            sock.startWS({});
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            })
            /*
        case REQUEST_PACKETS:
            console.debug("REQUEST PACKETS");
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            })
            */
        case RECEIVE_PACKETS:
            //
            //state.packets = _.concat(state.packets, action.packets);
            // console.debug("RECEIVING PACKETS", action.packets, state.packets.length);
            //
            // merge
            //gpackets = state.packets;
            state.packets = [];

            _.forEach(action.packets.hits.hits, (d, i) => {
                state.packets.push(d._source);
            });
            console.debug("Received packets: ", action.packets);

            return Object.assign({}, state, {
                packets: state.packets,
                isFetching: true,
                didInvalidate: false
            })
        case REQUEST_POSTS:
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            })
        case RECEIVE_POSTS:
            if (action.from == 0) {
                state.hits = [];
            } 

            let hits = action.entries.hits.hits;
            state.hits = _.concat(state.hits, hits);

            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                noMoreHits: (hits.length == 0),
                hits: state.hits,
                aggs: action.entries.aggregations,
                total: action.entries.hits.total,
                lastUpdated: action.receivedAt
            })
        default:
            return state
    }
}

function configureStore(initialState) {
    return createStore(
              combineReducers({
                entries,
                routing: routerReducer
              }),
            initialState,
            applyMiddleware()
            )
}

const store = configureStore();

function authConnected() {
    return {
        type: AUTH_CONNECTED,
        receivedAt: Date.now()
    }
}


export default class FlowWS {
  constructor(url, token, dispatcher) {
    this.websocket = new WebSocket(url);

    this.websocket.onopen = function (event) {
        console.debug(event);
    }
    this.websocket.onclose = function (event) {
        console.debug(event);
    }
    this.websocket.onerror = function (event) {
        console.debug(event);
    }
    this.websocket.onmessage = function (event) {
      dispatcher(JSON.parse(event.data));
    }
  }
  postMessage(data) {
      console.debug("postMessage", data);
    this.websocket.send(
      JSON.stringify({
        event_type: 1,
        query: data.query,
      })
    );
  }
  close() {
    this.websocket.close();
  }
}

const sock = {
  ws: null,
  URL: 'ws://127.0.0.1:8089/ws',
  wsDispatcher: (msg) => {
    const { session } = store.getState();
    console.debug("wsDispatcher", store.getState());
    return store.dispatch(receivePackets(msg));
  },
  startWS: (session) => {
    if(!!sock.ws){
        return;
      sock.ws.close();
    }

    sock.ws = new FlowWS(sock.URL, null, sock.wsDispatcher)
  }
};

store.dispatch(authConnected());

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
        entries: entries, // json.data.children.map(child => child.data),
        receivedAt: Date.now()
    }
}

function requestPackets(query) {
    return {
        type: REQUEST_PACKETS,
        receivedAt: Date.now(),
        query: query,
    }
}

function receivePackets(packets, opts = {
    from: 0
}) {
    return {
        type: RECEIVE_PACKETS,
        packets: packets, // json.data.children.map(child => child.data),
        receivedAt: Date.now()
    }
}


function fetchEntries(opts={
    from: 0,
    size: 50
}) {
    var qry = {
        aggs: {
            "Products.Vendor": {
                terms : { 
                    field : "Products.Vendor.raw",
                    size: 50
                }
            },
            "Products.Product": {
                terms : { 
                    field : "Products.Product.raw",
                    size: 50
                }
            },
            "Products.Version": {
                terms : { 
                    field : "Products.Version.raw",
                    size: 50
                }
            },
            "Cvss.AccessVector": {
                terms : { 
                    field : "Cvss.AccessVector.raw",
                    size: 50
                }
            },
            "Cvss.AccessComplexity": {
                terms : { 
                    field : "Cvss.AccessComplexity.raw",
                    size: 50
                }
            },
            "Cvss.Authentication": {
                terms : { 
                    field : "Cvss.Authentication.raw",
                    size: 50
                }
            },
            "Cvss.ConfidentialityImpact": {
                terms : { 
                    field : "Cvss.ConfidentialityImpact.raw",
                    size: 50
                }
            },
            "Cvss.IntegrityImpact": {
                terms : { 
                    field : "Cvss.IntegrityImpact.raw",
                    size: 50
                }
            },
            "Cvss.AvailabilityImpact": {
                terms : { 
                    field : "Cvss.AvailabilityImpact.raw",
                    size: 50
                }
            }
        },
        query: {
            bool: {
                must: {
                    query: {
                        match_all: {}
                    }
                }
            }
        },
        sort: {
            "PublishedDatetime": "desc"
        },
        highlight: {
                "tags_schema" : "styled",
                "pre_tags" : ["<hl1>", "<hl2>"],
                "post_tags" : ["</hl1>", "</hl2>"],
                "require_field_match": false,
                "fields" : {
                    "*": {
                        number_of_fragments: 0
                    }
                }
        }
    };

    let must = [];

    _.forEach({ 
        "Products.Vendor.raw": opts.vendors,
        "Products.Product.raw": opts.products,
        "Products.Version.raw": opts.versions,
        "Cvss.AccessVector.raw": opts.access_vectors,
        "Cvss.AccessComplexity.raw": opts.access_complexities,
        "Cvss.Authentication.raw": opts.authentications,
        "Cvss.ConfidentialityImpact.raw": opts.confidentiality_impacts,
        "Cvss.IntegrityImpact.raw": opts.integrity_impacts,
        "Cvss.AvailabilityImpact.raw": opts.availability_impacts,
    }, (items, bucket) => {
        must = _.concat(must, _.reduce(_.castArray(items || []), function (result, value) { 
                let term = {}
                term[bucket]= value;

                result.push({
                    term: term
                });
                return result;
            }, [])
        );
    });

    if (must.length > 0) {
        _.assign(qry.query.bool.must, {
            filter: { 
                bool: {
                    must : must
                }
            }
        });

    }

    if (opts.q ) {
       _.assign(qry.query.bool.must, {
            query: {
                query_string: {
                    query: opts.q
                }
            }       
        });
    }

    store.dispatch(requestEntries());

    fetch("http://api.cvedb.info/vulndb/entry/_search?from="+opts.from+"&size=" + opts.size, {
        method: "POST",
        body: JSON.stringify(qry)
    }).then(response => response.json())
      .then(json => store.dispatch(receiveEntries(json, opts)));
}

function fetchPackets(opts={
    from: 0,
    size: 50,
    query: ""
}) {
    store.dispatch(requestPackets(opts.query));
    //sock.ws.postMessage();
    /*
    store.dispatch({
        type: REQUEST_PACKETS,
        from: opts.from,
        entries: entries, // json.data.children.map(child => child.data),
        receivedAt: Date.now()
    });
    */
    // wait for messages on ws
};

class App extends Intl {
    constructor() {
        super( i18n.locales, i18n.messages );


        this.state = {
            nodes: [],
            protocols: [],
        }
    }

    render() {
        return (
              <Provider store={store}>
                  <Router history={history}>
                      <Route path='*' component={connect(mapStateToProps)(RootView)} />
                  </Router>
              </Provider>
       );
    }
}

class RootView extends React.Component {
    constructor(props){
        super(props);

        this.state = { 
            docs:[], 
            error: null, 
            currentNode: null,
        }
    }
    componentDidMount() {
    }
    onFilterChange(name, vendors, event) {
        if (event.target.checked) {
                vendors =  _.concat(vendors, event.target.value);
        } else {
                vendors = _.pull(vendors, event.target.value);
        }

        let v = {}
        v[name] = vendors;

        this.setState({ filters: { ...this.state.filters, ...v} });

        browserHistory.push({ query: { ...this.props.location.query, ...v }});
    }
    onFilterRemove(what, value, e) {
        e.preventDefault();

        if (what == 'all') {
            this.setState({ filters: {} });
            browserHistory.push({ query: {}});
        } else if (what == 'q') {
            browserHistory.push({ query: _.assign(this.props.location.query, {q: null})});
        } else {
            let x = {};
            x[what] = _.pull(_.castArray(this.props.location.query[what] || []), value);
            this.setState({filters: {...this.state.filters, ...x}});
            browserHistory.push({ query: _.assign(this.props.location.query, {...x})});
        }
    }
    loadMoreItems() {
        console.debug("loadMoreItems");
        fetchEntries({
            ...this.props.location.query, 
            from:this.props.hits.length,
            size: 50
        });
    }
    onSearchChange(q) {
        fetchPackets({ query: q});
        //alert(q);
        ////browserHistory.push({ query: _.assign(this.props.location.query, {q: q})});
        //
        //
    }
    shouldComponentUpdate(nextProps, nextState) {
        console.debug("shouldComponentUpdate", nextProps);
      return true; // this.props.packets.length + 500 < nextProps.packets.length;
    }
    componentWillReceiveProps(nextProps) {
        console.debug("componentWillReceiveProps", nextProps);
        return;
        let nodes = [];
        _.map(nextProps.packets, function(packet, index) {
            /*
            if (!_.find(nodes, (v) => {
                return (packet.src == v.ip);
            })) 
                nodes.push({ip: packet.src, host: packet.src_host || packet.src});

            if (!_.find(nodes, (v) => {
                return (packet.dst == v.ip);
            })) 
                nodes.push({ip: packet.dst, host: packet.dst_host || packet.dst});
            */

            // check if key is there already
            // so we'll have a map of keys, for the records.
            // eg the number, person, ip address. Probably this will be the unique path
            // or id.

                nodes.push({key: packet.document.Gekozennummer, data: packet.document });
        });

        // nodes = _.sortBy(nodes, function(o) { return o.host; });

        /*
        let protocols = [];
        _.map(this.props.packets, function(packet, index) {
            let port = Math.min(packet.src_port, packet.dst_port)
            if (!_.find(protocols, (v) => {
                return (port == v.port);
            })) 
                protocols.push({port: port});
        });

        protocols = _.sortBy(protocols, function(o) { return o.port; });
        */

        console.debug("componentWillReceiveProps", nodes);

        let protocols = [];
        this.setState({nodes: nodes, protocols: protocols});
    }
    colorLink(port) {
        switch (port) {
            case 80:
                return ("blue");
            case 389:
                return ("green");
            case 1433:
                return ("orange");
            case 3390:
                return ("pink");
            case 443:
                return ("yellow");
        }

        return ("#787878");
    }
    handleMouseOver(node) {
        this.setState({currentNode: node});
    }
    render() {
        console.debug("bala", this.props);

        if (this.state.error != null) {
            return <div>{this.state.error.code}</div>
        }


        var that =this;

        let protocols = _.map(this.state.protocols, (protocol) => {
            var divStyle = {
                color: that.colorLink(protocol.port),
            };

            return <div key={protocol.port} style={ divStyle }>{ protocol.port }</div>
        });

        let currentNode = null;
        
        if (this.state.currentNode) {
            currentNode = <div>
                <b>Summary</b>
                <div><b>IP</b><span>{ this.state.currentNode.ip }</span></div>
                <div><span>{ this.state.currentNode.host }</span></div>
                <div>WHOIS HERE</div>
                <div>PROTOCOLS here</div>
                <div>HOSTS here</div>
                <div>PACKETS here</div>
                </div>;
        }

        return <div>
                    <SearchBox isFetching={this.props.isFetching} total={this.props.total} q= { this.state.q } onChange={this.onSearchChange.bind(this)}/>
                    <Graph width="1000" height="1000" packets={this.props.packets} className="graph" handleMouseOver={ this.handleMouseOver.bind(this) } />
                    <div className="info">
                        <b>Packets:</b>
                        { this.props.packets.length }

                        { currentNode }
                    </div>
                    <div className="info">
                        <b>Hosts:</b>
                              { _.map(this.state.nodes, (node) => 
                                      <div key={node.ip}>{ node.host }</div>
                              )
                            }
                    </div>
                    <div className="info">
                        <b>Protocols:</b>
                        {protocols}
                    </div>
            </div>;

        var filters = [];

        let $this=this;

        const query = this.props.location.query;

        _.forEach({
            'vendors': "Vendor", 
            'versions': "Version", 
            'products': "Product", 
            'access_vectors': "AV", 
            'access_complexities': "AC",
            'authentications': "A", 
            'confidentiality_impacts': "CI",
            'integrity_impacts': "II",
            'availability_impacts': "AI"
        }, (tag, v) => {
            if (typeof(query[v])==='undefined')  {
                return;
            }

            _.each(_.castArray(query[v] || []), function (value) { 
                filters.push(<div className="sk-selected-filters-option sk-selected-filters__item selected-filter--" >
                                <div className="sk-selected-filters-option__name" ><span >{ tag }</span><span>: </span><span>{ value }</span></div>
                                <a href="" className="sk-selected-filters-option__remove-action" onClick={$this.onFilterRemove.bind($this, v, value)}>x</a>
                            </div>
                );
            });
        });

        if (query.q) {
            filters.push(<div className="sk-selected-filters-option sk-selected-filters__item selected-filter--categories" >
                            <div className="sk-selected-filters-option__name" ><span >Query</span><span>: </span><span>{ query.q }</span></div>
                            <a href="" className="sk-selected-filters-option__remove-action" onClick={$this.onFilterRemove.bind($this, "q", null)}>x</a>
                        </div>
            );
        }

        let waypoint = null;

        if (this.props.noMoreHits) {
            waypoint = <div/>;
        } else if (this.props.isFetching) {
            waypoint = <div>
                    fetching
            </div>;
        } else {
            waypoint = <div>
                    <Waypoint
                      onEnter={this.loadMoreItems}
                      threshold={2.0}
                    />
            </div>;
        }

        const hits = this.props.hits;
        const total = this.props.total;
        const aggs = this.props.aggs;
        
        return <div className="sk-layout sk-layout__size-l">
                <div className="sk-layout__top-bar sk-top-bar">
                    <div className="sk-top-bar__content">
                    <div className="my-logo">
                        cvedb.info
                    </div>
                    <SearchBox isFetching={this.props.isFetching} total={this.props.total} q= { this.state.q } onChange={this.onSearchChange.bind(this)}/>
                    </div>
                </div>
                <div className="sk-layout__body">
                    <div className="sk-layout__filters">
                        <div className="sk-hierarchical-menu-list filter--categories">
                        <Aggregration 
                                aggs={ aggs["Products.Vendor"].buckets } 
                                items={this.state.filters.vendors}
                                onChange={this.onFilterChange.bind(this, "vendors", this.state.filters.vendors )} 
                                text = "Vendor"
                        />
                        <Aggregration 
                                aggs={ aggs["Products.Product"].buckets } 
                                items={this.state.filters.products}
                                onChange={this.onFilterChange.bind(this, "products", this.state.filters.products)} 
                                text = "Product"
                        />
                        <Aggregration 
                                aggs={ aggs["Products.Version"].buckets } 
                                items={this.state.filters.versions}
                                onChange={this.onFilterChange.bind(this, "versions", this.state.filters.versions)} 
                                text = "Version"
                        />
                        <Aggregration 
                                aggs={ aggs["Cvss.AccessVector"].buckets } 
                                items={this.state.filters.access_vectors}
                                onChange={this.onFilterChange.bind(this, "access_vectors", this.state.filters.access_vectors )} 
                                text = "Access Vector"
                        />
                        <Aggregration 
                                aggs={ aggs["Cvss.AccessComplexity"].buckets } 
                                items={this.state.filters.access_complexities}
                                onChange={this.onFilterChange.bind(this, "access_complexities", this.state.filters.access_complexities)} 
                                text = "Access Complexity"
                        />
                        <Aggregration 
                                aggs={ aggs["Cvss.Authentication"].buckets } 
                                items={this.state.filters.authentications}
                                onChange={this.onFilterChange.bind(this, "authentications", this.state.filters.authentications)} 
                                text = "Authentication"
                        />
                        <Aggregration 
                                aggs={ aggs["Cvss.ConfidentialityImpact"].buckets } 
                                items={this.state.filters.confidentiality_impacts}
                                onChange={this.onFilterChange.bind(this, "confidentiality_impacts", this.state.filters.confidentiality_impacts)} 
                                text = "Confidentiality Impacts"
                        />
                        <Aggregration 
                                aggs={ aggs["Cvss.IntegrityImpact"].buckets } 
                                items={this.state.filters.integrity_impacts}
                                onChange={this.onFilterChange.bind(this, "integrity_impacts", this.state.filters.integrity_impacts)}
                                text = "Integrity Impacts"
                        />
                        <Aggregration 
                                aggs={ aggs["Cvss.AvailabilityImpact"].buckets } 
                                items={this.state.filters.availability_impacts}
                                onChange={this.onFilterChange.bind(this, "availability_impacts", this.state.filters.availability_impacts )} 
                                text = "Availability Impacts"
                        />
                        </div>
                    </div>
                    <div className="sk-layout__results sk-results-list">
                        <div className="sk-results-list__action-bar sk-action-bar">
                            <div className="sk-action-bar__info">
                                <div className="sk-hits-stats">
                                    <div className="sk-hits-stats__info"><FormattedNumber value={total} /> results found</div>
                                    </div>
                                    
                                   <div className="sk-select" ><select ><option value="_score_desc" >Relevance</option><option value="update_desc" >Latest update</option><option value="update_asc" > Earliest update</option></select></div></div>
                                    <div className="sk-action-bar__filters" >
                                        <div className="sk-selected-filters" >
                                            { filters }
                                        <div>
                                    </div>
                                    <div className="sk-reset-filters" ><a href="" className="sk-reset-filters__reset" onClick={$this.onFilterRemove.bind($this, "all", null)}>Clear all filters</a></div></div></div></div>
                        <table className="sk-table">
                            <thead>
                                <tr>
                                    <th>CVE ID</th>
                                    <th>Summary</th>
                                    <th>Score</th>
                                    <th>Last Updated</th>
                                    <th>Last Modified</th>
                                </tr>
                            </thead>
                            <tbody>
                              { _.map(hits, (hit) => 
                                <Entry doc={hit} />
                              )
                            }
                            </tbody>
                            <tfoot>
                                <tr>
                                <td colSpan="5">{ waypoint }</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                </div>
                <div className="clear"/>
                <footer>
                    <p>Made with <i className="glyphicon glyphicon-heart"></i> by <a href="http://blog.dutchcoders.io/" title="Dutch Coders">Dutch Coders</a> (<a href="http://twitter.com/dutchcoders" title="Dutch Coders">@dutchcoders</a>)
                    </p>
                </footer>
            </div>
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
          ...ownProps,
          isFetching: state.entries.isFetching,
          noMoreHits: state.entries.noMoreHits,
          hits: state.entries.hits,
          packets: state.entries.packets,
          packets2: state.packets,
          aggs: state.entries.aggs,
          total: state.entries.total
    }
}

const history = syncHistoryWithStore(browserHistory, store);

history.listen(location => fetchEntries({...location.query, from: 0, size: 50}));

ReactDOM.render((
  <App/>
), document.getElementById('root'))

function myGraph(el) {
    // Add and remove elements on the graph object
    this.addNode = function (id) {
        nodes.push({"id":id});
        // update();
    }

    this.removeNode = function (id) {
        var i = 0;
        var n = findNode(id);
        while (i < links.length) {
            if ((links[i]['source'] === n)||(links[i]['target'] == n)) links.splice(i,1);
            else i++;
        }
        var index = findNodeIndex(id);
        if(index !== undefined) {
            nodes.splice(index, 1);
            //update();
        }
    }

    this.addLink = function (sourceId, targetId) {
        var sourceNode = findNode(sourceId);
        var targetNode = findNode(targetId);

        if((sourceNode !== undefined) && (targetNode !== undefined)) {
            links.push({"source": sourceNode, "target": targetNode});
            //update();
        }
    }

    var findNode = function (id) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].id === id)
                return nodes[i]
        };
    }

    var findNodeIndex = function (id) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].id === id)
                return i
        };
    }

    // set up the D3 visualisation in the specified element
    var w = 800, // $(el).innerWidth(),
        h = 800; // $(el).innerHeight();

    var vis = this.vis = d3.select(el).append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    var force = d3.layout.force()
        .gravity(.05)
        .distance(100)
        .charge(-100)
        .size([w, h]);

    var nodes = force.nodes(),
        links = force.links();

    this.update = function () {
        var link = vis.selectAll("line.link")
            .data(links, function(d) { return d.source.id + "-" + d.target.id; });

        link.enter().insert("line")
            .attr("strokeWidth", "1")
            .attr("stroke", "#eee")
            .attr("class", "link");

        link.exit().remove();

        var node = vis.selectAll("g.node")
            .data(nodes, function(d) { return d.id;});

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        nodeEnter.append("circle")
            .attr("class", "node")
            // .attr("xlink:href", "https://d3nwyuy0nl342s.cloudfront.net/images/icons/public.png")
            .attr("r", "5")
            .attr("x", "-8px")
            .attr("y", "-8px")
            .attr("width", "16px")
            .attr("height", "16px");

        nodeEnter.append("text")
            .attr("class", "nodetext")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(function(d) {return d.id});

        node.exit().remove();

        force.on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        });

        // Restart the force layout.
        force.start();
    }

    // Make it all go
    // update();
}

/*
var i=document.createElement("div");
i.id = "graph";
i.width = "1600";
i.height = "1600";
document.body.appendChild(i);

var graph = new myGraph("#graph");
*/


// You can do this from the console as much as you like...
/*
graph.addNode("Cause");
graph.addNode("Effect");
graph.addLink("Cause", "Effect");
graph.addNode("A");
graph.addNode("B");
graph.addLink("A", "B");
*/

/*
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

//d3.json("miserables.json", function(error, graph) {
var graph = {
    links: [],
    nodes: [],
};

  if (error) throw error;

  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", 5)
      .attr("fill", function(d) { return color(d.group); })
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

  node.append("title")
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
*/
