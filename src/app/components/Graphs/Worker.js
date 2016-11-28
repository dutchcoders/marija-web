import * as d3 from 'd3';

let simulation = null;
let timer = null;

onmessage = function(event) {
    console.debug(event.data.type);

    if (event.data.type === "restart") {
	let { nodes } = event.data;

        for (let n1 of this.nodes) {
            for (let n2 of nodes) {
                if (n1.id !== n2.id)
                    continue;

                console.debug('found node, updating', n1, n2);

                n1.fx = n2.fx;
                n1.fy = n2.fy;
            }
        }
        
	 simulation.alpha(0.3).restart();
    } else if (event.data.type === 'stop') {
	let { nodes } = event.data;

        for (let n1 of this.nodes) {
            for (let n2 of nodes) {
                if (n1.id !== n2.id)
                    continue;

                console.debug('found node, updating', n1, n2);

                n1.fx = n2.fx;
                n1.fy = n2.fy;
            }
        }
        
        // simulation.alpha(0);
    } else if (event.data.type === 'init') {
	let { clientWidth, clientHeight } = event.data;

        simulation = d3.forceSimulation()
            .stop()
            .force("link", d3.forceLink().id(function (d) {
                return d.id;
            }))
            .force("charge", d3.forceManyBody().strength(-100).distanceMax(500))
            .force("center", d3.forceCenter(clientWidth / 2, clientHeight / 2))
            .force("vertical", d3.forceY().strength(0.018))
            .force("horizontal", d3.forceX().strength(0.006));

        this.nodes = [];
        this.links = [];
        
        timer = setInterval(function() {
            simulation.tick();
            postMessage({type: "tick", nodes: this.nodes, links: this.links });
        }, 20);
    } else if (event.data.type === 'update') {
	let { nodes, links } = event.data;

	this.nodes = nodes;
	this.links = links;

	simulation
	    .nodes(this.nodes);

	simulation.force("link")
	    .links(this.links);

        simulation.alpha(0.3).restart();
    }
}
