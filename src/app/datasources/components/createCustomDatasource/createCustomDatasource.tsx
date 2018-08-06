import * as React from 'react';
import * as styles from './createCustomDatasource.scss';
import Icon from '../../../ui/components/icon';
import { FormEvent } from 'react';
import { Item } from '../../../graph/interfaces/item';
import { csvToItems } from '../../helpers/csvToItems';
import { AppState } from '../../../main/interfaces/appState';
import { connect } from 'react-redux';
import { Datasource } from '../../interfaces/datasource';
import Loader from '../../../ui/components/loader';
import { createCustomDatasource } from '../../datasourcesActions';
import { getHistory } from '../../../main/helpers/getHistory';
import Url from '../../../main/helpers/url';
import CustomFieldList from '../customFieldList/customFieldList';
import { Field } from '../../../fields/interfaces/field';
import { createFieldsFromData } from '../../helpers/createFieldsFromData';
import Modal from '../../../ui/components/modal/modal';
import { FormattedMessage, FormattedHTMLMessage, InjectedIntl, injectIntl } from 'react-intl';

interface Props {
	dispatch: any;
	datasources: Datasource[];
	intl: InjectedIntl;
}

interface State {
	fileContents: string;
	name: string;
	isNameAvailable: boolean;
	activeStep: number;
	delimiter: string;
	parsedItems: Item[];
	isLoading: boolean;
	fileError: string;
	parseError: string;
	fields: Field[];
}

class CreateCustomDatasource extends React.Component<Props, State> {
	fileSelector: HTMLInputElement;
	state: State = {
		fileContents: '',
		activeStep: 1,
		delimiter: ',',
		name: '',
		isNameAvailable: true,
		parsedItems: [],
		isLoading: false,
		fileError: null,
		parseError: null,
		fields: []
	};

	checkNameAvailable(name: string): boolean {
		const { datasources } = this.props;

		const existing = datasources.find(datasource =>
			datasource.id === name
		);

		return typeof existing === 'undefined';
	}

	static hasCsvExtension(filename: string): boolean {
		return /.*\.csv$/i.test(filename);
	}

	loadFile(event) {
		this.setState({
			isLoading: true
		});

		const file = event.target.files[0];

		if (!CreateCustomDatasource.hasCsvExtension(file.name)) {
			this.setState({
				fileError: 'Please choose a CSV file. It should have the .csv extension.',
				isLoading: false
			});

			return;
		}

		const reader = new FileReader();

		reader.onload = () => {
			this.setState({
				fileContents: reader.result,
				name: file.name,
				isNameAvailable: this.checkNameAvailable(file.name),
				activeStep: 2,
				isLoading: false,
				fileError: null
			});
		};

		reader.readAsText(file);
	}

	onNameChange(event: FormEvent<HTMLInputElement>) {
		this.setState({
			name: event.currentTarget.value,
			isNameAvailable: this.checkNameAvailable(event.currentTarget.value)
		});
	}

	onFileContentsChange(event: FormEvent<HTMLTextAreaElement>) {
		this.setState({
			fileContents: event.currentTarget.value
		});
	}

	onDelimiterChange(event: FormEvent<HTMLInputElement>) {
		this.setState({
			delimiter: event.currentTarget.value
		});
	}

	selectFile() {
		this.fileSelector.click();
	}

	backToStep1() {
		this.setState({
			activeStep: 1,
			fileContents: '',
			parseError: null,
			fileError: null
		});
	}

	continueToStep3() {
		const { fileContents, delimiter, name } = this.state;

		this.setState({
			isLoading: true
		});

		let parsedItems: Item[];

		try {
			parsedItems = csvToItems(fileContents, delimiter, name);
		} catch (e) {
			this.setState({
				isLoading: false,
				parseError: 'Failed to parse the file. ' + e.message
			});

			return;
		}

		this.setState({
			activeStep: 3,
			parsedItems: parsedItems,
			isLoading: false,
			parseError: null,
			fields: createFieldsFromData(parsedItems, name)
		});
	}

	backToStep2() {
		this.setState({
			activeStep: 2
		});
	}

	finish() {
		const { dispatch } = this.props;
		const { name, parsedItems, fields } = this.state;

		dispatch(createCustomDatasource(name, parsedItems, fields));
		this.close();
	}

	close() {
		const history = getHistory();

		history.push({
			pathname: '/',
			search: Url.getQueryString()
		});
	}

	stopPropagation(event: MouseEvent) {
		event.stopPropagation();
	}

	onFieldTypeChange(field: Field, type: string) {
		const fields = this.state.fields.concat([]);
		const index = fields.findIndex(search => search.path === field.path);

		fields[index] = {
			...fields[index],
			type: type
		};

		this.setState({
			fields
		});
	}

