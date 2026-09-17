import {waitFor} from '@testing-library/react';
import {vi, expect} from 'vitest';

export interface WrapPromiseFactoryResult<T extends (...args: any[]) => Promise<any>> {
    createPromise: T;
    resolveCallback: () => void;
    rejectCallback: () => void;
    waitForResolvePromise: (callNumber?: number) => Promise<void>;
    waitForRejectPromise: (callNumber?: number) => Promise<void>;
}

export type WrapPromiseFactory = <T extends (...args: any[]) => Promise<any>>(action: T) => WrapPromiseFactoryResult<T>;

export const wrapPromiseFactory: WrapPromiseFactory = (action) => {
    const resolveCallback = vi.fn();
    const rejectCallback = vi.fn();
    return {
        createPromise: (async (...args: any[]) => {
            let result: any;
            try {
                result = await action(...args);
            } catch (e) {
                rejectCallback();
                throw e;
            }
            resolveCallback();
            return result;
        }) as any,
        resolveCallback,
        rejectCallback,
        waitForResolvePromise: async (callNumber) => {
            await waitFor(() => expect(resolveCallback).toHaveBeenCalledTimes(callNumber ?? 1));
        },
        waitForRejectPromise: async (callNumber) => {
            await waitFor(() => expect(rejectCallback).toHaveBeenCalledTimes(callNumber ?? 1));
        },
    };
};
