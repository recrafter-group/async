import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';

import type {MutationScoreThresholds, StrykerOptions} from '@stryker-mutator/api/core';
import {commonTokens, declareClassPlugin, PluginKind, tokens} from '@stryker-mutator/api/plugin';
import type {Reporter} from '@stryker-mutator/api/report';

type MutationTestMetricsResult = Parameters<NonNullable<Reporter['onMutationTestReportReady']>>[1];
type MetricsResult = MutationTestMetricsResult['systemUnderTestMetrics'];

interface MarkdownReporterOptions {
    markdownReporter: {
        fileName: string;
    };
}

const TABLE_HEADER = [
    '| File | % score | % covered | # killed | # timeout | # survived | # no cov | # ignored | # runtime errors | # compile errors |',
    '| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: |',
];

const formatScore = (score: number, {high, low}: MutationScoreThresholds) => {
    if (Number.isNaN(score)) {
        return 'n/a';
    }
    const status = score >= high ? '🟢' : score >= low ? '🟡' : '🔴';
    return `${status} ${score.toFixed(2)}`;
};

const formatRow = (name: string, {metrics}: MetricsResult, thresholds: MutationScoreThresholds) =>
    `| ${[
        name,
        formatScore(metrics.mutationScore, thresholds),
        formatScore(metrics.mutationScoreBasedOnCoveredCode, thresholds),
        metrics.killed,
        metrics.timeout,
        metrics.survived,
        metrics.noCoverage,
        metrics.ignored,
        metrics.runtimeErrors,
        metrics.compileErrors,
    ].join(' | ')} |`;

const formatThresholds = ({high, low, break: breaking}: MutationScoreThresholds) =>
    `Thresholds: 🟢 ≥ ${high}, 🟡 ≥ ${low}, 🔴 < ${low}${breaking === null ? '' : `, break < ${breaking}`}`;

const collectFiles = (result: MetricsResult, path: string[] = []): [string, MetricsResult][] =>
    result.childResults.flatMap((child) =>
        child.file ? [[[...path, child.name].join('/'), child]] : collectFiles(child, [...path, child.name]),
    );

/**
 * Writes the mutation score table as Markdown, e.g. for posting it as a pull request comment.
 */
class MarkdownReporter implements Reporter {
    public static readonly inject = tokens(commonTokens.options);

    private readonly options: MarkdownReporterOptions & StrykerOptions;

    public constructor(options: StrykerOptions) {
        this.options = options as MarkdownReporterOptions & StrykerOptions;
    }

    public onMutationTestReportReady(_report: unknown, {systemUnderTestMetrics}: MutationTestMetricsResult) {
        const {markdownReporter, thresholds} = this.options;
        const lines = [
            ...TABLE_HEADER,
            formatRow('**All files**', systemUnderTestMetrics, thresholds),
            ...collectFiles(systemUnderTestMetrics).map(([name, result]) => formatRow(name, result, thresholds)),
            '',
            formatThresholds(thresholds),
        ];
        mkdirSync(dirname(markdownReporter.fileName), {recursive: true});
        writeFileSync(markdownReporter.fileName, `${lines.join('\n')}\n`);
    }
}

export const strykerValidationSchema = {
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object',
    properties: {
        markdownReporter: {
            description: 'Configuration for the markdown reporter',
            type: 'object',
            additionalProperties: false,
            default: {},
            properties: {
                fileName: {
                    description: 'The relative filename for the markdown report',
                    type: 'string',
                    default: 'reports/mutation/mutation.md',
                },
            },
        },
    },
};

export const strykerPlugins = [declareClassPlugin(PluginKind.Reporter, 'markdown', MarkdownReporter)];
