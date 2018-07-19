import removeDeadLinks from './removeDeadLinks';
import filterComponentsByQueries from './filterComponentsBySearchIds';
import getConnectedComponents from './getConnectedComponents';
import markNodesForDisplay from './markNodesForDisplay';
import applyVia from './applyVia';
import getNodesAndLinks from "./getNodesAndLinks";
import markLinksForDisplay from "./markLinksForDisplay";
import normalizeLinks from "./normalizeLinks";
import normalizeNodes from "./normalizeNodes";
import filterBoringComponents from "./filterBoringComponents";
import {SEARCH_RECEIVE, LIVE_RECEIVE} from "../../search/searchConstants";
import {Field} from "../../fields/interfaces/field";
import createField from "../../fields/helpers/createField";
import {Search} from "../../search/interfaces/search";
import {forEach} from 'lodash';
import {Item} from "../interfaces/item";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";
import {Via} from "../interfaces/via";
import {EventEmitter} from "fbemitter";
import {Column} from "../../table/interfaces/column";
import {SortType} from "../../table/interfaces/sortType";
import {sortItems} from "./sortItems";
import { REBUILD_GRAPH } from '../graphConstants';
import { Connector } from '../interfaces/connector';
import { Datasource } from '../../datasources/interfaces/datasource';
import { createConnector } from '../../fields/helpers/createConnector';
import { getConnectorName } from '../../fields/helpers/getConnectorName';
import { getConnectorRuleId } from '../../fields/helpers/getConnectorRuleId';

export interface GraphWorkerPayload {
    items: Item[];
    searchId: string;
    prevNodes?: Node[];
    prevLinks?: Link[];
    prevItems?: Item[];
    normalizations: Normalization[];
    searches: Search[];
    deletedNodeIds: number[];
    via: Via[];
    receivedAt: number;
    sortColumn: Column;
    sortType: SortType;
    filterBoringNodes: boolean;
    filterSecondaryQueries: boolean;
    connectors: Connector[];
    datasources: Datasource[];
	outputId: string;
}

export interface GraphWorkerOutput {
    nodes: Node[];
    links: Link[];
    items: Item[];
    connectors: Connector[];
    searches: Search[];
	outputId: string;
}

let prevNodeCache: Node[];
let prevLinkCache: Link[];
let prevItemCache: Item[];

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

		let connectors = payload.connectors;
		let search: Search;
		let searches: Search[] = payload.searches;
		let useItems: Item[];

		if (action.type === REBUILD_GRAPH) {
			// When we're only triggering the graph worker, we don't have any new items,
			// and we also don't have a relevant search. We just want to regenerate the
			// nodes and links because some config changed, like the fields.
			useItems = prevItemCache;

		} else {
			const searchIndex: number = payload.searches.findIndex(loop =>
				loop.searchId === payload.searchId
				&& !loop.paused
			);

			searches = payload.searches.concat([]);
			search = Object.assign({}, searches[searchIndex]);

			searches[searchIndex] = search;
			search.items = search.items.concat(payload.items);

			// For live datasources we automatically add all the fields that are present in the items
			if (isLive) {
				connectors = GraphWorkerClass.createConnectorsFromData(connectors, payload.items, search.liveDatasource);
			}

			useItems = prevItemCache.concat(payload.items);
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

        result.nodes = markNodesForDisplay(result.nodes, payload.searches || []);
        result.links = markLinksForDisplay(result.nodes, result.links);

        const normalizedNodes = normalizeNodes(result.nodes, payload.normalizations);
        const normalizedLinks = normalizeLinks(normalizedNodes, result.links, payload.normalizations);

        result.nodes = normalizedNodes;
        result.links = removeDeadLinks(result.nodes, normalizedLinks);

        let { nodes, links } = applyVia(result.nodes, result.links, payload.via);

        let items = prevItemCache.concat(payload.items);
        if (payload.sortColumn) {
            items = sortItems(items, payload.sortColumn, payload.sortType);
        }

        // Sort on line thickness for performance improvement
        // The renderer is faster when it doesnt need to switch line styles so often
        links.sort((a, b) => a.itemIds.length - b.itemIds.length);

        const output: GraphWorkerOutput = {
            nodes: nodes,
            links: links,
            items: items,
            connectors: connectors,
            searches: searches,
			outputId: payload.outputId
        };

        prevNodeCache = nodes;
        prevLinkCache = links;
        prevItemCache = items;

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

    /**
     * Automatically create connectors based on all the data that is present in the
     * items.
     *
     * @param {Connector[]} connectors
     * @param {Item[]} items
     * @param {string} datasource
     * @returns {Connector[]}
     */
    private static createConnectorsFromData(connectors: Connector[], items: Item[], datasource: string): Connector[] {
        const usedFields: Field[] = [];

        connectors.forEach(connector =>
			connector.rules.forEach(rule =>
				usedFields.push(rule.field)
			)
		);

        items.forEach(item => {
            forEach(item.fields, (value, key) => {
            	const existing = usedFields.find(field => field.path === key);

                if (existing) {
                    // Field is already used in a connector
                    return;
                }

                const field = createField(usedFields, key, 'string', datasource);
                const name = getConnectorName(connectors);
                const connector = createConnector(connectors, name, [field]);

                usedFields.push(field);
                connectors = connectors.concat([connector]);
            });
        });

        return connectors;
    }
}