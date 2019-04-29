# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import os.path
import sys
import logging

import behave
import parse

import uitests.tools
import uitests.vscode
import uitests.vscode.settings
import uitests.vscode.startup


@parse.with_pattern(r"\d+")
def parse_number(text):
    return int(text)


behave.register_type(Number=parse_number)


def before_all(context):
    options = uitests.vscode.application.get_options(**context.config.userdata)
    app_context = uitests.vscode.startup.start(options)
    uitests.vscode.startup.clear_everything(app_context)
    context.driver = app_context.driver
    context.options = app_context.options
    context.workspace_repo = None


def after_all(context):
    context.driver = uitests.vscode.startup.CONTEXT["driver"]
    uitests.vscode.application.exit(context)


@uitests.tools.retry((PermissionError, FileNotFoundError), tries=2)
def before_feature(context, feature):
    logging.info("before feature start")
    # Restore `drive`, as behave will overwrite with original value.
    # Note, its possible we have a new driver instance due to reloading of VSC.
    context.driver = uitests.vscode.startup.CONTEXT["driver"]
    logging.info("before feature before clear")
    uitests.vscode.startup.clear_everything(context)
    logging.info("before feature after clear")

    # If on windows, close VSC perform necessary IO operations, then load VSC.
    # Else we get all sorts of Access Denied errors...
    if sys.platform.startswith("win"):
        logging.info("before feature before exit")
        uitests.vscode.application.exit(context)
        logging.info("before feature after exit")

    repo = [tag for tag in feature.tags if tag.startswith("git://github.com/")]
    uitests.tools.empty_directory(context.options.workspace_folder)
    if repo:
        context.workspace_repo = repo[0]
        uitests.vscode.startup.setup_workspace(
            repo[0], context.options.workspace_folder, context.options.temp_folder
        )
    else:
        context.workspace_repo = None

    if sys.platform.startswith("win"):
        logging.info("before feature before reload")
        app_context = uitests.vscode.startup.reload(context)
        context.driver = app_context.driver
        logging.info("before feature after reload")


@uitests.tools.retry((PermissionError, FileNotFoundError), tries=2)
def before_scenario(context, scenario):
    logging.info("before scenario start")
    # Restore `drive`, as behave will overwrite with original value.
    # Note, its possible we have a new driver instance due to reloading of VSC.
    context.driver = uitests.vscode.startup.CONTEXT["driver"]
    context.options = uitests.vscode.application.get_options(**context.config.userdata)

    # If on windows, close VSC perform necessary IO operations, then load VSC.
    # Else we get all sorts of Access Denied errors...
    if sys.platform.startswith("win"):
        logging.info("before scenario before exit")
        uitests.vscode.application.exit(context)
        logging.info("before scenario after exit")

    # Restore python.pythonPath in user & workspace settings.
    settings_json = os.path.join(context.options.user_dir, "User", "settings.json")
    # Sometimes, this throws a PermissionError error on windows.
    # Hence retry.
    uitests.vscode.settings.update_settings(
        settings_json, {"python.pythonPath": context.options.python_path}
    )

    if sys.platform.startswith("win"):
        logging.info("before scenario before reload")
        app_context = uitests.vscode.startup.reload(context)
        context.driver = app_context.driver
        logging.info("before scenario after reload")

    # We want this open so it can get captured in screenshots.
    logging.info("before scenario before show explorer")
    uitests.vscode.quick_open.select_command(context, "View: Show Explorer")
    uitests.vscode.startup.clear_everything(context)
    logging.info("before scenario after clear")
    if "preserve.workspace" not in scenario.tags:
        uitests.vscode.startup.reset_workspace(context)
    logging.info("before scenario end")


def after_scenario(context, feature):
    logging.info("after scenario start")
    context.driver = uitests.vscode.startup.CONTEXT["driver"]
    uitests.vscode.notifications.clear(context)
    logging.info("after scenario end")


def after_step(context, step):
    logging.info("after step start")
    context.driver = uitests.vscode.startup.CONTEXT["driver"]
    if step.exception is not None:
        uitests.vscode.application.capture_screen(context)
    logging.info("after step end")
