import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { Item } from '../../interfaces/item';
import { connect } from 'react-redux';
import { ValueInfo } from '../../helpers/getValueInfo';
import { selectValueInfo } from '../../graphSelectors';
import ValueTableRow from '../valueTableRow/valueTableRow';
import * as styles from './valuetable.scss';

interface Props {
	valueInfoList: ValueInfo[];
}

class ValueTable extends React.Component<Props> {
	render() {
		const { valueInfoList } = this.props;

		console.log(valueInfoList);

		return (
			<table className={styles.table}>
				<thead>
				<tr>
					<td className={styles.columnTitle}>Value</td>
					<td className={styles.columnTitle}>Occurences</td>
					<td className={styles.columnTitle}>Fields</td>
					<td className={styles.columnTitle}>Nodes</td>
				</tr>
				</thead>
				<tbody>
				{valueInfoList.map(valueInfo =>
					<ValueTableRow key={valueInfo.value} valueInfo={valueInfo}/>
				)}
				</tbody>
			</table>
		)
	}
}

const select = (state: AppState) => ({
	valueInfoList: selectValueInfo(state)
});

export default connect(select)(ValueTable);