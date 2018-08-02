import * as React from 'react';
import { ValueInfo } from '../../helpers/getValueInfo';
import * as styles from './valueTableRow.scss';
import { connect } from 'react-redux';
import MagicWand from '../magicWand/magicWand';

interface Props {
	valueInfo: ValueInfo;
	dispatch: any;
}

class ValueTableRow extends React.Component<Props> {
	render() {
		const { valueInfo } = this.props;

		return (
			<tr className={styles.tr}>
				<td className={styles.td}>{valueInfo.value.substring(0, 100) + (valueInfo.value.length > 100 ? '...' : '')}</td>
				<td className={styles.td + ' ' + styles.number}>{valueInfo.occurences}</td>
				<td className={styles.td}>{valueInfo.fields.join(', ')}</td>
				<td className={styles.td}>
					<MagicWand nodes={valueInfo.nodes} cssClass={styles.magicWand}/>
				</td>
			</tr>
		);
	}
}

export default connect()(ValueTableRow);