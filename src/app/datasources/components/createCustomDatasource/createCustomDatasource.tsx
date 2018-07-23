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

interface Props {
	dispatch: any;
	datasources: Datasource[];
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
				parseError: 'Failed to parse the file. You can try changing the delimiter, but most likely you will need to select a different file in step 1.'
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

		const loader = isLoading ? (
			<div className={styles.loaderOverlay}>
				<Loader classes={[styles.loader]} show={true}/>
			</div>
		): null;

		return (
			<Modal title="Create a CSV datasource">

				{activeStep === 1 && (
					<main className={styles.main}>
						<h2 className={styles.stepTitle}>Step 1/3 &mdash; Choose a CSV file</h2>

						<p>
							The first line of the CSV should contain the header information (the titles of the columns).
						</p>

						<div className={styles.formItem}>
							<input className={styles.hidden} type="file" ref={ref => this.fileSelector = ref} onChange={this.loadFile.bind(this)} />
							<button className={styles.chooseFile} onClick={this.selectFile.bind(this)}>Select file</button><br />

							{fileError && (
								<p className={styles.error}>{fileError}</p>
							)}
						</div>

						{loader}
					</main>
				)}

				{activeStep === 2 && (
					<main className={styles.main}>
						<h2 className={styles.stepTitle}>Step 2/3 &mdash; Settings</h2>

						<div className={styles.formItem}>
							<label className={styles.label}>Choose a datasource name</label>
							<input className={styles.input} value={name} onChange={this.onNameChange.bind(this)} />
							{!isNameAvailable && (
								<p className={styles.error}>This name is already used for another datasource. Choose a different name.</p>
							)}
						</div>

						<div className={styles.formItem}>
							<label className={styles.label}>Delimiter</label>
							<p className={styles.description}>The symbol that separates the values.</p>
							<input className={styles.input + ' ' + styles.delimiter} value={delimiter} onChange={this.onDelimiterChange.bind(this)} />
						</div>

						<div className={styles.formItem}>
							<label className={styles.label}>File contents</label>
							<p className={styles.description}>The first line should contain the header information (the titles of the columns).</p>
							<textarea className={styles.input + ' ' + styles.fileContents} value={fileContents} onChange={this.onFileContentsChange.bind(this)} />
							{parseError && (
								<p className={styles.error}>{parseError}</p>
							)}
						</div>

						<div className={styles.footer}>
							<button className={styles.prev} onClick={this.backToStep1.bind(this)}>Back</button>
							<button className={styles.next} onClick={this.continueToStep3.bind(this)} disabled={!isNameAvailable}>Continue</button>
						</div>

						{loader}
					</main>
				)}

				{activeStep === 3 && (
					<main className={styles.main}>
						<h2 className={styles.stepTitle}>Step 3/3 &mdash; Preview</h2>
						<h3 className={styles.subTitle}>Found {fields.length} fields</h3>

						<CustomFieldList fields={fields} onTypeChange={(field, type) => this.onFieldTypeChange(field, type)}/>

						<h3 className={styles.subTitle}>Found {parsedItems.length} items</h3>
						{parsedItems.length > 10 && (
							<p>Displaying the first 10.</p>
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
							<button className={styles.prev} onClick={this.backToStep2.bind(this)}>Back</button>
							<button className={styles.next} onClick={this.finish.bind(this)}>Create datasource {name}</button>
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

export default connect(select)(CreateCustomDatasource);