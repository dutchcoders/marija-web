import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { Node } from '../../interfaces/node';
import { deselectNodes, nodesSelect, showTooltip } from '../../graphActions';
import { Search } from '../../../search/interfaces/search';
import Icon from '../../../ui/components/icon';
import * as styles from './selectedNode.scss';
import { getSelectedNodes } from '../../graphSelectors';
import { Connector } from '../../interfaces/connector';
import NodeIcon from '../nodeIcon/nodeIcon';

interface Props {
	node: Node;
	selectedNodes: Node[];
	searches: Search[];
	connectors: Connector[];
	dispatch: any;
}

interface State {
	expanded: boolean;
	nodeImages: any;
}

class SelectedNode extends React.Component<Props, State> {
	state: State = {
		expanded: false,
		nodeImages: {}
	};

	displayTooltip() {
		const { dispatch, node } = this.props;

		dispatch(showTooltip([node]));
	}

	focus() {
		const { dispatch, selectedNodes, node } = this.props;

		dispatch(deselectNodes(selectedNodes));
		dispatch(nodesSelect([node]));
	}

	deselect() {
		const { dispatch, node } = this.props;

		dispatch(deselectNodes([node]));
	}

	toggleExpanded() {
		const { expanded } = this.state;

		this.setState({
			expanded: !expanded
		});
	}

	render() {
		const { node } = this.props;
		const { expanded } = this.state;

		return (
			<li onMouseEnter={() => this.displayTooltip()} className={styles.node}>
				<header className={styles.header} onClick={this.toggleExpanded.bind(this)}>
					<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')}/>
					<div className={styles.icon}>
						<NodeIcon node={node} />
					</div>
					<span className={styles.name}>{node.name}</span>
				</header>
				{expanded && (
					<main className={styles.main}>
						MAIN
					</main>
				)}
				{/*<span className='description'>{node.description}</span>*/}
				{/*<button className={styles.focus} onClick={() => this.focus()}>Focus</button>*/}
				{/*<button className={styles.deselect} onClick={() => this.deselect()}>Deselect</button>*/}
			</li>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	searches: state.graph.searches,
	selectedNodes: getSelectedNodes(state)
});

export default connect(select)(SelectedNode);