// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { CancellationTokenSource, Range, SymbolKind, TextEditorRevealType, Uri } from 'vscode';
import { traceError } from '../../common/logger';
import { captureTelemetry } from '../../telemetry';
import { EventName } from '../../telemetry/constants';
import { TestSuite } from '../common/types';
import { ITestCodeNavigator, ITestNavigatorHelper } from './types';

@injectable()
export class TestSuiteCodeNavigator implements ITestCodeNavigator {
    private cancellationToken?: CancellationTokenSource;
    constructor(@inject(ITestNavigatorHelper) private readonly helper: ITestNavigatorHelper) {}
    @captureTelemetry(EventName.UNITTEST_NAVIGATE_TEST_SUITE, undefined, true)
    public async navigateTo(item: TestSuite): Promise<void> {
        if (this.cancellationToken) {
            this.cancellationToken.cancel();
        }
        this.cancellationToken = new CancellationTokenSource();
        const [doc, editor] = await this.helper.openFile(item.file ? Uri.file(item.file) : undefined);
        let range: Range | undefined;
        if (item.line) {
            range = new Range(item.line, 0, item.line + 1, 0);
        } else {
            const symbol = await this.helper.findSymbol(doc, { kind: SymbolKind.Class, name: item.name }, this.cancellationToken.token);
            range = symbol ? symbol.location.range : undefined;
        }
        if (!range) {
            traceError('Unable to navigate to test suite', new Error('Test Suite not found'));
            return;
        }
        editor.revealRange(range, TextEditorRevealType.Default);
    }
}
