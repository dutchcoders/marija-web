import * as React from 'react';
import { connect } from 'react-redux';
import { AppState } from '../../interfaces/appState';
import { IntlProvider, addLocaleData } from 'react-intl';
import * as en from 'react-intl/locale-data/en';
import * as nl from 'react-intl/locale-data/nl';
import { selectMessages } from '../../../ui/uiSelectors';
import { Language } from '../../../ui/interfaces/uiState';

addLocaleData([...en, ...nl]);

interface Props {
	children: any;
	lang: Language;
	messages: any;
}

class Translate extends React.Component<Props> {
	render() {
		const { children, lang, messages } = this.props;

		return (
			<IntlProvider locale={lang} messages={messages} key={lang}>
				{children}
			</IntlProvider>
		);
	}
}

const select = (state: AppState) => ({
	lang: state.ui.lang,
	messages: selectMessages(state)
});

export default connect(select)(Translate);