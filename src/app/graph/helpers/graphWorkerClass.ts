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
import {Item} from "../../items/interfaces/item";
import {Node} from "../interfaces/node";
import {Link} from "../interfaces/link";
import {Normalization} from "../interfaces/normalization";
import {Via} from "../interfaces/via";
import {EventEmitter} from "fbemitter";
import {Column} from "../../table/interfaces/column";
import {SortType} from "../../table/interfaces/sortType";
import {sortItems} from "../../items/helpers/sortItems";
import { REBUILD_GRAPH } from '../graphConstants';
import { Connector } from '../interfaces/connector';
import { Datasource } from '../../datasources/interfaces/datasource';

export interface GraphWorkerPayload {
    items: Item[];
    searchId: string;
    prevNodes?: Node[];
    prevLinks?: Link[];
    prevItems?: Item[];
    fields: Field[];
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
}

export interface GraphWorkerOutput {
    nodes: Node[];
    links: Link[];
    items: Item[];
    fields: Field[];
    searches: Search[]
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

		let fields = payload.fields;
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

			// Save per item for which query we received it (so we can keep track of where data came from)
			payload.items.forEach(item => {
				item.searchId = search.searchId;
			});

			// For live datasources we automatically add all the fields that are present in the items
			if (isLive) {
				fields = GraphWorkerClass.createFieldsFromData(fields, payload.items, search.liveDatasource);
			}

			useItems = payload.items;
		}

        // update nodes and links
        const result = getNodesAndLinks(
            prevNodeCache,
            prevLinkCache,
            useItems,
            payload.connectors,
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
            fields: fields,
            searches: searches
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
     * Automatically create fields based on all the data that is present in the
     * items.
     *
     * @param {Field[]} fields
     * @param {Item[]} items
     * @param {string} datasource
     * @returns {Field[]}
     */
    private static createFieldsFromData(fields: Field[], items: Item[], datasource: string): Field[] {
        const fieldMap = {};
        fields.forEach(field => fieldMap[field.path] = true);

        items.forEach(item => {
            forEach(item.fields, (value, key) => {
                if (fieldMap[key]) {
                    // Field already exists
                    return;
                }

                const field = createField(fields, key, 'string', datasource);
                fields = fields.concat([field]);
                fieldMap[key] = true;
            });
        });

        return fields;
    }
}