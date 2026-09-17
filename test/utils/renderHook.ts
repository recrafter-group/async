import {renderHook as renderHookLib} from '@testing-library/react';

export interface RenderHookResult<Args, Result> {
    rerender: (args?: Args) => void;
    unmount: () => void;
    result: Result;
}

export type RenderHook = <Args, Result, ModifiedResult>(
    hook: (args: Args) => Result,
    args: Args,
    modifyResult: (result: {current: Result}) => ModifiedResult,
) => RenderHookResult<Args, ModifiedResult>;

export const renderHook: RenderHook = (hook, args, modifyResult) => {
    const {result, rerender, unmount} = renderHookLib((initialProps) => hook(initialProps), {initialProps: args});
    return {
        rerender,
        unmount,
        result: modifyResult(result),
    };
};
