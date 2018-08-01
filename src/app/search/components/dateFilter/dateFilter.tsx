import * as React from 'react';
import * as styles from './dateFilter.scss';
import { FormEvent } from 'react';

interface Props {
	date: string;
	onChange: (date: string) => void
}

class DateFilter extends React.Component<Props> {
	onChange(event: FormEvent<HTMLInputElement>) {
		const { onChange } = this.props;

		onChange(event.currentTarget.value);
	}

	render() {
		const { date } = this.props;

		return (
			<div className={styles.dates}>
				<h3 className={styles.datesTitle}>Maximum age</h3>
				<label className={styles.dateLabel}>
					<input type="radio" name="maxAge" value="" className={styles.dateRadio} checked={date === ''} onChange={this.onChange.bind(this)}/>
					<span>All</span>
				</label>
				<label className={styles.dateLabel}>
					<input type="radio" name="maxAge" value="1month" className={styles.dateRadio} checked={date === '1month'} onChange={this.onChange.bind(this)}/>
					<span>1 Month</span>
				</label>
				<label className={styles.dateLabel}>
					<input type="radio" name="maxAge" value="1week" className={styles.dateRadio} checked={date === '1week'} onChange={this.onChange.bind(this)}/>
					<span>1 Week</span>
				</label>
				<label className={styles.dateLabel}>
					<input type="radio" name="maxAge" value="1day" className={styles.dateRadio} checked={date === '1day'} onChange={this.onChange.bind(this)}/>
					<span>1 Day</span>
				</label>
			</div>
		)
	}
}

export default DateFilter;