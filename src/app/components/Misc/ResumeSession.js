import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import {fieldAdd} from "../../modules/data/actions";
import {activateIndex} from "../../modules/indices/actions";
import {requestItems} from "../../modules/search/actions";

class ResumeSession extends Component {
    componentDidMount() {
        const { history, location, dispatch } = this.props;

        const parsed = queryString.parse(location.search);

        if (parsed.fields) {
            this.addFields(parsed.fields.split(','));
        }

        if (parsed.datasources) {
            this.addDatasources(parsed.datasources.split(','));
        }

        if (parsed.search) {
            this.search(parsed.search.split(','));
        }
    }

    addFields(fields) {
        const { dispatch } = this.props;

        console.log('found fields from url', fields);

        fields.forEach(field => {
            dispatch(fieldAdd(field));
        });
    }

    addDatasources(ids) {
        const { dispatch } = this.props;

        console.log('found data sources from url');

        ids.forEach(id => {
            dispatch(activateIndex(id));
        });
    }

    search(terms) {
        const { dispatch } = this.props;

        dispatch((dispatch, getState) => {
            // Get the updated state, because it might have changed by
            // adding datasources from the url
            const datasources = getState().indices.activeIndices;

            terms.forEach(term => {
                dispatch(requestItems({
                    query: term,
                    datasources: datasources,
                    from: 0,
                    size: 500,
                    color: '#de79f2'
                }));
            });
        });
    }

    render() {
        return null;
    }
}

// Empty function, needed for mapping dispatch method to the props
const select = () => {
    return {};
};

export default connect(select)(ResumeSession);