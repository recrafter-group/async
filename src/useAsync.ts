import React from 'react';

import {AsyncState} from './types.js';
import {LOADING_ABORT_ASYNC_STATE, ASYNC_STATUS, LOADING_ASYNC_STATE, SKIP_ASYNC_STATE} from './constants.js';
import {startAction} from './startAction.js';
import {
    createLoadingFailureAsyncState,
    createSuccessAsyncState,
    createUpdatingAbortAsyncState,
    createUpdatingAsyncState,
    createUpdatingFailureAsyncState,
} from './factories.js';

/**
 * @public
 */
export interface CreatePromiseArgs<Variables> {
    variables: Variables;
    signal: AbortSignal;
}

/**
 * @public
 */
export type CreatePromise<Data, Variables> = (args: CreatePromiseArgs<Variables>) => Promise<Data>;

/**
 * @public
 */
export interface StartAsyncActionArgs<Data, Variables> {
    variables: Variables;
    onSuccess?: (data: Data) => void;
    onFailure?: (reason: unknown) => void;
    onFinally?: () => void;
}

/**
 * @public
 */
export type StartAsyncAction<Data, Variables> = (args: StartAsyncActionArgs<Data, Variables>) => void;

/**
 * @public
 */
export interface AsyncActions<Data, Variables> {
    start: StartAsyncAction<Data, Variables>;
    abort: () => void;
}

/**
 * @public
 */
export type UseAsyncResult<Data, Variables> = [AsyncState<Data>, AsyncActions<Data, Variables>];

/**
 * @public
 */
export interface UseAsyncArgs<Data, Variables> {
    createPromise: CreatePromise<Data, Variables>;
    isSkipped?: boolean;
    initialAsyncState?: AsyncState<Data>;
}

/**
 * @public
 */
export type UseAsync = <Data, Variables>(args: UseAsyncArgs<Data, Variables>) => UseAsyncResult<Data, Variables>;

interface Ref<Data, Variables> {
    isSkipped: boolean;
    createPromise: CreatePromise<Data, Variables>;
    abort: null | (() => void);
}

/**
 * @public
 */
export const useAsync: UseAsync = (args) => {
    const {createPromise, initialAsyncState = SKIP_ASYNC_STATE, isSkipped = false} = args;
    type Data = typeof createPromise extends CreatePromise<infer U, any> ? U : never;
    type Variables = typeof createPromise extends CreatePromise<any, infer U> ? U : never;
    const [asyncState, setAsyncState] = React.useState(isSkipped ? SKIP_ASYNC_STATE : initialAsyncState);
    const ref = React.useRef<Ref<Data, Variables>>({isSkipped, createPromise, abort: null});
    ref.current = {...ref.current, isSkipped, createPromise};
    React.useEffect(() => {
        if (isSkipped) {
            setAsyncState(SKIP_ASYNC_STATE);
            ref.current.abort?.();
        }
    }, [isSkipped]);
    React.useEffect(() => {
        return () => {
            // A useEffect with an empty deps array is not guaranteed to run only once per component's lifetime,
            // e.g. during hot module reloading this effect can rerun without a real unmount/remount.
            // That's why this resets the async state on "unmount" instead of only aborting.
            // See https://github.com/facebook/react/issues/21019#issuecomment-800650091
            // The isSkipped branch only matters for that HMR rerun (skip after an unmounted start),
            // a case that also can't be observed through React's public unmount behavior in a unit test.
            /* v8 ignore else */
            if (!ref.current.isSkipped && ref.current.abort) {
                setAsyncState(LOADING_ABORT_ASYNC_STATE);
                ref.current.abort();
            }
        };
    }, []);
    const start = React.useCallback<StartAsyncAction<Data, Variables>>((actionArgs) => {
        if (!ref.current.isSkipped) {
            setAsyncState((prevAsyncState) => {
                if (prevAsyncState.hasData) {
                    return createUpdatingAsyncState({data: prevAsyncState.data});
                }
                return LOADING_ASYNC_STATE;
            });
            ref.current.abort?.();
            ref.current.abort = startAction({
                createPromise(signal) {
                    return ref.current.createPromise({
                        variables: actionArgs.variables,
                        signal,
                    });
                },
                onSuccess(data) {
                    setAsyncState(createSuccessAsyncState({data}));
                    actionArgs.onSuccess?.(data);
                },
                onFailure(reason) {
                    setAsyncState((prevAsyncState) => {
                        if (prevAsyncState.status === ASYNC_STATUS.UPDATING) {
                            return createUpdatingFailureAsyncState({
                                reason,
                                data: prevAsyncState.data,
                            });
                        }
                        return createLoadingFailureAsyncState({reason});
                    });
                    actionArgs.onFailure?.(reason);
                },
                onFinally() {
                    actionArgs.onFinally?.();
                },
            });
        }
    }, []);
    const abort = React.useCallback(() => {
        if (!ref.current.isSkipped && ref.current.abort) {
            setAsyncState((prevAsyncState) => {
                if (prevAsyncState.status === ASYNC_STATUS.UPDATING) {
                    return createUpdatingAbortAsyncState({data: prevAsyncState.data});
                }
                return LOADING_ABORT_ASYNC_STATE;
            });
            ref.current.abort();
        }
    }, []);
    const asyncActions = React.useMemo<AsyncActions<Data, Variables>>(() => ({start, abort}), [start, abort]);
    return [asyncState, asyncActions];
};
