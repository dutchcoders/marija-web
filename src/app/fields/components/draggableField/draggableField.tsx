import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { Field } from '../../interfaces/field';
import * as styles from './draggableField.scss';
import Icon from '../../../ui/components/icon';
import {
	setFieldParent,
	setIsDraggingSubFields
} from '../../../graph/graphActions';
import { connect } from 'react-redux';
import {
	FieldHierarchy,
	getFieldHierarchy
} from '../../../graph/graphSelectors';

interface Props {
	parent: Field;
	children: Field[];
	dispatch: any;
	fieldHierarchy: FieldHierarchy[]
}

interface State {
	hoveringOnDropArea: boolean
}

class DraggableField extends React.Component<Props, State> {
	state: State = {
		hoveringOnDropArea: false
	};

	onDragStart(event: DragEvent, field: Field) {
		event.dataTransfer.setData('text', field.path);
	}

	onDragEnter(event: DragEvent) {
		this.setState({
			hoveringOnDropArea: true
		});
	}

	onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	onDragLeave() {
		this.setState({
			hoveringOnDropArea: false
		});
	}

	onDrop(event: DragEvent) {
		const { parent, dispatch, fieldHierarchy } = this.props;

		const child: string = event.dataTransfer.getData('text');

		this.setState({
			hoveringOnDropArea: false
		});

		if (child !== parent.path) {
			console.log(child, parent.path);
			// Check the existing hierarchy for the field we're about to change
			const hierarchy = fieldHierarchy.find(item => item.parent.path === child);

			// If this field was used as a parent before, he's taking all of his children
			// with him to the new parent
			if (hierarchy && hierarchy.children) {
				hierarchy.children.forEach(child => {
					dispatch(setFieldParent(child.path, parent.path));
				})
			}

			dispatch(setFieldParent(child, parent.path));
		}
	}

	render() {
		const { parent, children } = this.props;
		const { hoveringOnDropArea } = this.state;

		return (
			<div className={styles.draggableField}>
				<div className={styles.parent} draggable={true} onDragStart={(event: any) => this.onDragStart(event, parent)}>
					<Icon name="ion-arrow-move" />
					{parent.path}
				</div>

				{children.map(child =>
					<div key={child.path}
						className={styles.child}
						draggable={true}
						onDragStart={(event: any) => this.onDragStart(event, child)}>
						<Icon name="ion-arrow-move" />
						{child.path}
					</div>
				)}

				<div className={styles.drop + (hoveringOnDropArea ? ' ' + styles.hovering : '')}
					onDrop={this.onDrop.bind(this)}
					onDragOver={this.onDragOver.bind(this)}
					onDragEnter={this.onDragEnter.bind(this)}
					onDragLeave={this.onDragLeave.bind(this)}>
					Drop here to set as sub field
				</div>
			</div>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	fieldHierarchy: getFieldHierarchy(state)
});

export default connect(select)(DraggableField);