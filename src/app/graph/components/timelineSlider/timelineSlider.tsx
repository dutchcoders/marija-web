import * as React from 'react';
import { findDOMNode } from 'react-dom';
import * as styles from './timelineSlider.scss';
import Icon from '../../../ui/components/icon';

interface Props {
	onChanged: (fraction: number) => void
}

interface State {

}

class TimelineSlider extends React.Component<Props, State> {
	isComponentMounted: boolean = false;
	isMouseDown: boolean = false;
	fraction: number = 1;
	relativePosition: number = 0;
	container: HTMLElement;
	containerRect: ClientRect;
	overlay: HTMLDivElement;
	handle: HTMLButtonElement;

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

	startDragging = () => {
		this.isMouseDown = true;
	};

	drag = (event: MouseEvent) => {
		const { onChanged } = this.props;

		if (!this.isMouseDown) {
			return;
		}

		const relativePosition = event.clientX - this.containerRect.left;
		const allowedOutside = 20;

		if (relativePosition > this.containerRect.width + allowedOutside || relativePosition < 0 - allowedOutside) {
			this.stopDragging();
			return;
		}

		this.relativePosition = Math.max(0, relativePosition);
		this.fraction = 1 - this.relativePosition / this.containerRect.width;
		onChanged(this.fraction);
	};

	stopDragging = () => {
		const { onChanged } = this.props;

		this.isMouseDown = false;
		onChanged(this.fraction);
	};

	ticker() {
		if (!this.isComponentMounted) {
			return;
		}

		this.overlay.style.width = (this.fraction * 100) + '%';
		this.overlay.style.left = ((1 - this.fraction) * 100) + '%';
		this.handle.style.transform = 'translateX(' + this.relativePosition + 'px)';


		window.requestAnimationFrame(this.ticker.bind(this));
	}

	render() {
		return (
			<div className={styles.timelineSlider}>
				<div className={styles.overlay} style={{ transform: 'scaleX(1)' }} ref={ref => this.overlay = ref }/>
				<button className={styles.handle} onMouseDown={this.startDragging} ref={ref => this.handle = ref }>
					<Icon name="ion-arrow-swap" />
				</button>
			</div>
		);
	}
}

export default TimelineSlider;