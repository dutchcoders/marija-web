import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { getSelectedNodes, selectItemFields } from '../../graphSelectors';
import ValueTable from '../valueTable/valueTable';
import * as styles from './valueTableContainer.scss';
import { FormEvent } from 'react';
import Icon from '../../../ui/components/icon';
import { Node } from '../../interfaces/node';
import { nodesSelect } from '../../graphActions';

interface Props {
	fields: string[];
	selectedNodes: Node[];
	nodes: Node[];
	dispatch: any;
}

interface State {
	field: string;
	search: string;
}

class ValueTableContainer extends React.Component<Props, State> {
	state: State = {
		field: '',
		search: ''
	};

	onFieldChange(event: FormEvent<HTMLSelectElement>) {
		this.setState({
			field: event.currentTarget.value
		});
	}

	onSearchChange(event: FormEvent<HTMLInputElement>) {
		this.setState({
			search: event.currentTarget.value
		});
	}

	selectAllNodes() {
		const { dispatch, nodes } = this.props;

		dispatch(nodesSelect(nodes));
	}

	render() {
		const { fields, selectedNodes } = this.props;
		const { field, search } = this.state;

		return (
			<div className={styles.container}>

				<div className={styles.filters}>
					<div className={styles.filter}>
						<label className={styles.label}>Filter by field: </label>
						<select value={field} onChange={this.onFieldChange.bind(this)} className={styles.select}>
							<option value="">All fields</option>
							{fields.map(fieldLoop =>
								<option key={fieldLoop} value={fieldLoop}>{fieldLoop}</option>
							)}
						</select>
					</div>

					<div className={styles.filter}>
						<input
							value={search}
							onChange={this.onSearchChange.bind(this)}
							className={styles.searchInput}
							placeholder="Type to filter"
						/>
						<Icon name={'ion-ios-search ' + styles.searchIcon} />
					</div>
				</div>

				{selectedNodes.length > 0
					? <ValueTable field={field} search={search} />
					: (
						<div className={styles.noNodes}>
							<p className={styles.noNodes}>Select nodes to display the unique values found in their data.</p>
							<button onClick={this.selectAllNodes.bind(this)} className={styles.button}>Select all nodes</button>
						</div>
					)
				}
			</div>
		)
	}
}

const select = (state: AppState) => ({
	fields: selectItemFields(state),
	selectedNodes: getSelectedNodes(state),
	nodes: state.graph.nodes
});

export default connect(select)(ValueTableContainer);