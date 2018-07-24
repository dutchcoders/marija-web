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
		message.push(node.r);
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
        
        // simulation.alpha(0);
    } else if (data.type === 'init') {
    	workerLinks = [];
    	workerNodes = [];
    	workerLinkMap.clear();
    	workerNodeMap.clear();

		const forceLink = d3.forceLink()
			.distance((link: any) => {
				if (!link.label) {
					return 80;
				}

				let label = link.label;

				if (Array.isArray(label)) {
					label = label.join('');
				}

				return label.length * 10 + 30;
			})
			.id((d: any) => d.id);

		const forceManyBody = d3.forceManyBody()
			.strength(-100)
			.distanceMax(500)
			.distanceMin(50);

		simulation = d3.forceSimulation()
			.stop()
			.force("link", forceLink)
			.force("charge", forceManyBody)
			// .force("center", d3.forceCenter(clientWidth / 2, clientHeight / 2))
			.force('collide', d3.forceCollide((node: any) => {
				return node.r
			}))
			// .force("vertical", d3.forceY().strength(0.018))
			// .force("horizontal", d3.forceX().strength(0.006))
			.on("tick", () => {
				postMessage(getTickMessage());
				//
				//
				// postMessage({
				// 	type: "tick",
				// 	nodes: workerNodes,
				// 	links: workerLinks
				// });
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

        const sizeRange = [15, 100];

        let forceScale = function (node) {
            var scale = d3.scaleLog().domain(sizeRange).range(sizeRange.slice().reverse());
            const result = node.r + scale(node.r);

            console.log(node.r, result);

            return 1000;
        };

        var countExtent = d3.extent(nodes, (n: any) => {
            return n.count;
        }),
            radiusScale = d3.scalePow().exponent(2).domain(countExtent as any).range(sizeRange);

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
                // n = assign(n, {force: forceScale(n)});

                newNodes = true;
                continue;
            }

            let node2 = clone(node);
            // node2 = assign(node2, {force: forceScale(node2)});

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

        const connectivity = links.length / nodes.length;

        // Links are longer in graphs with a high connectivity
        const baseLength = connectivity * 30;

        // Nodes are further apart in graphs with a high connectivity
        const baseStrength = -100;
        const dynamicStrength = connectivity * -60;

        const forceManyBody = d3.forceManyBody()
            .strength(baseStrength + dynamicStrength)
            .distanceMax(500)
            .distanceMin(50);

        simulation.force('charge', forceManyBody);

        const forceLink = d3.forceLink()
            .distance((link: any) => {
                if (!link.label) {
                    return 80 + baseLength;
                }

                let label = link.label;

                if (Array.isArray(label)) {
                    label = label.join('');
                }

                return label.length * 10 + 60 + baseLength;
            })
            .id((d: any) => d.id);

        simulation.force("link", forceLink);

        simulation.force('link')
            .links(workerLinks);

        simulation
            .alpha(0.5)
            // .alphaDecay(.0428)
            // .velocityDecay(.2)
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
