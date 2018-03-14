import * as React from 'react';

import { Icon } from '../../../../components/index';
import { FieldType } from '../../index';
import {Field} from "../../../../interfaces/field";
import IconSelector from "../../../../components/Configuration/iconSelector/iconSelector";
import {connect, Dispatch} from "react-redux";
import * as styles from './fieldRow.scss';
import {fieldAdd, fieldDelete, fieldUpdate} from "../../../data";
import Url from "../../../../domain/Url";
import {searchFieldsUpdate} from "../../../search/actions";
import {fieldNodesHighlight} from "../../../graph/actions";

interface Props {
    field: Field;
    isActive: boolean;
    dispatch: Dispatch<any>;
}

interface State {
    iconSelectorOpened: boolean;
}

class FieldRow extends React.Component<Props, State> {
    state: State = {
        iconSelectorOpened: false
    };

    add() {
        const { field, dispatch } = this.props;

        Url.addQueryParam('fields', field.path);

        dispatch(fieldAdd(field));
        dispatch(searchFieldsUpdate());
    }

    remove() {
        const { field, dispatch } = this.props;

        Url.removeQueryParam('fields', field.path);

        dispatch(fieldDelete(field));
    }

    highlightNodes() {
        const { field, isActive, dispatch } = this.props;

        if (!isActive) {
            return;
        }

        dispatch(fieldNodesHighlight(field.path));
    }

    toggleIconSelector() {
        const { iconSelectorOpened } = this.state;

        this.setState({
            iconSelectorOpened: !iconSelectorOpened
        });
    }

    selectIcon(icon: string) {
        const { dispatch, field } = this.props;

        dispatch(fieldUpdate(field.path, {
            icon: icon
        }));

        this.setState({
            iconSelectorOpened: false
        });
    }

    render() {
        const { field, isActive } = this.props;
        const { iconSelectorOpened } = this.state;

        let deleteButton = null;

        if (isActive) {
            deleteButton = (
                <td className={styles.td}>
                    <Icon
                        onClick={this.remove.bind(this)}
                        name={styles.delete + ' ion-ios-close'}
                    />
                </td>
            );
        }

        let addButton = null;

        if (!isActive) {
            addButton = (
                <td className={styles.td}>
                    <Icon
                        onClick={this.add.bind(this)}
                        name={styles.add + ' ion-ios-plus'}
                    />
                </td>
            );
        }

        let selectIconButton = null;

        if (isActive) {
            selectIconButton = (
                <td className={styles.td}>
                    <i className={styles.icon}
                       onClick={() => this.toggleIconSelector()}>{ field.icon }</i>
                    {!iconSelectorOpened ? null :
                        <IconSelector onSelectIcon={(icon: string) => this.selectIcon(icon)} />
                    }
                </td>
            );
        }

        return (
            <tr className={styles.tr}
                onMouseEnter={this.highlightNodes.bind(this)}>

                <td className={styles.td}><FieldType type={field.type} /></td>
                <td className={styles.td}>{field.path}</td>
                <td className={styles.td}>{field.datasourceId}</td>
                {selectIconButton}
                {deleteButton}
                {addButton}
            </tr>
        );
    }
}

const select = (state, ownProps) => {
    return {
        ...ownProps,
    }
};

export default connect(select)(FieldRow);