import * as React from 'react';
import { findDOMNode } from 'react-dom';
import * as styles from './timelineSlider.scss';
import Icon from '../../../ui/components/icon';

interface Props {
	onChanged: (minFraction: number, maxFraction: number) => void
}

interface State {

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
		const { onChanged } = this.props;

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
		onChanged(this.minFraction, this.maxFraction);
	}

	dragHandleRight(event: MouseEvent) {
		const { onChanged } = this.props;

		const relativePosition = event.clientX - this.containerRect.left;
		const allowedOutside = 20;
		const fraction = Math.min(this.containerRect.width + this.containerRect.left, relativePosition) / this.containerRect.width;

		if (relativePosition > this.containerRect.width + allowedOutside
			|| relativePosition < 0 - allowedOutside
			|| fraction < this.minFraction) {
			this.stopDragging();
			return;
		}

		this.maxFraction = fraction;
		onChanged(this.minFraction, this.maxFraction);
	}

	dragArea(event: MouseEvent) {
		const { onChanged } = this.props;
		
		const deltaCursor =  this.dragAreaStart - event.clientX;
		const deltaCursorFraction = deltaCursor / this.containerRect.width;
		const widthFraction = this.maxFractionDragStart - this.minFractionDragStart;

		this.minFraction = Math.min(1 - widthFraction, Math.max(0, this.minFractionDragStart - deltaCursorFraction));
		this.maxFraction = Math.max(widthFraction, Math.min(1, this.maxFractionDragStart - deltaCursorFraction));

		onChanged(this.minFraction, this.maxFraction);
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
		const { onChanged } = this.props;

		this.isDraggingHandleLeft = false;
		this.isDraggingHandleRight = false;
		this.isDraggingArea = false;
		onChanged(this.minFraction, this.maxFraction);
	};

	ticker() {
		if (!this.isComponentMounted) {
			return;
		}

		const width = (this.maxFraction - this.minFraction) * 100;
		this.overlay.style.width = width + '%';
		this.overlay.style.left = (this.minFraction * 100) + '%';

		window.requestAnimationFrame(this.ticker.bind(this));
	}

	render() {
		return (
			<div className={styles.timelineSlider}>
				<div className={styles.overlay} style={{ transform: 'scaleX(1)' }} ref={ref => this.overlay = ref } onMouseDown={this.startDraggingArea}>
					<button className={styles.handleLeft} onMouseDown={this.startDraggingHandleLeft}>
						<Icon name="ion-arrow-swap" />
					</button>
					<button className={styles.handleRight} onMouseDown={this.startDraggingHandleRight}>
						<Icon name="ion-arrow-swap" />
					</button>
				</div>
			</div>
		);
	}
}

export default TimelineSlider;