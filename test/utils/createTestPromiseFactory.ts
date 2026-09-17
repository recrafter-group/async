import {type CreatePromise} from '../../index.js';

export interface CreateTestPromiseFactoryArgs<Data, Variables> {
    getResult: (args: {variables: Variables; callNumber: number}) => Data;
    delays?: number[];
}

export type CreateTestPromiseFactory = <Data, Variables>(
    args: CreateTestPromiseFactoryArgs<Data, Variables>,
) => CreatePromise<Data, Variables>;

export const createTestPromiseFactory: CreateTestPromiseFactory = ({getResult, delays = []}) => {
    let i = 0;
    return ({variables, signal}) => {
        const callNumber = i;
        i++;
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                try {
                    resolve(getResult({variables, callNumber}));
                } catch (e) {
                    reject(e);
                }
            }, delays[callNumber] ?? 0);
            signal.onabort = () => {
                clearTimeout(timeoutId);
                reject(new Error('AbortError'));
            };
        });
    };
};
