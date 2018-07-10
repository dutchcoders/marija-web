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
}

class RuleComponent extends React.Component<Props, State> {
	similarityChangeTimeout;
	state: State = {
		expanded: false,
		unsavedSimilarity: 100
	};

	componentWillReceiveProps(props: Props) {
		this.setState({
			unsavedSimilarity: props.rule.similarity || 100
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

	render() {
		const { rule } = this.props;
		const { expanded, unsavedSimilarity } = this.state;

		const isTextType: boolean = ['text', 'string'].indexOf(rule.field.type) !== -1;

		return (
			<li
				key={rule.id}
				className={styles.rule}>

				<div className={styles.header}
					 draggable={true}
					 onDragStart={(event: any) => this.onDragStart(event, rule)}>
					<span>{rule.field.path}</span>
					<div className={styles.buttons}>
						{isTextType && (
							<Icon name={styles.toggle + ' ' + (expanded ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down')} onClick={this.toggleExpanded.bind(this)}/>
						)}
						<Icon name={styles.delete + ' ion-ios-close'} onClick={() => this.deleteRule(rule)}/>
					</div>
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
								defaultValue={typeof unsavedSimilarity === 'number' ? unsavedSimilarity.toString() : '100'}
							/>
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