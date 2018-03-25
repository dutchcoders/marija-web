import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {dateFieldAdd, fieldAdd} from "../../modules/data/actions";
import {searchRequest} from "../../modules/search/actions";
import Url from "../../domain/Url";
import {Field} from "../../interfaces/field";

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