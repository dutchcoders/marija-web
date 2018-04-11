import Url from './Url';
import Workspaces from './Workspaces';

export default function persistState() {
    return (next) => (reducer, initialState, enhancer) => {

        initialState = Workspaces.loadCurrentWorkspace(initialState);

        // parse all normalizations
        for (let i=0; i < (initialState.graph.normalizations || []).length; i++) {
            let normalization = initialState.graph.normalizations[i];
            normalization.re = new RegExp(normalization.regex, "i");
        }

        // Add datasources to url to keep local storage and url in sync
        initialState.graph.fields.forEach(field => {
            Url.addQueryParam('fields', field.path);
        });

        return next(reducer, initialState, enhancer);
    };
}
