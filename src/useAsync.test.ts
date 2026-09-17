import {test, expect, describe, beforeEach, vi} from 'vitest';

import {wrapPromiseFactory} from '../test/utils/wrapPromiseFactory.js';
import {
    postfix,
    postfix2,
    createTestPromise,
    createTestPromiseResult,
    createBadTestPromise,
    badPromiseError,
} from '../test/utils/testPromises.js';
import {createTestPromiseFactory} from '../test/utils/createTestPromiseFactory.js';
import {renderAsyncHook} from '../test/utils/renderAsyncHook.js';

import {SKIP_ASYNC_STATE, LOADING_ASYNC_STATE, LOADING_ABORT_ASYNC_STATE} from './constants.js';
import {
    createLoadingFailureAsyncState,
    createSuccessAsyncState,
    createUpdatingAbortAsyncState,
    createUpdatingAsyncState,
    createUpdatingFailureAsyncState,
} from './factories.js';

test('Skip state by default', () => {
    const {createPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
});

test('Loading state as initial', () => {
    const {createPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise, initialAsyncState: LOADING_ASYNC_STATE});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
});

test('State changes after once action call', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
    result.action.start({variables: {}});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    await waitForResolvePromise();
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult}));
});

test('State changes after twice action calls', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise});
    result.action.start({variables: {}});
    await waitForResolvePromise();
    result.action.start({variables: {postfix}});
    expect(result.state).toEqual(createUpdatingAsyncState({data: createTestPromiseResult}));
    await waitForResolvePromise(2);
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult + postfix}));
});

test('State changes after thrice action calls', async () => {
    const {createPromise, waitForResolvePromise, waitForRejectPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise});
    result.action.start({variables: {}});
    await waitForResolvePromise();
    result.action.start({variables: {postfix}});
    result.action.start({variables: {postfix: postfix2}});
    expect(result.state).toEqual(createUpdatingAsyncState({data: createTestPromiseResult}));
    await waitForRejectPromise();
    await waitForResolvePromise(2);
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult + postfix2}));
});

test('State changes to loading failure after once action call', async () => {
    const {createPromise, waitForRejectPromise} = wrapPromiseFactory(createBadTestPromise);
    const {result} = renderAsyncHook({createPromise});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
    result.action.start({variables: null});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    await waitForRejectPromise();
    expect(result.state).toEqual(createLoadingFailureAsyncState({reason: badPromiseError}));
});

test('Should switch to the updating failure status if happens fail after success', async () => {
    const {createPromise, waitForRejectPromise, waitForResolvePromise} = wrapPromiseFactory(
        createTestPromiseFactory({
            getResult: ({callNumber}) => {
                if (callNumber === 1) {
                    throw badPromiseError;
                }
                return createTestPromiseResult;
            },
        }),
    );
    const {result} = renderAsyncHook({createPromise});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
    result.action.start({variables: null});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    await waitForResolvePromise();
    result.action.start({variables: null});
    await waitForRejectPromise();
    expect(result.state).toEqual(
        createUpdatingFailureAsyncState({
            reason: badPromiseError,
            data: createTestPromiseResult,
        }),
    );
});

describe('Callbacks', () => {
    let onSuccess: (data: any) => void;
    let onFailure: (reason: unknown) => void;
    let onFinally: () => void;

    beforeEach(() => {
        onSuccess = vi.fn();
        onFailure = vi.fn();
        onFinally = vi.fn();
    });

    test('Should call all callbacks instead error handler on success', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
        const {result} = renderAsyncHook({createPromise});
        result.action.start({variables: {}, onSuccess, onFailure, onFinally});
        await waitForResolvePromise();
        expect(onSuccess).toHaveBeenCalledWith(createTestPromiseResult);
        expect(onFinally).toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
    });

    test('Should call all callbacks instead success handler on failure', async () => {
        const {createPromise, waitForRejectPromise} = wrapPromiseFactory(createBadTestPromise);
        const {result} = renderAsyncHook({createPromise});
        result.action.start({variables: null, onSuccess, onFailure, onFinally});
        await waitForRejectPromise();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFinally).toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith(badPromiseError);
    });

    test('Should not call callbacks if call action and then unmounting component', async () => {
        const {createPromise, waitForRejectPromise} = wrapPromiseFactory(createTestPromise);
        const {unmount, result} = renderAsyncHook({createPromise});
        result.action.start({variables: {}, onSuccess, onFailure, onFinally});
        unmount();
        await waitForRejectPromise();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
        expect(onFinally).not.toHaveBeenCalled();
    });

    test('Should not call callbacks even if action was resolved after unmounting component', async () => {
        const {createPromise, waitForResolvePromise} = wrapPromiseFactory(async () => null);
        const {unmount, result} = renderAsyncHook({createPromise});
        result.action.start({variables: {}, onSuccess, onFailure, onFinally});
        unmount();
        await waitForResolvePromise();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).not.toHaveBeenCalled();
        expect(onFinally).not.toHaveBeenCalled();
    });
});

