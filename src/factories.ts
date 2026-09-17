import {ASYNC_STATUS} from './constants.js';
import {
    LoadingFailureAsyncState,
    SuccessAsyncState,
    UpdatingAbortAsyncState,
    UpdatingAsyncState,
    UpdatingFailureAsyncState,
} from './types.js';

export interface CreateDataAsyncStateArgs<Data> {
    data: Data;
}

export interface CreateFailureAsyncStateArgs {
    reason: unknown;
}

export type CreateSuccessAsyncState = <Data>(args: CreateDataAsyncStateArgs<Data>) => SuccessAsyncState<Data>;

export type CreateLoadingFailureAsyncState = (args: CreateFailureAsyncStateArgs) => LoadingFailureAsyncState;

export type CreateUpdatingAsyncState = <Data>(args: CreateDataAsyncStateArgs<Data>) => UpdatingAsyncState<Data>;

export interface CreateUpdatingFailureAsyncStateArgs<Data>
    extends CreateDataAsyncStateArgs<Data>, CreateFailureAsyncStateArgs {}
export type CreateUpdatingFailureAsyncState = <Data>(
    args: CreateUpdatingFailureAsyncStateArgs<Data>,
) => UpdatingFailureAsyncState<Data>;

export type CreateUpdatingAbortAsyncState = <Data>(
    args: CreateDataAsyncStateArgs<Data>,
) => UpdatingAbortAsyncState<Data>;

export const createSuccessAsyncState: CreateSuccessAsyncState = ({data}) =>
    Object.freeze({
        status: ASYNC_STATUS.SUCCESS,
        isWaiting: false,
        hasData: true,
        isFailed: false,
        isAborted: false,
        data,
    });

export const createLoadingFailureAsyncState: CreateLoadingFailureAsyncState = ({reason}) =>
    Object.freeze({
        status: ASYNC_STATUS.LOADING_FAILURE,
        isWaiting: false,
        hasData: false,
        isFailed: true,
        isAborted: false,
        reason,
    });

export const createUpdatingAsyncState: CreateUpdatingAsyncState = ({data}) =>
    Object.freeze({
        status: ASYNC_STATUS.UPDATING,
        isWaiting: true,
        hasData: true,
        isFailed: false,
        isAborted: false,
        data,
    });

export const createUpdatingFailureAsyncState: CreateUpdatingFailureAsyncState = ({data, reason}) =>
    Object.freeze({
        status: ASYNC_STATUS.UPDATING_FAILURE,
        isWaiting: false,
        hasData: true,
        isFailed: true,
        isAborted: false,
        data,
        reason,
    });

export const createUpdatingAbortAsyncState: CreateUpdatingAbortAsyncState = ({data}) =>
    Object.freeze({
        status: ASYNC_STATUS.UPDATING_ABORT,
        isWaiting: false,
        hasData: true,
        isFailed: false,
        isAborted: true,
        data,
    });
