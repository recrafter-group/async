import React from 'react';
import isEqual from 'fast-deep-equal/es6/index.js';

import {CreatePromise, StartAsyncActionArgs, useAsync} from './useAsync.js';
import {AsyncState} from './types.js';

/**
 * @public
 */
export interface UseAutoAsyncArgs<Data, Variables> {
    createPromise: CreatePromise<Data, Variables>;
    variables: Variables;
    isSkipped?: boolean;
    initialAsyncState?: AsyncState<Data>;
    onSuccess?: (data: Data) => void;
    onFailure?: (reason: unknown) => void;
    onFinally?: () => void;
}

/**
 * @public
 */
export type AutoAsyncActionRestart<Data, Variables> = (
    updateArgs?: Partial<StartAsyncActionArgs<Data, Variables>>,
) => void;

/**
 * @public
 */
export interface AutoAsyncActions<Data, Variables> {
    restart: AutoAsyncActionRestart<Data, Variables>;
    abort: () => void;
}

/**
 * @public
 */
export type UseAutoAsyncResult<Data, Variables> = [AsyncState<Data>, AutoAsyncActions<Data, Variables>];

/**
 * @public
 */
export type UseAutoAsync = <Data, Variables>(
    args: UseAutoAsyncArgs<Data, Variables>,
) => UseAutoAsyncResult<Data, Variables>;

/**
 * @public
 */
export const useAutoAsync: UseAutoAsync = (args) => {
    type Data = typeof args.createPromise extends CreatePromise<infer U, any> ? U : never;
    type Variables = typeof args.createPromise extends CreatePromise<any, infer U> ? U : never;
    const {createPromise, variables, isSkipped = false, onSuccess, onFailure, onFinally} = args;
    const [asyncState, {start, abort}] = useAsync({createPromise, isSkipped});
    const ref = React.useRef({
        wasAction: false,
        variables,
        prevVariables: variables,
        onSuccess,
        onFailure,
        onFinally,
    });
    ref.current = {...ref.current, variables, onSuccess, onFailure, onFinally};
    React.useEffect(() => {
        let shouldUpdate = false;
        if (isEqual(variables, ref.current.prevVariables)) {
            if (!isSkipped && !ref.current.wasAction) {
                shouldUpdate = true;
                ref.current.wasAction = true;
            }
        } else {
            shouldUpdate = true;
        }
        if (shouldUpdate) {
            start({
                variables,
                onSuccess,
                onFailure,
                onFinally,
            });
        }
        ref.current.prevVariables = variables;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSkipped, variables]);
    React.useEffect(() => {
        // A useEffect with an empty deps array is not guaranteed to run only once per component's lifetime,
        // e.g. during hot module reloading. That's why this resets wasAction on "unmount".
        // See https://github.com/facebook/react/issues/21019#issuecomment-800650091
        // Only triggers during hot module reloading, which unit tests cannot reproduce.
        /* v8 ignore next 3 */
        return () => {
            ref.current.wasAction = false;
        };
    }, []);
    const restart = React.useCallback<AutoAsyncActionRestart<Data, Variables>>(
        (updateArgs) => {
            start({
                variables: ref.current.variables,
                onSuccess: ref.current.onSuccess,
                onFailure: ref.current.onFailure,
                onFinally: ref.current.onFinally,
                ...updateArgs,
            });
        },
        [start],
    );
    const asyncAutoActions = React.useMemo(() => ({restart, abort}), [restart, abort]);
    return [asyncState, asyncAutoActions];
};
