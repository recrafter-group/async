import React from 'react';

import {type ASYNC_STATUS, type AsyncState, type AsyncGuardBasicProps} from '../../src/index.js';
import {
    createLoadingFailureAsyncState,
    createSuccessAsyncState,
    createUpdatingAbortAsyncState,
    createUpdatingAsyncState,
    createUpdatingFailureAsyncState,
} from '../../src/factories.js';

const data = 'Some data';
const reason = 'Failure reason';

export const SUCCESS_ASYNC_STATE: AsyncState<string> = createSuccessAsyncState({data});

export const LOADING_FAILURE_ASYNC_STATE: AsyncState<string> = createLoadingFailureAsyncState({reason});

export const UPDATING_ASYNC_STATE: AsyncState<string> = createUpdatingAsyncState({data});

export const UPDATING_FAILURE_ASYNC_STATE: AsyncState<string> = createUpdatingFailureAsyncState({reason, data});

export const UPDATING_ABORT_ASYNC_STATE: AsyncState<string> = createUpdatingAbortAsyncState({data});

export const UNKNOWN_ASYNC_STATE: AsyncState<string> = {
    status: 'UNKNOWN' as ASYNC_STATUS.LOADING,
    isWaiting: true,
    hasData: false,
    isFailed: false,
    isAborted: false,
};

export const renderJson = (renderProps?: unknown) => (
    <pre>{`\n${
        typeof renderProps === 'object' && renderProps !== null
            ? JSON.stringify(renderProps, Object.keys(renderProps).sort(), 2)
            : ''
    }\n`}</pre>
);

export const jsonRenderers: AsyncGuardBasicProps<string> = {
    children: renderJson,
    loadingSlot: renderJson,
    loadingAbortSlot: renderJson,
    loadingFailureSlot: renderJson,
    updatingSlot: renderJson,
    updatingAbortSlot: renderJson,
    updatingFailureSlot: renderJson,
    skipSlot: renderJson,
};

export const elementRenderers: AsyncGuardBasicProps<string> = {
    children: <span>Success</span>,
    loadingSlot: <span>Loading</span>,
    loadingAbortSlot: <span>Loading Abort</span>,
    loadingFailureSlot: <span>Loading Failure</span>,
    updatingSlot: <span>Updating</span>,
    updatingAbortSlot: <span>Updating Abort</span>,
    updatingFailureSlot: <span>Updating Failure</span>,
    skipSlot: <span>Skip</span>,
};
