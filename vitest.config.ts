import {defineConfig} from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    test: {
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            include: ['index.ts', 'src/**/*.ts', 'src/**/*.tsx'],
            exclude: ['**/*.test.snap.ts'],
            reporter: ['text', 'html', 'json', 'json-summary'],
            reportsDirectory: '.coverage',
            thresholds: {
                branches: 100,
                functions: 100,
                lines: 100,
                statements: 100,
            },
        },
        typecheck: {
            enabled: true,
            tsconfig: 'tsconfig.test.json',
            include: ['**/*.test.ts', '**/*.test.tsx'],
        },
        snapshotSerializers: ['test/htmlSnapshotSerializer.ts'],
        resolveSnapshotPath: (testPath) => testPath.replace(/test\.tsx?$/, `test.snap.ts`),
    },
});
