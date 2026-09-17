export type CreatePromise<T> = (signal: AbortSignal) => Promise<T>;

export interface StartActionArgs<T> {
    createPromise: CreatePromise<T>;
    onSuccess: (result: T) => void;
    onFailure: (reason: unknown) => void;
    onFinally: () => void;
}

export type AbortAction = () => void;

export type StartAction = <T>(args: StartActionArgs<T>) => AbortAction;

const abortError = Symbol('Abort Error');

export const startAction: StartAction = (args) => {
    const {createPromise, onSuccess, onFailure, onFinally} = args;
    type T = typeof createPromise extends CreatePromise<infer U> ? U : never;
    const abortController = new AbortController();
    const promise = createPromise(abortController.signal);
    new Promise<T>((resolve, reject) => {
        promise.then(
            (result) => (abortController.signal.aborted ? reject(abortError) : resolve(result)),
            (error) => (abortController.signal.aborted ? reject(abortError) : reject(error)),
        );
    })
        .then(onSuccess)
        .catch((reason) => {
            if (reason !== abortError) {
                onFailure(reason);
            }
        })
        .finally(() => {
            if (!abortController.signal.aborted) {
                onFinally();
            }
        });
    return function abortAction() {
        abortController.abort();
    };
};
