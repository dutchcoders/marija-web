import * as React from 'react';
import { Node } from '../../interfaces/node';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import * as styles from './filteredNode.scss';
import NodeIcon from '../nodeIcon/nodeIcon';
import { deselectNodes, nodesSelect } from '../../graphActions';

interface Props {
	node: Node;
	dispatch: any;
}

class FilteredNode extends React.Component<Props> {
	select() {
		const { node, dispatch } = this.props;

		if (node.selected) {
			dispatch(deselectNodes([node]));
		} else {
			dispatch(nodesSelect([node]));
		}
	}

	render() {
		const { node } = this.props;

		return (
			<li className={styles.node} onClick={this.select.bind(this)}>
				<NodeIcon node={node}/>
				{node.name}
			</li>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps
});

export default connect(select)(FilteredNode);