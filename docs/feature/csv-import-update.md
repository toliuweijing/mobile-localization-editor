# Feature Specification Document: CSV Import for Project Updates

## 1. Executive Summary

-   **Feature**: CSV Import for Project Updates
-   **Status**: Implemented
-   **Summary**: This feature enhances the application's collaborative capabilities by allowing users to import a Comma-Separated Values (CSV) file to update an existing project. The system intelligently compares the imported CSV against the current project state and presents a comprehensive summary of all changes—including additions, updates across multiple languages, and removals—in a safe "Merge Review" modal. This provides a robust, professional workflow for teams that prefer to manage translations in spreadsheet software.

## 2. Problem Statement & Goals

-   **Problem**: Many localization workflows involve non-technical team members, such as translators or project managers, who are most comfortable working in spreadsheet applications like Excel or Google Sheets. The application lacked a direct way to integrate their work, forcing a manual, error-prone copy-paste process to get translations from a spreadsheet into the editor.
-   **Goals**:
    -   Enable a seamless round-trip workflow: `Export CSV -> Edit in Spreadsheet -> Import CSV`.
    -   Provide a safe import mechanism that does not blindly overwrite data, instead allowing the user to review all proposed changes before they are applied.
    -   Support updates to multiple language values and context comments for any given string ID in a single import operation.
    -   Broaden the application's utility to better support standard, collaborative localization processes.
-   **Success Metrics**:
    -   A user can successfully import a modified CSV file using the "Update from File" button.
    -   The Merge Review Modal correctly displays a visual diff of all changes from the CSV, including new strings, modified translations in multiple language columns, and removed strings.
    -   A user can review and apply these changes, and the main resource table updates correctly.

## 3. Scope

-   **In Scope:**
    -   Updating the "Update from File" functionality to accept `.csv` files.
    -   Implementing a robust CSV parser that correctly handles headers and quoted fields containing commas or newlines.
    -   Refactoring the core data comparison logic to handle multi-language diffs from a single source file.
    -   Updating the data structures (`types.ts`) to represent these complex, multi-language changes.
    -   Refactoring the `MergeReviewModal` component to clearly visualize diffs for multiple language values and context changes within a single updated item.
-   **Out of Scope:**
    -   Using a CSV file to create a new project from scratch (the workflow is for updating existing projects).
    -   Automatic conversion between platform-specific placeholders during import/export.
    -   Support for custom CSV schemas or column mappings; the import format must match the application's export format.

## 4. User Stories

-   As a **Localization Manager**, I want to export the project to CSV, send it to my team of translators, and then import their completed file so that I can update all languages at once in a single, auditable step.
-   As a **Developer**, I want to receive a CSV of translation updates from the product team so that I can safely merge them into my project, with a clear view of exactly what has changed before I commit the changes.

## 5. Acceptance Criteria

-   **Scenario: User updates a project using a CSV file**
    -   **Given**: A user has an active project and has exported it to CSV.
    -   **And**: They have edited several translation values for English and Spanish, and added a new row in the CSV file.
    -   **When**: They click "Update from File" and select the modified `.csv` file.
    -   **Then**: The Merge Review Modal appears.
    -   **And**: The "Updated Strings" section shows the original and new values for both the English and Spanish translations.
    -   **And**: The "New Strings" section shows the row that was added to the CSV.
    -   **And**: After clicking "Apply Changes", the main resource table reflects all these updates.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The feature leverages and extends the existing "Merge Review" infrastructure. The core technical challenge involves making the diff generation and presentation logic more generic to support changes across multiple data fields (e.g., `value_en`, `value_es`, `context`) from a single update operation, which is characteristic of a CSV import.
-   **Component Breakdown**:
    -   `types.ts`: The `UpdateDiff` interface was fundamentally changed. Instead of simple `oldValue`/`newValue` strings, it now contains a `valueChanges` array of objects, where each object details a change for a specific language code.
    -   `App.tsx`:
        -   A new, robust `parseCsvContent` function was added to handle CSV parsing.
        -   The `handleFileUpdateRequest` function was updated to detect CSV files and trigger the new parsing logic. Its comparison algorithm was completely refactored to generate the new, more detailed `UpdateDiff` structure.
        -   The `handleApplyMerge` function was updated to correctly process the new `UpdateDiff` structure and apply changes across multiple languages.
    -   `MergeReviewModal.tsx`: This component was significantly refactored to render the new `UpdateDiff` data structure. It now iterates through `valueChanges` to display a separate visual diff for each modified language within a single item view.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User starts with an active project containing translated data.
    2.  User clicks "Download .csv" from the "Export Options" card.
    3.  User opens the CSV in a spreadsheet editor, makes changes (e.g., corrects typos, fills in missing translations), and saves the file.
    4.  Back in the application, the user clicks the "Update from File..." button.
    5.  The user selects their modified `.csv` file.
    6.  The Merge Review Modal opens, showing a clear, color-coded summary of all changes.
    7.  The user reviews the changes and clicks "Apply Changes".
    8.  The modal closes, and the main resource table is updated with the new data.
-   **Visual Design**: The UI changes are concentrated within the `MergeReviewModal`. The updated design can now stack multiple "diff" views within a single item, clearly labeled by language, making it easy to understand complex updates at a glance.
-   **Copywriting**:
    -   Button Label: "Update from File..."
    -   Modal Title: "Review Changes"
    -   Modal Button: "Apply Changes"

## 8. Data Management & Schema

### 8.1. Data Source

The data is sourced from a user-provided `.csv` file.

### 8.2. Data Schema

The expected CSV schema is defined by the application's own export format.
-   **Headers**: The first row must be a header row. It must contain an `id` column, an optional `context` column, and one or more value columns formatted as `value_{langCode}` (e.g., `value_default`, `value_es`, `value_fr`).
-   **Example Row**: `"app_name","The main app name","My App","Mi App","Mon App"`

### 8.3. Persistence

Once changes are approved and applied via the Merge Review Modal, the updated project state is saved to `IndexedDB` using the existing persistence mechanism.

## 9. Limitations & Known Issues

-   **Strict Schema Requirement**: The imported CSV must strictly follow the format of the exported CSV, including all header names (`id`, `context`, `value_en`, etc.). There is no column mapping or flexibility. An incorrectly named header (e.g., `ID` instead of `id`) will cause the import to fail or misbehave.
-   **Update-Only Workflow**: The feature is designed only for *updating* an existing project. A user cannot create a new project by importing a CSV from scratch.
-   **File Encoding**: The application expects UTF-8 encoded CSV files. Files saved with different encodings (which can sometimes occur with older versions of Microsoft Excel) may lead to parsing errors or corrupted characters on import.
