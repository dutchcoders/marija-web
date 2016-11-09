import { concat, merge } from 'lodash';

export default function persistState() {
    return (next) => (reducer, initialState, enhancer) => {
        try {
            const fields = JSON.parse(localStorage.getItem("fields"));
            initialState.entries.fields = merge(initialState.entries.fields, fields);
        } catch (e) {
            console.warn('failed to retrieve initialize state from localstorage:', e);
        }

        try {
            const date_fields = JSON.parse(localStorage.getItem("date_fields"));
            initialState.entries.date_fields = merge(initialState.entries.date_fields, date_fields);
        } catch (e) {
            console.warn('failed to retrieve initialize state from localstorage:', e);
        }

        try {
            const columns = JSON.parse(localStorage.getItem("columns"));
            initialState.entries.columns = merge(initialState.entries.columns, columns);
        } catch (e) {
            console.warn('failed to retrieve initialize state from localstorage:', e);
        }

        try {
            const activeIndices = JSON.parse(localStorage.getItem("active_indices"));
            initialState.indices.activeIndices = merge(initialState.indices.activeIndices, activeIndices);
        } catch (e) {
            console.warn('failed to retrieve initialize state from localstorage:', e);
        }

        try {
            const indices = JSON.parse(localStorage.getItem("indexes"));
            initialState.entries.indexes = merge(initialState.entries.indexes, indices);
        } catch (e) {
            console.warn('Failed to retrieve initialize state from localStorage:', e);
        }

        try {
            const servers = JSON.parse(localStorage.getItem("servers"));
            initialState.servers = merge(initialState.servers, servers);
        } catch (e) {
            console.warn('Failed to retrieve initialize state from localStorage:', e);
        }


        const store = next(reducer, initialState, enhancer);


        store.subscribe(() => {
            const state = store.getState();

            // todo(nl5887): verify if changed

            try {
                localStorage.setItem("columns", JSON.stringify(state.entries.columns));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }

            try {
                localStorage.setItem("active_indices", JSON.stringify(state.indices.activeIndices));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }

            try {
                localStorage.setItem("fields", JSON.stringify(state.entries.fields));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }

            try {
                localStorage.setItem("date_fields", JSON.stringify(state.entries.date_fields));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }

            try {
                localStorage.setItem("indexes", JSON.stringify(state.entries.indexes));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }

            try {
                localStorage.setItem("servers", JSON.stringify(state.servers));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }
        });

        return store;
    };
}
