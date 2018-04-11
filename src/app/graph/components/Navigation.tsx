import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { connect } from 'react-redux';

import { AppState } from '../../main/interfaces/appState';
import Icon from '../../ui/components/Icon';
import { closePane, openPane } from '../../ui/uiActions';
import { setSelectingMode, toggleLabels } from '../graphActions';
import Filter from './Filter';

class Navigation extends React.Component<any, any> {
    enableMoving() {
        const { dispatch } = this.props;
        dispatch(setSelectingMode(false));
    }

    enableSelecting() {
        const { dispatch } = this.props;
        dispatch(setSelectingMode(true));
    }

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

    getButton(icon, tooltip, clickHandler, active) {
        return (
            <li className={active ? 'active': ''}>
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

    render() {
        const { selectingMode, zoomIn, zoomOut, showLabels } = this.props;

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
                </ul>
                <ul className="mapControls">
                    {this.getButton(
                        'ion-ios-pricetag',
                        'Show labels',
                        () => this.toggleLabels(),
                        showLabels
                    )}
                    {this.getButton(
                        'ion-arrow-move',
                        'Move (M)',
                        () => this.enableMoving(),
                        !selectingMode
                    )}
                    {this.getButton(
                        'ion-qr-scanner',
                        'Select (S)',
                        () => this.enableSelecting(),
                        selectingMode
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
            </nav>
        );
    }
}

const select = (state: AppState, ownProps) => {
    return {
        ...ownProps,
        panes: state.ui.panes,
        selectingMode: state.graph.selectingMode,
        showLabels: state.graph.showLabels
    };
};

export default connect(select)(Navigation);