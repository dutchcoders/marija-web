import { concat } from 'lodash';

export default function persistState() {
    return (next) => (reducer, initialState, enhancer) => {
        if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
            enhancer = initialState;
            initialState = {
                entries: {
                    fields: [],
                    columns: [],
                    indexes: [],
                }
            };
        }

        try {
            initialState.entries.fields = JSON.parse(localStorage.getItem("fields"));
        } catch (e) {
            console.warn('failed to retrieve initialize state from localstorage:', e);
        }

        try {
            initialState.entries.columns = JSON.parse(localStorage.getItem("columns"));
        } catch (e) {
            console.warn('failed to retrieve initialize state from localstorage:', e);
        }

        try {
            initialState.entries.indexes = concat(initialState.entries.indexes, JSON.parse(localStorage.getItem("indexes")));
        } catch (e) {
            console.warn('Failed to retrieve initialize state from localStorage:', e);
        }

        const store = next(reducer, initialState, enhancer);

        store.subscribe(() => {
            const state = store.getState();

            try {
                localStorage.setItem("columns", JSON.stringify(state.entries.columns));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }

            try {
                localStorage.setItem("fields", JSON.stringify(state.entries.fields));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }

            try {
                localStorage.setItem("indexes", JSON.stringify(state.entries.indexes));
            } catch (e) {
                console.warn('Unable to persist state to localStorage:', e);
            }
        });

        return store;
    };
}
