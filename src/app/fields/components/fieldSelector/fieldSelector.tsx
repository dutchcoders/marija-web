import * as React from 'react';
import { AppState } from '../../../main/interfaces/appState';
import { getFieldsByDatasourceAndType } from '../../fieldsSelectors';
import ReactSelect from 'react-select';
import { Field } from '../../interfaces/field';
import { connect } from 'react-redux';

interface Props {
	datasourceId: string;
	type?: string;
	fields: Field[];
	selected: Field;
	onChange: (fieldPath: string) => void
}

class FieldSelector extends React.Component<Props> {
	onChange(fieldPath: string) {
		const { onChange } = this.props;

		onChange(fieldPath);
	}

	static fieldToOption(field: Field) {
		return {
			label: field.path,
			value: field.path
		};
	}

	render() {
		const { fields, selected } = this.props;

		const options = fields.map(field => FieldSelector.fieldToOption(field));

		let selectedOption = null;

		if (selected) {
			selectedOption = {
				label: selected,
				value: selected
			}
		}

		return (
			<ReactSelect
				value={selectedOption}
				options={options}
				simpleValue
				onChange={this.onChange.bind(this)}
			/>
		);
	}
}

const select = (state: AppState, ownProps) => ({
	...ownProps,
	fields: getFieldsByDatasourceAndType(state, ownProps.datasourceId, ownProps.type)
});

export default connect(select)(FieldSelector);