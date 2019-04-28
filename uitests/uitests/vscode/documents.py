# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

# import logging
# import os
import re

# import sys
# import time
from urllib.parse import quote

import uitests.tools
import uitests.vscode.application
import uitests.vscode.core
import uitests.vscode.quick_open
import uitests.vscode.startup

from . import core, quick_input, quick_open

LINE_COLUMN_REGEX = re.compile("Ln (?P<line>\d+), Col (?P<col>\d+)")


@uitests.tools.retry(TimeoutError, tries=5)
def open_file(context, filename):
    uitests.vscode.application.capture_screen(context)
    quick_open.select_command(context, "Go to File...")
    uitests.vscode.application.capture_screen(context)
    quick_open.select_value(context, filename)
    uitests.vscode.application.capture_screen(context)
    _wait_for_editor_focus(context, filename)

    # if sys.platform.startswith("linux"):
    #     filePath = os.path.join(context.options.workspace_folder, filename)
    #     with open(
    #         os.path.join(context.options.extensions_dir, "commands.txt"), "w"
    #     ) as file:
    #         file.write(filePath)
    #     time.sleep(1)
    #     uitests.vscode.application.capture_screen(context)
    #     time.sleep(1)
    #     uitests.vscode.quick_open.select_command(context, "Smoke: Open File")
    #     time.sleep(1)
    # else:
    # try:
    #     uitests.vscode.application.capture_screen(context)
    #     quick_open.select_command(context, "Go to File...")
    #     uitests.vscode.application.capture_screen(context)
    #     quick_open.select_value(context, filename)
    #     uitests.vscode.application.capture_screen(context)
    #     _wait_for_editor_focus(context, filename)
    # except Exception:
    #     try:
    #         logging.info("Show notifications1")
    #         uitests.vscode.application.capture_screen(context)
    #         uitests.vscode.quick_open.select_command(
    #             context, "Notifications: Show Notifications"
    #         )
    #         logging.info("Show notifications2")
    #         uitests.vscode.application.capture_screen(context)
    #         # Ensure we select each notification before expanding them.
    #         selector = ".notification-list-item-main-row"
    #         elements = uitests.vscode.core.wait_for_elements(context.driver, selector)
    #         logging.info("Show notifications3")
    #         for element in elements:
    #             logging.info("click 1")
    #             element.click()
    #             try:
    #                 selector = ".notification-list-item-main-row .action-label.icon.expand-notification-action"
    #                 eles = uitests.vscode.core.wait_for_elements(
    #                     context.driver, selector
    #                 )
    #                 logging.info("Show notifications3")
    #                 for ele in eles:
    #                     logging.info("click 2")
    #                     ele.click()
    #             except Exception:
    #                 pass
    #         uitests.vscode.application.capture_screen(context)
    #     except Exception:
    #         import traceback


def is_file_open(context, filename, **kwargs):
    _wait_for_active_tab(context, filename, **kwargs)
    _wait_for_editor_focus(context, filename)


def create_new_untitled_file(context, language="Python"):
    quick_open.select_command(context, "File: New Untitled File")
    _wait_for_editor_focus(context, "Untitled-1")
    quick_open.select_command(context, "Change Language Mode")
    quick_input.select_value(context, language)


def scroll_to_top(context):
    go_to_line(context, 1)


def go_to_line(context, line_number):
    quick_open.select_command(context, "Go to Line...")
    quick_open.select_value(context, str(line_number))


def get_current_position(context):
    selector = "a.editor-status-selection"
    element = core.wait_for_element(context.driver, selector)
    match = LINE_COLUMN_REGEX.match(element.text)
    if match is None:
        raise ValueError(f"Unable to detemrine line & column")
    return int(match.group("line")), int(match.group("col"))


def _wait_for_active_tab(context, filename, is_dirty=False):
    """Wait till a tab is active with the given file name."""
    dirty_class = ".dirty" if is_dirty else ""
    selector = f'.tabs-container div.tab.active{dirty_class}[aria-selected="true"][aria-label="{filename}, tab"]'
    core.wait_for_element(context.driver, selector)


def _wait_for_active_editor(context, filename, is_dirty=False):
    """Wait till an editor with the given file name is active."""
    selector = (
        f'.editor-instance .monaco-editor[data-uri$="{quote(filename)}"] textarea'
    )
    core.wait_for_element(context.driver, selector)


def _wait_for_editor_focus(context, filename, is_dirty=False, **kwargs):
    """Wait till an editor with the given file name receives focus."""
    _wait_for_active_tab(context, filename, is_dirty, **kwargs)
    _wait_for_active_editor(context, filename, is_dirty, **kwargs)
