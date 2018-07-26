import * as React from 'react';
import * as styles from './errorPage.scss';
import { ErrorDetails } from '../errorBoundary/errorBoundary';
import { saveAs } from 'file-saver';

interface Props {
	errorDetails: ErrorDetails;
}

class ErrorPage extends React.Component<Props> {
	getMessage(): string {
		const { errorDetails } = this.props;

		return JSON.stringify(errorDetails);
	}

	saveFile() {
		const now = new Date();
		const dateString = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + 'T' + now.getUTCHours() + '-' + now.getUTCMinutes();
		const filename = 'marija-error-' + dateString + '.json';

		const blob = new Blob(
			[this.getMessage()],
			{type: "text/json;charset=utf-8"}
		);

		saveAs(blob, filename);
	}

	render() {
		return (
			<div className={styles.container}>
				<h1 className={styles.title}>Whoops!</h1>
				<h2 className={styles.subtitle}>Something went wrong.</h2>
				<p className={styles.debugTitle}>Debugging information:</p>
				<textarea className={styles.debugInfo} value={this.getMessage()} readOnly />
				<button onClick={this.saveFile.bind(this)} className={styles.save}>Save debugging file</button>
			</div>
		);
	}
}

export default ErrorPage;