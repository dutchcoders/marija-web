import * as d3 from 'd3';
import { assign, clone, difference, each, find, forEach, groupBy, includes, isEqual, map, reduce, remove, uniq } from 'lodash';

let simulation = null;
let timer = null;
let workerNodes = [];
let workerNodeMap = new Map();
let workerLinks = [];
let workerLinkMap = new Map();

function getTickMessage() {
	const message = [];

	message.push(workerNodes.length);

	workerNodes.forEach(node => {
		message.push(node.id);
		message.push(node.x);
		message.push(node.y);
	});

	workerLinks.forEach(link => {
		message.push(link.hash);
		message.push(link.source.x);
		message.push(link.source.y);
		message.push(link.target.x);
		message.push(link.target.y);
	});

	return new Float64Array(message);
}

onmessage = function(event) {
	const data = JSON.parse(event.data);

    if (data.type === "restart") {
        let { nodes } = data;

        for (let n1 of workerNodes) {
            for (let n2 of nodes) {
                if (n1.id !== n2.id)
                    continue;

                n1.fx = n2.fx;
                n1.fy = n2.fy;
            }
        }
        
        simulation.alpha(0.3).restart();
    } else if (data.type === 'stop') {
        let { nodes } = data;

        for (let n1 of workerNodes) {
            for (let n2 of nodes) {
                if (n1.id !== n2.id)
                    continue;

                n1.fx = n2.fx;
                n1.fy = n2.fy;
            }
        }
    } else if (data.type === 'init') {
    	workerLinks = [];
    	workerNodes = [];
    	workerLinkMap.clear();
    	workerNodeMap.clear();

		const forceLink = d3.forceLink()
			.distance(80)
			.id((d: any) => d.id);

		const longDistance = d3.forceManyBody()
			.strength((node: any) => node.r * -15 * (workerLinks.length / workerNodes.length))
			.distanceMin(50)
			.distanceMax(400);

		const shortDistance = d3.forceManyBody()
			.strength((node: any) => 10)
			.distanceMin(0)
			.distanceMax(50);

		simulation = d3.forceSimulation()
			.stop()
			.velocityDecay(.75)
			.force("link", forceLink)
			.force("longDistance", longDistance)
			.force("shortDistance", shortDistance)
			.force('collide', d3.forceCollide((node: any) => {
				return node.r
			}))
			.on("tick", () => {
				postMessage(getTickMessage());
			})
			.on("end", () => {
				postMessage({
					type: "end",
					nodes: workerNodes,
					links: workerLinks
				});
			});

		workerNodes = [];
		workerLinks = [];
	} else if (data.type === 'setAreaForces') {
		const { clientWidth, clientHeight, active } = data;

        if (active) {
            simulation
				.force("center", d3.forceCenter(clientWidth / 2, clientHeight / 2))
				.force("vertical", d3.forceY().strength(0.018))
				.force("horizontal", d3.forceX().strength(0.006))
                .restart();
        } else {
            simulation
				.force("center", null)
				.force("vertical", null)
				.force("horizontal", null)
                .restart();
        }
    } else if (data.type === 'update') {
        let { nodes, links } = data;

        var newNodes = false;

        let removed = 0;

        const newWorkerNodeMap = new Map();
        nodes.forEach(node => newWorkerNodeMap.set(node.id, node));

        // remove deleted nodes
        remove(workerNodes, (n) => {
        	const shouldRemove = !newWorkerNodeMap.has(n.id);

            if (shouldRemove) {
            	workerNodeMap.delete(n.id);
            	removed ++;
			}

			return shouldRemove;
        });

        for (let i=0; i < nodes.length; i++) {
            let node = nodes[i];
            // todo(nl5887): cleanup

            var n = workerNodeMap.get(node.id);
            if (n) {
                n = assign(n, node);

                newNodes = true;
                continue;
            }

            let node2 = clone(node);

            workerNodes.push(node2);
            workerNodeMap.set(node2.id, node2);

            newNodes = true;
        }

        let newLinkMap = new Map();
        links.forEach(link => newLinkMap.set(link.hash, true));


        remove(workerLinks, (link) => {
        	const shouldRemove = !newLinkMap.has(link.hash);

        	if (shouldRemove) {
        		workerLinkMap.delete(link.hash);
			}

			return shouldRemove;
        });

        for (let i=0; i < links.length; i++) {
            let link = links[i];

            var n = workerLinkMap.get(link.hash);
            
            if (n) {
                Object.assign(n, link);
                continue;
            }
            
            // todo(nl5887): why?
            const add = {
                source: link.source,
                target: link.target,
				hash: link.hash
            };

            workerLinks.push(add);
            workerLinkMap.set(link.hash, link);
        }

        simulation
            .nodes(workerNodes);

        simulation.force('link')
            .links(workerLinks);

        simulation
            .alpha(0.5)
            .restart();
    } else if (data.type === 'updateNodeProperties') {
        const { nodes } = data;

        nodes.forEach(node => {
            const existing = workerNodes.find(search => search.id === node.id);

            Object.assign(existing, node);
        });

        postMessage({
            type: "tick",
            nodes: workerNodes,
            links: workerLinks
        });
    }
}
