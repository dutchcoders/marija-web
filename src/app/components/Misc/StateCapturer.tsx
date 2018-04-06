import * as React from 'react';
import { connect } from 'react-redux';

import { Workspaces, Migrations } from '../../domain/index'
import {AppState} from '../../interfaces/appState';

class StateCapturer extends React.Component<any, any> {

    debounce(fn, delay) {
        let timer;

        return function () {
            const context = this;
            const args = arguments;

            clearTimeout(timer);

            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    }

    componentWillReceiveProps(nextProps){
        this.persistWorkspace();
    }

    /**
     * Debounce workspace persisting by 1000ms, so we don't try to do this
     * multiple times per second (better for performance).
     */
    persistWorkspace = this.debounce(() => {
        const { store } = this.props;

        const persistedState = Object.assign({}, store.getState());
        Workspaces.persistCurrentWorkspace(persistedState);
    }, 1000);

    render() {
        return null;
    }
}

function select(state: AppState, ownProps) {
    return {
        ...ownProps,
        columns: state.entries.columns,
        searches: state.entries.searches,
        entries_fields: state.entries.fields,
        date_fields: state.entries.date_fields,
        datasources: state.datasources.datasources,
        normalizations: state.entries.normalizations,
        utils: state.utils,
        fields: state.fields,
    };
}

export default connect(select)(StateCapturer);