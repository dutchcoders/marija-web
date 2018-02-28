import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import {dateFieldAdd, fieldAdd} from "../../modules/data/actions";
import {activateDatasource} from "../../modules/datasources/actions";
import {searchRequest} from "../../modules/search/actions";
import Url from "../../domain/Url";

class ResumeSession extends Component {
    componentDidMount() {
        const { history, location, datasources } = this.props;

        const parsed = queryString.parse(location.search);

        if (parsed.fields) {
            this.addFields(parsed.fields.split(','));
        }

        if (parsed['date-fields']) {
            this.addDateFields(parsed['date-fields'].split(','));
        }

        if (parsed.search) {
            this.search(parsed.search.split(','));
        }

        this.addDatasources(datasources);
    }

    componentWillReceiveProps(nextProps) {
        this.addDatasources(nextProps.datasources);
    }

    addFields(fields) {
        const { dispatch } = this.props;

        fields.forEach(field => {
            dispatch(fieldAdd({
                path: field
            }));
        });
    }

    addDateFields(fields) {
        const { dispatch } = this.props;

        fields.forEach(field => {
            dispatch(dateFieldAdd({
                path: field
            }));
        });
    }

    addDatasources(existingDatasources) {
        const { dispatch, location } = this.props;

        const parsed = queryString.parse(location.search);

        if (!parsed.datasources) {
            return;
        }

        const ids = parsed.datasources.split(',');

        ids.forEach(id => {
            const datasource = existingDatasources.find(search => search.id === id);

            if (datasource && !datasource.active) {
                dispatch(activateDatasource(id));
            }
        });
    }

    search(terms) {
        const { dispatch } = this.props;

        dispatch((dispatch, getState) => {
            const state = getState();

            // Get the updated state, because it might have changed by
            // adding datasources from the url
            const datasources = state.datasources.datasources.filter(datasource => datasource.active);

            if (datasources.length === 0) {
                this.cancelSearch();
                return;
            }

            const fields = state.entries.fields;

            if (fields.length === 0) {
                this.cancelSearch();
                return;
            }

            terms.forEach(term => {
                dispatch(searchRequest({
                    query: term,
                    datasources: datasources,
                    from: 0,
                    size: 500,
                    fields: fields
                }));
            });
        });
    }

    /**
     * Tried to perform search, but couldnt continue. Remove the search queries
     * from the url
     */
    cancelSearch() {
        Url.removeAllQueryParams('search');
    }

    render() {
        return null;
    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
        datasources: state.datasources.datasources,
    };
};

export default connect(select)(ResumeSession);