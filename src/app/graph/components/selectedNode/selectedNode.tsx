import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { Node } from '../../interfaces/node';
import { deselectNodes, nodesSelect, showTooltip } from '../../graphActions';
import Icon from '../../../ui/components/icon';
import * as styles from './selectedNode.scss';
import {
	getSelectedNodes
} from '../../graphSelectors';
import NodeIcon from '../nodeIcon/nodeIcon';
import getDirectlyRelatedNodes from '../../helpers/getDirectlyRelatedNodes';
import { Link } from '../../interfaces/link';

interface Props {
	node: Node;
	isOnlySelectedNode: boolean;
	selectedNodes: Node[];
	nodesForDisplay: Node[];
	linksForDisplay: Link[];
	dispatch: any;
}

interface State {
	expanded: boolean;
	userSelectedExpanded: boolean;
	nodeImages: any;
}

class SelectedNode extends React.Component<Props, State> {
	state: State = {
		expanded: false,
		nodeImages: {},
		userSelectedExpanded: false
	};

	componentDidMount() {
		const { isOnlySelectedNode } = this.props;

		if (isOnlySelectedNode) {
			this.setState({
				expanded: true
			});
		}
	}

	componentWillReceiveProps(props: Props) {
		const { userSelectedExpanded } = this.state;

		if (userSelectedExpanded) {
			// If the user already clicked on the expand toggle, don't do any
			// magic of automatically opening/closing the node.
			return;
		}

		this.setState({
			expanded: props.isOnlySelectedNode
		});
	}

	displayTooltip(node) {
		const { dispatch } = this.props;

		dispatch(showTooltip([node]));
	}

	hideTooltip() {
		const { dispatch } = this.props;

		dispatch(showTooltip([]));
	}

	deselectOthers(event: MouseEvent) {
		event.stopPropagation();

		const { dispatch, selectedNodes, node } = this.props;

		dispatch(deselectNodes(selectedNodes));
		dispatch(nodesSelect([node]));
	}

	deselect(event: MouseEvent) {
		event.stopPropagation();

		const { dispatch, node } = this.props;

		dispatch(deselectNodes([node]));
	}

	toggleExpanded() {
		const { expanded } = this.state;

		this.setState({
			expanded: !expanded,
			userSelectedExpanded: true
		});
	}

	renderItemMain() {
		const { node, nodesForDisplay, linksForDisplay } = this.props;

		const connectors = getDirectlyRelatedNodes([node], nodesForDisplay, linksForDisplay)
			.filter(search => search.id !== node.id);

		return (
			<ul className={styles.level2}>
				{connectors.map(connector => {
					const items = getDirectlyRelatedNodes([connector], nodesForDisplay, linksForDisplay)
						.filter(search => search.id !== node.id && search.id !== connector.id);

					return (
						<li className={styles.level2Element} key={connector.id}>
							<header
								className={styles.level2Header}
								onMouseEnter={() => this.displayTooltip(connector)}
								onMouseLeave={this.hideTooltip.bind(this)}>

								<NodeIcon node={connector}/>
								<span className={styles.name}>Same {connector.fields.join(',')}: {connector.name}</span>
							</header>
							<ul className={styles.level3}>
								{items.map(item => {
									return (
										<li key={item.id}
											className={styles.level3Element}
											onMouseEnter={() => this.displayTooltip(item)}
											onMouseLeave={this.hideTooltip.bind(this)}>

											<NodeIcon node={item}/>
											<span className={styles.name}>{item.name}</span>
										</li>
									);
								})}
							</ul>
						</li>
					);
				})}
			</ul>
		);
	}

	renderConnectorMain() {
		const { node, nodesForDisplay, linksForDisplay } = this.props;

		const items = getDirectlyRelatedNodes([node], nodesForDisplay, linksForDisplay)
			.filter(search => search.id !== node.id);

		return (
			<ul className={styles.level2}>
				{items.map(item => {
					return (
						<li
							className={styles.level2Element}
							key={item.id}
							onMouseEnter={() => this.displayTooltip(item)}
							onMouseLeave={this.hideTooltip.bind(this)}>

							<header className={styles.level2Header}>
								<NodeIcon node={item}/>
								<span className={styles.name}>{item.name}</span>
							</header>
						</li>
					);
				})}
			</ul>
		);
	}

	render() {
		const { node, isOnlySelectedNode } = this.props;
		const { expanded } = this.state;

		return (
			<li className={styles.node}>
				<header
					className={styles.header}
					onClick={this.toggleExpanded.bind(this)}
					onMouseEnter={() => this.displayTooltip(node)}
					onMouseLeave={this.hideTooltip.bind(this)}>
					<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')}/>
					<div className={styles.icon}>
						<NodeIcon node={node} />
					</div>
					<span className={styles.name}>{node.name}</span>
					<div className={styles.buttons}>
						<button className={styles.button} onClick={this.deselect.bind(this)}>deselect</button>
						{!isOnlySelectedNode && (
							<button className={styles.button} onClick={this.deselectOthers.bind(this)}>deselect others</button>
						)}
					</div>
				</header>
				{expanded && node.type === 'item' ? this.renderItemMain() : null}
				{expanded && node.type === 'connector' ? this.renderConnectorMain() : null}
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
	selectedNodes: getSelectedNodes(state),
	nodesForDisplay: state.graph.nodes,
	linksForDisplay: state.graph.links
});

export default connect(select)(SelectedNode);