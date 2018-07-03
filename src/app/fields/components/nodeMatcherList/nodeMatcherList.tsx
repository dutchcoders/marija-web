import { saveAs } from 'file-saver';
import { isEqual, map } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { NodeMatcher } from '../../../graph/interfaces/nodeMatcher';
import { AppState } from '../../../main/interfaces/appState';
import * as styles from './nodeMatcherList.scss';
import NodeMatcherComponent from '../nodeMatcherComponent/nodeMatcherComponent';

interface State {
	isDragging: boolean;
}

interface Props {
	dispatch: Dispatch<any>;
	nodeMatchers: NodeMatcher[];
}

class NodeMatcherList extends React.Component<Props, State> {
	state: State = {
		isDragging: false
	};

	toggleAdvanced() {
		const { isDragging } = this.state;

		this.setState({
			isDragging: !isDragging
		});
	}

	render() {
		const { isDragging } = this.state;
		const { nodeMatchers } = this.props;

		return (
			<div className={styles.nodeMatchers}>
				<h2>Matchers</h2>

				{nodeMatchers.map(nodeMatcher => (
					<NodeMatcherComponent nodeMatcher={nodeMatcher} isDragging={isDragging} key={nodeMatcher.name} />
				))}

				{isDragging &&
					<NodeMatcherComponent nodeMatcher={null} isDragging={true} />
				}

				<button className={styles.toggleAdvanced} onClick={this.toggleAdvanced.bind(this)}>
					{isDragging ? 'Done' : 'Advanced'}
				</button>
			</div>
		);
	}
}


function select(state: AppState) {
	return {
		nodeMatchers: state.graph.nodeMatchers
	};
}

export default connect(select)(NodeMatcherList);
