import React from 'react';

/**
 * @public
 */
export type Slot<Props> = React.ReactNode | ((props: Props) => React.ReactNode);

/**
 * @public
 */
export type SimpleSlot = React.ReactNode | (() => React.ReactNode);

export type RenderSlot = <Props>(slot: Slot<Props>, props: Props) => React.ReactElement;

export type RenderSimpleSlot = (slot: SimpleSlot) => React.ReactElement;

export const renderSlot: RenderSlot = (render, props) => (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>{typeof render === 'function' ? render(props) : render}</>
);

export const renderSimpleSlot: RenderSimpleSlot = (render) => (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>{typeof render === 'function' ? render() : render}</>
);
