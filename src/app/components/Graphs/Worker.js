import * as d3 from 'd3';

let simulation = null;

onmessage = function(event) {
	return;

    if (event.data.type === "restart") {
console.debug("restart");

	 simulation.alpha(0.3).restart();

	for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
	    postMessage({type: "tick", nodes: this.nodes, links: this.links });
	    simulation.tick();
	}

	postMessage({type: "end", nodes: this.nodes, links: this.links});
    } else {
	let { nodes, links, clientWidth, clientHeight } = event.data;

	this.nodes = nodes;
	this.links = links;

	if (!simulation) {
	    simulation = d3.forceSimulation()
		.stop()
		.force("link", d3.forceLink().id(function (d) {
		    return d.id;
		}))
		.force("charge", d3.forceManyBody().strength(-100).distanceMax(500))
		.force("center", d3.forceCenter(clientWidth / 2, clientHeight / 2))
		.force("vertical", d3.forceY().strength(0.018))
		.force("horizontal", d3.forceX().strength(0.006));
	}

	simulation
	    .nodes(this.nodes);

	simulation.force("link")
	    .links(this.links);

	for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
	    postMessage({type: "tick", nodes: this.nodes, links: this.links });
	    simulation.tick();
	}

	postMessage({type: "end", nodes: this.nodes, links: this.links});
    }
}
