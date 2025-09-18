
# Feature Specification Document: Column Mapping for Spreadsheet Import

## 1. Executive Summary

-   **Feature**: Column Mapping for Spreadsheet (XLSX) Import
-   **Status**: Implemented
-   **Summary**: This feature enhances the XLSX import workflow by introducing a user-friendly modal that allows users to map unrecognized or custom-named columns (e.g., "French Translation") to standard language codes (e.g., "fr"). This removes the need for users to manually edit spreadsheet headers before import, making the tool more flexible and compatible with a wider range of collaborative workflows.

## 2. Problem Statement & Goals

-   **Problem**: The previous XLSX import functionality was rigid, requiring column headers for translations to strictly follow the `value_{langCode}` format (e.g., `value_es`). This created a significant point of friction for users collaborating with translators or teams who use human-readable column names like "Spanish" or "German Translation." Users were forced to manually rename columns in their spreadsheets before they could import them, an error-prone and tedious extra step.
-   **Goals**:
    -   Goal 1: Eliminate the strict requirement for `value_{langCode}` column headers in imported XLSX files.
    -   Goal 2: Provide an intuitive interface for users to map their custom column names to the application's required language codes.
    -   Goal 3: Allow users to explicitly ignore certain columns that do not contain translation data.
    -   Goal 4: Make the translation update process more seamless, robust, and accommodating of real-world file formats.
-   **Success Metrics**:
    -   A user can successfully import an XLSX file with a "French" column by mapping it to the "fr" language code.
    -   The import process proceeds directly to the Merge Review step without showing the mapping modal if all columns are already in the correct format.
    -   Data from columns that the user chooses to "ignore" is not imported into the project.

## 3. Scope

-   **In Scope:**
    -   Logic to analyze XLSX headers upon upload and identify columns that do not match the `id`, `context`, or `value_{langCode}` patterns.
    -   A new modal component (`LanguageMappingModal.tsx`) that appears only when unrecognized columns are detected.
    -   UI controls within the modal for each unrecognized column, allowing the user to either map it to a language code via a text input or to ignore it.
    -   State management to handle the mapping request and resolutions.
    -   Updating the file processing logic to use the user-provided mappings to correctly parse the spreadsheet data.
-   **Out of Scope:**
    -   Saving a user's column mappings for future imports. Each import requires a fresh mapping.
    -   Automatic or "fuzzy" matching of column names to language codes (e.g., automatically suggesting "fr" for "French").
    -   Validation of the user-provided language code against a list of ISO standards.

## 4. User Stories

-   As a **Localization Manager**, I want to map the column named "German" from my translator's spreadsheet to the language code "de" so that I can import their work directly without having to ask them to change their file or doing it myself.
-   As a **Developer**, I want to ignore the "Notes" column in a spreadsheet I received so that this non-essential data doesn't clutter my project.

## 5. Acceptance Criteria

-   **Scenario: User uploads an XLSX with unrecognized columns**
    -   **Given**: A user has an XLSX file with columns `id`, `context`, and "Spanish Translation".
    -   **When**: They upload this file using the "Update Translation" feature.
    -   **Then**: The Language Mapping Modal appears.
    -   **And**: The modal lists "Spanish Translation" as an unrecognized column and provides options to map or ignore it.

-   **Scenario: User successfully maps a column**
    -   **Given**: The Language Mapping Modal is open for the "Spanish Translation" column.
    -   **When**: The user selects the "Map" option and types "es" into the input field, then clicks "Continue".
    -   **Then**: The modal closes, and the application proceeds to the Merge Review step.
    -   **And**: The data from the "Spanish Translation" column is correctly treated as the "es" language data.

-   **Scenario: User ignores a column**
    -   **Given**: The Language Mapping Modal is open for a column named "Internal Notes".
    -   **When**: The user selects the "Ignore" option and clicks "Continue".
    -   **Then**: The modal closes, and the data from the "Internal Notes" column is not processed or imported.

-   **Scenario: User uploads a compliant XLSX file**
    -   **Given**: A user has an XLSX file with only compliant columns (`id`, `value_en`, `value_fr`).
    -   **When**: They upload this file.
    -   **Then**: The Language Mapping Modal does **not** appear, and the application proceeds directly to the next step.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The implementation intercepts the spreadsheet import workflow between file selection and data processing. It analyzes the file's headers first. If an intermediate step is needed to resolve ambiguity, it triggers a modal and pauses the workflow. The resolution from the modal is then passed along to the main processing function.
-   **Component Breakdown**:
    -   `types.ts`: New interfaces `LanguageMappingRequest` and `LanguageMappingResolution` are defined to manage the data flow for this feature.
    -   `App.tsx`:
        -   A new state, `languageMappingRequest`, is added to control the visibility and data of the mapping modal.
        -   The `processAndAnalyzeSpreadsheet` helper function is created. It analyzes the XLSX headers, identifies new languages and unrecognized columns, and if the latter exists, it populates and displays the `LanguageMappingModal`.
        -   The `handleProcessFileUpdate` function is updated to accept the `LanguageMappingResolution` object. It uses this mapping to correctly associate data from custom-named columns with the proper language codes during the final processing.
    -   `components/LanguageMappingModal.tsx`: A new modal component that receives a `LanguageMappingRequest`, renders the UI for mapping/ignoring columns, and calls back with a `LanguageMappingResolution` object upon confirmation.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User clicks "Update Translation" and selects an `.xlsx` file.
    2.  The app analyzes the file's headers in the background.
    3.  **If** there are unrecognized columns, a modal appears, overlaying the screen.
    4.  The modal displays a list of the unrecognized columns. For each column, the user is presented with two choices: "Map to Language Code" (with a text input) or "Ignore this column".
    5.  The user fills out the required mappings. The "Continue" button is disabled until all columns have a valid resolution (either ignored or mapped to a non-empty language code).
    6.  The user clicks "Continue".
    7.  The modal closes, and the regular update process continues to the Merge Review stage, now using the user-provided mappings.
-   **Visual Design**: A clean, centered modal that follows the application's existing design language. It clearly states its purpose and provides an intuitive, form-like interface for resolving each column.

## 8. Data Management & Schema

### 8.1. Data Source

The data is sourced from the headers of a user-provided `.xlsx` file.

### 8.2. Data Schema

This feature does not introduce any changes to the persistent data schema in `IndexedDB`. It uses temporary, in-memory state objects (`LanguageMappingRequest`, `LanguageMappingResolution`) to manage the user interaction during the import process.

## 9. Limitations & Known Issues

-   **One-Time Mapping**: The mappings provided by the user are for the current import session only. They are not saved or remembered for future uploads.
-   **No Language Code Validation**: The application accepts any string in the "language code" input field. It does not validate this input against ISO standards. An incorrect code (e.g., "fre" instead of "fr") will be used as-is.
-   **Adds an Extra Step**: For users with non-standard files, this feature introduces a necessary but additional step to the import process. The logic is designed to hide this step whenever possible to keep the workflow fast for users with compliant files.
