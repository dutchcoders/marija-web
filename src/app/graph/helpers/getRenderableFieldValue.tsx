import Lightbox from '../../ui/components/lightbox/lightbox';
import Expandable from '../../table/components/expandable/expandable';
import { isObject } from 'lodash';
import * as React from 'react';

export function getRenderableFieldValue(value: any) {
	if (isImage(value)) {
		return <Lightbox imageUrl={value} />
	} else if (typeof value === 'number') {
		return value;
	}
	else if (typeof value === 'string') {
		if (value.length > 200) {
			return <Expandable content={value} maxLength={200} />
		} else if (isUrl(value)) {
			return <a href={value} target="_blank">{value}</a>
		} else {
			return value;
		}
	} else if (typeof value === 'boolean') {
		return value ? 'yes' : 'no';
	} else if (Array.isArray(value)) {
		if (value.length === 1) {
			return getRenderableFieldValue(value[0]);
		} else {
			return (
				<ul>
					{value.map((element, i) =>
						<li key={i}>{getRenderableFieldValue(element)}</li>
					)}
				</ul>
			);
		}
	} else if (isObject(value)) {
		const elements = [];

		for (let key in value) {
			if (!value.hasOwnProperty(key)) {
				continue;
			}

			elements.push(
				<div>
					<strong>{key}: </strong>
					{getRenderableFieldValue(value[key])}
				</div>
			);
		}

		if (elements.length === 1) {
			return elements[0];
		}

		return (
			<ul>
				{elements.map((element, i) => <li key={i}>{element}</li>)}
			</ul>
		);
	} else {
		return JSON.stringify(value);
	}
}

function isImage(value: any): boolean {
	if (typeof value !== 'string') {
		return false;
	}

	return /\.(jpg|jpeg|gif|png)$/.test(value);
}

function isUrl(value: string): boolean {
	return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*$)/.test(value);
}