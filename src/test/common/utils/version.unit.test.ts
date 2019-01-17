// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

"use strict";

// tslint:disable: no-any

import * as assert from "assert";
import { parsePythonVersion } from "../../../client/common/utils/version";

suite("Version Utils", () => {
    test("Must convert undefined if empty strinfg", async () => {
        assert.equal(parsePythonVersion(undefined as any), undefined);
        assert.equal(parsePythonVersion(""), undefined);
    });
    test("Must convert version correctly", async () => {
        const version = parsePythonVersion("3.7.1")!;
        assert.equal(version.raw, "3.7.1");
        assert.equal(version.major, 3);
        assert.equal(version.minor, 7);
        assert.equal(version.patch, 1);
        assert.deepEqual(version.prerelease, []);
    });
    test("Must convert version correctly with pre-release", async () => {
        const version = parsePythonVersion("3.7.1-alpha")!;
        assert.equal(version.raw, "3.7.1-alpha");
        assert.equal(version.major, 3);
        assert.equal(version.minor, 7);
        assert.equal(version.patch, 1);
        assert.deepEqual(version.prerelease, ["alpha"]);
    });
    test("Must remove invalid pre-release channels", async () => {
        assert.deepEqual(parsePythonVersion("3.7.1-alpha")!.prerelease, [
            "alpha"
        ]);
        assert.deepEqual(parsePythonVersion("3.7.1-beta")!.prerelease, [
            "beta"
        ]);
        assert.deepEqual(parsePythonVersion("3.7.1-candidate")!.prerelease, [
            "candidate"
        ]);
        assert.deepEqual(parsePythonVersion("3.7.1-final")!.prerelease, [
            "final"
        ]);
        assert.deepEqual(parsePythonVersion("3.7.1-unknown")!.prerelease, []);
        assert.deepEqual(parsePythonVersion("3.7.1-")!.prerelease, []);
        assert.deepEqual(
            parsePythonVersion("3.7.1-prerelease")!.prerelease,
            []
        );
    });
    test("Must default versions partgs to 0 if they are not numeric", async () => {
        assert.deepEqual(parsePythonVersion("3.B.1")!.raw, "3.0.1");
        assert.deepEqual(parsePythonVersion("3.B.C")!.raw, "3.0.0");
        assert.deepEqual(parsePythonVersion("A.B.C")!.raw, "0.0.0");
    });
});
