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

import * as d3 from "d3";
// import { brush } from 'd3'

const REQUEST_POSTS = 'REQUEST_POSTS';
const RECEIVE_POSTS = 'RECEIVE_POSTS';
const SELECT_NODE = 'SELECT_NODE';
const CLEAR_SELECTION = 'CLEAR_SELECTION';
const REQUEST_PACKETS = 'REQUEST_PACKETS';
const AUTH_CONNECTED = 'AUTH_CONNECTED';
const RECEIVE_PACKETS = 'RECEIVE_PACKETS';

var network = {
    onmouseover: function(n) {
    },
    // Start data
    graph: {
	"nodes":[
	],
	"links":[
	]
    },
    simulation: {},
    // Graph design
    width: 1600,
    height: 800,
    lines: {
	stroke: {
	    color: "#ccc",
	    thickness: 2
	}
    },
    nodes: {
	fill: {
	    color: "#333"
	},
	stroke: {
	    color: "#fff",
	    thickness: 3
	},
	sizeRange: [8,30]
    },
    setup: function(el){
	var i=document.createElement("canvas");
	i.id = "networkCanvas";
	i.width = "1600";
	i.height = "800";
	el.appendChild(i);

	this.canvas = document.getElementById('networkCanvas');
	this.context = this.canvas.getContext('2d');

	var width = 1600, height=800;

	var canvas = d3.select(this.canvas);

	canvas.on("mousedown", this.mouseclick.bind(this))
	    .call(d3.drag()
		    .container(canvas.node())
		    .subject(this.dragsubject.bind(this))
		    .on("start", this.dragstarted.bind(this))
		    .on("drag", this.dragged.bind(this))
		    .on("end", this.dragended.bind(this))
		);

	this.simulation = d3.forceSimulation()
	    .stop()
	    .force("link", d3.forceLink().id(function(d) { return d.id; }))
	    .force("charge", d3.forceManyBody()) // .strength(-10).distanceMax(300))
	    .force("center",d3.forceCenter())
	    .force("vertical", d3.forceY().strength(0.018))
	    .force("horizontal", d3.forceX().strength(0.006))
	    .on("tick",()=>{
		this.ticked();
	    });

	    // have a mouse move as well

/*
	    var zoom = d3.behavior.zoom()
		.translate([0, 0])
		.scale(1)
		.scaleExtent([1, 8])
		.on("zoom", zoomed);<Paste>

	    */
	    this.render(this.graph);
	},
    forceScale: function(node){
	var scale = d3.scaleLog().domain(this.nodes.sizeRange).range(this.nodes.sizeRange.slice().reverse());
	return node.r + scale(node.r);
    },
    render: function(graph){
	var countExtent = d3.extent(graph.nodes,function(d){return d.connections}),
	radiusScale = d3.scalePow().exponent(2).domain(countExtent).range(this.nodes.sizeRange);

	var that = this;
	_.each(graph.nodes, function(node){
	    var n = _.find(that.graph.nodes, {id: node.id});
	    if (n ) {
		n.connections++;

		n.r = radiusScale(n.connections);
		n.force = that.forceScale(n);

		// todo(nl5887): add to node that result multiple searches, eg create multiple parts
		return;
	    }

	    node.r = radiusScale(node.connections);
	    node.force = that.forceScale(node);
	    that.graph.nodes.push(node);
	});

	this.graph.links = this.graph.links.concat(graph.links);

	this.simulation
	    .nodes(this.graph.nodes);

	this.simulation.force("link")
	    .links(this.graph.links);

	this.simulation.alpha(0.3).restart();
    },
    ticked: function(){
	if(!this.graph) {
	    return false;
	}

	this.context.clearRect(0,0,this.width,this.height);
	this.context.save();

	this.context.translate(this.width / 2, this.height / 2);

	this.context.beginPath();

	this.graph.links.forEach((d)=>{
	    this.context.moveTo(d.source.x, d.source.y);
	    this.context.lineTo(d.target.x, d.target.y);
	});

	this.context.strokeStyle = this.lines.stroke.color;
	this.context.lineWidth = this.lines.stroke.thickness;

	this.context.stroke();

	this.graph.nodes.forEach((d)=>{
	    this.context.beginPath();

	    this.context.moveTo(d.x + d.r, d.y);

	    // for each different query, show a part. This will show that the edge
	    //  has been found in multiple queries.
	    this.context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);

	    this.context.fillStyle = d.color;
	    this.context.strokeStyle =this.nodes.stroke.color;
	    this.context.lineWidth = this.nodes.stroke.thickness;
	    this.context.fill();
	    this.context.stroke();

	    this.context.fillStyle = d.color;
	    this.context.fillText(d.id,d.x + 5,d.y - 5);
	});

	this.context.restore();
    },
    mouseclick: function() {
	var subject = this.simulation.find(d3.event.x - (this.width / 2), d3.event.y - (this.height / 2), 20);
	if (subject === undefined) {
	    return;
	}

	this.onmouseclick(subject);
    },
    dragstarted: function() {
	if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
	d3.event.subject.fx = d3.event.subject.x;
	d3.event.subject.fy = d3.event.subject.y;
    },
    dragged: function() {
	d3.event.subject.fx = d3.event.x;
	d3.event.subject.fy = d3.event.y;
    },
    dragended: function() {
	if (!d3.event.active) this.simulation.alphaTarget(0);
	d3.event.subject.fx = null;
	d3.event.subject.fy = null;
    },
    dragsubject: function() {
	// adjust
	return this.simulation.find(d3.event.x - (this.width / 2), d3.event.y - (this.height / 2), 20);
    },
    mousemoved: function() {
    },
    drawLink: function(d) {
	context.moveTo(d.source.x, d.source.y);
	context.lineTo(d.target.x, d.target.y);
    },
    drawNode: function(d) {
	context.moveTo(d.x + 3, d.y);
	context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
    }
};

