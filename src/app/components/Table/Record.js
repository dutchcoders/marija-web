import React, { Component } from 'react';
import { map, mapValues, reduce } from 'lodash';
import { fieldLocator } from '../../helpers/index';
import { highlightNodes } from '../../modules/graph/index';
import { Icon } from '../../components/index';

export default class Record extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };

        this.handleToggleExpand.bind(this);
    }

    handleToggleExpand(id) {
        const { toggleExpand } = this.props;
        toggleExpand(id);
    }

    render() {
        const { record, columns, node } = this.props;
        const { expanded } = this.props;

        const renderedColumns = (columns || []).map((value) => {
            return (
                <td key={ 'column_' + record.id + value }>
                    <span className={'length-limiter'}
                          title={ fieldLocator(record.fields, value) }>{ fieldLocator(record.fields, value) }</span>
                </td>
            );
        });

        return (
            <tr key={`record_${record.id}`} className={`columns ${expanded ? 'expanded' : 'closed'}`}>
                <td width="25" style={{'textAlign': 'center'}}>
                    <Icon onClick={() => this.handleToggleExpand(record.id) }
                          name={expanded ? 'ion-ios-remove' : 'ion-ios-add'}/>
                </td>
                { renderedColumns}
            </tr>
        );
    }
}
