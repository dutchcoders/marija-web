import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {dateFieldAdd, fieldAdd, viaAdd} from "../../modules/data/actions";
import {
    activateLiveDatasource,
    searchRequest
} from "../../modules/search/searchActions";
import Url from "../../helpers/Url";
import {Field} from "../../modules/fields/interfaces/field";
import {Via} from "../../modules/graph/interfaces/via";
import {AppState} from "../../interfaces/appState";

interface Props {
    history: any;
    location: any;
    datasources: any;
    dispatch: Dispatch<any>;
}

interface State {
}

class ResumeSession extends React.Component<Props, State> {
    componentDidMount() {
        const data = Url.getData();

        if (data.fields) {
            this.addFields(data.fields);
        }

        if (data['date-fields']) {
            this.addDateFields(data['date-fields']);
        }

        if (data.search) {
            data.search.forEach(search => {
                this.search(search.q, search.d);
            });
        }

        if (data.via) {
            data.via.forEach(via => {
                this.addVia(via);
            });
        }
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
            const dateField = {
                path: field
            } as Field;

            dispatch(dateFieldAdd(dateField));
        });
    }

    search(query: string, datasources: string[]) {
        const { dispatch } = this.props;

        dispatch(searchRequest(query, datasources));
    }

    addVia(viaData) {
        const { dispatch } = this.props;

        const via: Via = {
            from: viaData.f,
            via: viaData.v,
            to: viaData.t
        };

        dispatch(viaAdd(via));
    }

    render() {
        return null;
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
        datasources: state.datasources.datasources,
    };
};

export default connect(select)(ResumeSession);