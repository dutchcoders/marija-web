import * as React from 'react';
import { Node } from '../../interfaces/node';
import { getNodeImageCanvas } from '../../helpers/getNodeImageCanvas';
import { getNodeCanvas } from '../../helpers/getNodeCanvas';
import { connect } from 'react-redux';
import { AppState } from '../../../main/interfaces/appState';
import { getSelectedNodes } from '../../graphSelectors';
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
		this.prepareIcon();
	}

	prepareIcon() {
		const { node, searches, connectors } = this.props;

		if (node.image) {
			getNodeImageCanvas(node, 1, false)
				.then(canvas => this.setState({
					icon: canvas.toDataURL()
				}));
		} else {
			const canvas = getNodeCanvas(node, 1, false, searches, connectors);

			this.setState({
				icon: canvas.toDataURL()
			});
		}
	}

	render() {
		const { icon } = this.state;

		return <img src={icon} />
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	searches: state.graph.searches,
	connectors: state.fields.connectors,
});

export default connect(select)(NodeIcon);