import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { Datasource } from '../../interfaces/datasource';
import * as styles from './datasourceComponent.scss';
import Icon from '../../../ui/components/icon';
import { FormEvent } from 'react';
import {
	datasourceActivated,
	datasourceDeactivated, updateDatasource
} from '../../datasourcesActions';
import FieldSelector from '../../../fields/components/fieldSelector/fieldSelector';
import { connect } from 'react-redux';
import { Field } from '../../../fields/interfaces/field';
import { fieldAdd } from '../../../fields/fieldsActions';

interface Props {
	datasource: Datasource;
	dispatch: any;
}

interface State {
	expanded: boolean;
}

class DatasourceComponent extends React.Component<Props, State> {
	state: State = {
		expanded: false
	};

	toggleActive(event: FormEvent<HTMLInputElement>) {
		const { datasource, dispatch } = this.props;

		if (datasource.active) {
			dispatch(datasourceDeactivated(datasource.id));
		} else {
			dispatch(datasourceActivated(datasource.id));
		}
	}

	toggleExpanded() {
		const { expanded } = this.state;

		this.setState({
			expanded: !expanded
		});
	}

	onImageChange(field: Field) {
		const { dispatch, datasource } = this.props;

		dispatch(updateDatasource(datasource.id, {
			imageFieldPath: field.path
		}));
	}

	onLabelChange(field: Field) {
		const { dispatch, datasource } = this.props;

		dispatch(updateDatasource(datasource.id, {
			labelFieldPath: field.path
		}));
	}

	onLocationChange(field: Field) {
		const { dispatch, datasource } = this.props;

		dispatch(updateDatasource(datasource.id, {
			locationFieldPath: field.path
		}));
	}

	render() {
		const { datasource } = this.props;
		const { expanded } = this.state;

		return (
			<form className={styles.datasource}>
				<header className={styles.header}>
					<h3 className={styles.name}>
						<input className={styles.active} type="checkbox" checked={datasource.active} onChange={this.toggleActive.bind(this)}/>
						{datasource.name}
					</h3>
					<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')} onClick={this.toggleExpanded.bind(this)}/>
				</header>
				{expanded && (
					<main className={styles.main}>
						<h4 className={styles.optionTitle}>Label</h4>
						<FieldSelector
							datasourceId={datasource.id}
							type="string"
							selected={datasource.labelFieldPath}
							onChange={this.onLabelChange.bind(this)}
						/>

						<h4 className={styles.optionTitle}>Image</h4>
						<FieldSelector
							datasourceId={datasource.id}
							type="image"
							selected={datasource.imageFieldPath}
							onChange={this.onImageChange.bind(this)}
						/>

						<h4 className={styles.optionTitle}>Geo location</h4>
						<FieldSelector
							datasourceId={datasource.id}
							type="location"
							selected={datasource.locationFieldPath}
							onChange={this.onLocationChange.bind(this)}
						/>
					</main>
				)}
			</form>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps
});

export default connect(select)(DatasourceComponent);