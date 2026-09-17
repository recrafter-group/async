import {test, expect, describe, beforeEach, vi} from 'vitest';

import {wrapPromiseFactory} from '../test/utils/wrapPromiseFactory.js';
import {
    badPromiseError,
    postfix,
    createTestPromise,
    createTestPromiseResult,
    createBadTestPromise,
} from '../test/utils/testPromises.js';
import {renderAutoAsyncHook} from '../test/utils/renderAutoAsyncHook.js';
import {createTestPromiseFactory} from '../test/utils/createTestPromiseFactory.js';

import {SKIP_ASYNC_STATE, LOADING_ASYNC_STATE, LOADING_ABORT_ASYNC_STATE} from './constants.js';
import {createSuccessAsyncState, createUpdatingAsyncState} from './factories.js';

test('Should call action on mount', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAutoAsyncHook({createPromise, variables: {}});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    await waitForResolvePromise();
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult}));
});

test('Should not call action when rerender with same variables', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result, rerender} = renderAutoAsyncHook({createPromise, variables: {}});
    await waitForResolvePromise();
    rerender({createPromise, variables: {}});
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult}));
    await waitForResolvePromise();
});

test('Should call action when rerender with new variables', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result, rerender} = renderAutoAsyncHook({createPromise, variables: {}});
    await waitForResolvePromise();
    rerender({createPromise, variables: {postfix}});
    expect(result.state).toEqual(createUpdatingAsyncState({data: createTestPromiseResult}));
    await waitForResolvePromise(2);
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult + postfix}));
});

test('Should call action when called update function with same variables', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAutoAsyncHook({createPromise, variables: {}});
    await waitForResolvePromise();
    result.action.restart();
    expect(result.state).toEqual(createUpdatingAsyncState({data: createTestPromiseResult}));
    await waitForResolvePromise(2);
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult}));
});

test('Should call action when called update function with new variables', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAutoAsyncHook({createPromise, variables: {}});
    await waitForResolvePromise();
    result.action.restart({variables: {postfix}});
    expect(result.state).toEqual(createUpdatingAsyncState({data: createTestPromiseResult}));
    await waitForResolvePromise(2);
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult + postfix}));
});

describe('Callbacks', () => {
    let onSuccess: (data: any) => void;
    let onFailure: (reason: unknown) => void;
    let onFinally: () => void;
    let onUpdateSuccess: (data: any) => void;
    let onUpdateFailure: (reason: unknown) => void;
    let onUpdateFinally: () => void;

    beforeEach(() => {
        onSuccess = vi.fn();
        onFailure = vi.fn();
        onFinally = vi.fn();
        onUpdateSuccess = vi.fn();
        onUpdateFailure = vi.fn();
        onUpdateFinally = vi.fn();
    });

    test('Should call all callbacks instead error handler', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        renderAutoAsyncHook({createPromise, variables: {}, onSuccess, onFinally, onFailure});
        await waitForResolvePromise();
        expect(onSuccess).toHaveBeenCalledWith(createTestPromiseResult);
        expect(onFinally).toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Should call all callbacks instead success handler', async () => {
        const {createPromise, waitForRejectPromise} = wrapPromiseFactory(createBadTestPromise);
        renderAutoAsyncHook({
            createPromise,
            variables: null,
            onSuccess,
            onFinally,
            onFailure,
        });
        await waitForRejectPromise();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFinally).toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith(badPromiseError);
    });

    test('Should call only callbacks passed to update function (instead failure) when it called', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        const {result} = renderAutoAsyncHook({
            createPromise,
            variables: {},
            onSuccess,
            onFinally,
            onFailure,
        });
        await waitForResolvePromise();
        result.action.restart({
            onSuccess: onUpdateSuccess,
            onFinally: onUpdateFinally,
            onFailure: onUpdateFailure,
        });
        await waitForResolvePromise(2);
        expect(onSuccess).not.toHaveBeenCalledTimes(2);
        expect(onFinally).not.toHaveBeenCalledTimes(2);
        expect(onFailure).not.toHaveBeenCalled();
        expect(onUpdateSuccess).toHaveBeenCalledWith(createTestPromiseResult);
        expect(onUpdateFinally).toHaveBeenCalled();
        expect(onUpdateFailure).not.toHaveBeenCalled();
    });

    test('Should call only callbacks passed to update function (instead success) when it called', async () => {
        const error = new Error();
        const {createPromise, waitForRejectPromise} = wrapPromiseFactory(async (_: {variables: null}) => {
            throw error;
        });
        const {result} = renderAutoAsyncHook({
            createPromise,
            variables: null,
            onSuccess,
            onFinally,
            onFailure,
        });
        await waitForRejectPromise();
        result.action.restart({
            onSuccess: onUpdateSuccess,
            onFinally: onUpdateFinally,
            onFailure: onUpdateFailure,
        });
        await waitForRejectPromise(2);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFinally).not.toHaveBeenCalledTimes(2);
        expect(onFailure).not.toHaveBeenCalledTimes(2);
        expect(onUpdateSuccess).not.toHaveBeenCalled();
        expect(onUpdateFinally).toHaveBeenCalled();
        expect(onUpdateFailure).toHaveBeenCalledWith(error);
    });
});

