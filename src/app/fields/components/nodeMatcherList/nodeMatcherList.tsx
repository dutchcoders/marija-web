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
	isHoveringOnDropZone: boolean;
	showAdvancedInfo: boolean;
}

interface Props {
	dispatch: Dispatch<any>;
	nodeMatchers: NodeMatcher[];
}

class NodeMatcherList extends React.Component<Props, State> {
	state: State = {
		isDragging: false,
		isHoveringOnDropZone: false,
		showAdvancedInfo: false,
	};

	toggleSubFieldInfo() {
		const { showAdvancedInfo } = this.state;

		this.setState({
			showAdvancedInfo: !showAdvancedInfo
		});
	}

	toggleAdvanced() {
		const { isDragging } = this.state;

		this.setState({
			isDragging: !isDragging
		});
	}

	resetChildField(event: DragEvent) {
		const { dispatch } = this.props;

		const fieldPath: string = event.dataTransfer.getData('text');

		// dispatch(setFieldParent(fieldPath, null));

		this.setState({
			isHoveringOnDropZone: false
		});
	}

	onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	onDragEnter() {
		this.setState({
			isHoveringOnDropZone: true
		});
	}

	onDragLeave() {
		this.setState({
			isHoveringOnDropZone: false
		});
	}

	render() {
		const { isDragging, isHoveringOnDropZone, showAdvancedInfo } = this.state;
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

				{showAdvancedInfo ? (
					<button className={styles.toggleAdvancedInfo}
							onClick={this.toggleSubFieldInfo.bind(this)}>
						Hide
					</button>
				) : (
					<button className={styles.toggleAdvancedInfo}
							onClick={this.toggleSubFieldInfo.bind(this)}>
						What's this?
					</button>
				)}

				{showAdvancedInfo && (
					<p className={styles.advancedInfo}>
						Fields that you select as sub fields will not
						be displayed as nodes on the graph. However, their data is
						used to create connections between their main nodes.
					</p>
				)}
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
