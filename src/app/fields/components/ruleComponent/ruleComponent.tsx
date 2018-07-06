import * as React from 'react';
import {
	Connector,
	Rule,
	SimilarityAlgorithm
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
}

class RuleComponent extends React.Component<Props, State> {
	similarityChangeTimeout;
	state: State = {
		expanded: false,
		unsavedSimilarity: 100
	};

	componentWillReceiveProps(props: Props) {
		this.setState({
			unsavedSimilarity: props.rule.similarity
		});
	}

	componentDidMount() {
		this.setState({
			unsavedSimilarity: this.props.rule.similarity || 100
		});
	}

	onDragStart(event: DragEvent, rule: Rule) {
		const { connector } = this.props;

		const data = JSON.stringify({
			ruleId: rule.id,
			fromConnectorName: connector.name
		});

		event.dataTransfer.setData('text', data);
	}

	deleteRule(rule: Rule) {
		const { dispatch, connector } = this.props;

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

	updateSimilarity(similarity: number) {
		const { dispatch, rule } = this.props;

		dispatch(updateRule(rule.id, { similarity }));
	}

	updateAlgorithm(event: FormEvent<HTMLInputElement>) {
		const { dispatch, rule } = this.props;

		const similarityAlgorithm = event.currentTarget.value as SimilarityAlgorithm;

		dispatch(updateRule(rule.id, { similarityAlgorithm }));
	}

	render() {
		const { rule } = this.props;
		const { expanded, unsavedSimilarity } = this.state;

		const isTextType: boolean = ['text', 'string'].indexOf(rule.field.type) !== -1;
		const radioNames = rule.id + '_algorithm';
		const algorithmDisabled = unsavedSimilarity === 100;

		return (
			<li
				key={rule.id}
				className={styles.rule}>

				<div className={styles.header}
					 draggable={true}
					 onDragStart={(event: any) => this.onDragStart(event, rule)}>
					<span>{rule.field.path}</span>
					<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')} onClick={this.toggleExpanded.bind(this)}/>
					<Icon name={styles.delete + ' ion-ios-close'} onClick={() => this.deleteRule(rule)}/>
				</div>

				{expanded && isTextType && (
					<form className={styles.config} draggable={false}>
						<div className={styles.setting}>
							<label className={styles.label}>Minimum similarity: {unsavedSimilarity}%</label>
							<input
								type="range"
								onChange={this.onSimilarityChange.bind(this)}
								min={1}
								max={100}
								defaultValue={unsavedSimilarity.toString()}
							/>
						</div>

						<div className={styles.setting + (algorithmDisabled ? ' ' + styles.disabled : '')}>
							<h4 className={styles.label}>Similarity algorithm</h4>
							<label className={styles.radioLabel}>
								<input
									className={styles.radio}
									type="radio"
									name={radioNames}
									disabled={algorithmDisabled}
									value="levenshtein"
									checked={rule.similarityAlgorithm === 'levenshtein'}
									onChange={this.updateAlgorithm.bind(this)}
								/>
								Levenshtein
							</label>
							<label className={styles.radioLabel}>
								<input
									className={styles.radio}
									disabled={algorithmDisabled}
									type="radio"
									name={radioNames}
									value="ssdeep"
									checked={rule.similarityAlgorithm === 'ssdeep'}
									onChange={this.updateAlgorithm.bind(this)}
								/>
								Ssdeep
							</label>
						</div>
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