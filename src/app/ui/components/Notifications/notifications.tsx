import * as React from 'react';
import Icon from '../Icon';
import {error} from "../../../ui/uiActions";
import {connect, Dispatch} from "react-redux";
import * as styles from './notifications.scss';
import {AppState} from "../../../main/interfaces/appState";

interface Props {
    errors: string;
    dispatch: Dispatch<any>;
}

interface State {
}

class Notifications extends React.Component<Props, State> {
    closeError() {
        const { dispatch } = this.props;
        dispatch(error(null));
    }

    render() {
        const { errors } = this.props;

        if (!errors) {
            return null;
        }

        return (
            <div className={styles.notification + ' ' + styles.error}>
                <h1 className={styles.title}>Something went wrong</h1>
                <Icon name={'ion-ios-close ' + styles.close} onClick={this.closeError.bind(this)} />
                <p className={styles.message}>
                    { errors }
                </p>
            </div>
        );
    }
}

const select = (state: AppState) => {
    return {
        errors: state.graph.errors,
    };
};

export default connect(select)(Notifications);