import removeDeadLinks from './removeDeadLinks';
import filterComponentsByQueries from './filterComponentsBySearchIds';
import getConnectedComponents from './getConnectedComponents';
import markNodesForDisplay from './markNodesForDisplay';
import getNodesAndLinks from "./getNodesAndLinks";
import markLinksForDisplay from "./markLinksForDisplay";
import filterBoringComponents from "./filterBoringComponents";
import {LIVE_RECEIVE} from "../../search/searchConstants";
import {Search} from "../../search/interfaces/search";
import {Item} from "../interfaces/item";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {EventEmitter} from "fbemitter";
import { MAX_AUTOMATIC_CONNECTORS, REBUILD_GRAPH } from '../graphConstants';
import { Connector } from '../interfaces/connector';
import { Datasource } from '../../datasources/interfaces/datasource';
import { getSuggestedConnectors } from '../../fields/helpers/getSuggestedConnectors';
import { Field } from '../../fields/interfaces/field';
import { groupNodes } from './groupNodes';

export interface GraphWorkerPayload {
    items: Item[];
    searchId: string;
    prevNodes?: Node[];
    prevLinks?: Link[];
    prevItems?: Item[];
    searches: Search[];
    deletedNodeIds: number[];
    filterBoringNodes: boolean;
    filterSecondaryQueries: boolean;
    connectors: Connector[];
    datasources: Datasource[];
	outputId: string;
	automaticallyCreateConnectors: boolean;
	fields: Field[];
	deletedConnectorFields: string[];
	noGroupingNodeIds: number[];
	suggestedConnectors: Connector[];
	groupNodes: boolean;
}

export interface GraphWorkerOutput {
    nodes: Node[];
    links: Link[];
    connectors: Connector[];
    suggestedConnectors: Connector[];
	outputId: string;
}

let prevNodeCache: Node[];
let prevLinkCache: Link[];
let prevItemCache: Item[];
let fieldCache: Field[];

export default class GraphWorkerClass {
    output: EventEmitter = new EventEmitter();

    onMessage(action) {
        const isLive: boolean = action.type === LIVE_RECEIVE;
        const payload: GraphWorkerPayload = action.payload;

		if (typeof payload.prevNodes !== 'undefined') {
			prevNodeCache = payload.prevNodes;
		}

		if (typeof payload.prevLinks !== 'undefined') {
			prevLinkCache = payload.prevLinks;
		}

		if (typeof payload.prevItems !== 'undefined') {
			prevItemCache = payload.prevItems;
		}

		if (typeof payload.fields !== 'undefined') {
			fieldCache = payload.fields;
		}

		let search: Search;
		let useItems: Item[];
		let suggested: Connector[];
		let connectors: Connector[] = payload.connectors;

		if (action.type === REBUILD_GRAPH) {
			// When we're only triggering the graph worker, we don't have any new items,
			// and we also don't have a relevant search. We just want to regenerate the
			// nodes and links because some config changed, like the fields.
			useItems = prevItemCache;
			suggested = payload.suggestedConnectors;
		} else {
			search = payload.searches.find(loop =>
				loop.searchId === payload.searchId
				&& !loop.paused
			);
			useItems = prevItemCache.concat(payload.items);
			prevItemCache = useItems;
			suggested = getSuggestedConnectors(useItems, fieldCache, connectors, payload.deletedConnectorFields);
		}

		const automaticallyCreateConnectors = payload.automaticallyCreateConnectors || isLive;

		if (automaticallyCreateConnectors) {
			const toAdd = MAX_AUTOMATIC_CONNECTORS - connectors.length;
			connectors = connectors.concat(suggested.slice(0, toAdd));
			suggested = suggested.slice(toAdd);
		}

        // update nodes and links
        const result = getNodesAndLinks(
            prevNodeCache,
            prevLinkCache,
            useItems,
            connectors,
            search ? search.aroundNodeId : null,
            payload.deletedNodeIds,
			payload.datasources
        );

        // For live searches we display everything, we don't filter boring components etc.
        if (!isLive) {
            if (payload.filterBoringNodes) {
				result.nodes = GraphWorkerClass.filterBoringNodes(result.nodes, result.links);
				result.links = removeDeadLinks(result.nodes, result.links);
            }

            if (payload.filterSecondaryQueries) {
				const secondaryFilterResult = GraphWorkerClass.filterSecondaryQueries(
					result.nodes,
					result.links,
					payload.searches
				);

				result.nodes = secondaryFilterResult.nodes;
				result.links = secondaryFilterResult.links;
            }
        }

        if (payload.groupNodes) {
			const grouped = groupNodes(result.nodes, result.links, payload.noGroupingNodeIds);
			result.nodes = grouped.nodes;
			result.links = grouped.links;
		}

        result.nodes = markNodesForDisplay(result.nodes, payload.searches || []);
        result.links = markLinksForDisplay(result.nodes, result.links);

        // Sort on line thickness for performance improvement
        // The renderer is faster when it doesnt need to switch line styles so often
        // links.sort((a, b) => a.color - b.color);

        const output: GraphWorkerOutput = {
            nodes: result.nodes,
            links: result.links,
            connectors: connectors,
			outputId: payload.outputId,
			suggestedConnectors: suggested
        };

        prevNodeCache = result.nodes;
        prevLinkCache = result.links;

        this.output.emit('output', output);
    }

    /**
     * Returns only the nodes that are in connected components that contain
     * more than 1 item.
     *
     * @param {Node[]} nodes
     * @param {Link[]} links
     * @returns {Node[]}
     */
    private static filterBoringNodes(nodes: Node[], links: Link[]): Node[] {
        const components = getConnectedComponents(nodes, links);
        const filtered = filterBoringComponents(components);

        return filtered.reduce((prev, current) => prev.concat(current), []);
    }

    /**
     * Returns only nodes that are related to the primary (first) query. Nodes
     * that are results for a live datasource are an exception, those are never
     * filtered.
     *
     * @param {Node[]} nodes
     * @param {Link[]} links
     * @param {Search[]} searches
     * @returns {{nodes: Node[]; links: Link[]}}
     */
    private static filterSecondaryQueries(nodes: Node[], links: Link[], searches: Search[]): { nodes: Node[], links: Link[]} {
        const normalSearches = searches.filter(search => !search.liveDatasource);

        if (normalSearches.length < 2) {
            return {
                nodes: nodes,
                links: links
            };
        }

        // If there is more than 1 query, all nodes for subsequent searchIds
        // need to be linked to nodes from the first query, or a live datasource
        // If some results are not linked, they will not be displayed as nodes

        const components: Node[][] = getConnectedComponents(nodes, links);

        // The first query of the normal searches is the primary query
        const primarySearchId: string = normalSearches[0].searchId;
        const liveDatasources: string[] = searches
            .filter(search => search.liveDatasource)
            .map(search => search.searchId);

        // Every component needs to be linked to either the primary query,
        // or one of the live datasources
        const validSearchIds: string[] = liveDatasources.concat([primarySearchId]);
        const filteredComponents: Node[][] = filterComponentsByQueries(components, validSearchIds);

        const filteredNodes = filteredComponents.reduce((prev, current) => prev.concat(current), []);
        const filteredLinks = removeDeadLinks(filteredNodes, links);

        return {
            nodes: filteredNodes,
            links: filteredLinks
        };
    }
}