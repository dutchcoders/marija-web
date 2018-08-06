import * as React from 'react';
import { findDOMNode } from 'react-dom';
import * as styles from './timelineSlider.scss';
import Icon from '../../../ui/components/icon';
import { FormattedMessage } from 'react-intl';

interface Props {
	onChange: (minFraction: number, maxFraction: number) => void;
	onSelect: (minFraction: number, maxFraction: number) => void;
	onStartPlaying: () => void;
	onFinishPlaying: () => void;
	playTime: number;
	playWindowWidth: number;
}

interface State {
	isPlaying: boolean;
}

class TimelineSlider extends React.Component<Props, State> {
	isComponentMounted: boolean = false;
	isDraggingHandleLeft: boolean = false;
	isDraggingHandleRight: boolean = false;
	isDraggingArea: boolean = false;
	dragAreaStart: number;
	minFractionDragStart: number;
	maxFractionDragStart: number;
	minFraction: number = 0;
	maxFraction: number = 1;
	container: HTMLElement;
	containerRect: ClientRect;
	overlay: HTMLDivElement;
	startPlayingAt: number;
	state: State = {
		isPlaying: false
	};

	componentDidMount() {
		this.container = findDOMNode(this).parentNode as HTMLElement;
		this.containerRect = this.container.getBoundingClientRect();
		this.isComponentMounted = true;

		window.addEventListener('mousemove', this.drag);
		window.addEventListener('mouseup', this.stopDragging);
		window.addEventListener('blur', this.stopDragging);

		window.requestAnimationFrame(this.ticker.bind(this));
	}

	componentWillUnmount() {
		this.isComponentMounted = false;

		window.removeEventListener('mousemove', this.drag);
		window.removeEventListener('mouseup', this.stopDragging);
		window.removeEventListener('blur', this.stopDragging);
	}

	dragHandleLeft(event: MouseEvent) {
		const { onChange } = this.props;

		const relativePosition = event.clientX - this.containerRect.left;
		const allowedOutside = 20;
		const fraction = Math.max(0, relativePosition) / this.containerRect.width;

		if (relativePosition > this.containerRect.width + allowedOutside
			|| relativePosition < 0 - allowedOutside
			|| fraction > this.maxFraction) {
			this.stopDragging();
			return;
		}

		this.minFraction = fraction;
		onChange(this.minFraction, this.maxFraction);
	}

	dragHandleRight(event: MouseEvent) {
		const { onChange } = this.props;

		const relativePosition = event.clientX - this.containerRect.left;
		const allowedOutside = 20;
		const fraction = Math.min(this.containerRect.width + this.containerRect.left, relativePosition) / this.containerRect.width;

		if (relativePosition > this.containerRect.width + allowedOutside
			|| relativePosition < 0 - allowedOutside
			|| fraction < this.minFraction) {
			this.stopDragging();
			return;
		}

		this.maxFraction = Math.min(1, fraction);
		onChange(this.minFraction, this.maxFraction);
	}

	dragArea(event: MouseEvent) {
		const { onChange } = this.props;

		const deltaCursor =  this.dragAreaStart - event.clientX;
		const deltaCursorFraction = deltaCursor / this.containerRect.width;
		const widthFraction = this.maxFractionDragStart - this.minFractionDragStart;

		this.minFraction = Math.min(1 - widthFraction, Math.max(0, this.minFractionDragStart - deltaCursorFraction));
		this.maxFraction = Math.max(widthFraction, Math.min(1, this.maxFractionDragStart - deltaCursorFraction));

		onChange(this.minFraction, this.maxFraction);
	}

	startDraggingHandleLeft = (event) => {
		event.stopPropagation();
		this.isDraggingHandleLeft = true;
	};

	startDraggingHandleRight = (event) => {
		event.stopPropagation();
		this.isDraggingHandleRight = true;
	};

	startDraggingArea = (event) => {
		event.stopPropagation();

		this.isDraggingArea = true;
		this.dragAreaStart = event.clientX;
		this.minFractionDragStart = this.minFraction;
		this.maxFractionDragStart = this.maxFraction;
	};

