import * as React from 'react';
import Tooltip from 'rc-tooltip';
import { Icon } from '../../../../components/index';
import { FieldType } from '../../index';
import {Field} from "../../interfaces/field";
import IconSelector from "../iconSelector/iconSelector";
import {connect, Dispatch} from "react-redux";
import * as styles from './fieldRow.scss';
import {fieldAdd, fieldDelete, fieldUpdate} from "../../fieldsActions";
import Url from "../../../../helpers/Url";
import {searchFieldsUpdate} from "../../../search/searchActions";
import {fieldNodesHighlight, selectFieldNodes} from "../../../graph/graphActions";
import {datasourceActivated} from "../../../datasources/datasourcesActions";

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

        // If we add a field for a datasource, we assume that a user wants to
        // search in it, so we go ahead and activate it for the user, saving him
        // a click.
        dispatch(datasourceActivated(field.datasourceId));
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

    selectNodes() {
        const { field, dispatch } = this.props;

        dispatch(selectFieldNodes(field.path));
    }

    render() {
        const { field, isActive } = this.props;
        const { iconSelectorOpened } = this.state;

        let deleteButton = null;

        if (isActive) {
            deleteButton = (
                <td className={styles.buttonTd}>
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
                <td className={styles.buttonTd}>
                    <Icon
                        onClick={this.add.bind(this)}
                        name={styles.add + ' ion-ios-plus'}
                    />
                </td>
            );
        }

        let selectIconButton = null;
        let selectNodesButton = null;

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

            selectNodesButton = (
                <td className={styles.td}>
                    <Tooltip
                        overlay={'Select nodes'}
                        placement="bottom"
                        mouseLeaveDelay={0}
                        arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                        <Icon name={styles.selectNodesButton + ' ion-qr-scanner'}
                              onClick={this.selectNodes.bind(this)} />
                    </Tooltip>
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
                {selectNodesButton}
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