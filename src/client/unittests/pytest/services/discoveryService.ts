// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable, named } from 'inversify';
import { CancellationTokenSource } from 'vscode';
import { IServiceContainer } from '../../../ioc/types';
import { PYTEST_PROVIDER } from '../../common/constants';
import {
    ITestDiscoveryRunner, ITestDiscoveryService, ITestsHelper,
    ITestsParser, Options, TestDiscoveryOptions, Tests
} from '../../common/types';
import { IArgumentsService, TestFilter } from '../../types';

@injectable()
export class TestDiscoveryService implements ITestDiscoveryService {

    private argsService: IArgumentsService;
    private helper: ITestsHelper;
    private discoveryRunner: ITestDiscoveryRunner;

    constructor(
        @inject(IServiceContainer) private serviceContainer: IServiceContainer,
        @inject(ITestsParser) @named(PYTEST_PROVIDER) private testParser: ITestsParser
    ) {
        this.argsService = this.serviceContainer.get<IArgumentsService>(IArgumentsService, PYTEST_PROVIDER);
        this.helper = this.serviceContainer.get<ITestsHelper>(ITestsHelper);
        this.discoveryRunner = this.serviceContainer.get<ITestDiscoveryRunner>(ITestDiscoveryRunner);
    }

    public async discoverTests(options: TestDiscoveryOptions): Promise<Tests> {
        const args = this.buildTestCollectionArgs(options);

        // Collect tests for each test directory separately and merge.
        const testDirectories = this.argsService.getTestFolders(options.args);
        if (testDirectories.length === 0) {
            const opts = {
                ...options,
                args
            };
            return this.discoverTestsInTestDirectory(opts);
        }
        const results = await Promise.all(testDirectories.map(testDir => {
            // Add test directory as a positional argument.
            const opts = {
                ...options,
                args: [...args, testDir]
            };
            return this.discoverTestsInTestDirectory(opts);
        }));

        return this.helper.mergeTests(results);
    }

    private buildTestCollectionArgs(options: TestDiscoveryOptions) {
        // Remove unwanted arguments (which happen to be test directories & test specific args).

        return this.argsService.filterArguments(options.args, TestFilter.discovery);
    }

    private async discoverTestsInTestDirectory(options: TestDiscoveryOptions): Promise<Tests> {
        const token = options.token ? options.token : new CancellationTokenSource().token;
        const discoveryOpts: Options = {
            args: options.args,
            cwd: options.cwd,
            workspaceFolder: options.workspaceFolder,
            token,
            outChannel: options.outChannel
        };

        const data = await this.discoveryRunner.discover(PYTEST_PROVIDER, discoveryOpts);
        if (options.token && options.token.isCancellationRequested) {
            return Promise.reject<Tests>('cancelled');
        }

        return this.testParser.parse(data, options);
    }
}
