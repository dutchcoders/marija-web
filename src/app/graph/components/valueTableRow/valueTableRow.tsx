import * as React from 'react';
import { ValueInfo } from '../../helpers/getValueInfo';
import * as styles from './valueTableRow.scss';
import { nodesSelect } from '../../graphActions';
import { connect } from 'react-redux';

interface Props {
	valueInfo: ValueInfo;
	dispatch: any;
}

class ValueTableRow extends React.Component<Props> {
	selectNodes() {
		const { valueInfo, dispatch } = this.props;

		dispatch(nodesSelect(valueInfo.nodes));
	}

	render() {
		const { valueInfo } = this.props;

		return (
			<tr className={styles.tr}>
				<td className={styles.td}>{valueInfo.value.substring(0, 100) + (valueInfo.value.length > 100 ? '...' : '')}</td>
				<td className={styles.td + ' ' + styles.number}>{valueInfo.occurences}</td>
				<td className={styles.td}>{valueInfo.fields.join(', ')}</td>
				<td className={styles.td}>
					<button onClick={this.selectNodes.bind(this)} className={styles.select}>Select {valueInfo.nodes.length}</button>
				</td>
			</tr>
		);
	}
}

export default connect()(ValueTableRow);