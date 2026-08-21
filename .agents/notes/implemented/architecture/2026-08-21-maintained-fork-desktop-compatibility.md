# Agent Note: Maintained fork compatibility fixes for Desktop

Status: implemented

English | [中文](2026-08-21-maintained-fork-desktop-compatibility.zh.md)

## Problem

DSH Desktop carried seven pnpm patch files for behavior that differed from the published Harness `0.1.0-rc.8` packages. The patches covered empty user-patch documents, streaming DeepSeek tool-call identity, redundant sandbox escalation, directory views with file-only ranges, a Workspace drop target, hidden Windows restricted-shell processes, and the Desktop native directory picker bridge.

Keeping those changes only as consumer-side patches duplicated source diffs across releases, separated tests from their owning packages, and made a Harness upgrade require manual patch regeneration. Pointing a Git submodule at a fork alone did not change the packages installed by Desktop.

## Decision

The maintained Harness fork owns all seven behaviors in their source packages and keeps the regression tests beside those packages:

- `dsh-app-boot` treats an empty or null YAML patch document as an empty patch list.
- `dsh-llm-deepseek` preserves the last nonempty streaming tool-call id and function name.
- `dsh-sandbox` accepts a redundant narrower request when the effective call already has `danger-full-access`.
- `dsh-tool-str-replace-editor` ignores file-only `view_range` values for directory listings and normalizes an empty range for files.
- `dsh-client-ui-workspace` exposes the Workspace browser root as the Desktop folder-drop target.
- `dsh-sandbox-windows-acl` starts both restricted process paths with `STARTF_USESHOWWINDOW` and `SW_HIDE`.
- `dsh-client-ui-directory-picker-browse` accepts optional native-pick and path-validation callbacks through its Client injection boundary.

The Desktop repository pins this fork as a Git submodule. Its install flow builds the fork, then synchronizes the seven built `lib` directories into every matching pnpm-installed package instance. This preserves the published package resolution graph while making the fork the only source of the maintained behavior. A future owned package registry may replace this synchronization step without moving the source changes back into Desktop.

## Alternatives considered

**Keep pnpm patches.** This preserves registry package identity, but each Harness release requires regenerating consumer-owned diffs and keeps tests outside the source packages.

**Link the Harness workspace directly.** This crosses the independent workspace boundary and can resolve host-runtime peers from a second dependency tree.

**Override only the seven packages with local tarballs.** Packed packages preserve publication metadata, but pnpm optional-peer resolution can retain both registry and `file:` identities. A sandbox call through the aggregate `dsh` package demonstrated that the registry instance could still execute.

**Publish immediately to a private registry.** This is the clean long-term distribution boundary, but it requires registry ownership, authentication, and release automation that are not part of the current repository setup.

## Consequences

- Harness source and package-local tests are authoritative; Desktop no longer carries DSH patch files.
- The fork remains an independent submodule and pnpm workspace with an explicit official `upstream` remote.
- Desktop installation must run its Harness synchronization command after dependency installation and before tests, development, or packaging.
- The synchronization step intentionally copies only matching package versions and ignores stale pnpm store entries from older releases.
- Moving to an owned registry later removes the synchronization step but does not require another source migration.

## Verification

- Focused Harness tests cover each migrated behavior, including directory `view_range` arrays, redundant sandbox requests, both Windows process creation paths, empty YAML, streaming tool-call continuations, Workspace drop targeting, and native directory picker callbacks.
- Harness Host and Client library builds and contract-ready type checking complete with the migrated source.
- Desktop integration tests resolve behavior through the aggregate installed package graph and verify redundant escalation plus directory listing behavior after synchronization.
- Desktop layout verification rejects new `patches/dsh-*` entries and verifies the maintained fork and official upstream remotes.
