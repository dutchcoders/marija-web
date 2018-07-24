import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { Datasource } from '../../interfaces/datasource';
import * as styles from './datasourceComponent.scss';
import Icon from '../../../ui/components/icon';
import {
	datasourceActivated,
	datasourceDeactivated, deleteCustomDatasource, updateDatasource
} from '../../datasourcesActions';
import FieldSelector from '../../../fields/components/fieldSelector/fieldSelector';
import { connect } from 'react-redux';
import { Field } from '../../../fields/interfaces/field';
import IconSelector from '../../../fields/components/iconSelector/iconSelector';
import {
	createGetNodesByDatasource
} from '../../../graph/graphSelectors';
import { Node } from '../../../graph/interfaces/node';
import MagicWand from '../../../graph/components/magicWand/magicWand';
import Tooltip from 'rc-tooltip';
import { showAllItemsOfCustomDatasource } from '../../../search/searchActions';

interface Props {
	datasource: Datasource;
	dispatch: any;
	nodes: Node[];
}

interface State {
	expanded: boolean;
	iconSelectorOpen: boolean;
}

class DatasourceComponent extends React.Component<Props, State> {
	state: State = {
		expanded: false,
		iconSelectorOpen: false
	};

	toggleExpanded() {
		const { expanded } = this.state;

		this.setState({
			expanded: !expanded
		});
	}

	onImageChange(field: Field) {
		const { dispatch, datasource } = this.props;

		dispatch(updateDatasource(datasource.id, {
			imageFieldPath: field ? field.path : false
		}));
	}

	onLabelChange(field: Field) {
		const { dispatch, datasource } = this.props;

		dispatch(updateDatasource(datasource.id, {
			labelFieldPath: field ? field.path : false
		}));
	}

	onLocationChange(field: Field) {
		const { dispatch, datasource } = this.props;

		dispatch(updateDatasource(datasource.id, {
			locationFieldPath: field ? field.path : false
		}));
	}

	onDateChange(field: Field) {
		const { dispatch, datasource } = this.props;

		dispatch(updateDatasource(datasource.id, {
			dateFieldPath: field ? field.path : false
		}));
	}

	onSelectIcon(icon: string) {
		const { dispatch, datasource } = this.props;

		dispatch(updateDatasource(datasource.id, {
			icon
		}));

		this.setState({
			iconSelectorOpen: false
		});
	}

	toggleIconSelector(event: MouseEvent) {
		event.stopPropagation();

		const { iconSelectorOpen } = this.state;

		this.setState({
			iconSelectorOpen: !iconSelectorOpen
		});
	}

	deleteCustomDatasource() {
		const { dispatch, datasource } = this.props;

		dispatch(deleteCustomDatasource(datasource));
	}

	showAllItems() {
		const { dispatch, datasource } = this.props;

		dispatch(showAllItemsOfCustomDatasource(datasource));
	}

	render() {
		const { datasource, nodes } = this.props;
		const { expanded, iconSelectorOpen } = this.state;

		return (
			<form className={styles.datasource}>
				<header className={styles.header} onClick={this.toggleExpanded.bind(this)}>
					<div className={styles.icon} onClick={this.toggleIconSelector.bind(this)}>{datasource.icon}</div>
					<MagicWand nodes={nodes} cssClass={styles.magicWand} />
					<h3 className={styles.name}>
						{datasource.name}
					</h3>
					<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')} />
				</header>

				{iconSelectorOpen && (
					<IconSelector onSelectIcon={this.onSelectIcon.bind(this)} />
				)}

				{expanded && (
					<main className={styles.main}>
						<h4 className={styles.optionTitle}>Label</h4>
						<FieldSelector
							datasourceId={datasource.id}
							types={['string', 'text', 'number']}
							selected={datasource.labelFieldPath}
							onChange={this.onLabelChange.bind(this)}
						/>
						<p className={styles.help}>Select a field that will be displayed as the nodes' label on the graph.</p>

						<h4 className={styles.optionTitle}>Image</h4>
						<FieldSelector
							datasourceId={datasource.id}
							types={['image']}
							selected={datasource.imageFieldPath}
							onChange={this.onImageChange.bind(this)}
						/>
						<p className={styles.help}>Select a field with image urls to render nodes as images.</p>

						<h4 className={styles.optionTitle}>Geo location</h4>
						<FieldSelector
							datasourceId={datasource.id}
							types={['location']}
							selected={datasource.locationFieldPath}
							onChange={this.onLocationChange.bind(this)}
						/>
						<p className={styles.help}>Select a field with geo location (in the format: <strong>52.1, 4.2</strong>) to display nodes on the map.</p>

						<h4 className={styles.optionTitle}>Date</h4>
						<FieldSelector
							datasourceId={datasource.id}
							types={['date']}
							selected={datasource.dateFieldPath}
							onChange={this.onDateChange.bind(this)}
						/>
						<p className={styles.help}>Select a field with dates/times to display nodes on the timeline.</p>

						{datasource.isCustom && (
							<div className={styles.customButtons}>
								<button type="button" className={styles.showAll} onClick={this.showAllItems.bind(this)}>Show all items</button>
								<button type="button" className={styles.delete} onClick={this.deleteCustomDatasource.bind(this)}>Delete datasource</button>
							</div>
						)}
					</main>
				)}
			</form>
		);
	}
}

const select = () => {
	const getNodesByDatasource = createGetNodesByDatasource();

	return (state: AppState, ownProps) => ({
		...ownProps,
		nodes: getNodesByDatasource(state, ownProps.datasource.id)
	});
};

export default connect(select)(DatasourceComponent);