test('Should return skip state when enabled isSkipped flag independent initAsyncState parameter', () => {
    const {createPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise, isSkipped: true, initialAsyncState: LOADING_ASYNC_STATE});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
});

test('Should freeze action call when enabled isSkipped flag', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise, isSkipped: true});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
    result.action.start({variables: {}});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
    await waitForResolvePromise(0);
});

test('Should unfreeze action call as soon as isSkipped flag will be disabled', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result, rerender} = renderAsyncHook({createPromise, isSkipped: true});
    result.action.start({variables: {}});
    await waitForResolvePromise(0);
    rerender({createPromise, isSkipped: false});
    result.action.start({variables: {}});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    await waitForResolvePromise(1);
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult}));
});

test('Should return skip state as soon as isSkipped flag will be enabled', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result, rerender} = renderAsyncHook({createPromise, isSkipped: false});
    result.action.start({variables: {}});
    await waitForResolvePromise();
    rerender({createPromise, isSkipped: true});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
});

test('Should ignore promise reject when enabled isSkipped flag after action start', async () => {
    const {createPromise, waitForRejectPromise} = wrapPromiseFactory(createTestPromise);
    const {result, rerender} = renderAsyncHook({createPromise});
    result.action.start({variables: {}});
    rerender({createPromise, isSkipped: true});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
    await waitForRejectPromise();
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
});

test('Should ignore promise resolve when enabled isSkipped flag after action start', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(async () => null);
    const {result, rerender} = renderAsyncHook({createPromise});
    result.action.start({variables: null});
    rerender({createPromise, isSkipped: true});
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
    await waitForResolvePromise();
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
});

test('SShould properly call the start callback from previous render', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result, rerender} = renderAsyncHook({createPromise, isSkipped: true});
    const {start} = result.action;
    rerender({createPromise, isSkipped: false});
    start({variables: {}});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    await waitForResolvePromise();
    expect(result.state).toEqual(createSuccessAsyncState({data: createTestPromiseResult}));
});

test('Should abort slow action in favour same, but more fast action', async () => {
    const {createPromise, waitForResolvePromise, waitForRejectPromise} = wrapPromiseFactory(
        createTestPromiseFactory({
            getResult: ({callNumber}) => callNumber,
            delays: [900, 500],
        }),
    );
    const {result} = renderAsyncHook({createPromise, isSkipped: false});
    result.action.start({variables: {}});
    result.action.start({variables: {}});
    await waitForRejectPromise();
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    await waitForResolvePromise();
    expect(result.state).toEqual(createSuccessAsyncState({data: 1}));
});

test('Should switch to abort state after abort action', async () => {
    const {createPromise, waitForRejectPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise});
    result.action.start({variables: {}});
    expect(result.state).toEqual(LOADING_ASYNC_STATE);
    result.action.abort();
    expect(result.state).toEqual(LOADING_ABORT_ASYNC_STATE);
    await waitForRejectPromise();
    expect(result.state).toEqual(LOADING_ABORT_ASYNC_STATE);
});

test('Should not switch to abort state if action was not called', async () => {
    const {createPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise});
    result.action.abort();
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
});

test('Should not switch to abort state after abort action when enabled isSkipped flag', async () => {
    const {createPromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise, isSkipped: true});
    result.action.abort();
    expect(result.state).toEqual(SKIP_ASYNC_STATE);
});

test('Should properly call the abort callback from previous render', async () => {
    const {createPromise} = wrapPromiseFactory(createTestPromise);
    const {result, rerender} = renderAsyncHook({createPromise, isSkipped: true});
    const {abort} = result.action;
    rerender({createPromise, isSkipped: false});
    result.action.start({variables: {}});
    abort();
    expect(result.state).toEqual(LOADING_ABORT_ASYNC_STATE);
});

test('Should switch to the updating abort status when call abort after updating', async () => {
    const {createPromise, waitForResolvePromise} = wrapPromiseFactory(createTestPromise);
    const {result} = renderAsyncHook({createPromise});
    result.action.start({variables: {}});
    await waitForResolvePromise();
    result.action.start({variables: {postfix}});
    result.action.abort();
    expect(result.state).toEqual(createUpdatingAbortAsyncState({data: createTestPromiseResult}));
});
