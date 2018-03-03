import {graphReceive} from "./actions";
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

onmessage = (event: MessageEvent) => {
    const action = event.data;

    if (action.type !== SEARCH_RECEIVE) {
        // This is the only action type we currently support in this worker
        return;
    }

    const payload = action.payload;
    const items = payload.items.results === null ? [] : payload.items.results;

    const search = payload.searches.find(loop => loop.q === payload.items.query);

    if (!search) {
        console.error('received items for a query we were not searching for: ' + payload.items.query);
        return;
    }

    search.items = search.items.concat(payload.items.results);

    // Save per item for which query we received it (so we can keep track of where data came from)
    items.forEach(item => {
        item.query = search.q;
    });

    // update nodes and links
    const result = getNodesAndLinks(
        payload.prevNodes,
        payload.prevLinks,
        items,
        payload.fields,
        search,
        payload.normalizations,
        search.aroundNodeId,
        payload.deletedNodes
    );

    const normalizedNodes = normalizeNodes(result.nodes, payload.normalizations);
    const normalizedLinks = normalizeLinks(result.links, payload.normalizations);

    result.nodes = normalizedNodes;
    result.links = removeDeadLinks(result.nodes, normalizedLinks);

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

    let { nodes, links } = applyVia(result.nodes, result.links, payload.via);
    nodes = getNodesForDisplay(nodes, payload.searches || []);
    links = getLinksForDisplay(nodes, links);

    postMessage(graphReceive(
        nodes,
        links,
        items
    ));
};