describe('Skip', () => {
    test('Should not call action on mount if enabled isSkipped flag', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        const {result} = renderAutoAsyncHook({createPromise, variables: {}, isSkipped: true});
        expect(result.state).toEqual(SKIP_ASYNC_STATE);
        await waitForResolvePromise(0);
    });

    test('Should not call action after update if enabled isSkipped flag', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        const {result} = renderAutoAsyncHook({createPromise, variables: {}, isSkipped: true});
        result.action.restart();
        expect(result.state).toEqual(SKIP_ASYNC_STATE);
        await waitForResolvePromise(0);
    });

    test('Should call action automatically after disable isSkipped flag', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        const {result, rerender} = renderAutoAsyncHook({createPromise, variables: {}, isSkipped: true});
        rerender({createPromise, variables: {}, isSkipped: false});
        expect(result.state).toEqual(LOADING_ASYNC_STATE);
        await waitForResolvePromise();
        expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult}));
    });

    test('Should reset state to skip after rerender with enabled isSkipped flag', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        const {result, rerender} = renderAutoAsyncHook({createPromise, variables: {}, isSkipped: false});
        await waitForResolvePromise();
        expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult}));
        rerender({createPromise, variables: {}, isSkipped: true});
        expect(result.state).toEqual(SKIP_ASYNC_STATE);
        await waitForResolvePromise();
    });
});

test('Should switch to abort state after abort action', async () => {
    const {createPromise, waitForRejectPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAutoAsyncHook({createPromise, variables: {}});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    result.action.abort();
    expect(result.state).toEqual(LOADING_ABORT_ASYNC_STATE);
    await waitForRejectPromise();
    expect(result.state).toEqual(LOADING_ABORT_ASYNC_STATE);
});

test('Should not switch to abort state after abort action when enabled isSkipped flag', async () => {
    const {createPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAutoAsyncHook({createPromise, variables: {}, isSkipped: true});
    result.action.abort();
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
});

test('Should properly call the restart callback from previous render', async () => {
    const onSuccess = vi.fn();
    const onFinally = vi.fn();
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result, rerender} = renderAutoAsyncHook({createPromise, variables: {}});
    const {restart} = result.action;
    rerender({createPromise, variables: {}, onSuccess, onFinally});
    restart();
    await waitForResolvePromise();
    expect(onSuccess).toHaveBeenCalledWith(createTestPromiseResult);
    expect(onFinally).toHaveBeenCalled();
});

test('Should properly call the restart callback from previous render when promise failure', async () => {
    const onFailure = vi.fn();
    const {createPromise, waitForRejectPromise} = wrapPromiseFactory(
        createTestPromiseFactory({
            getResult: (_: {variables: null}) => {
                throw badPromiseError;
            },
            delays: [100, 0],
        }),
    );
    const {result, rerender} = renderAutoAsyncHook({createPromise, variables: null});
    const {restart} = result.action;
    rerender({createPromise, variables: null, onFailure});
    restart();
    await waitForRejectPromise(2);
    expect(onFailure).toHaveBeenCalledWith(badPromiseError);
});
