import * as React from 'react';
import { Connector, Rule } from '../../../graph/interfaces/connector';
import * as styles from './ruleComponent.scss';
import Icon from '../../../ui/components/icon';
import { deleteFromConnector } from '../../fieldsActions';
import { connect } from 'react-redux';
import { AppState } from '../../../main/interfaces/appState';

interface Props {
	rule: Rule;
	connector: Connector;
	dispatch: any;
}

interface State {
	expanded: boolean;
}

class RuleComponent extends React.Component<Props, State> {
	state: State = {
		expanded: false
	};

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

	render() {
		const { rule } = this.props;

		return (
			<li
				key={rule.id}
				className={styles.rule}
				draggable={true}
				onDragStart={(event: any) => this.onDragStart(event, rule)}>
				<span>{rule.field.path}</span>
				<Icon name={styles.delete + ' ion-ios-close'} onClick={() => this.deleteRule(rule)}/>
			</li>
		)
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps
});

export default connect(select)(RuleComponent);