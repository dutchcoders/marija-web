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



var network = {
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
	canvas
	    .call(d3.drag()
	    .container(canvas.node())
		    .subject(this.dragsubject.bind(this))
		    .on("start", this.dragstarted.bind(this))
		    .on("drag", this.dragged.bind(this))
		    .on("end", this.dragended.bind(this)));

	this.simulation = d3.forceSimulation()
	    .stop()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody()) // .strength(-10).distanceMax(300))
            //.force("center", d3.forceCenter(width / 2, height / 2))
.force("center",d3.forceCenter())
            .force("vertical", d3.forceY().strength(0.018))
            .force("horizontal", d3.forceX().strength(0.006))

//	    .force("link",d3.forceLink().id((d)=>{return d.id}))
//	    .force("change",d3.forceManyBody())
//	    .force("center",d3.forceCenter())
	    // .force("collide",d3.forceCollide().radius((d)=>{return d.force;}).iterations(2))
	    .on("tick",()=>{
		this.ticked();
	    });

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
		    // increase number of connections, and radius
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

	    // Add new data to old data
	    // this.graph.nodes = this.graph.nodes.concat(graph.nodes);
	    this.graph.links = this.graph.links.concat(graph.links);

	    // Feed to simulation
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

// for each part
	    this.context.moveTo(d.x + d.r, d.y);
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

var lastId = 9;

var getRandomColor = function(q){
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var addNode = function(n, l){
  var newGraph = {
    nodes: n,
    links: l
  };
  console.log(newGraph);
  network.render(newGraph);
};



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

      //  this.state.graph = new myGraph(this.refs["graph"]);

      network.setup(this.refs["graph"]);
  
  //$("#addNode").click(addNode);
//});
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

	addNode(nodes, links);

        //this.state.graph.update();
    }
    render() {
        //console.debug("render graph");
        return <div ref="graph"></div>;

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

class Results extends React.Component {
    constructor(props){
        super(props);

    }
    render() {
        //console.debug("render graph");
        return <div>results</div>;
    }
}


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
    searches: [],
}, action) {
    switch (action.type) {
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

            console.debug("Received packets: ", action.packets);

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
      console.debug("postMessage", data);
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
console.debug("receivePackets", packets);
    return {
        type: RECEIVE_PACKETS,
        packets: packets, // json.data.children.map(child => child.data),
        receivedAt: Date.now()
    }
}

function fetchPackets(opts={
    from: 0,
    size: 50,
    query: "",
    color: "", 
}) {
console.debug("fetchPackets", opts);

    store.dispatch(requestPackets(opts));
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
	    searches: [],
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
/*
        fetchEntries({
            ...this.props.location.query, 
            from:this.props.hits.length,
            size: 50
        });
*/
    }
    onSearchChange(q) {
	// add query to state
var color = getRandomColor() ;
        fetchPackets({ query: q, color: color });
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

	let results = <Results className="results" />;

        return <div className="container-fluid">
		    <div className="row">
			<div className="col-xs-9 col-sm-9">
			    <div className="row">
				<SearchBox isFetching={this.props.isFetching} total={this.props.total} q= { this.state.q } onChange={this.onSearchChange.bind(this)}/>
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
			    { results }
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
console.debug("mapStateToProps", state);
    return {
          ...ownProps,
          isFetching: state.entries.isFetching,
          noMoreHits: state.entries.noMoreHits,
          hits: state.entries.hits,
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

function myGraph(el) {
var links = [];
var nodes = [];

    // Add and remove elements on the graph object
    this.addNode = function (id, o) {
        if (findNode(id) !== undefined)
	    return;

        nodes.push({"id":id, data: o});
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

	if((sourceNode === undefined) || (targetNode === undefined)) {
	    return;
	}

        for (var i=0; i < links.length; i++) {
            if (links[i].source === sourceNode && 
			links[i].target === targetNode )
		return;
        };

	links.push({"source": sourceNode, "target": targetNode});
    }
//good sample (canvas):
    // https://plnkr.co/edit/iadT0ikcpKELU0eaE9f6?p=preview

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
    var width = 1000, // $(el).innerWidth(),
        height = 1000; // $(el).innerHeight();


    // unmount
    // d3.select("svg").remove(); 

    console.debug(el);

/*
    var vis = this.vis = d3.select(el)
        .attr("width", width)
        .attr("height", height);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
	.stop()
        .force("link", d3.forceLink().id(function(d) { d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));
	.on("tick", () => {
	    link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	    node
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });
	});

*/

    /*

    var force = d3.layout.force()
        .gravity(.05)
        .distance(100)
        .charge(-100)
        .size([w, h]);

    var nodes = force.nodes(),
        links = force.links();
        */

    this.update = function (nodes, links) {
/*
        var link = vis.selectAll("line.link")
            .data(links, function(d) { return d.source.id + "-" + d.target.id; });

        link.enter().insert("line")
            .attr("strokeWidth", "1")
            .attr("stroke", "#ccc")
            .attr("class", "link");

        link.exit().remove();

        var node = vis.selectAll("g.node")
            .data(nodes, function(d) { return d.id;});

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
		    .on("start", dragstarted)
		    .on("drag", dragged)
		    .on("end", dragended));

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
*/

/*
        force.on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

*/
	console.debug("links", vis.append("g")
	    .attr("class", "links")
 	    .selectAll("line")._groups);

	var link = vis.append("g")
	    .attr("class", "links")
 	    .selectAll("line")
	    .data(links, function(d) { return d.source.id + "-" + d.target.id; })
	    .enter().append("line")
	    .attr("stroke-width", function(d) { return 1; /*Math.sqrt(d.value); */ })
            .attr("strokeWidth", "1")
            .attr("stroke", "#ccc")
            .attr("class", "link");

	link.append("title")
            .attr("class", "nodetext")
            .attr("dx", 12)
            .attr("dy", ".35em")
	    .text(function(d) { return "TEST"; /* + d.source.id + "-" + d.target.id; */ });

	vis.selectAll("line").exit().remove();

	var node = vis.append("g")
	    .attr("class", "nodes")
	    .selectAll("circle")
	    .data(nodes, function(d) { console.debug(d.id); return d.id;})
	    .enter()
	    .append("circle")
	    .attr("r", 5)
	    .attr("fill",  function(d) { 
		console.debug(d);
		switch (d.data.q) {
		    case "willem":
			return "red";
		    case "bas":
			return "blue";
		    default:
			return "green";
		}
	    })
	.call(d3.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended));

	node.append("title")
            .attr("class", "nodetext")
            .attr("dx", 12)
            .attr("dy", ".35em")
	    .text(function(d) { return "Test" /*+ d.id*/; });

/*
        node.append("text")
            .attr("class", "nodetext")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(function(d) {return d.id});
*/

	vis.selectAll("circle").exit().remove();

	console.debug("d3", d3);
	console.debug("vis", vis);

	simulation
	    .nodes(nodes);

	simulation.force("link")
	    .links(links);

	  simulation.restart();

        // Restart the force layout.
        //force.start();
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
