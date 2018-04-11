import * as React from 'react';
import {Node} from "../graph/interfaces/node";
import * as styles from './contextMenu.scss';
import Icon from '../ui/components/Icon';
import {connect, Dispatch} from "react-redux";
import {deleteNodes, nodesSelect, nodeUpdate} from "../graph/graphActions";
import getDirectlyRelatedNodes from "../graph/helpers/getDirectlyRelatedNodes";
import {Link} from "../graph/interfaces/link";
import {hideContextMenu} from "./contextMenuActions";
import {searchAround} from "../search/searchActions";
import {FormEvent} from "react";
import abbreviateNodeName from '../graph/helpers/abbreviateNodeName';
import {Search} from "../search/interfaces/search";
import {Datasource} from "../datasources/interfaces/datasource";
import {AppState} from "../../interfaces/appState";

interface Props {
    nodeId: string;
    nodes: Node[];
    links: Link[];
    x: number;
    y: number;
    dispatch: Dispatch<any>;
    searches: Search[];
    datasources: Datasource[];
}

interface State {
    renameOpened: boolean;
    renameTo: string;
    forceNoteOpen: boolean;
}

class ContextMenu extends React.Component<Props, State> {
    contextMenu: HTMLDivElement;
    renameInput: HTMLInputElement;

    state: State = {
        renameOpened: false,
        renameTo: '',
        forceNoteOpen: false
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
                renameTo: node.name,
                forceNoteOpen: false
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

    componentDidUpdate() {
        const { nodeId, x, y } = this.props;

        if (!nodeId) {
            return;
        }

        const rect = this.contextMenu.getBoundingClientRect();
        const containerRect = this.contextMenu.parentElement.getBoundingClientRect();

        let newY: number = y;

        // Make sure the context menu fits on the page
        if (rect.height + y > containerRect.height) {
            newY = containerRect.height - rect.height;
        }

        let newX: number = x;

        if (rect.width + x > containerRect.width) {
            newX = containerRect.width - rect.width;
        }

        this.contextMenu.style.top = newY + 'px';
        this.contextMenu.style.left = newX + 'px';
    }

    handleAddNote() {
        this.setState({
            forceNoteOpen: true
        });
    }

    handleNoteChange(event: FormEvent<HTMLTextAreaElement>) {
        const { nodeId, dispatch } = this.props;

        dispatch(nodeUpdate(nodeId, {
            description: event.currentTarget.value
        }));
    }

    render() {
        const { nodeId } = this.props;
        const { renameOpened, renameTo, forceNoteOpen } = this.state;

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

        let noteButton = null;
        let note = null;

        if (node.description || forceNoteOpen) {
            note = (
                <div className={styles.note}>
                    <textarea
                        autoFocus
                        onChange={event => this.handleNoteChange(event)}
                        defaultValue={node.description} />
                </div>
            );
        } else {
            noteButton = (
                <button onClick={this.handleAddNote.bind(this)} className={styles.button}>
                    <Icon name={'ion-ios-paper ' + styles.icon} />
                    <span className={styles.buttonText}>Add note</span>
                </button>
            );
        }

        return (
            <div className={styles.contextMenu} ref={ref => this.contextMenu = ref}>
                <div className={styles.main}>
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
                            {noteButton}
                        </li>
                        <li>
                            <button onClick={this.delete.bind(this)} className={styles.button}>
                                <Icon name={'ion-ios-trash ' + styles.icon} />
                                <span className={styles.buttonText}>Delete</span>
                            </button>
                        </li>
                    </ul>
                </div>
                {note}
            </div>
        );
    }
}


const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
        nodeId: state.contextMenu.nodeId,
        nodes: state.graph.nodes,
        links: state.graph.links,
        searches: state.graph.searches,
        datasources: state.datasources.datasources,
        x: state.contextMenu.x,
        y: state.contextMenu.y,
    };
};

export default connect(select)(ContextMenu);
