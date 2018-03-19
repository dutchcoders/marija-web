import removeDeadLinks from '../../helpers/removeDeadLinks';
import filterComponentsByQueries from '../../helpers/filterComponentsByQueries';
import getConnectedComponents from '../../helpers/getConnectedComponents';
import markNodesForDisplay from '../../helpers/markNodesForDisplay';
import applyVia from '../../helpers/applyVia';
import getNodesAndLinks from "../../helpers/getNodesAndLinks";
import markLinksForDisplay from "../../helpers/markLinksForDisplay";
import normalizeLinks from "../../helpers/normalizeLinks";
import normalizeNodes from "../../helpers/normalizeNodes";
import filterBoringComponents from "../../helpers/filterBoringComponents";
import {SEARCH_RECEIVE} from "../search/constants";
import {Field} from "../../interfaces/field";
import createField from "../../helpers/createField";
import {Search} from "../../interfaces/search";
import {forEach} from 'lodash';
import {Item} from "../../interfaces/item";
import {Node} from "../../interfaces/node";
import {Link} from "../../interfaces/link";
import {Normalization} from "../../interfaces/normalization";
import {Via} from "../../interfaces/via";
import {EventEmitter} from "fbemitter";
import {Column} from "../../interfaces/column";
import {SortType} from "../../interfaces/sortType";
import {sortItems} from "../../helpers/sortItems";

export interface GraphWorkerPayload {
    items: Item[];
    query: string;
    prevNodes: Node[];
    prevLinks: Link[];
    prevItems: Item[];
    fields: Field[];
    normalizations: Normalization[];
    searches: Search[];
    deletedNodes: Node[];
    via: Via[];
    receivedAt: number;
    sortColumn: Column;
    sortType: SortType;
}

export interface GraphWorkerOutput {
    nodes: Node[];
    links: Link[];
    items: Item[];
    fields: Field[];
    searches: Search[]
}

export default class GraphWorkerClass {
    output: EventEmitter = new EventEmitter();

    onMessage(event: MessageEvent) {
        const action = event.data;

        if (action.type !== SEARCH_RECEIVE) {
            // This is the only action type we currently support in this worker
            return;
        }

        const payload: GraphWorkerPayload = action.payload;

        if (!payload.items) {
            return;
        }

        const searchIndex: number = payload.searches.findIndex(loop => loop.q === payload.query && !loop.paused);

        if (searchIndex === -1) {
            // received items for a query we were not searching for
            return;
        }

        const searches = payload.searches.concat([]);
        const search = Object.assign({}, searches[searchIndex]);

        searches[searchIndex] = search;
        search.items = search.items.concat(payload.items);

        const isLive: boolean = search.liveDatasource !== null;

        // Save per item for which query we received it (so we can keep track of where data came from)
        payload.items.forEach(item => {
            item.query = search.q;
        });

        let fields = payload.fields;

        // For live datasources we automatically add all the fields that are present in the items
        if (isLive) {
            fields = GraphWorkerClass.createFieldsFromData(fields, payload.items, search.liveDatasource);
        }

        // update nodes and links
        const result = getNodesAndLinks(
            payload.prevNodes,
            payload.prevLinks,
            payload.items,
            fields,
            search,
            search.aroundNodeId,
            payload.deletedNodes
        );

        // For live searches we display everything, we don't filter boring components etc.
        if (!isLive) {
            result.nodes = GraphWorkerClass.filterBoringNodes(result.nodes, result.links);
            result.links = removeDeadLinks(result.nodes, result.links);

            const secondaryFilterResult = GraphWorkerClass.filterSecondaryQueries(
                result.nodes,
                result.links,
                payload.searches
            );

            result.nodes = secondaryFilterResult.nodes;
            result.links = secondaryFilterResult.links;
        }

        result.nodes = markNodesForDisplay(result.nodes, payload.searches || []);
        result.links = markLinksForDisplay(result.nodes, result.links);

        const normalizedNodes = normalizeNodes(result.nodes, payload.normalizations);
        const normalizedLinks = normalizeLinks(result.links, payload.normalizations);

        result.nodes = normalizedNodes;
        result.links = removeDeadLinks(result.nodes, normalizedLinks);

        let { nodes, links } = applyVia(result.nodes, result.links, payload.via);

        let items = payload.prevItems.concat(payload.items);
        if (payload.sortColumn) {
            items = sortItems(items, payload.sortColumn, payload.sortType);
        }

        const output: GraphWorkerOutput = {
            nodes: nodes,
            links: links,
            items: items,
            fields: fields,
            searches: searches
        };

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

        if (normalSearches.length === 0) {
            return {
                nodes: nodes,
                links: links
            };
        }

        // If there is more than 1 query, all nodes for subsequent queries
        // need to be linked to nodes from the first query, or a live datasource
        // If some results are not linked, they will not be displayed as nodes

        const components: Node[][] = getConnectedComponents(nodes, links);

        // The first query of the normal searches is the primary query
        const primaryQuery: string = normalSearches[0].q;
        const liveDatasources: string[] = searches
            .filter(search => search.liveDatasource)
            .map(search => search.liveDatasource);

        // Every component needs to be linked to either the primary query,
        // or one of the live datasources
        const validQueries: string[] = liveDatasources.concat([primaryQuery]);
        const filteredComponents: Node[][] = filterComponentsByQueries(components, validQueries);

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
            });
        });

        return fields;
    }
}