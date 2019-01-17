// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

"use strict";

import { inject, injectable } from "inversify";
import * as path from "path";
import { Uri, WorkspaceFolder } from "vscode";
import { IWorkspaceService } from "../../../../common/application/types";
import { IFileSystem } from "../../../../common/platform/types";
import { IPathUtils } from "../../../../common/types";
import {
    DebugConfigurationPrompts,
    localize
} from "../../../../common/utils/localize";
import { MultiStepInput } from "../../../../common/utils/multiStepInput";
import { SystemVariables } from "../../../../common/variables/systemVariables";
import { sendTelemetryEvent } from "../../../../telemetry";
import { DEBUGGER_CONFIGURATION_PROMPTS } from "../../../../telemetry/constants";
import { DebuggerTypeName } from "../../../constants";
import { LaunchRequestArguments } from "../../../types";
import {
    DebugConfigurationState,
    DebugConfigurationType,
    IDebugConfigurationProvider
} from "../../types";

// tslint:disable-next-line:no-invalid-template-strings
const workspaceFolderToken = "${workspaceFolder}";

@injectable()
export class PyramidLaunchDebugConfigurationProvider
    implements IDebugConfigurationProvider {
    constructor(
        @inject(IFileSystem) private fs: IFileSystem,
        @inject(IWorkspaceService)
        private readonly workspace: IWorkspaceService,
        @inject(IPathUtils) private pathUtils: IPathUtils
    ) {}
    public async buildConfiguration(
        input: MultiStepInput<DebugConfigurationState>,
        state: DebugConfigurationState
    ) {
        const iniPath = await this.getDevelopmentIniPath(state.folder);
        const defaultIni = `${workspaceFolderToken}${
            this.pathUtils.separator
        }development.ini`;
        let manuallyEnteredAValue: boolean | undefined;

        const config: Partial<LaunchRequestArguments> = {
            name: localize(
                "python.snippet.launch.pyramid.label",
                "Python: Pyramid Application"
            )(),
            type: DebuggerTypeName,
            request: "launch",
            args: [iniPath || defaultIni],
            pyramid: true,
            jinja: true
        };

        if (!iniPath) {
            const selectedIniPath = await input.showInputBox({
                title: DebugConfigurationPrompts.pyramidEnterDevelopmentIniPathTitle(),
                value: defaultIni,
                prompt: DebugConfigurationPrompts.pyramidEnterDevelopmentIniPathPrompt(),
                validate: value =>
                    this.validateIniPath(
                        state ? state.folder : undefined,
                        defaultIni,
                        value
                    )
            });
            if (selectedIniPath) {
                manuallyEnteredAValue = true;
                config.args = [selectedIniPath];
            }
        }

        sendTelemetryEvent(DEBUGGER_CONFIGURATION_PROMPTS, undefined, {
            configurationType: DebugConfigurationType.launchPyramid,
            autoDetectedPyramidIniPath: !!iniPath,
            manuallyEnteredAValue
        });
        Object.assign(state.config, config);
    }
    public async validateIniPath(
        folder: WorkspaceFolder | undefined,
        defaultValue: string,
        selected?: string
    ): Promise<string | undefined> {
        if (!folder) {
            return;
        }
        const error = DebugConfigurationPrompts.pyramidEnterDevelopmentIniPathInvalidFilePathError();
        if (!selected || selected.trim().length === 0) {
            return error;
        }
        const resolvedPath = this.resolveVariables(selected, folder.uri);
        if (
            selected !== defaultValue &&
            !(await this.fs.fileExists(resolvedPath))
        ) {
            return error;
        }
        if (
            !resolvedPath
                .trim()
                .toLowerCase()
                .endsWith(".ini")
        ) {
            return error;
        }
    }
    protected resolveVariables(
        pythonPath: string,
        resource: Uri | undefined
    ): string {
        const workspaceFolder = resource
            ? this.workspace.getWorkspaceFolder(resource)
            : undefined;
        const systemVariables = new SystemVariables(
            workspaceFolder ? workspaceFolder.uri.fsPath : undefined
        );
        return systemVariables.resolveAny(pythonPath);
    }

    protected async getDevelopmentIniPath(
        folder: WorkspaceFolder | undefined
    ): Promise<string | undefined> {
        if (!folder) {
            return;
        }
        const defaultLocationOfManagePy = path.join(
            folder.uri.fsPath,
            "development.ini"
        );
        if (await this.fs.fileExists(defaultLocationOfManagePy)) {
            return `${workspaceFolderToken}${
                this.pathUtils.separator
            }development.ini`;
        }
    }
}
