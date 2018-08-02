import * as React from 'react';
import * as styles from './magicWand.scss';
import { deselectNodes, highlightNodes, nodesSelect } from '../../graphActions';
import { Node } from '../../interfaces/node';
import { connect } from 'react-redux';
import Icon from '../../../ui/components/icon';

interface Props {
	nodes: Node[];
	cssClass?: string;
	dispatch: any;
}

class MagicWand extends React.Component<Props> {
	selectNodes() {
		const { nodes, dispatch } = this.props;

		let allSelected = true;
		nodes.forEach(node => {
			if (!node.selected) {
				allSelected = false;
			}
		});

		if (allSelected) {
			dispatch(deselectNodes(nodes));
		} else {
			dispatch(nodesSelect(nodes));
		}
	}

	highlightNodes() {
		const { nodes, dispatch } = this.props;

		dispatch(highlightNodes(nodes));
	}

	unHighlightNodes() {
		const { dispatch } = this.props;

		dispatch(highlightNodes([]));
	}

	render() {
		const { nodes, cssClass } = this.props;

		return (
			<button
				className={styles.button + ' ' + cssClass}
				onClick={this.selectNodes.bind(this)}
				onMouseEnter={this.highlightNodes.bind(this)}
				onMouseLeave={this.unHighlightNodes.bind(this)}>
				{nodes.length}
				<Icon name="ion-ios-color-wand" />
			</button>
		)
	}
}

export default connect()(MagicWand);