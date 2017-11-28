import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import {fieldAdd} from "../../modules/data/actions";

class ResumeSession extends Component {
    componentDidMount() {
        const { history, location, dispatch } = this.props;

        const parsed = queryString.parse(location.search);

        if (parsed.fields) {
            this.addFields(parsed.fields.split(','));
        }
    }

    addFields(fields) {
        const { dispatch } = this.props;

        console.log('found fields from url', fields);

        fields.forEach(field => {
            dispatch(fieldAdd({
                icon: 'A',
                path: field
            }));
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