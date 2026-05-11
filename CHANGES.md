This is the changelog for forecasts-viz.
All notable changes in a release will be documented in this file.

This changelog is intended for _humans_ and follows many of the principles from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

Versions for this project follow the [Semantic Versioning rules](https://semver.org/spec/v2.0.0.html).
Each heading below is a version released to downstream repositories (e.g., forecasts-ncov) and the date it was released.
The "__NEXT__" heading below describes changes in the unreleased development source code and as such may not be routinely kept up to date.

# __NEXT__

# 0.4.0 (May 2026)

 - Breaking changes to config structures.
 - Annotate final point in state-space graphs.
 - Remove streams visualization (no longer focusing on renewal model outputs).
 - Use a select component for variant selection (in addition to the existing variant UI).
 - Add calculations for population-relative growth advantage (frequency vs relative GA). These are not yet validated and are disabled by default.

# 0.3.0 (May 2026)

 - Convert all code to TypeScript (with `any` types in some places for incremental adoption).
 - Export types in the tarball and generate markdown API docs.
 - Reorganise repo structure to clearly separate the library from the test app.
 - Extend geographic filtering to allow config/model-defined hierarchies (e.g. region → countries).
 - Don't render empty graphs, removing the need for apps to provide a list of locations directly to `<Panel>`.
 - Add location filtering via a text & dropdown select element.
 - Support config-definable locations.
 - Update tooltip to reflect selected variants.
 - Shared control state: replace variant hover action with (shift-)click behaviour, consistent across all panels via context.
 - Shift build tooling from CRA to Vite (for both the test app and library bundle).
 - Move all runtime dependencies to peer dependencies.

# 0.2.0 (February 9, 2026)

## Features

 - Support user-defined point estimator functions for frequencies and growth advantages. See [#33](https://github.com/nextstrain/forecasts-viz/pull/33) for more.