	drag = (event: MouseEvent) => {
		if (this.isDraggingHandleLeft) {
			this.dragHandleLeft(event);
		} else if (this.isDraggingHandleRight) {
			this.dragHandleRight(event);
		} else if (this.isDraggingArea) {
			this.dragArea(event);
		}
	};

	stopDragging = () => {
		const { onChange } = this.props;

		this.isDraggingHandleLeft = false;
		this.isDraggingHandleRight = false;
		this.isDraggingArea = false;

		const wasDragging: boolean = this.isDraggingHandleRight || this.isDraggingHandleLeft || this.isDraggingArea;
		const draggedFarEnough: boolean =
			Math.abs(this.minFractionDragStart - this.minFraction) > 1
			|| Math.abs(this.maxFractionDragStart - this.maxFraction) > 1;

		if (wasDragging || draggedFarEnough) {
			onChange(this.minFraction, this.maxFraction);
		}
	};

	startPlaying() {
		const { playWindowWidth, onStartPlaying } = this.props;

		this.setState({
			isPlaying: true
		});

		this.minFraction = 0;
		this.maxFraction = playWindowWidth;
		this.startPlayingAt = Date.now();
		onStartPlaying();
	}

	finishPlaying() {
		const { onFinishPlaying } = this.props;

		this.setState({
			isPlaying: false
		});

		onFinishPlaying();
	}

	reset() {
		const { onChange } = this.props;

		this.finishPlaying();

		this.minFraction = 0;
		this.maxFraction = 1;

		onChange(this.minFraction, this.maxFraction);
	}

	ticker() {
		if (!this.isComponentMounted) {
			return;
		}

		const { playWindowWidth, playTime, onChange } = this.props;
		const { isPlaying } = this.state;

		if (isPlaying) {
			const playingFinishedAt = this.startPlayingAt + playTime;
			const minFractionDestination = 1 - playWindowWidth;
			const playTimePassed = Date.now() - this.startPlayingAt;

			this.minFraction = playTimePassed / playTime * minFractionDestination;
			this.maxFraction = this.minFraction + playWindowWidth;

			onChange(this.minFraction, this.maxFraction);

			if (Date.now() > playingFinishedAt) {
				this.finishPlaying();
			}
		}

		const width = (this.maxFraction - this.minFraction) * 100;
		this.overlay.style.width = width + '%';
		this.overlay.style.left = (this.minFraction * 100) + '%';

		window.requestAnimationFrame(this.ticker.bind(this));
	}

	render() {
		const { isPlaying } = this.state;
		const { onSelect } = this.props;

		return (
			<div className={styles.timelineSlider}>
				<div className={styles.overlay} style={{ transform: 'scaleX(1)' }} ref={ref => this.overlay = ref } onMouseDown={this.startDraggingArea}>
					<button className={styles.handleLeft} onMouseDown={this.startDraggingHandleLeft}>
						<Icon name="ion-arrow-swap" />
					</button>
					<button className={styles.handleRight} onMouseDown={this.startDraggingHandleRight}>
						<Icon name="ion-arrow-swap" />
					</button>
					<button className={styles.select} onClick={() => onSelect(this.minFraction, this.maxFraction)}>
						<FormattedMessage id="select_nodes"/>
					</button>
				</div>
				<nav className={styles.actions}>
					{isPlaying && (
						<button className={styles.stop}
								onClick={this.finishPlaying.bind(this)}>
							<Icon name="ion-stop"/>
							<FormattedMessage id="stop"/>
						</button>
					)}

					{!isPlaying && (
						<button className={styles.play} onClick={this.startPlaying.bind(this)}>
							<Icon name="ion-ios-play" />
							<FormattedMessage id="play"/>
						</button>
					)}

					<button className={styles.reset} onClick={this.reset.bind(this)}><FormattedMessage id="reset"/></button>
				</nav>
			</div>
		);
	}
}

export default TimelineSlider;