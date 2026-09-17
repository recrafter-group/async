import {ASYNC_STATUS} from './constants.js';

/**
 * @public
 */
export interface SkipAsyncState {
    readonly status: ASYNC_STATUS.SKIP;
    readonly isWaiting: false;
    readonly hasData: false;
    readonly isFailed: false;
    readonly isAborted: false;
}

/**
 * @public
 */
export interface LoadingAsyncState {
    readonly status: ASYNC_STATUS.LOADING;
    readonly isWaiting: true;
    readonly hasData: false;
    readonly isFailed: false;
    readonly isAborted: false;
}

/**
 * @public
 */
export interface SuccessAsyncState<Data> {
    readonly status: ASYNC_STATUS.SUCCESS;
    readonly isWaiting: false;
    readonly hasData: true;
    readonly data: Data;
    readonly isFailed: false;
    readonly isAborted: false;
}

/**
 * @public
 */
export interface UpdatingAsyncState<Data> {
    readonly status: ASYNC_STATUS.UPDATING;
    readonly isWaiting: true;
    readonly hasData: true;
    readonly data: Data;
    readonly isFailed: false;
    readonly isAborted: false;
}

/**
 * @public
 */
export interface LoadingFailureAsyncState {
    readonly status: ASYNC_STATUS.LOADING_FAILURE;
    readonly isWaiting: false;
    readonly hasData: false;
    readonly reason: unknown;
    readonly isFailed: true;
    readonly isAborted: false;
}

/**
 * @public
 */
export interface UpdatingFailureAsyncState<Data> {
    readonly status: ASYNC_STATUS.UPDATING_FAILURE;
    readonly isWaiting: false;
    readonly hasData: true;
    readonly reason: unknown;
    readonly data: Data;
    readonly isFailed: true;
    readonly isAborted: false;
}

/**
 * @public
 */
export interface LoadingAbortAsyncState {
    readonly status: ASYNC_STATUS.LOADING_ABORT;
    readonly isWaiting: false;
    readonly hasData: false;
    readonly isFailed: false;
    readonly isAborted: true;
}

/**
 * @public
 */
export interface UpdatingAbortAsyncState<Data> {
    readonly status: ASYNC_STATUS.UPDATING_ABORT;
    readonly isWaiting: false;
    readonly hasData: true;
    readonly data: Data;
    readonly isFailed: false;
    readonly isAborted: true;
}

/**
 * @public
 */
export type AsyncState<Data> =
    | SkipAsyncState
    | LoadingAsyncState
    | SuccessAsyncState<Data>
    | UpdatingAsyncState<Data>
    | UpdatingFailureAsyncState<Data>
    | LoadingFailureAsyncState
    | LoadingAbortAsyncState
    | UpdatingAbortAsyncState<Data>;