	render() {
		const { activeStep, fileContents, delimiter, name, parsedItems, isNameAvailable, isLoading, fileError, parseError, fields } = this.state;
		const { intl } = this.props;

		const loader = isLoading ? (
			<div className={styles.loaderOverlay}>
				<Loader classes={[styles.loader]} show={true}/>
			</div>
		): null;

		return (
			<Modal title={intl.formatMessage({ id: 'create_csv_datasource' })}>

				{activeStep === 1 && (
					<main className={styles.main}>
						<h2 className={styles.stepTitle}><FormattedHTMLMessage id="csv_datasource_step_1"/></h2>

						<p>
							<FormattedMessage id="csv_header_info"/>
						</p>

						<div className={styles.formItem}>
							<input className={styles.hidden} type="file" ref={ref => this.fileSelector = ref} onChange={this.loadFile.bind(this)} />
							<button className={styles.chooseFile} onClick={this.selectFile.bind(this)}><FormattedMessage id="select_file"/></button><br />

							{fileError && (
								<p className={styles.error}>{fileError}</p>
							)}
						</div>

						{loader}
					</main>
				)}

				{activeStep === 2 && (
					<main className={styles.main}>
						<h2 className={styles.stepTitle}><FormattedHTMLMessage id="csv_datasource_step_2"/></h2>

						<div className={styles.formItem}>
							<label className={styles.label}><FormattedMessage id="choose_datasource_name"/></label>
							<input className={styles.input} value={name} onChange={this.onNameChange.bind(this)} />
							{!isNameAvailable && (
								<p className={styles.error}><FormattedMessage id="datasource_name_exists"/></p>
							)}
						</div>

						<div className={styles.formItem}>
							<label className={styles.label}><FormattedMessage id="delimiter"/></label>
							<p className={styles.description}><FormattedMessage id="delimiter_explanation"/></p>
							<input className={styles.input + ' ' + styles.delimiter} value={delimiter} onChange={this.onDelimiterChange.bind(this)} />
						</div>

						<div className={styles.formItem}>
							<label className={styles.label}><FormattedMessage id="file_contents"/></label>
							<p className={styles.description}><FormattedMessage id="csv_header_info"/></p>
							<textarea className={styles.input + ' ' + styles.fileContents} value={fileContents} onChange={this.onFileContentsChange.bind(this)} />
							{parseError && (
								<p className={styles.error}>{parseError}</p>
							)}
						</div>

						<div className={styles.footer}>
							<button className={styles.prev} onClick={this.backToStep1.bind(this)}><FormattedMessage id="back"/></button>
							<button className={styles.next} onClick={this.continueToStep3.bind(this)} disabled={!isNameAvailable}><FormattedMessage id="continue"/></button>
						</div>

						{loader}
					</main>
				)}

				{activeStep === 3 && (
					<main className={styles.main}>
						<h2 className={styles.stepTitle}><FormattedHTMLMessage id="csv_datasource_step_3"/></h2>
						<h3 className={styles.subTitle}><FormattedMessage id="found_x_fields" values={{ fields: fields.length}}/></h3>

						<CustomFieldList fields={fields} onTypeChange={(field, type) => this.onFieldTypeChange(field, type)}/>

						<h3 className={styles.subTitle}><FormattedMessage id="found_x_items" values={{ items: parsedItems.length}}/></h3>
						{parsedItems.length > 10 && (
							<p><FormattedMessage id="display_first_10"/></p>
						)}

						<table className={styles.table}>
							<thead className={styles.thead}>
							<tr>
								{Object.keys(parsedItems[0].fields).map(key =>
									<td className={styles.td} key={key}>{key}</td>
								)}
							</tr>
							</thead>
							<tbody>
							{parsedItems.slice().splice(0, 10).map(item =>
								<tr key={item.id}>
									{Object.keys(parsedItems[0].fields).map(key =>
										<td className={styles.td} key={key}>{item.fields[key]}</td>
									)}
								</tr>
							)}
							</tbody>
						</table>

						<div className={styles.footer}>
							<button className={styles.prev} onClick={this.backToStep2.bind(this)}><FormattedMessage id="back"/></button>
							<button className={styles.next} onClick={this.finish.bind(this)}><FormattedMessage id="create_datasource" values={{datasource: name}}/></button>
						</div>
					</main>
				)}
			</Modal>
		);
	}
}

const select = (state: AppState) => ({
	datasources: state.datasources.datasources
});

export default injectIntl(connect(select)(CreateCustomDatasource));