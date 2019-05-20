@ds @smoke
@wip
@https://github.com/DonJayamanne/vscode-python-uitests/datascience
Feature: Data Science
    Scenario: Can display an image and print text into the interactive window
        Given the package "jupyter" is installed
        # Increase font size for text detection.
        And the workspace setting "editor.fontSize" has the value "15"
        And the file "smoke.py" is open
        # Code will display an image and print stuff into interactive window.
        When I select the command "Python: Run All Cells"
        # Wait for 60 seconds for Jupyter to start.
        And I wait for 60 seconds
        # Close the file, to close it, first set focus to it by opening it again.
        And I open the file "smoke.py"
        And I select the command "View: Revert and Close Editor"
        And I select the command "View: Close Panel"
        Then take a screenshot
        And a file named "log.log" is created
        # This is the content of the image rendered in the interactive window.
        And the text "VSCODEROCKS" is displayed in the Interactive Window
        # This is the content printed by a python script.
        And the text "DATASCIENCEROCKS" is displayed in the Interactive Window

    Scenario: Workspace directory is used as cwd for untitled python files
        Given the package "jupyter" is installed
        And a file named "log.log" does not exist
        When I create an untitled Python file with the following text
            """
            open("log.log", "w").write("Hello")
            """
        # Code will display an image and print stuff into interactive window.
        When I select the command "Python: Run All Cells"
        # Wait for 60 seconds for Jupyter to start.
        And I wait for 60 seconds
        Then take a screenshot
        And a file named "log.log" is created
