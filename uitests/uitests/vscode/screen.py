# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import os

from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import (
    TextOperationStatusCodes, TextRecognitionMode, VisualFeatureTypes)
from msrest.authentication import CognitiveServicesCredentials

import uitests.vscode.application
from uitests.tools import retry


def get_screen_text(context):
    image_file = uitests.vscode.application.capture_screen_to_file(context)

    # Get endpoint and key from environment variables
    endpoint = os.getenv("AZURE_COGNITIVE_ENDPOINT", "https://westus.api.cognitive.microsoft.com/")
    key = os.getenv("AZURE_COGNITIVE_KEY", "35d491860aa24a3bb002359f2041d373")

    # Set credentials
    credentials = CognitiveServicesCredentials(key)

    # Create client
    client = ComputerVisionClient(endpoint, credentials)
    mode = TextRecognitionMode.printed
    raw = True
    custom_headers = None
    numberOfCharsInOperationId = 36

    # Async SDK call
    with open(image_file, "rb") as fp:
        rawHttpResponse = client.batch_read_file_in_stream(fp, mode, custom_headers,  raw)

    # Get ID from returned headers
    operationLocation = rawHttpResponse.headers["Operation-Location"]
    idLocation = len(operationLocation) - numberOfCharsInOperationId
    operationId = operationLocation[idLocation:]

    @retry(ConnectionError, tries=10, backoff=2)
    def get_result():
        result = client.get_read_operation_result(operationId)
        if result.status not in ['NotStarted', 'Running']:
            return result
        raise ConnectionError

    result = get_result()

    # Get data
    if result.status == TextOperationStatusCodes.succeeded:
        return os.linesep.join(line.text for textResult in result.recognition_results for line in textResult.lines)
        # for textResult in result.recognition_results:
        #     for line in textResult.lines:
        #         print(line.text)
    else:
        raise Exception(result)
