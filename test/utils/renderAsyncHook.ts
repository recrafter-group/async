import {act} from '@testing-library/react';

import {
    useAsync,
    type AsyncState,
    type StartAsyncAction,
    type StartAsyncActionArgs,
    type UseAsyncArgs,
} from '../../src/index.js';

import {renderHook, type RenderHookResult} from './renderHook.js';

export interface RenderAsyncHookResult<Data, Variables> extends RenderHookResult<
    UseAsyncArgs<Data, Variables>,
    {
        state: AsyncState<Data>;
        action: {
            start: StartAsyncAction<Data, Variables>;
            abort: () => void;
        };
    }
> {}

export type RenderAsyncHook = <Data, Variables>(
    args: UseAsyncArgs<Data, Variables>,
) => RenderAsyncHookResult<Data, Variables>;

export const renderAsyncHook: RenderAsyncHook = (args) =>
    renderHook(useAsync, args, (result) => ({
        get state() {
            return result.current[0];
        },
        action: {
            get start() {
                const {start} = result.current[1];
                return (startArgs: StartAsyncActionArgs<any, any>) => {
                    act(() => {
                        start(startArgs);
                    });
                };
            },
            get abort() {
                const {abort} = result.current[1];
                return () => {
                    act(() => {
                        abort();
                    });
                };
            },
        },
    }));
