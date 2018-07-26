import * as React from 'react';
import { Node } from '../../interfaces/node';
import { getNodeImageCanvas } from '../../helpers/getNodeImageCanvas';
import { getNodeCanvas } from '../../helpers/getNodeCanvas';
import { connect } from 'react-redux';
import { AppState } from '../../../main/interfaces/appState';
import * as styles from './nodeIcon.scss';
import { Search } from '../../../search/interfaces/search';
import { Connector } from '../../interfaces/connector';

interface Props {
	node: Node;
	searches: Search[];
	connectors: Connector[];
}

interface State {
	icon: string;
}

class NodeIcon extends React.Component<Props, State> {
	state: State = {
		icon: null
	};

	componentWillMount() {
		this.prepareIcon(this.props);
	}

	componentWillReceiveProps(nextProps: Props) {
		const { node } = this.props;

		// Update the icon if the node got selected or deselected
		if (node.selected !== nextProps.node.selected) {
			this.prepareIcon(nextProps);
		}
	}

	prepareIcon(props: Props) {
		const { node, searches, connectors } = props;

		if (node.image) {
			getNodeImageCanvas(node, 1, false)
				.then(canvas => this.setState({
					icon: canvas.toDataURL()
				}));
		} else {
			const canvas = getNodeCanvas(node, 1, node.selected, searches, connectors);

			this.setState({
				icon: canvas.toDataURL()
			});
		}
	}

	render() {
		const { icon } = this.state;

		return <img className={styles.image} src={icon} />
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	searches: state.graph.searches,
	connectors: state.fields.connectors,
});

export default connect(select)(NodeIcon);