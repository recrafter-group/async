import {SkipAsyncState, LoadingAsyncState, LoadingAbortAsyncState} from './types.js';

/**
 * @public
 */
export enum ASYNC_STATUS {
    SKIP = 'SKIP',
    LOADING = 'LOADING',
    SUCCESS = 'SUCCESS',
    UPDATING = 'UPDATING',
    UPDATING_FAILURE = 'UPDATING_FAILURE',
    LOADING_FAILURE = 'LOADING_FAILURE',
    LOADING_ABORT = 'LOADING_ABORT',
    UPDATING_ABORT = 'UPDATING_ABORT',
}

/**
 * @public
 */
export const SKIP_ASYNC_STATE: SkipAsyncState = Object.freeze({
    status: ASYNC_STATUS.SKIP,
    isWaiting: false,
    hasData: false,
    isFailed: false,
    isAborted: false,
});

/**
 * @public
 */
export const LOADING_ASYNC_STATE: LoadingAsyncState = Object.freeze({
    status: ASYNC_STATUS.LOADING,
    isWaiting: true,
    hasData: false,
    isFailed: false,
    isAborted: false,
});

/**
 * @public
 */
export const LOADING_ABORT_ASYNC_STATE: LoadingAbortAsyncState = Object.freeze({
    status: ASYNC_STATUS.LOADING_ABORT,
    isWaiting: false,
    hasData: false,
    isFailed: false,
    isAborted: true,
});
