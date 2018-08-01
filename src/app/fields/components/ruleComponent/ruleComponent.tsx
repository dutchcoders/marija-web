import * as React from 'react';
import {
	Connector,
	Rule
} from '../../../graph/interfaces/connector';
import * as styles from './ruleComponent.scss';
import Icon from '../../../ui/components/icon';
import {
	deleteFromConnector,
	updateRule
} from '../../fieldsActions';
import { connect } from 'react-redux';
import { AppState } from '../../../main/interfaces/appState';
import { FormEvent } from 'react';

interface Props {
	rule: Rule;
	connector: Connector;
	dispatch: any;
}

interface State {
	expanded: boolean;
	unsavedSimilarity: number;
	unsavedDistance: number;
}

class RuleComponent extends React.Component<Props, State> {
	similarityChangeTimeout;
	distanceChangeTimeout;
	state: State = {
		expanded: false,
		unsavedSimilarity: 100,
		unsavedDistance: 0
	};

	initSettings(props: Props) {
		this.setState({
			unsavedSimilarity: props.rule.similarity || 100,
			unsavedDistance: props.rule.distance || 0,
		});
	}

	componentWillReceiveProps(props: Props) {
		this.initSettings(props);
	}

	componentDidMount() {
		this.initSettings(this.props);
	}

	onDragStart(event: DragEvent, rule: Rule) {
		const { connector } = this.props;

		const data = JSON.stringify({
			ruleId: rule.id,
			fromConnectorName: connector.name
		});

		event.dataTransfer.setData('text', data);
	}

	deleteRule(event: MouseEvent) {
		event.stopPropagation();

		const { dispatch, connector, rule } = this.props;

		dispatch(deleteFromConnector(connector.name, rule.id));
	}

	toggleExpanded() {
		const { expanded } = this.state;

		this.setState({
			expanded: !expanded
		});
	}

	onSimilarityChange(event: FormEvent<HTMLInputElement>) {
		clearTimeout(this.similarityChangeTimeout);
		const value = parseInt(event.currentTarget.value, 10);

		this.setState({
			unsavedSimilarity: value
		});

		this.similarityChangeTimeout = setTimeout(
			() => this.updateSimilarity(value),
			300
		);
	}

	onDistanceChange(event: FormEvent<HTMLInputElement>) {
		clearTimeout(this.distanceChangeTimeout);
		const value = parseInt(event.currentTarget.value, 10);

		this.setState({
			unsavedDistance: value
		});

		this.distanceChangeTimeout = setTimeout(
			() => this.updateDistance(value),
			300
		);
	}

	updateSimilarity(similarity: number) {
		const { dispatch, rule } = this.props;

		dispatch(updateRule(rule.id, { similarity }));
	}

	updateDistance(distance: number) {
		const { dispatch, rule } = this.props;

		dispatch(updateRule(rule.id, { distance }));
	}

	render() {
		const { rule } = this.props;
		const { expanded, unsavedSimilarity, unsavedDistance } = this.state;

		const isTextType: boolean = ['text', 'string'].indexOf(rule.field.type) !== -1;
		const isLocationType: boolean = rule.field.type === 'location';

		return (
			<li
				key={rule.id}
				className={styles.rule}>

				<div className={styles.header}
					 draggable={true}
					 onDragStart={(event: any) => this.onDragStart(event, rule)}
					 onClick={this.toggleExpanded.bind(this)}>
					<span>{rule.field.path}</span>
					<div className={styles.buttons}>
						{(isTextType || isLocationType) && (
							<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')} />
						)}
						<Icon name={styles.delete + ' ion-ios-close'} onClick={this.deleteRule.bind(this)}/>
					</div>
				</div>

				{expanded && (
					<form className={styles.config} draggable={false}>
						{isTextType && (
							<div className={styles.setting}>
								<label className={styles.label}>Minimum similarity: {unsavedSimilarity}%</label>
								<input
									type="range"
									onChange={this.onSimilarityChange.bind(this)}
									min={1}
									max={100}
									defaultValue={typeof unsavedSimilarity === 'number' ? unsavedSimilarity.toString() : '100'}
								/>
							</div>
						)}

						{isLocationType && (
							<div className={styles.setting}>
								<label className={styles.label}>Maximum distance: {unsavedDistance}km</label>
								<input
									type="range"
									onChange={this.onDistanceChange.bind(this)}
									min={1}
									max={100}
									defaultValue={typeof unsavedDistance === 'number' ? unsavedDistance.toString() : '100'}
								/>
							</div>
						)}
					</form>
				)}
			</li>
		)
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps
});

export default connect(select)(RuleComponent);