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
import {Search} from "../../interfaces/search";
import {Datasource} from "../../interfaces/datasource";

interface Props {
    nodeId: string;
    nodes: Node[];
    links: Link[];
    x: number;
    y: number;
    dispatch: Dispatch<any>;
    searches: Search[];
    datasources: Datasource[]
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

    getNode(nodeId: string): Node {
        const { nodes } = this.props;

        return nodes.find(search => search.id === nodeId);
    }

    componentWillReceiveProps(nextProps: Props) {
        const { nodeId } = this.props;

        if (!nextProps.nodeId) {
            return;
        }

        const isDifferentNode: boolean = nextProps.nodeId !== nodeId;

        if (isDifferentNode) {
            const node = this.getNode(nextProps.nodeId);

            this.setState({
                renameOpened: false,
                renameTo: node.name
            });
        }
    }

    selectRelated() {
        const { dispatch, nodes, links, nodeId } = this.props;

        const node = this.getNode(nodeId);
        const relatedNodes = getDirectlyRelatedNodes([node], nodes, links);
        dispatch(nodesSelect(relatedNodes));

        this.close();
    }

    delete() {
        const { dispatch, nodeId } = this.props;

        const node = this.getNode(nodeId);
        dispatch(deleteNodes([node]));

        this.close();
    }

    searchAround(datasourceId: string) {
        const { dispatch, nodeId } = this.props;

        const node = this.getNode(nodeId);
        dispatch(searchAround(node, [datasourceId]));
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
        const { dispatch, nodeId, searches } = this.props;
        const { renameTo } = this.state;

        if (event.key === 'Enter') {
            const node = this.getNode(nodeId);
            const search = searches.find(loop => loop.searchId === node.searchIds[0]);

            dispatch(nodeUpdate(nodeId, {
                name: renameTo,
                abbreviated: abbreviateNodeName(renameTo, search.q, 20)
            }));

            this.setState({
                renameOpened: false
            });
        } else if (event.key === 'Escape') {
            const node = this.getNode(nodeId);

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

    handleImportant() {
        const { dispatch, nodeId } = this.props;

        dispatch(nodeUpdate(nodeId, {
            important: true
        }));
    }

    handleNotImportant() {
        const { dispatch, nodeId } = this.props;

        dispatch(nodeUpdate(nodeId, {
            important: false
        }));
    }

    renderSearchAround() {
        const { datasources } = this.props;

        const useDatasources = datasources.filter(datasource =>
            datasource.type !== 'live'
        );

        return (
            <li>
                <h2 className={styles.searchAroundHeading}>
                    <Icon name={'ion-ios-search ' + styles.icon} />
                    <span className={styles.buttonText}>Search around in</span>
                </h2>
                <ul className={styles.datasourceList}>
                    {useDatasources.map(datasource =>
                        <li key={datasource.id}>
                            <button
                                className={styles.datasource}
                                onClick={() => this.searchAround(datasource.id)}>
                                &mdash; {datasource.name}
                            </button>
                        </li>
                    )}
                </ul>
            </li>
        )
    }

    render() {
        const { nodeId, x, y } = this.props;
        const { renameOpened, renameTo } = this.state;

        if (!nodeId) {
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

        const node = this.getNode(nodeId);

        let important;

        if (node.important) {
            important = (
                <button onClick={this.handleNotImportant.bind(this)} className={styles.button}>
                    <Icon name={'ion-alert-circled ' + styles.icon} />
                    <span className={styles.buttonText}>Undo important mark</span>
                </button>
            );
        } else {
            important = (
                <button onClick={this.handleImportant.bind(this)} className={styles.button}>
                    <Icon name={'ion-alert-circled ' + styles.icon} />
                    <span className={styles.buttonText}>Mark important</span>
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
                    {this.renderSearchAround()}
                    <li>
                        {rename}
                    </li>
                    <li>
                        {important}
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
        nodeId: state.contextMenu.nodeId,
        nodes: state.entries.nodes,
        links: state.entries.links,
        searches: state.entries.searches,
        datasources: state.datasources.datasources,
        x: state.contextMenu.x,
        y: state.contextMenu.y,
    };
};

export default connect(select)(ContextMenu);
