import * as React from 'react';
import { ValueInfo } from '../../helpers/getValueInfo';
import * as styles from './valueTableRow.scss';

interface Props {
	valueInfo: ValueInfo;
}

class ValueTableRow extends React.Component<Props> {
	render() {
		const { valueInfo } = this.props;

		return (
			<tr className={styles.tr}>
				<td className={styles.td}>{valueInfo.value.substring(0, 100) + (valueInfo.value.length > 100 ? '...' : '')}</td>
				<td className={styles.td + ' ' + styles.number}>{valueInfo.occurences}</td>
				<td className={styles.td}>{valueInfo.fields.join(', ')}</td>
				<td className={styles.td}>{valueInfo.nodes.length}</td>
			</tr>
		);
	}
}

export default ValueTableRow;