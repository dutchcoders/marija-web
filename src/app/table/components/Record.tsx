import * as React from 'react';
import fieldLocator from '../../fields/helpers/fieldLocator';
import Icon from '../../ui/components/Icon';
import {Column} from "../interfaces/column";
import {Item} from "../../items/interfaces/item";
import {Node} from "../../graph/interfaces/node";
import {Search} from "../../search/interfaces/search";
import {QueryColorMap} from "../table";

interface Props {
    toggleExpand: Function;
    record: Item;
    columns: Column[];
    selectedNodes: Node[];
    searches: Search[];
    className: string;
    expanded: boolean;
    queryColorMap: QueryColorMap;
}

interface State {
}

export default class Record extends React.Component<Props, State> {
    handleToggleExpand(id) {
        const { toggleExpand } = this.props;
        toggleExpand(id);
    }

    getQueryInfo() {
        const { queryColorMap, record } = this.props;

        const queryElements = [];
        queryColorMap[record.id].forEach(color => {
            queryElements.push(<Icon name='ion-ios-lightbulb' style={{ color: color }} key={color} />);
        });

        return queryElements;
    }

    render() {
        const { record, columns, className } = this.props;
        const { expanded } = this.props;

        const renderedColumns = (columns || []).map((value) => {
            const val = fieldLocator(record.fields, value);

            return (
                <td key={ 'column_' + record.id + value }>
                    <span className={'length-limiter'}>{val}</span>
                </td>
            );
        });

        return (
            <tr key={`record_${record.id}`} className={`columns record ${className} ${expanded ? 'expanded' : 'closed'}`}>
                <td>
                    <div className="itemIcons">
                        <Icon onClick={() => this.handleToggleExpand(record.id) }
                          name={expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down'}/>
                        { this.getQueryInfo() }
                    </div>
                </td>
                { renderedColumns}
            </tr>
        );
    }
}
