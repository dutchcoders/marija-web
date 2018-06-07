import * as d3 from 'd3';
import { assign, clone, difference, each, find, forEach, groupBy, includes, isEqual, map, reduce, remove, uniq } from 'lodash';

let simulation = null;
let timer = null;
let workerNodes = [];
let workerLinks = [];

onmessage = function(event) {
    if (event.data.type === "restart") {
        let { nodes } = event.data;

        for (let n1 of workerNodes) {
            for (let n2 of nodes) {
                if (n1.id !== n2.id)
                    continue;

                n1.fx = n2.fx;
                n1.fy = n2.fy;
            }
        }
        
        simulation.alpha(0.3).restart();
    } else if (event.data.type === 'stop') {
        let { nodes } = event.data;

        for (let n1 of workerNodes) {
            for (let n2 of nodes) {
                if (n1.id !== n2.id)
                    continue;

                n1.fx = n2.fx;
                n1.fy = n2.fy;
            }
        }
        
        // simulation.alpha(0);
    } else if (event.data.type === 'init') {
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
			.force('collide', d3.forceCollide((node: any) => node.r))
			// .force("vertical", d3.forceY().strength(0.018))
			// .force("horizontal", d3.forceX().strength(0.006))
			.on("tick", () => {
				postMessage({
					type: "tick",
					nodes: workerNodes,
					links: workerLinks
				});
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
	} else if (event.data.type === 'setAreaForces') {
		const { clientWidth, clientHeight, active } = event.data;

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
    } else if (event.data.type === 'tick') {
    } else if (event.data.type === 'update') {
        let { nodes, links } = event.data;

        const sizeRange = [15, 30];

        let forceScale = function (node) {
            var scale = d3.scaleLog().domain(sizeRange).range(sizeRange.slice().reverse());
            return node.r + scale(node.r);
        };

        var countExtent = d3.extent(nodes, (n: any) => {
            return n.count;
        }),
            radiusScale = d3.scalePow().exponent(2).domain(countExtent as any).range(sizeRange);

        var newNodes = false;

        var that = this;

        // remove deleted nodes
        remove(workerNodes, (n) => {
            return !find(nodes, (o) => {
                return (o.id==n.id);
            });
        });

        for (let i=0; i < nodes.length; i++) {
            let node = nodes[i];
            // todo(nl5887): cleanup

            var n = find(workerNodes, {id: node.id});
            if (n) {
                n = assign(n, node);
                n = assign(n, {force: forceScale(n), r: radiusScale(n.count)});

                newNodes = true;
                continue;
            }

            let node2 = clone(node);
            node2 = assign(node2, {force: forceScale(node2), r: radiusScale(node2.count)});

            workerNodes.push(node2);

            newNodes = true;
        }

        remove(workerLinks, (link) => {
            return !find(links, (o) => {
                return (link.source.id == o.source && link.target.id == o.target);
            });
        });

        for (let i=0; i < links.length; i++) {
            let link = links[i];

            var n = find(workerLinks, (o) => {
                return o.source.id == link.source && o.target.id == link.target;
            });
            
            if (n) {
                Object.assign(n, link);
                continue;
            }
            
            // todo(nl5887): why?
            const add = {
                source: link.source,
                target: link.target,
                color: link.color,
                label: link.label,
                total: link.total,
                current: link.current,
                thickness: link.thickness
            };

            workerLinks.push(add);
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
    } else if (event.data.type === 'updateNodeProperties') {
        const { nodes } = event.data;

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
