import * as React from 'react';

import fieldLocator from '../../fields/helpers/fieldLocator';
import { Node } from '../../graph/interfaces/node';
import { Item } from '../../graph/interfaces/item';
import { Search } from '../../search/interfaces/search';
import Icon from '../../ui/components/icon';
import { Column } from '../interfaces/column';
import { AppState } from '../../main/interfaces/appState';
import { getItemNodeByItemId } from '../../graph/graphSelectors';
import { connect } from 'react-redux';
import NodeIcon from '../../graph/components/nodeIcon/nodeIcon';
import { showTooltip } from '../../graph/graphActions';

interface Props {
    toggleExpand: Function;
    record: Item;
    columns: Column[];
    searches: Search[];
    className: string;
    expanded: boolean;
    node: Node;
    dispatch: any;
}

interface State {
}

class Record extends React.Component<Props, State> {
    handleToggleExpand(id) {
        const { toggleExpand } = this.props;
        toggleExpand(id);
    }

    onMouseEnter() {
        const { node, dispatch } = this.props;

        dispatch(showTooltip([node]));
    }

    onMouseLeave() {
		const { dispatch } = this.props;

		dispatch(showTooltip([]));
    }

    render() {
        const { record, columns, className, node } = this.props;
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
            <tr key={`record_${record.id}`}
				onClick={() => this.handleToggleExpand(record.id) }
                onMouseEnter={this.onMouseEnter.bind(this)}
                onMouseLeave={this.onMouseLeave.bind(this)}
				className={`columns record ${className} ${expanded ? 'expanded' : 'closed'}`}>
                <td>
                    <div className="itemIcons">
						<NodeIcon node={node} />
                        <Icon name={expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down'} />
                    </div>
                </td>
                { renderedColumns}
            </tr>
        );
    }
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	node: getItemNodeByItemId(state, ownProps.record.id)
});

export default connect(select)(Record);