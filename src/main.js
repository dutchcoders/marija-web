// http://bl.ocks.org/GerHobbelt/3071239
// http://bl.ocks.org/norrs/2883411
//
//
//
// change color, and icon of query
// change individual node (and name)
// load and save workspace
// tooltip
// aliases
// meerdere indexen tegelijk zoeken
//
import React from 'react';
import ReactDOM from 'react-dom';
import {Table, Column, Cell} from 'fixed-data-table';
import _ from 'lodash';
import { browserHistory, Router, Route, Link } from 'react-router'
import { Provider } from 'react-redux'
import { dispatch, compose, createStore, combineReducers, applyMiddleware } from 'redux'
import { connect } from 'react-redux'
import * as redux from 'redux'
import {Intl,FormattedDate, FormattedNumber}  from 'react-intl-es6'
import { syncHistoryWithStore, routerReducer } from 'react-router-redux'
import ReactList from 'react-list';

import SkyLight from 'react-skylight';
import { SketchPicker } from 'react-color';

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
const SELECT_NODES = 'SELECT_NODES';
const HIGHLIGHT_NODES = 'HIGHLIGHT_NODES';
const CLEAR_SELECTION = 'CLEAR_SELECTION';
const ADD_FIELD = 'ADD_FIELD';
const TABLE_COLUMN_ADD = 'TABLE_COLUMN_ADD';
const TABLE_COLUMN_REMOVE = 'TABLE_COLUMN_REMOVE';
const DELETE_FIELD = 'DELETE_FIELD';
const ADD_INDEX = 'ADD_INDEX';
const DELETE_INDEX = 'DELETE_INDEX';
const REQUEST_PACKETS = 'REQUEST_PACKETS';
const AUTH_CONNECTED = 'AUTH_CONNECTED';
const ERROR = 'ERROR';
const RECEIVE_PACKETS = 'RECEIVE_PACKETS';

