import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { connect } from 'react-redux';

import { AppState } from '../../../main/interfaces/appState';
import Icon from '../icon';
import { closePane, openPane } from '../../uiActions';
import { setMapActive, toggleLabels } from '../../../graph/graphActions';
import Filter from '../../../graph/components/filter';
import * as styles from './navigation.scss';
import { isMapAvailable } from '../../../graph/graphSelectors';

class Navigation extends React.Component<any, any> {
    togglePane(handle) {
        const { dispatch } = this.props;

        if (this.isActive(handle)) {
            dispatch(closePane(handle));
        } else {
            dispatch(openPane(handle));
        }
    }

    isActive(name) {
        const { panes } = this.props;

        return panes[name].open;
    }

    toggleLabels() {
        const { dispatch, showLabels } = this.props;

        dispatch(toggleLabels(!showLabels));
    }

    toggleMapActive() {
        const { dispatch, isMapActive } = this.props;

        dispatch(setMapActive(!isMapActive));
    }

    getButton(icon, tooltip, clickHandler, active, disabled: boolean = false) {
        return (
            <li className={(active ? 'active': '') + ' ' + (disabled ? 'disabled' : '')}>
                <Tooltip
                    overlay={tooltip}
                    placement="bottom"
                    mouseLeaveDelay={0}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                    <Icon name={icon} onClick={clickHandler} />
                </Tooltip>
            </li>
        );
    }

    getHelp() {
        return (
            <div>
                <h1 className={styles.helpTitle}>Tips</h1>
                <ul className={styles.tips}>
                    <li>Hold <strong>shift</strong> while dragging to select an area of nodes.</li>
                </ul>
            </div>
        );
    }

    render() {
        const { zoomIn, zoomOut, showLabels, isMapAvailable, isMapActive } = this.props;

        return (
            <nav className="navigation">
                <Filter />
                <ul className="paneToggles">
                    {this.getButton(
                        'ion-ios-gear',
                        'Configuration',
                        () => this.togglePane('configuration'),
                        this.isActive('configuration')
                    )}
                    {this.getButton(
                        'ion-android-share-alt',
                        'Selected nodes',
                        () => this.togglePane('nodes'),
                        this.isActive('nodes')
                    )}
                    {this.getButton(
                        'ion-ios-grid-view',
                        'Table',
                        () => this.togglePane('table'),
                        this.isActive('table')
                    )}
                    {this.getButton(
                        'ion-ios-clock',
                        'Timeline',
                        () => this.togglePane('timeline'),
                        this.isActive('timeline')
                    )}
                    {this.getButton(
                        'ion-ios-circle-filled',
                        'Chord diagram',
                        () => this.togglePane('chordDiagram'),
                        this.isActive('chordDiagram')
                    )}
                    {this.getButton(
                        'ion-grid',
                        'Adjacency matrix',
                        () => this.togglePane('adjacencyMatrix'),
                        this.isActive('adjacencyMatrix')
                    )}
                </ul>
                <ul className="mapControls">
                    {this.getButton(
						'ion-android-globe',
						isMapAvailable ? 'Map' : 'Map is unavailable for this data',
						() => this.toggleMapActive(),
						isMapActive,
                        !isMapAvailable
					)}
                    {this.getButton(
                        'ion-ios-pricetag',
                        'Labels',
                        () => this.toggleLabels(),
                        showLabels
                    )}
                    {this.getButton(
                        'ion-ios-minus',
                        'Zoom out',
                        () => zoomOut(),
                        false
                    )}
                    {this.getButton(
                        'ion-ios-plus',
                        'Zoom in',
                        () => zoomIn(),
                        false
                    )}
                </ul>
                <ul className="mapControls">
                    <li>
                        <Tooltip
                            overlay={this.getHelp.bind(this)}
                            placement="bottom"
                            mouseLeaveDelay={0}
                            overlayClassName={styles.help}
                            arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                            <Icon name={'ion-ios-help ' + styles.helpButton} />
                        </Tooltip>
                    </li>
                </ul>
            </nav>
        );
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
        panes: state.ui.panes,
        showLabels: state.graph.showLabels,
        isMapAvailable: isMapAvailable(state),
        isMapActive: state.graph.isMapActive
    };
};

export default connect(select)(Navigation);