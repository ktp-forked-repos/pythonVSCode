// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { inject, injectable } from 'inversify';
import { IExtensionActivationService } from '../../activation/types';
import { IApplicationShell } from '../../common/application/types';
import '../../common/extensions';
import { IPersistentState, IPersistentStateFactory, Resource } from '../../common/types';
import { swallowExceptions } from '../../common/utils/decorators';
import { Common, Interpreters } from '../../common/utils/localize';

@injectable()
export class InterpreterSelectionTip implements IExtensionActivationService {
    private readonly storage: IPersistentState<boolean>;
    constructor(@inject(IApplicationShell) private readonly shell: IApplicationShell,
        @inject(IPersistentStateFactory) private readonly factory: IPersistentStateFactory) {
        this.storage = this.factory.createGlobalPersistentState('InterpreterSelectionTip', false);
    }
    /**
     * Do not block this method waiting for user feedback, else this blocks loading the extension.
     *
     * @param {Resource} _resource
     * @returns {Promise<void>}
     * @memberof InterpreterSelectionTip
     */
    public async activate(_resource: Resource): Promise<void> {
        if (this.storage.value) {
            return;
        }
        this.showTip().ignoreErrors();
    }
    @swallowExceptions('Failed to Display tip')
    private async showTip() {
        const selection = await this.shell.showInformationMessage(Interpreters.selectInterpreterTip(), Common.gotIt());
        if (selection !== Common.gotIt()) {
            return;
        }
        await this.storage.updateValue(true);
    }
}
