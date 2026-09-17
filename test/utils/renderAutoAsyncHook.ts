import {act} from '@testing-library/react';

import {
    type AsyncState,
    type AutoAsyncActionRestart,
    type StartAsyncActionArgs,
    type UseAutoAsyncArgs,
    useAutoAsync,
} from '../../src/index.js';

import {renderHook, type RenderHookResult} from './renderHook.js';

export interface RenderAutoAsyncHookResult<Data, Variables> extends RenderHookResult<
    UseAutoAsyncArgs<Data, Variables>,
    {
        state: AsyncState<Data>;
        action: {
            restart: AutoAsyncActionRestart<Data, Variables>;
            abort: () => void;
        };
    }
> {}

export type RenderAutoAsyncHook = <Data, Variables>(
    args: UseAutoAsyncArgs<Data, Variables>,
) => RenderAutoAsyncHookResult<Data, Variables>;

export const renderAutoAsyncHook: RenderAutoAsyncHook = (args) =>
    renderHook(useAutoAsync, args, (result) => ({
        get state() {
            return result.current[0];
        },
        action: {
            get restart() {
                const {restart} = result.current[1];
                return (restartArgs?: Partial<StartAsyncActionArgs<any, any>>) => {
                    act(() => {
                        restart(restartArgs);
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
