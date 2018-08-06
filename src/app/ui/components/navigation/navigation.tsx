import * as React from 'react';
import { connect } from 'react-redux';
import Tooltip from '../tooltip/tooltip';
import { AppState } from '../../../main/interfaces/appState';
import Icon from '../icon';
import { closePane, openPane } from '../../uiActions';
import { setMapActive, toggleLabels } from '../../../graph/graphActions';
import Filter from '../../../graph/components/filter/filter';
import * as styles from './navigation.scss';
import { isMapAvailable } from '../../../graph/graphSelectors';
import RcTooltip from 'rc-tooltip';
import { FormattedHTMLMessage } from 'react-intl';

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
        const { dispatch, isMapActive, isMapAvailable } = this.props;

        const active = !isMapActive;

        if (isMapAvailable || !active) {
			dispatch(setMapActive(active));
        }
    }

    getButton(icon, tooltip, clickHandler, active, disabled: boolean = false) {
        return (
            <li className={(active ? 'active': '') + ' ' + (disabled ? 'disabled' : '')}>
                <Tooltip
                    messageId={tooltip}>
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
                    <li><FormattedHTMLMessage id="hold_shift_to_select_area"/></li>
                    <li><FormattedHTMLMessage id="hold_alt_to_drag_cluster"/></li>
                </ul>
            </div>
        );
    }

    render() {
        const { zoomIn, zoomOut, showLabels, isMapAvailable, isMapActive, center } = this.props;

        const isMapDisabled = !isMapAvailable && !isMapActive;

        return (
            <nav className="navigation">
                <Filter />
                <ul className="paneToggles">
                    {this.getButton(
                        'ion-ios-gear',
                        'configuration',
                        () => this.togglePane('configuration'),
                        this.isActive('configuration')
                    )}
                    {this.getButton(
                        'ion-android-share-alt',
                        'selected_nodes',
                        () => this.togglePane('nodes'),
                        this.isActive('nodes')
                    )}
                    {this.getButton(
                        'ion-ios-grid-view',
                        'table',
                        () => this.togglePane('table'),
                        this.isActive('table')
                    )}
                    {this.getButton(
                        'ion-android-list',
                        'unique_values',
                        () => this.togglePane('valueTable'),
                        this.isActive('valueTable')
                    )}
                    {this.getButton(
                        'ion-ios-clock',
                        'timeline',
                        () => this.togglePane('timeline'),
                        this.isActive('timeline')
                    )}
                </ul>
                <ul className="mapControls">
                    {this.getButton(
						'ion-android-globe',
						isMapDisabled ? 'map_unavailable' : 'map',
						() => this.toggleMapActive(),
						isMapActive,
                        isMapDisabled
					)}
                    {this.getButton(
                        'ion-ios-pricetag',
                        'labels',
                        () => this.toggleLabels(),
                        showLabels
                    )}
                    {this.getButton(
                        'ion-ios-minus',
                        'zoom_out',
                        () => zoomOut(),
                        false
                    )}
                    {this.getButton(
                        'ion-ios-plus',
                        'zoom_in',
                        () => zoomIn(),
                        false
                    )}
                    {this.getButton(
                        'ion-android-locate',
                        'center',
                        () => center(),
                        false
                    )}
                </ul>
                <ul className="mapControls">
                    <li>
                        <RcTooltip
                            overlay={this.getHelp.bind(this)}
                            placement="bottom"
                            mouseLeaveDelay={0}
                            overlayClassName={styles.help}
                            arrowContent={<div className="rc-tooltip-arrow-inner" />}>
                            <Icon name={'ion-ios-help ' + styles.helpButton} />
                        </RcTooltip>
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