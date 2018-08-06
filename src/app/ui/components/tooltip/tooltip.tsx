import * as React from 'react';
import { InjectedIntl, injectIntl } from 'react-intl';
import RcTooltip from 'rc-tooltip';

interface Props {
	children: any;
	messageId: string;
	intl?: InjectedIntl;
}

class Tooltip extends React.Component<Props> {
	render() {
		const { intl, children, messageId } = this.props;

		return (
			<RcTooltip
				overlay={intl.formatMessage({ id: messageId })}
				placement="bottom"
				mouseLeaveDelay={0}
				arrowContent={<div className="rc-tooltip-arrow-inner" />}>
				{children}
			</RcTooltip>
		);
	}
}

//@ts-ignore
export default injectIntl(Tooltip);