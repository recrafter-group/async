import {test, expect} from 'vitest';

import {ASYNC_STATUS} from './constants.js';
import {
    createLoadingFailureAsyncState,
    createSuccessAsyncState,
    createUpdatingAbortAsyncState,
    createUpdatingAsyncState,
    createUpdatingFailureAsyncState,
} from './factories.js';

const data = 'Some data';
const reason = 'Some reason';

test('Should create SuccessAsyncState', () => {
    expect(createSuccessAsyncState({data})).toEqual({
        status: ASYNC_STATUS.SUCCESS,
        isWaiting: false,
        hasData: true,
        isFailed: false,
        isAborted: false,
        data,
    });
});

test('Should create LoadingFailureAsyncState', () => {
    expect(createLoadingFailureAsyncState({reason})).toEqual({
        status: ASYNC_STATUS.LOADING_FAILURE,
        isWaiting: false,
        hasData: false,
        isFailed: true,
        isAborted: false,
        reason,
    });
});

test('Should create UpdatingAsyncState', () => {
    expect(createUpdatingAsyncState({data})).toEqual({
        status: ASYNC_STATUS.UPDATING,
        isWaiting: true,
        hasData: true,
        isFailed: false,
        isAborted: false,
        data,
    });
});

test('Should create UpdatingFailureAsyncState', () => {
    expect(createUpdatingFailureAsyncState({data, reason})).toEqual({
        status: ASYNC_STATUS.UPDATING_FAILURE,
        isWaiting: false,
        hasData: true,
        isFailed: true,
        isAborted: false,
        data,
        reason,
    });
});

test('Should create UpdatingAbortAsyncState', () => {
    expect(createUpdatingAbortAsyncState({data})).toEqual({
        status: ASYNC_STATUS.UPDATING_ABORT,
        isWaiting: false,
        hasData: true,
        isFailed: false,
        isAborted: true,
        data,
    });
});
