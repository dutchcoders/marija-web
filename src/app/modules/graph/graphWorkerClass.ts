import {graphWorkerOutput} from "./actions";
import removeDeadLinks from '../../helpers/removeDeadLinks';
import filterComponentsByQueries from '../../helpers/filterComponentsByQueries';
import getConnectedComponents from '../../helpers/getConnectedComponents';
import getNodesForDisplay from '../../helpers/markNodesForDisplay';
import applyVia from '../../helpers/applyVia';
import getNodesAndLinks from "../../helpers/getNodesAndLinks";
import getLinksForDisplay from "../../helpers/markLinksForDisplay";
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
            const fieldMap = {};
            fields.forEach(field => fieldMap[field.path] = true);

            payload.items.forEach(item => {
                forEach(item.fields, (value, key) => {
                    if (fieldMap[key]) {
                        // Field already exists
                        return;
                    }

                    const field = createField(fields, key, 'string', search.liveDatasource);
                    fields = fields.concat([field]);
                });
            });
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
            const components = getConnectedComponents(result.nodes, result.links);
            const filtered = filterBoringComponents(components);
            result.nodes = filtered.reduce((prev, current) => prev.concat(current), []);
            result.links = removeDeadLinks(result.nodes, result.links);

            const normalSearches = payload.searches.filter(search => !search.liveDatasource);

            if (normalSearches.length > 1) {
                // If there is more than 1 query, all nodes for subsequent queries
                // need to be linked to nodes from the first query, or a live datasource
                // If some results are not linked, they will not be displayed as nodes

                const components = getConnectedComponents(result.nodes, result.links);

                const primaryQuery = normalSearches[0].q;
                const liveDatasources = payload.searches
                    .filter(search => search.liveDatasource)
                    .map(search => search.liveDatasource);

                const validQueries: string[] = liveDatasources.concat([primaryQuery]);
                const filtered = filterComponentsByQueries(components, validQueries);

                result.nodes = filtered.reduce((prev, current) => prev.concat(current), []);
                result.links = removeDeadLinks(result.nodes, result.links);
            }
        }

        result.nodes = getNodesForDisplay(result.nodes, payload.searches || []);
        result.links = getLinksForDisplay(result.nodes, result.links);

        const normalizedNodes = normalizeNodes(result.nodes, payload.normalizations);
        const normalizedLinks = normalizeLinks(result.links, payload.normalizations);

        result.nodes = normalizedNodes;
        result.links = removeDeadLinks(result.nodes, normalizedLinks);

        let { nodes, links } = applyVia(result.nodes, result.links, payload.via);

        const output: GraphWorkerOutput = {
            nodes: nodes,
            links: links,
            items: payload.prevItems.concat(payload.items),
            fields: fields,
            searches: searches
        };

        this.output.emit('output', output);
    }
}