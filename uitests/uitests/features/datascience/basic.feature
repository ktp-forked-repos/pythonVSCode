@ds @smoke
@https://github.com/DonJayamanne/vscode-python-uitests/datascience
Feature: Data Science
    Scenario: Can display an image and print text into the interactive window
        Given the package "jupyter" is installed
        And the file "smoke.py" is open
        # Code will display an image and print stuff into interactive window.
        When I select the command "Python: Run All Cells"
        And I wait for 60 seconds
        And I open the file "smoke.py"
        And I select the command "View: Revert and Close Editor"
        And I select the command "View: Close Panel"
        # This is the content of the image rendered in the interactive window.
        Then the text "19c03ff0-3276-4f00-bb47-cb1d1748ad92" is displayed in the Interactive Window
        # This is the content printed by a python script.
        And the text "080d2f6d-49df-42c5-97e6-2424edb15809" is displayed in the Interactive Window