var getRandomColor = function(q){
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

class Graph extends React.Component {

  static propTypes = {
    packets: React.PropTypes.array.isRequired
  }

  constructor(props) {
    super(props);

    this.state = {
	nodes: [],
	links: [],
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
  getInitialState() {
      return {
	  nodes: [],
	  links: [],
	  edges: []
      };
  }
  componentDidMount() {
      var $this = this;

      network.onmouseclick = this.onMouseClick.bind(this);

      network.setup(this.refs["graph"]);
  }
  shouldComponentUpdate(nextProps, nextState) {
      return true; 
    }
    onPortMouseOver(link) {
    }
    onMouseClick(node) {
	store.dispatch(selectNode({node:node}));
    }
    onMouseOver(node) {
	// store.dispatch(selectNode({node:node}));
    }
    componentWillReceiveProps(nextProps) {
        console.debug("will receive props", nextProps);
    }
    componentDidUpdate(prevProps, prevState) {

        console.debug("updated", this.props.packets);
    // componentWillReceiveProps(nextProps) {
        var {graph} = this.state;

	var nodes = [];
	var links = [];

		// only new packets!
	_.forEach(this.props.packets, (d, i) => {
	    nodes.push({
		id: d.fields.document.GetaptTelnr,
		query: d.q,
		name: d.fields.document.GetaptTelnr,
		color: d.color,
		connections: 1
	    });

	    nodes.push({
		id: d.fields.document.Gekozennummer,
		query: d.q,
		name: d.fields.document.Gekozennummer,
		color: d.color,
		connections: 1
	    });

	    links.push({
		source: d.fields.document.GetaptTelnr,
		target: d.fields.document.Gekozennummer
	    });
	});

	network.render({
	    nodes: nodes,
	    links: links
	});
    }
    render() {
        return <div ref="graph"></div>;
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
	this.props.onSubmit(q);
    }
    componentDidUpdate(prevProps, prevState) {
    }
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

function entries(state = {
    isFetching: false,
    noMoreHits: false,
    didInvalidate: false,
    total: 0,
    node: [],
    packets: [],
    searches: [],
}, action) {
    switch (action.type) {
	case CLEAR_SELECTION:
	    return Object.assign({}, state, {
		node: [],
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
	case REQUEST_PACKETS:
	    sock.ws.postMessage({query: action.query, color: action.color});

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
	case RECEIVE_PACKETS:
	    state.searches.push({q: action.packets.query, color: action.packets.color, count: action.packets.results.hits.hits.length});

	    state.packets = _.concat(state.packets, []);
	    _.forEach(action.packets.results.hits.hits, (d, i) => {
		state.packets.push({ q: action.packets.query, color: action.packets.color, fields: d._source});
	    });

	    return Object.assign({}, state, {
		packets: state.packets,
		searches: state.searches,
		isFetching: false,
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

// connect
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

function clearSelection(opts) {
    return {
        type: CLEAR_SELECTION,
        receivedAt: Date.now(),
	...opts,
    }
}

function selectNode(opts) {
    return {
        type: SELECT_NODE,
        receivedAt: Date.now(),
	...opts,
    }
}

function fetchPackets(opts={
    from: 0,
    size: 50,
    query: "",
    color: "", 
}) {
    store.dispatch(requestPackets(opts));
};

function requestPackets(opts) {
    return {
        type: REQUEST_PACKETS,
        receivedAt: Date.now(),
	...opts,
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
	    searches: [],
            currentNode: null,
        }
    }
    componentDidMount() {
    }
    loadMoreItems() {
    }
    onSearchSubmit(q) {
        fetchPackets({ query: q, color: getRandomColor() });
    }
    shouldComponentUpdate(nextProps, nextState) {
        console.debug("shouldComponentUpdate", nextProps);
      return true; // this.props.packets.length + 500 < nextProps.packets.length;
    }
    componentWillReceiveProps(nextProps) {
        console.debug("componentWillReceiveProps", nextProps);
    }
    handleMouseOver(node) {
        this.setState({currentNode: node});
    }
    handleClearSelection() {
	store.dispatch(clearSelection());
    }
    render() {
        if (this.state.error != null) {
            return <div>{this.state.error.code}</div>
        }

        var that =this;

	console.debug("searches", this.props);

        let searches = _.map(this.props.searches, (search) => {
            var divStyle = {
                color: search.color,
            };

            return <div style={ divStyle }>{ search.q } ({search.count})</div>
        });

	let nodes = null;

	if (this.props.node) {
	    nodes = _.map(this.props.node, (node) => {
		return  _.map(this.props.packets, (packet) => {
		    if (packet.fields.document.GetaptTelnr!=node.id &&
			    packet.fields.document.Gekozennummer!=node.id) {
			return;
		    }
		    return <div> 
			    <div>
				<span>{ packet.fields.document.GetaptTelnr }</span> -&gt; <span>{ packet.fields.document.Gekozennummer }</span>	
			    </div>
			    <div>{ packet.fields.document.BEVINDINGEN }</div>
			    <div><b>{ packet.fields.document.GETAPT_PERSOON }</b></div>
			    <div>{ packet.fields.document.date }</div>
			</div>;
		});
	    });
	}

        return <div className="container-fluid">
		    <div className="row">
			<div className="col-xs-9 col-sm-9">
			    <div className="row">
				<SearchBox isFetching={this.props.isFetching} total={this.props.total} q= { this.state.q } onSubmit={this.onSearchSubmit.bind(this)}/>
			    </div>
			    <div className="row">
				<Graph width="1600" height="800" packets={this.props.packets} className="graph" handleMouseOver={ this.handleMouseOver.bind(this) } />
			    </div>
			</div>
			<div className="col-xs-3 col-sm-3">
			    <div className="row">
			    <b>Records:</b> { this.props.packets.length }
			    </div>
			    <div className="row">
			    { searches }
			    </div>
			    <div className="row">
			    </div>
			    <div className="row">
			    <button onClick={this.handleClearSelection.bind(this)}>Clear</button>
			    {nodes}
			    </div>
			</div>
		    </div>
		    <div className="row">
                    </div>
		    <div className="row">
                    </div>
                    <div className="row">
                    </div>
		    <footer>footer</footer>
            </div>;
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
          ...ownProps,
          isFetching: state.entries.isFetching,
          noMoreHits: state.entries.noMoreHits,
          hits: state.entries.hits,
          node: state.entries.node,
          packets: state.entries.packets,
	  searches: state.entries.searches,
          aggs: state.entries.aggs,
          total: state.entries.total
    }
}

const history = syncHistoryWithStore(browserHistory, store);

// history.listen(location => fetchEntries({...location.query, from: 0, size: 50}));

ReactDOM.render((
  <App/>
), document.getElementById('root'))