var network = {
    // Start data
    graph: {
	"nodes":[
	],
	"links":[
	],
	"highlight_nodes": [
	],
        selection: null,
        selectedNodes: [],
        tooltip: null,
        transform: d3.zoomIdentity,
        queries: []
    },
    simulation: {},
    // Graph design
    width: 1600,
    height: 800,
    lines: {
	stroke: {
	    color: "#ccc",
	    thickness: 1
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
    zoomed: function() {
  this.graph.transform = d3.event.transform;
 // this.render();
		this.ticked();
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

	canvas.on("mousedown", this.mousedown.bind(this))
            .on("mousemove", this.mousemove.bind(this))
            .on("mouseup", this.mouseup.bind(this))
            .call(d3.drag()
                    .filter(() => {
                        // console.debug("drag filter", d3.event);
                        return d3.event.altKey;
                    })
		    .subject(this.dragsubject.bind(this))
		    .on("start", this.dragstarted.bind(this))
		    .on("drag", this.dragged.bind(this))
		    .on("end", this.dragended.bind(this))
            )
            .call(d3.zoom()
                    .filter(() => {
                        // console.debug("zoom filter", d3.event);
                        return d3.event.altKey;
                    })
                    .scaleExtent([1 / 2, 8])
                    .on("zoom", this.zoomed.bind(this))
            )
            .on("start.render drag.render end.render", this.ticked);

	this.simulation = d3.forceSimulation()
	    .stop()
	    .force("link", d3.forceLink().id(function(d) { return d.id; }))
	    .force("charge", d3.forceManyBody()) // .strength(-10).distanceMax(300))
	    .force("center",d3.forceCenter(this.width / 2, this.height / 2))
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
    select: function(nodes){
        this.graph.selectedNodes = nodes;
        this.ticked();
    },
    highlight: function(nodes){
	this.graph.highlight_nodes = nodes;
        this.ticked();
    },
    render: function(graph){
	var countExtent = d3.extent(graph.nodes,function(d){return d.connections}),
	radiusScale = d3.scalePow().exponent(2).domain(countExtent).range(this.nodes.sizeRange);

        var newNodes = false;

	var that = this;
	_.each(graph.nodes, function(node){
	    var n = _.find(that.graph.nodes, {id: node.id});
	    if (n ) {
		n.connections++;

		n.r = radiusScale(n.connections);
		//n.force = that.forceScale(n);

                n.query.push(node.query);
                n.query = _.uniq(n.query);

                n.color.push(node.color);
                n.color = _.uniq(n.color);

		// todo(nl5887): add to node that result multiple searches, eg create multiple parts
		return;
	    }

	    node.r = radiusScale(node.connections);
            node.color = [node.color];
            node.query = [node.query];

            //node.x = that.width / 2;
            //node.y = that.height / 2;

            //node.cx = that.width / 2;
            //node.cy = that.height / 2;
	    //node.force = that.forceScale(node);
	    that.graph.nodes.push(node);

            newNodes = true;
	});

	this.graph.links = this.graph.links.concat(graph.links);

        if (!newNodes) 
            return;

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

        // console.debug(this.graph.queries);

	this.context.save();
	this.context.clearRect(0,0,this.width,this.height);

  //this.context.translate(this.graph.transform.x, this.graph.transform.y);

this.context.translate((0) + this.graph.transform.x, (0) + this.graph.transform.y);
//this.context.translate((this.width / 2) + this.graph.transform.x, (this.height / 2) + this.graph.transform.y);

  this.context.scale(this.graph.transform.k, this.graph.transform.k);
        if (this.graph.selection) {
            this.context.beginPath();
            this.context.strokeStyle = '#000000';
            this.context.lineWidth = 1;
            this.context.setLineDash([6]);
            this.context.rect(this.graph.selection.x1, this.graph.selection.y1, this.graph.selection.x2 - this.graph.selection.x1, this.graph.selection.y2 - this.graph.selection.y1);
            this.context.stroke();
        }

	this.context.beginPath();

	this.graph.links.forEach((d)=>{
	    this.context.moveTo(d.source.x, d.source.y);
	    this.context.lineTo(d.target.x, d.target.y);
	});

	this.context.strokeStyle = this.lines.stroke.color;
	this.context.lineWidth = this.lines.stroke.thickness;

	this.context.stroke();

	this.graph.nodes.forEach((d)=>{

	    this.context.moveTo(d.x + d.r, d.y);

            // for each different query, show a part. This will show that the edge
            //  has been found in multiple queries.
            for (var i=0; i<d.query.length; i++) {
                // find color

                this.context.beginPath();
                this.context.arc(d.x, d.y, d.r, 2 * Math.PI * (i / d.color.length), 2 * Math.PI * ( (i + 1) / d.color.length));

                var color = '#000'; // d.searches[i];

                for (var j = 0; j < this.graph.queries.length; j++) {
                    if (this.graph.queries[j].q === d.query[i]) 
                        color = this.graph.queries[j].color;
                }
                /*
                if ( _.findIndex(this.graph.highlight_nodes, function(o) {
                    return o == d.id
                })!=-1) {
                    color = "black";
                }*/

                this.context.fillStyle = color;
                this.context.fill();

                if (_.includes(this.graph.selectedNodes, d)) {
                    this.context.strokeStyle = '#993833';
                    this.context.lineWidth = this.nodes.stroke.thickness;
                    this.context.stroke();
                }

            }
            /*

                this.context.strokeStyle =this.nodes.stroke.color;
                this.context.lineWidth = this.nodes.stroke.thickness;
                this.context.stroke();
                */

            //this.context.fillStyle = '#000'; //d.color[0];
	    //this.context.fillText(d.id,d.x + 5,d.y - 5);
	});

        if (this.graph.tooltip) {
            console.debug(this.graph.tooltip);
            this.context.fillStyle = '#000'; //d.color[0];
	    this.context.fillText( this.graph.tooltip.node.id, this.graph.tooltip.x + 5, this.graph.tooltip.y - 5);
        }

	this.context.restore();
    },
    mousedown: function() {
          var x = this.graph.transform.invertX(d3.event.layerX),
              y = this.graph.transform.invertY(d3.event.layerY);

          if (d3.event.altKeys) {
              return;
          }

	var subject = this.simulation.find(x, y, 20);
	if (subject === undefined) {
            console.debug("mousedown, no sel", d3.event);
            this.graph.selection = {x1: x, y1: y, x2: x, y2: y};
            this.ticked();
	    return;
	} else {
            console.debug("mousedown Subject", subject);

            if (!_.includes(this.graph.selectedNodes, subject)) {
                this.graph.selectedNodes.push(subject);
            } else {
                _.remove(this.graph.selectedNodes, subject);
            }

            store.dispatch(selectNodes({nodes:this.graph.selectedNodes}));

            this.onmouseclick(subject);
        }
    },
    mouseup: function() {
          var x = this.graph.transform.invertX(d3.event.layerX),
              y = this.graph.transform.invertY(d3.event.layerY);
          
          // find all nodes within selection and highliht

          console.debug("mouseup");

            this.graph.selection = null;

            this.ticked();

    },
    mousemove: function(n) {
          var x = this.graph.transform.invertX(d3.event.layerX),
              y = this.graph.transform.invertY(d3.event.layerY);

          if (this.graph.selection) {
            this.graph.selection = _.assign(this.graph.selection, {x2:x, y2:y});

          this.graph.nodes.forEach((d)=>{
              if ((d.x > this.graph.selection.x1 && d.x < this.graph.selection.x2) &&
                      (d.y > this.graph.selection.y1 && d.y < this.graph.selection.y2)) {
                  if (!_.includes(this.graph.selectedNodes, d)) {
                      this.graph.selectedNodes.push(d);
                  } 
              }

              if ((d.x > this.graph.selection.x2 && d.x < this.graph.selection.x1) &&
                      (d.y > this.graph.selection.y2 && d.y < this.graph.selection.y1)) {
                  if (!_.includes(this.graph.selectedNodes, d)) {
                      this.graph.selectedNodes.push(d);
                  } 
              }
          });

	store.dispatch(selectNodes({nodes:this.graph.selectedNodes}));
            this.ticked();
          }


	var subject = this.simulation.find(x, y, 20);
	if (subject === undefined) {
            this.graph.tooltip = null;
            this.ticked();
	    return;
	}


        this.graph.tooltip = {node: subject, x: x, y: y};
        this.onmousemove(subject);

        this.ticked();
    },
    dragstarted: function() {
          var x = d3.event.x,
              y = d3.event.y;

	if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
	d3.event.subject.fx = x;
	d3.event.subject.fy = y;
    },
    dragged: function() {
          var x = d3.event.x,
              y = d3.event.y;

	d3.event.subject.fx = (x);
	d3.event.subject.fy = (y);
    },
    dragended: function() {
	if (!d3.event.active) this.simulation.alphaTarget(0);
	d3.event.subject.fx = null;
	d3.event.subject.fy = null;
    },
    dragsubject: function() {
          var x = this.graph.transform.invertX(d3.event.x),
              y = this.graph.transform.invertY(d3.event.y);

	// adjust
	return this.simulation.find(x, y, 20);
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

class Histogram extends React.Component {
  static propTypes = {
    packets: React.PropTypes.array.isRequired
  }
  constructor(props) {
    super(props);

    this.state = {
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
          this.canvas =  this.refs["canvas"];

	this.context = this.canvas.getContext('2d');

	var width = 1600, height=800;

	var canvas = d3.select(this.canvas),
            context = this.context;

        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = canvas.width - margin.left - margin.right,
            height = canvas.height - margin.top - margin.bottom;

        var x = d3.scaleBand()
            .rangeRound([0, width])
            .padding(0.1);

        var y = d3.scaleLinear()
            .rangeRound([height, 0]);

        context.translate(margin.left, margin.top);


        let data = [
        {
            letter: 'A', 
            frequency :0.08167
        },
         {
            letter:    'B', 
            frequency :0.01492,
          },
          {
            letter:   'C', 
            frequency :0.02782,
          },
           {
            letter:  'D', 
            frequency :0.04253,
          },
            {
            letter: 'E', 
            frequency :0.12702,
          },
         {
            letter:    'F', 
            frequency :0.02288,
          },
         {
            letter:    'G', 
            frequency :0.02015,
          },
         {
            letter:    'H', 
            frequency :0.06094,
          },
         {
            letter:    'I', 
            frequency :0.06966,
          },
         {
            letter:    'J', 
            frequency :0.00153,
          },
         {
            letter:    'K', 
            frequency :0.00772,
          },
         {
            letter:    'L', 
            frequency :0.04025,
          },
         {
            letter:    'M', 
            frequency :0.02406,
          },
         {
            letter:    'N', 
            frequency :0.06749,
          },
         {
            letter:    'O', 
            frequency :0.07507,
          },
         {
            letter:    'P', 
            frequency :0.01929,
          },
         {
            letter:    'Q', 
            frequency :0.00095,
          },
         {
            letter:    'R', 
            frequency :0.05987,
          },
         {
            letter:    'S', 
            frequency :0.06327,
          },
         {
            letter:    'T', 
            frequency :0.09056,
          },
         {
            letter:    'U', 
            frequency :0.02758,
          },
         {
            letter:    'V', 
            frequency :0.00978,
          },
         {
            letter:    'W', 
            frequency :0.02360,
          },
         {
            letter:    'X', 
            frequency :0.00015,
          },
         {
            letter:    'Y', 
            frequency :0.01974,
          },
         {
            letter:    'Z', 
            frequency :0.00074
          },
        ]

  x.domain(data.map(function(d) { return d.letter; }));
  y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

  var yTickCount = 10,
      yTicks = y.ticks(yTickCount),
      yTickFormat = y.tickFormat(yTickCount, "%");

  context.beginPath();
  x.domain().forEach(function(d) {
    context.moveTo(x(d) + x.bandwidth() / 2, height);
    context.lineTo(x(d) + x.bandwidth() / 2, height + 6);
  });
  context.strokeStyle = "black";
  context.stroke();

  context.textAlign = "center";
  context.textBaseline = "top";
  x.domain().forEach(function(d) {
    context.fillText(d, x(d) + x.bandwidth() / 2, height + 6);
  });

  context.beginPath();
  yTicks.forEach(function(d) {
    context.moveTo(0, y(d) + 0.5);
    context.lineTo(-6, y(d) + 0.5);
  });
  context.strokeStyle = "black";
  context.stroke();

  context.textAlign = "right";
  context.textBaseline = "middle";
  yTicks.forEach(function(d) {
    context.fillText(yTickFormat(d), -9, y(d));
  });

  context.beginPath();
  context.moveTo(-6.5, 0 + 0.5);
  context.lineTo(0.5, 0 + 0.5);
  context.lineTo(0.5, height + 0.5);
  context.lineTo(-6.5, height + 0.5);
  context.strokeStyle = "black";
  context.stroke();

  context.save();
  context.rotate(-Math.PI / 2);
  context.textAlign = "right";
  context.textBaseline = "top";
  context.font = "bold 10px sans-serif";
  context.fillText("Frequency", -10, 10);
  context.restore();

  context.fillStyle = "steelblue";
  data.forEach(function(d) {
    context.fillRect(x(d.letter), y(d.frequency), x.bandwidth(), height - y(d.frequency));
  });
  }
  render() {
      return <canvas width='1600' height='1200' ref="canvas">histogram</canvas>;
  }
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
      network.onmousemove = this.onMouseMove.bind(this);

      network.setup(this.refs["graph"]);
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
	console.debug("highlight", this.props.highlight_nodes);
        console.debug("updated", this.props.packets);
        console.debug("queries", this.props.queries);

        network.graph.queries = this.props.queries;

        var {graph} = this.state;

	var nodes = [];
	var links = [];

        if (this.props.packets.length > 0) {
            var fields = this.props.fields;
            // only new packets!
            _.forEach(this.props.packets, (d, i) => {
                // should we hash the id?
                _.forEach(fields, (field) => {
                    if (d.fields.document[field] === undefined)
                            return;

                    nodes.push({
                        id: phone(d.fields.document[field]),
                        query: d.q,
                        name: d.fields.document[field],
                        color: d.color,
                        connections: 1
                    });
                });

                // create links of every possible source and target combination
                _.forEach(fields, (source) => {
                    if (d.fields.document[source] === undefined)
                        return;
                    _.forEach(fields, (target) => {
                        if (d.fields.document[target] === undefined)
                            return;

                        links.push({
                            source: phone(d.fields.document[source]),
                            target: phone(d.fields.document[target]),
                        });
                    });
                });
            });

            // console.debug("added new nodes.");

            network.render({
                nodes: nodes,
                links: links,
            });
        }


        network.select(this.props.node);
        network.highlight(this.props.highlight_nodes);


        network.ticked();
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
        this.state = { 
            q: props.q, 
            selectValue: this.props.indexes[0], 
        };
    }
    handleSubmit(e) {
	e.preventDefault();

        let q = this.refs.q.value;
        this.props.onSubmit(q, this.state.selectValue);
    }
    handleChange(e){
        this.setState({selectValue:e.target.value});
    }
    componentDidUpdate(prevProps, prevState) {
    }
    handleDeleteIndex(field, e) {
	e.preventDefault();

	store.dispatch(deleteIndex(field));
    }
    handleAddIndex(e) {
	e.preventDefault();

        let index = this.refs.index.value;
	store.dispatch(addIndex(index));
    }
    render() {
	let indexes = null;
	if (this.props.indexes) {
	    let options = _.map(this.props.indexes, (index) => {
                return <option value={index}>{ index }</option>;
	    });
            indexes = <div>
                <select onChange={this.handleChange.bind(this)} value={this.state.selectValue}>{options}</select>
                </div>;
	}
        

        let loader = classNames({ 'sk-search-box__loader': true, 'sk-spinning-loader': true, 'is-hidden': !this.props.isFetching });
        /*
        return <div className="[ bootsnipp-search animate ]">
			<div className="[ container ]">
				<form onSubmit={this.handleSubmit.bind(this)} role="search">
					<div className="[ input-group ]">
						<input ref="q" autoComplete="off" type="text" className="[ form-control ]" name="q" placeholder="Search for snippets and hit enter" value={this.state.q} />
					</div>
                                        <div data-qa="loader" className={loader}></div>
                                        { indexes }
				</form>
			</div>
		</div>
                */

        return <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-1 col-xs-10 col-sm-8 col-md-8 col-lg-6">
                 <div className="form-group">
                    <form onSubmit={this.handleSubmit.bind(this)}>
                         <input ref="q" className="form-control" placeholder="query" value={ this.state.q } />
                        <div data-qa="loader" className={loader}></div>
                        { indexes }
                    </form>
                </div>
            </div>
    }
}

function entries(state = {
    isFetching: false,
    noMoreHits: false,
    didInvalidate: false,
    connected: false,
    total: 0,
    node: [],
    highlight_nodes: [],
    columns: [],
    fields: [
        /*
        "GetaptTelnr", 
        "Gekozennummer"
        */
    ],
    indexes: [
        /*
        "http://172.16.84.1:9200/octopus/",
        "http://127.0.0.1:9200/octopus/",
        */
    ],
    packets: [],
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
	    var indexes = _.without(state.indexes,  action.index);
	    return Object.assign({}, state, {
		indexes: indexes,
	    })
	case TABLE_COLUMN_ADD:
	    var columns = _.concat(state.columns, action.field);
	    return Object.assign({}, state, {
		columns: columns,
	    })
	case TABLE_COLUMN_REMOVE:
	    var columns = _.without(state.columns,  action.field);
	    return Object.assign({}, state, {
		columns: columns,
	    })
	case ADD_FIELD:
	    var fields = _.concat(state.fields, action.field);
	    return Object.assign({}, state, {
		fields: fields,
	    })
	case DELETE_FIELD:
	    var fields = _.without(state.fields,  action.field);
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
	case REQUEST_PACKETS:
	    sock.ws.postMessage({query: action.query, index: action.index, color: action.color});

	    return Object.assign({}, state, {
		isFetching: true,
		didInvalidate: false
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
	case RECEIVE_PACKETS:
	    state.searches.push({q: action.packets.query, color: action.packets.color, count: action.packets.results.hits.hits.length});

            console.debug("results", action.packets.results);
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

        console.debug("initialState", initialState);

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


            console.debug(store);


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
                    fields: [
                        /*
                           "GetaptTelnr", 
                           "Gekozennummer"
                           */
                    ],
                    indexes: [
                        /*
                        "http://172.16.84.1:9200/octopus/",
                        "http://127.0.0.1:9200/octopus/",
                        */
                    ],
                    packets: [],
                    searches: [],
                },
            },
            compose(persistState(/*paths, config*/))
                )
}

const store = configureStore({});

function error() {
    return {
        type: ERROR,
        receivedAt: Date.now()
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
	console.debug("wsDispatcher", store.getState());
	return store.dispatch(receivePackets(msg));
    },
    startWS: (session) => {
	if(!!sock.ws){
	    return;
	    sock.ws.close();
	}

        try {
	sock.ws = new FlowWS(sock.URL, null, sock.wsDispatcher)
        } catch (e) {
            store.dispatch(error());
        }
    }
};

// connect
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
        entries: entries, // json.data.children.map(child => child.data),
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

function tableColumnRemove(field) {
    return {
        type: TABLE_COLUMN_REMOVE,
        receivedAt: Date.now(),
	field: field,
    }
}

function tableColumnAdd(field) {
    return {
        type: TABLE_COLUMN_ADD,
        receivedAt: Date.now(),
	field: field,
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

function selectNodes(opts) {
    return {
        type: SELECT_NODES,
        receivedAt: Date.now(),
	...opts,
    }
}


function highlightNodes(opts) {
    return {
        type: HIGHLIGHT_NODES,
        receivedAt: Date.now(),
	...opts,
    }
}

function fetchPackets(opts={
    from: 0,
    size: 50,
    index: "",
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

function phone(p) {
    // p = p.replace(/^06/i, "316");
    return p;
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
    onSearchSubmit(q, index) {
        fetchPackets({ query: q, index: index, color: getRandomColor() });
    }
    shouldComponentUpdate(nextProps, nextState) {
        console.debug("shouldComponentUpdate", nextProps);
      return true; // this.props.packets.length + 500 < nextProps.packets.length;
    }
    componentWillReceiveProps(nextProps) {
        console.debug("componentWillReceiveProps", nextProps);
    }
    handleDeleteField(field, e) {
	e.preventDefault();

	store.dispatch(deleteField(field));
    }
    handleAddField(e) {
	e.preventDefault();

        let field = this.refs.field.value;
	store.dispatch(addField(field));
    }
    handleChange(e){
        this.setState({selectValue:e.target.value});
    }
    handleMouseOver(node) {
        this.setState({currentNode: node});
    }
    handleClearSelection() {
	store.dispatch(clearSelection());
    }
    handleMouseOver(nr1, nr2) {
	console.debug("test", "getapttelnr", nr1, nr2);
	store.dispatch(highlightNodes({ nodes: [nr1, nr2] }));
    }
    handleDeleteIndex(field, e) {
	e.preventDefault();

	store.dispatch(deleteIndex(field));
    }
    handleAddIndex(e) {
	e.preventDefault();

        let index = this.refs.index.value;
	store.dispatch(addIndex(index));
    }
    handleDeleteField(field, e) {
	e.preventDefault();

	store.dispatch(deleteField(field));
    }
    handleEditSearch(search, e) {
	e.preventDefault();
        this.setState({editSearchValue: search});
    }
    handleChangeSearchColorComplete(color) {
        let search = this.state.editSearchValue;
        search.color = color.hex;
        this.setState({editSearchValue: search});
    }
    handleCancelEditSearch(search, e) {
	e.preventDefault();
        this.setState({editSearchValue: null});
    }
    handleTableAddColumn(field) {
	//store.dispatch(addField(field));
	store.dispatch(tableColumnAdd(field));
    }
    handleTableRemoveColumn(field) {
	//store.dispatch(addField(field));
	store.dispatch(tableColumnRemove(field));
    }
    handleAddField(e) {
	e.preventDefault();

        let field = this.refs.field.value;
	store.dispatch(addField(field));
    }
    render() {
        if (this.state.error != null) {
            return <div>{this.state.error.code}</div>
        }

        var that =this;

        let searches = _.map(this.props.searches, (search) => {
            var divStyle = {
                color: search.color,
            };

            if (this.state.editSearchValue === search) {
                return <div style={ divStyle }><SketchPicker  color={ search.color } onChangeComplete={ this.handleChangeSearchColorComplete.bind(this) }/> { search.q } ({search.count}) <button onClick={this.handleCancelEditSearch.bind(this, search) }>cancel</button> </div>
            } else {
                return <div style={ divStyle }>{ search.q } ({search.count}) <button onClick={this.handleEditSearch.bind(this, search) }>edit</button> </div>
            }
        });

	let nodes = null;
	if (this.props.node) {
	    nodes = _.map(this.props.node, (node) => {
		return  _.map(this.props.packets, (packet) => {
                    return _.map(this.props.fields || [], (value) => {
                        if (phone(packet.fields.document[value])!==node.id) 
                            return null;

                        let fields = _.map(packet.fields.document, function(value, key) {
                            return <tr>
                                <th>{ key} <button onClick={that.handleTableAddColumn.bind(that, key)}>add</button></th>
                                <td colSpan="3">{ value}</td>
                            </tr>;
                        });

                        let columns = _.map(this.props.columns, function(value) {
                            return <td>{ packet.fields.document[value] }<button onClick={that.handleTableRemoveColumn.bind(that, value)}>remove</button></td>;
                        });

		    return [<tr onMouseOver={ this.handleMouseOver.bind(this, packet.fields.document.GetaptTelnr, packet.fields.document.Gekozennummer  ) }> 
                            {columns}
                            </tr>,
                            <tr>
                            { fields }
                            </tr>
                            ];
                    });
		});
	    });
	}

	let fields = null;
	if (this.props.fields || []) {
	    let options = _.map(this.props.fields || [], (field) => {
                return <li value={ field }>{ field } <button onClick={this.handleDeleteField.bind(this, field) }>x</button></li>;
	    });
            fields = <div>
                <ul>{ options }</ul>
                    <form onSubmit={this.handleAddField.bind(this)}>
                <input type="text" ref="field" />
                </form>
            </div>;
	}

	let indexes = null;
	if (this.props.indexes) {
	    let options = _.map(this.props.indexes, (index) => {
                return <li value={index}>{ index }<button onClick={this.handleDeleteIndex.bind(this, index) }>x</button></li>;
	    });
            indexes = <div>
                <ul onChange={this.handleChange.bind(this)} value={this.state.selectValue}>{options}</ul>
                </div>;
	}

	let connected = null;
	if (this.props.connected) {
            connected = <div>connected </div>;
	} else {
            connected = <div>not connected </div>;
        }

	let errors = null;
	if (this.props.errors) {
            errors = <div>{ this.props.errors } </div>;
	} 

        return <div className="container-fluid">
                    <div className="row">
                        <nav className="[ navbar ][ navbar-bootsnipp animate ]" role="navigation">
                            <SearchBox isFetching={this.props.isFetching} total={this.props.total} q= { this.state.q } onSubmit={this.onSearchSubmit.bind(this)} indexes = {this.props.indexes}/>
                        </nav>
                    </div>
		    <div className="row">
			<div className="col-xs-9 col-sm-9">
			    <div className="row">
                                <section>
                                <button onClick={() => this.refs.dialogWithCallBacks.show()}>Configure</button>
                                </section>
                                { connected }
                                { errors }
			    </div>
			    <div className="row">
				<Graph width="1600" height="800" node={this.props.node} queries={this.props.searches} fields={this.props.fields} packets={this.props.packets} highlight_nodes={this.props.highlight_nodes} className="graph" handleMouseOver={ this.handleMouseOver.bind(this) } />
				<Histogram width="1600" height="200" fields={this.props.fields} packets={this.props.packets} highlight_nodes={this.props.highlight_nodes} className="histogram" handleMouseOver={ this.handleMouseOver.bind(this) } />
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
                            <table className='table table-condensed table-striped col-md-4 col-lg-4'>
			    {nodes}
                            </table>
			    </div>
			</div>
		    </div>
		    <div className="row">
                    </div>
		    <div className="row">
                    </div>
                    <div className="row">
                    </div>
        <SkyLight
            ref="dialogWithCallBacks"
            title="add Index">
            <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-1 col-xs-10 col-sm-8 col-md-8 col-lg-6">
                <div className="form-group">
                <h2>Indexes</h2>
                { indexes }
                </div>
                <div className="form-group">
                    <form onSubmit={this.handleAddIndex.bind(this)}>
                        <input type="text" ref="index" />
                    </form>
                </div>
                <h2>Fields</h2>
                <div className="form-group">
                { fields }
                </div>
            </div>
        </SkyLight>
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
          connected: state.entries.connected,
          errors: state.entries.errors,
          packets: state.entries.packets,
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

// history.listen(location => fetchEntries({...location.query, from: 0, size: 50}));

ReactDOM.render((
  <App/>
), document.getElementById('root'))

