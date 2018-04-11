import * as React from 'react';

import fieldLocator from '../../fields/helpers/fieldLocator';
import Icon from '../../ui/components/icon';

export default class Record extends React.Component<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            editNode: null,
            expanded: false
        };
    }

    toggleExpand(id) {
        this.setState({expanded: !this.state.expanded});
    }

    render() {
        const { record, columns } = this.props;
        const { expanded } = this.state;

        const renderedColumns = (columns || []).map((value) => {
            const field_value = record.highlight[value] || fieldLocator(record.fields, value) ;
            return (
                <td key={ 'column_' + record.id + value }>
                    <span className={'length-limiter'}
                          title={ fieldLocator(record.fields, value) } dangerouslySetInnerHTML={{ __html: value }}></span>
                </td>
            );
        });

        return (
            <tr className={`columns ${expanded ? 'expanded' : 'closed'}`}>
                <td style={{'textAlign': 'center'}}>
                    <Icon onClick={() => this.toggleExpand(record.id) }
                          name={expanded ? 'ion-ios-remove' : 'ion-ios-add'}/>
                </td>
                { renderedColumns}
            </tr>
        );
    }
}
