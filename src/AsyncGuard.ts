import React from 'react';

import {AsyncState} from './types.js';
import {ASYNC_STATUS} from './constants.js';
import {renderSimpleSlot, renderSlot, SimpleSlot, Slot} from './slot.js';

/**
 * @public
 */
export interface AsyncGuardDataSlotProps<Data> {
    data: Data;
}

/**
 * @public
 */
export interface AsyncGuardFailureSlotProps {
    reason: unknown;
}

/**
 * @public
 */
export interface AsyncGuardUpdatingFailureSlotProps<Data> {
    data: Data;
    reason: unknown;
}

/**
 * @public
 */
export interface AsyncGuardBasicProps<Data> {
    children?: Slot<AsyncGuardDataSlotProps<Data>>;
    skipSlot?: SimpleSlot;
    loadingSlot?: SimpleSlot;
    loadingAbortSlot?: SimpleSlot;
    loadingFailureSlot?: Slot<AsyncGuardFailureSlotProps>;
    updatingSlot?: Slot<AsyncGuardDataSlotProps<Data>>;
    updatingAbortSlot?: Slot<AsyncGuardDataSlotProps<Data>>;
    updatingFailureSlot?: Slot<AsyncGuardUpdatingFailureSlotProps<Data>>;
}

/**
 * @public
 */
export interface AsyncGuardComponent {
    <Data>(props: AsyncState<Data> & AsyncGuardBasicProps<Data>): React.ReactNode;
}

/**
 * @public
 */
export const AsyncGuard: AsyncGuardComponent = React.memo(function AsyncGuard(props) {
    const {
        skipSlot,
        updatingSlot,
        updatingAbortSlot,
        updatingFailureSlot,
        loadingSlot,
        loadingAbortSlot,
        loadingFailureSlot,
        children,
        ...otherProps
    } = props;
    switch (otherProps.status) {
        case ASYNC_STATUS.SUCCESS:
            return renderSlot(children, {data: otherProps.data});
        case ASYNC_STATUS.SKIP:
            return renderSimpleSlot(skipSlot);
        case ASYNC_STATUS.LOADING:
            return renderSimpleSlot(loadingSlot);
        case ASYNC_STATUS.LOADING_FAILURE:
            return renderSlot(loadingFailureSlot, {reason: otherProps.reason});
        case ASYNC_STATUS.LOADING_ABORT:
            return renderSimpleSlot(loadingAbortSlot);
        case ASYNC_STATUS.UPDATING:
            return renderSlot(updatingSlot, {data: otherProps.data});
        case ASYNC_STATUS.UPDATING_FAILURE:
            return renderSlot(updatingFailureSlot, {data: otherProps.data, reason: otherProps.reason});
        case ASYNC_STATUS.UPDATING_ABORT:
            return renderSlot(updatingAbortSlot, {data: otherProps.data});
        default:
            return null;
    }
});
