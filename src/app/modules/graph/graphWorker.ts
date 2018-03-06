import {graphWorkerOutput} from "./actions";
import removeDeadLinks from '../../helpers/removeDeadLinks';
import filterSecondaryComponents from '../../helpers/filterSecondaryComponents';
import getConnectedComponents from '../../helpers/getConnectedComponents';
import getNodesForDisplay from '../../helpers/getNodesForDisplay';
import applyVia from '../../helpers/applyVia';
import getNodesAndLinks from "../../helpers/getNodesAndLinks";
import getLinksForDisplay from "../../helpers/getLinksForDisplay";
import normalizeLinks from "../../helpers/normalizeLinks";
import normalizeNodes from "../../helpers/normalizeNodes";
import filterBoringComponents from "../../helpers/filterBoringComponents";
import {SEARCH_RECEIVE} from "../search/constants";
import {Field} from "../../interfaces/field";
import createField from "../../helpers/createField";
import {Search} from "../../interfaces/search";
import {forEach} from 'lodash';

onmessage = (event: MessageEvent) => {
    const action = event.data;

    if (action.type !== SEARCH_RECEIVE) {
        // This is the only action type we currently support in this worker
        return;
    }

    const payload = action.payload;
    const items = payload.items.results === null ? [] : payload.items.results;

    const search: Search = payload.searches.find(loop => loop.q === payload.items.query);

    if (!search) {
        console.error('received items for a query we were not searching for: ' + payload.items.query);
        return;
    }

    search.items = search.items.concat(payload.items.results);

    const isLive: boolean = search.liveDatasource !== null;

    // Save per item for which query we received it (so we can keep track of where data came from)
    items.forEach(item => {
        item.query = search.q;
    });


    let fields = payload.fields;

    // For live datasources we automatically add all the fields that are present in the items
    if (isLive) {
        items.forEach(item => {
            forEach(item.fields, (value, key) => {
                const existing: Field = fields.find(field => field.path === key);

                if (typeof existing === 'undefined') {
                    const field = createField(fields, key, 'string', search.liveDatasource);
                    fields = fields.concat([field]);
                }
            });
        });
    }

    // update nodes and links
    const result = getNodesAndLinks(
        payload.prevNodes,
        payload.prevLinks,
        items,
        fields,
        search,
        payload.normalizations,
        search.aroundNodeId,
        payload.deletedNodes
    );

    const normalizedNodes = normalizeNodes(result.nodes, payload.normalizations);
    const normalizedLinks = normalizeLinks(result.links, payload.normalizations);

    result.nodes = normalizedNodes;
    result.links = removeDeadLinks(result.nodes, normalizedLinks);

    // For live searches we display everything, we don't filter boring components etc.
    if (!isLive) {
        const components = getConnectedComponents(result.nodes, result.links);
        const filtered = filterBoringComponents(components);
        result.nodes = filtered.reduce((prev, current) => prev.concat(current), []);
        result.links = removeDeadLinks(result.nodes, result.links);

        if (payload.searches.length > 1) {
            // If there is more than 1 query, all nodes for subsequent queries
            // need to be linked to nodes from the first query
            // If some results are not linked, they will not be displayed as nodes

            const components = getConnectedComponents(result.nodes, result.links);
            const primaryQuery = payload.searches[0].q;
            const filtered = filterSecondaryComponents(primaryQuery, components);
            result.nodes = filtered.reduce((prev, current) => prev.concat(current), []);
            result.links = removeDeadLinks(result.nodes, result.links);
        }
    }

    let { nodes, links } = applyVia(result.nodes, result.links, payload.via);
    nodes = getNodesForDisplay(nodes, payload.searches || []);
    links = getLinksForDisplay(nodes, links);

    postMessage(graphWorkerOutput(
        nodes,
        links,
        items,
        fields
    ));
};