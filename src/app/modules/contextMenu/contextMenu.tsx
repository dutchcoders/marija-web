import * as React from 'react';
import {Node} from "../../interfaces/node";
import * as styles from './contextMenu.scss';
import { Icon } from '../../components/index';
import {connect, Dispatch} from "react-redux";
import {deleteNodes, nodesSelect, nodeUpdate} from "../graph";
import getDirectlyRelatedNodes from "../../helpers/getDirectlyRelatedNodes";
import {Link} from "../../interfaces/link";
import {hideContextMenu} from "./contextMenuActions";
import {searchAround} from "../search/actions";
import {FormEvent} from "react";
import abbreviateNodeName from '../../helpers/abbreviateNodeName';

interface Props {
    node: Node;
    nodes: Node[];
    links: Link[];
    x: number;
    y: number;
    dispatch: Dispatch<any>
}

interface State {
    renameOpened: boolean;
    renameTo: string;
}

class ContextMenu extends React.Component<Props, State> {
    renameInput: HTMLInputElement;

    state: State = {
        renameOpened: false,
        renameTo: ''
    };

    componentWillReceiveProps(nextProps: Props) {
        if (!nextProps.node) {
            return;
        }

        this.setState({
            renameTo: nextProps.node.name,
            renameOpened: false
        });
    }

    selectRelated() {
        const { dispatch, nodes, links, node } = this.props;

        const relatedNodes = getDirectlyRelatedNodes([node], nodes, links);
        dispatch(nodesSelect(relatedNodes));

        this.close();
    }

    delete() {
        const { dispatch, node } = this.props;
        dispatch(deleteNodes([node]));

        this.close();
    }

    searchAround() {
        const { dispatch, node } = this.props;

        dispatch(searchAround(node));
        this.close();
    }

    close() {
        const { dispatch } = this.props;
        dispatch(hideContextMenu());
    }

    openRename() {
        this.setState({
            renameOpened: true
        });
    }

    handleRenameChange(event: FormEvent<HTMLInputElement>) {
        this.setState({
            renameTo: event.currentTarget.value
        });
    }

    handleRenameEvents(event: KeyboardEvent) {
        const { dispatch, node } = this.props;
        const { renameTo } = this.state;

        if (event.key === 'Enter') {
            dispatch(nodeUpdate(node.id, {
                name: renameTo,
                abbreviated: abbreviateNodeName(renameTo, node.queries[0], 20)
            }));
        } else if (event.key === 'Escape') {
            this.setState({
                renameOpened: false,
                renameTo: node.name
            });
        }
    }

    handleRenameBlur() {
        this.setState({
            renameOpened: false
        });
    }

    render() {
        const { node, x, y } = this.props;
        const { renameOpened, renameTo } = this.state;

        if (!node) {
            return null;
        }

        let rename;

        if (renameOpened) {
            rename = (
                <div onClick={this.openRename.bind(this)} className={styles.inputWrapper}>
                    <Icon name={'ion-ios-compose ' + styles.icon} />
                    <input
                        autoFocus={true}
                        onChange={this.handleRenameChange.bind(this)}
                        onKeyDown={this.handleRenameEvents.bind(this)}
                        onBlur={this.handleRenameBlur.bind(this)}
                        ref={element => this.renameInput = element}
                        value={renameTo}
                    />
                </div>
            );
        } else {
            rename = (
                <button onClick={this.openRename.bind(this)} className={styles.button}>
                    <Icon name={'ion-ios-compose ' + styles.icon} />
                    <span className={styles.buttonText}>Rename</span>
                </button>
            );
        }

        return (
            <div className={styles.contextMenu} style={{top: y, left: x}}>
                <h1 className={styles.title}>{node.name}</h1>
                <ul>
                    <li>
                        <button onClick={this.selectRelated.bind(this)} className={styles.button}>
                            <Icon name={'ion-qr-scanner ' + styles.icon} />
                            <span className={styles.buttonText}>Select related</span>
                        </button>
                    </li>
                    <li>
                        <button onClick={this.searchAround.bind(this)} className={styles.button}>
                            <Icon name={'ion-ios-search ' + styles.icon} />
                            <span className={styles.buttonText}>Search around</span>
                        </button>
                    </li>
                    <li>
                        {rename}
                    </li>
                    <li>
                        <button onClick={this.delete.bind(this)} className={styles.button}>
                            <Icon name={'ion-ios-trash ' + styles.icon} />
                            <span className={styles.buttonText}>Delete</span>
                        </button>
                    </li>
                </ul>
            </div>
        );
    }
}


const select = (state, ownProps) => {
    return {
        ...ownProps,
        node: state.contextMenu.node,
        nodes: state.entries.nodes,
        links: state.entries.links,
        x: state.contextMenu.x,
        y: state.contextMenu.y,
    };
};

export default connect(select)(ContextMenu);
