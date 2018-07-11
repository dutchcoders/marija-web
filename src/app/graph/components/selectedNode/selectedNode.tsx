import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { Node } from '../../interfaces/node';
import { deselectNodes, nodesSelect, showTooltip } from '../../graphActions';
import { forEach } from 'lodash';
import { Search } from '../../../search/interfaces/search';
import Icon from '../../../ui/components/icon';
import * as styles from './selectedNode.scss';
import { getSelectedNodes } from '../../graphSelectors';

interface Props {
	node: Node;
	selectedNodes: Node[];
	searches: Search[];
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

	getQueryColor(searchId: string) {
		const { searches } = this.props;
		const search = searches.find(search => search.searchId === searchId);

		if (typeof search !== 'undefined') {
			return search.color;
		}
	}

	getImageKey(node) {
		return node.icon
			+ node.searchIds.map(searchId => this.getQueryColor(searchId)).join('');
	}

	prepareImage(key, node) {
		const { nodeImages } = this.state;

		if (nodeImages[key]) {
			return;
		}

		const width = 20;
		const height = 20;
		const radius = width / 2;

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');

		const fractionPerQuery = 1 / node.searchIds.length;
		const anglePerQuery = 2 * Math.PI * fractionPerQuery;
		let currentAngle = .5 * Math.PI;

		node.searchIds.forEach(searchId => {
			ctx.beginPath();
			ctx.fillStyle = this.getQueryColor(searchId);
			ctx.moveTo(radius, radius);
			ctx.arc(radius, radius, radius, currentAngle, currentAngle + anglePerQuery);
			ctx.fill();

			currentAngle += anglePerQuery;
		});

		ctx.fillStyle = '#ffffff';
		ctx.font = 'italic 12px Roboto, Helvetica, Arial';
		ctx.textAlign = 'center';
		ctx.fillText(node.icon, radius - 1, radius + 5);

		this.setState(prevState => ({
			nodeImages: {
				...prevState.nodeImages,
				[key]: canvas.toDataURL()
			}
		}));
	}

	prepareImages(nodes) {
		const keys = {};

		nodes.forEach(node => {
			const key = this.getImageKey(node);

			if (typeof keys[key] === 'undefined') {
				keys[key] = node;
			}
		});

		forEach(keys, (node, key) => {
			this.prepareImage(key, node);
		});
	}

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

	componentWillReceiveProps(nextProps: Props) {
		const { selectedNodes } = nextProps;

		this.prepareImages(selectedNodes);
	}

	componentWillMount() {
		const { selectedNodes } = this.props;

		this.prepareImages(selectedNodes);
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

		const image = this.state.nodeImages[this.getImageKey(node)];

		return (
			<li onMouseEnter={() => this.displayTooltip()} className={styles.node}>
				<header className={styles.header} onClick={this.toggleExpanded.bind(this)}>
					<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')}/>
					<img className={styles.icon} src={image} />
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