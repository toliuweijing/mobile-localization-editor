# Feature Specification Document: CSV Import for Project Updates

## 1. Executive Summary

-   **Feature**: CSV Import for Project Updates
-   **Status**: **Superseded**
-   **Summary**: This feature has been superseded by the more robust **XLSX Import for Project Updates**. The original goal was to allow users to update projects from a CSV file, enabling collaboration with teams using spreadsheet software. The new XLSX functionality achieves this goal with better data integrity, avoiding common CSV issues like character encoding errors. The core workflow of reviewing and applying changes remains, but the underlying file format has been upgraded.

## 2. Problem Statement & Goals

-   **Problem**: Many localization workflows involve non-technical team members, such as translators or project managers, who are most comfortable working in spreadsheet applications like Excel or Google Sheets. The application lacked a direct way to integrate their work, forcing a manual, error-prone copy-paste process to get translations from a spreadsheet into the editor. Furthermore, treating a translation CSV as a source of truth could lead to accidental deletion of strings if they were missing from the file.
-   **Goals**:
    -   Enable a seamless round-trip workflow: `Export Spreadsheet -> Edit -> Import Spreadsheet`.
    -   Provide a safe import mechanism that *only updates existing strings* and does not add or remove resources, preventing accidental data loss.
    -   Allow the user to review all proposed value changes in a clear visual diff before they are applied.
    -   Support updates to multiple language values and context comments for any given string ID in a single import operation.
    -   Broaden the application's utility to better support standard, collaborative localization processes.
-   **Success Metrics**:
    -   A user can successfully import a modified spreadsheet file using the "Update Translation" button.
    -   The Merge Review Modal correctly displays a visual diff of all *value changes* from the spreadsheet.
    -   The Merge Review Modal does **not** show "New Strings" or "Removed Strings" sections when updating from a spreadsheet.
    -   A user can review and apply these changes, and the main resource table updates correctly.

## 3. Scope

-   **In Scope:**
    -   An "Update Translation" workflow that accepts spreadsheet files (`.xlsx`).
    -   Implementing a robust spreadsheet parser that correctly handles headers and data types.
    -   Refactoring the core data comparison logic to handle multi-language diffs.
    -   Updating the data structures (`types.ts`) to represent complex, multi-language changes.
    -   Displaying a review of all proposed value changes in the `MergeReviewModal` component.
-   **Out of Scope:**
    -   Using a spreadsheet to create a new project from scratch.
    -   **Adding new strings or removing existing strings via spreadsheet import.** The native source file is the only source of truth for the string manifest.
    -   Automatic conversion between platform-specific placeholders during import/export.
    -   Support for custom spreadsheet schemas or column mappings; the import format must match the application's export format.

## 4. User Stories

-   As a **Localization Manager**, I want to export the project to a spreadsheet, send it to my team of translators, and then import their completed file so that I can update all languages at once in a single, auditable step without fear of accidentally deleting strings.
-   As a **Developer**, I want to receive a spreadsheet of translation updates from the product team so that I can safely merge them into my project, with a clear view of exactly what values have changed before I commit the changes.

## 5. Acceptance Criteria

-   **Scenario: User updates a project using a spreadsheet file**
    -   **Given**: A user has an active project with string IDs `str1` and `str2`. They have exported it to a spreadsheet.
    -   **And**: In the spreadsheet, they have edited the Spanish translation for `str1` and deleted the entire row for `str2`.
    -   **When**: They click "Update Translation" and select the modified `.xlsx` file.
    -   **Then**: The Merge Review Modal appears.
    -   **And**: The "Updated Strings" section shows a visual diff for the change to the Spanish translation of `str1`.
    -   **And**: There is **no** "Removed Strings" section, and `str2` is not mentioned in the modal.
    -   **And**: After clicking "Apply Changes", the main resource table reflects the update to `str1`, and the `str2` resource remains completely untouched.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The feature leverages and extends the existing "Merge Review" infrastructure. The key logic change is in the file processing pipeline, which now handles spreadsheet files (`.xlsx`).
-   **Component Breakdown**:
    -   `types.ts`: The `UpdateDiff` interface was changed to contain a `valueChanges` array, allowing it to represent multiple language value changes for a single string ID.
    -   `App.tsx`:
        -   A robust `parseXlsxContent` function handles spreadsheet parsing using the SheetJS library.
        -   The `handleProcessFileUpdate` function contains a critical conditional check. If the incoming file is a spreadsheet, the comparison logic is strictly limited:
            -   It only iterates through string IDs that exist in *both* the current project and the spreadsheet.
            -   It will **only** generate `updated` diffs.
            -   It will **never** generate `added` or `removed` diffs.
        -   If the file is a native source file (`.xml` or `.strings`), the original logic runs, generating `added`, `updated`, and `removed` diffs as expected.
    -   `MergeReviewModal.tsx`: This component was refactored to render the more detailed `UpdateDiff` data structure, showing a separate visual diff for each modified language within a single item view.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User starts with an active project.
    2.  User clicks "Download .xlsx" from the "Export Options" card.
    3.  User opens the spreadsheet in an editor, makes changes to existing translations, and saves the file.
    4.  Back in the application, the user clicks the "Update Translation" button.
    5.  The user selects their modified `.xlsx` file.
    6.  The Merge Review Modal opens, showing a clear, color-coded summary of all *value changes*.
    7.  The user reviews the changes and clicks "Apply Changes".
    8.  The modal closes, and the main resource table is updated with the new data.
-   **Visual Design**: The UI changes are concentrated within the `MergeReviewModal`. The updated design can now stack multiple "diff" views within a single item, clearly labeled by language, making it easy to understand complex updates at a glance.
-   **Copywriting**:
    -   Button Label: "Update Translation"
    -   Modal Title: "Review Changes"
    -   Modal Button: "Apply Changes"

## 8. Data Management & Schema

### 8.1. Data Source

The data is sourced from a user-provided `.xlsx` file.

### 8.2. Data Schema

The expected spreadsheet schema is defined by the application's own export format.
-   **Headers**: The first row must be a header row. It must contain an `id` column, an optional `context` column, and one or more value columns formatted as `value_{langCode}` (e.g., `value_default`, `value_es`, `value_fr`).
-   **Sheet**: The import logic reads from the first sheet in the workbook.

### 8.3. Persistence

Once changes are approved and applied via the Merge Review Modal, the updated project state is saved to `IndexedDB` using the existing persistence mechanism.

## 9. Limitations & Known Issues

-   **Update-Only, Not a Manifest**: The spreadsheet import feature is designed exclusively for updating translation values for strings that *already exist* in the project. It cannot be used to add new strings or remove existing ones. The native source file (`.xml` or `.strings`) is considered the sole source of truth for the list of string IDs. Rows in the spreadsheet with IDs not present in the project will be ignored, and strings in the project that are missing from the spreadsheet will be left untouched.
-   **Strict Schema Requirement**: The imported spreadsheet must strictly follow the format of the exported file, including all header names (`id`, `context`, `value_en`, etc.). There is no column mapping or flexibility. An incorrectly named header will cause the import to fail or misbehave.