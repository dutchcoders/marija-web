import { saveAs } from 'file-saver';
import { isEqual, map } from 'lodash';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import {
	MatchingStrategy,
	NodeMatcher
} from '../../../graph/interfaces/nodeMatcher';
import { AppState } from '../../../main/interfaces/appState';
import * as styles from './nodeMatcherComponent.scss';
import {
	createNewNodeMatcher, deleteFromNodeMatcher,
	moveFieldBetweenNodeMatchers,
	setIsDraggingSubFields, setMatchingStrategy
} from '../../../graph/graphActions';
import { Field } from '../../interfaces/field';
import { FormEvent } from 'react';
import Icon from '../../../ui/components/icon';

interface State {
	isHoveringOnDropArea: boolean;
}

interface Props {
	dispatch: Dispatch<any>;
	nodeMatcher: NodeMatcher | null;
	isDragging: boolean;
}

class NodeMatcherComponent extends React.Component<Props, State> {
	state: State = {
		isHoveringOnDropArea: false
	};

	onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	onDragEnter() {
		this.setState({
			isHoveringOnDropArea: true
		});
	}

	onDragLeave() {
		this.setState({
			isHoveringOnDropArea: false
		});
	}

	onDragStart(event: DragEvent, field: Field) {
		const { nodeMatcher } = this.props;

		const data = JSON.stringify({
			fieldPath: field.path,
			fromNodeMatcherName: nodeMatcher.name
		});

		event.dataTransfer.setData('text', data);
	}

	onDrop(event: DragEvent) {
		const { nodeMatcher, dispatch } = this.props;

		const text: string = event.dataTransfer.getData('text');
		let data: any;

		try {
			data = JSON.parse(text);
		} catch (e) {
			return;
		}

		if (nodeMatcher === null) {
			dispatch(createNewNodeMatcher(data.fieldPath, data.fromNodeMatcherName));
		} else {
			dispatch(moveFieldBetweenNodeMatchers(data.fieldPath, data.fromNodeMatcherName, nodeMatcher.name));
		}
	}

	onStrategyChange(event: FormEvent<HTMLInputElement>) {
		const { nodeMatcher, dispatch } = this.props;

		dispatch(setMatchingStrategy(nodeMatcher.name, event.currentTarget.value as MatchingStrategy));
	}

	deleteField(field: Field) {
		const { dispatch, nodeMatcher } = this.props;

		dispatch(deleteFromNodeMatcher(nodeMatcher.name, field.path));
	}

	render() {
		const { isHoveringOnDropArea } = this.state;
		const { nodeMatcher, isDragging } = this.props;

		return (
			<div className={styles.nodeMatcher}>
				{isDragging && nodeMatcher && nodeMatcher.fields.length > 1 && (
					<form className={styles.strategy}>
						<label>
							<input type="radio" name="strategy" checked={nodeMatcher.strategy === 'AND'} value="AND" onChange={this.onStrategyChange.bind(this)}/>
							<span>Match all</span>
						</label>
						<label>
							<input type="radio" name="strategy" checked={nodeMatcher.strategy === 'OR'} value="OR" onChange={this.onStrategyChange.bind(this)}/>
							<span>Match at least one</span>
						</label>
					</form>
				)}

				{nodeMatcher !== null && (
					<ul className={styles.fields}>
						{nodeMatcher.fields.map(field => (
							<li
								key={field.path}
								className={styles.field}
								draggable={true}
								onDragStart={(event: any) => this.onDragStart(event, field)}>
								{field.path}
								<Icon name={styles.delete + ' ion-ios-close'} onClick={() => this.deleteField(field)}/>
							</li>
						))}
					</ul>
				)}

				{isDragging && (
					<div className={styles.dropZone}
						 onDragOver={this.onDragOver.bind(this)}
						 onDrop={this.onDrop.bind(this)}>
						{nodeMatcher === null ? 'Drop field here to create new matcher' : 'Drop field here to make part of matcher'}
					</div>
				)}
			</div>
		);
	}
}


function select(state: AppState, ownProps) {
	return {
		...ownProps
	};
}

export default connect(select)(NodeMatcherComponent);
