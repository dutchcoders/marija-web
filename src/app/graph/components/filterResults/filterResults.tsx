import * as React from 'react';
import { Node } from '../../interfaces/node';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { selectFilteredNodes } from '../../graphSelectors';
import * as styles from './filterResults.scss';
import FilteredNode from '../filteredNode/filteredNode';
import { deselectNodes, nodesSelect } from '../../graphActions';

interface Props {
	nodes: Node[];
	dispatch: any;
}

class FilterResults extends React.Component<Props> {
	selectAll() {
		const { nodes, dispatch } = this.props;

		dispatch(nodesSelect(nodes));
	}

	deselectAll() {
		const { nodes, dispatch } = this.props;

		dispatch(deselectNodes(nodes));
	}

	render() {
		const { nodes } = this.props;

		const selected = nodes.filter(node => node.selected).length;

		return (
			<div className={styles.container}>
				<ul className={styles.results}>
					{nodes.map(node =>
						<FilteredNode key={node.id} node={node} />
					)}
				</ul>
				<div className={styles.actions}>
					<p className={styles.count}>
						{nodes.length} Nodes found. Selected {selected}.
					</p>
					<button
						className={styles.button}
						onClick={this.selectAll.bind(this)}
					>Select all</button>
					<button
						className={styles.button}
						onClick={this.deselectAll.bind(this)}
					>Deselect all</button>
				</div>
			</div>
		);
	}
}

const select = (state: AppState) => ({
	nodes: selectFilteredNodes(state)
});

export default connect(select)(FilterResults);