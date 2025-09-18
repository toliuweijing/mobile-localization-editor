# Feature Specification Document: Select Sheet on XLSX Import

## 1. Executive Summary

-   **Feature**: Select Sheet on XLSX Import
-   **Status**: Implemented
-   **Summary**: This feature enhances the XLSX import functionality to allow users to select which sheet to import from a workbook that contains multiple sheets. To avoid unnecessary user interaction, the feature intelligently handles cases where the choice is obvious (e.g., only one sheet exists, or only one sheet contains valid data), only prompting the user for a selection when there is genuine ambiguity.

## 2. Problem Statement & Goals

-   **Problem**: The application previously defaulted to importing only the first sheet of an XLSX file. This workflow fails for users who organize their translations across multiple sheets (e.g., "Android Strings," "iOS Strings," "Instructions") or receive files where the relevant data is not on the first sheet. This limitation made the application incompatible with many common, real-world localization workflows.
-   **Goals**:
    -   Goal 1: Enable users to import data from any valid sheet within an XLSX workbook.
    -   Goal 2: Preserve the simplicity and speed of the import process for users with simple, single-sheet files.
    -   Goal 3: Provide an intelligent workflow that only prompts for user input when it is absolutely necessary to resolve ambiguity.
    -   Goal 4: Improve the application's compatibility and flexibility to support a wider variety of localization management practices.
-   **Success Metrics**:
    -   A user can successfully import data from the third sheet of a multi-sheet XLSX file.
    -   When a user uploads a workbook with only one "valid" sheet (i.e., one containing a required `id` column), the import proceeds directly to the next step without showing a selection modal.
    -   When a user uploads a workbook with multiple valid sheets, a modal appears, allowing them to choose the correct one before proceeding.

## 3. Scope

-   **In Scope:**
    -   Logic to analyze all sheets in an XLSX workbook upon upload.
    -   Logic to identify "valid" sheets, defined as those containing a required `id` column header.
    -   A new modal component (`SheetSelectionModal.tsx`) to present the list of valid sheets to the user when more than one is detected.
    -   State management to handle the sheet selection request and pass the chosen sheet name to subsequent processing steps.
    -   Updating the XLSX parsing logic to accept and use a specific sheet name provided by the user.
-   **Out of Scope:**
    -   Importing and merging data from multiple sheets simultaneously.
    -   Allowing users to preview the content of sheets from within the selection modal.
    -   Support for complex sheet selection logic beyond checking for an `id` column header.

## 4. User Stories

-   As a **Localization Manager**, I want to upload a workbook containing sheets for "Android" and "iOS" and be able to choose the "Android" sheet to update my current Android project.
-   As a **Developer**, I want the app to be smart enough to automatically pick the correct sheet if only one in my workbook contains translation data, so I don't have to make an extra click during my workflow.

## 5. Acceptance Criteria

-   **Scenario: User uploads a multi-sheet workbook with one valid sheet**
    -   **Given**: A user has an XLSX file with two sheets: "Instructions" (which lacks an `id` column) and "Translations" (which has an `id` column).
    -   **When**: They upload this file using the "Update Translation" feature.
    -   **Then**: The application automatically selects the "Translations" sheet and proceeds to the next step (either Language Mapping or Merge Review) without showing the Sheet Selection Modal.

-   **Scenario: User uploads a multi-sheet workbook with multiple valid sheets**
    -   **Given**: A user has an XLSX file with two sheets: "Android_Strings" and "iOS_Strings", both of which contain an `id` column.
    -   **When**: They upload this file.
    -   **Then**: The Sheet Selection Modal appears, listing "Android_Strings" and "iOS_Strings" as choices.
    -   **And**: After selecting a sheet and clicking "Continue", the application proceeds using only the data from the chosen sheet.

-   **Scenario: User uploads a standard single-sheet workbook**
    -   **Given**: A user has a standard XLSX file with only one sheet.
    -   **When**: They upload this file.
    -   **Then**: The application proceeds directly to the next step without showing the Sheet Selection Modal.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The implementation intercepts the XLSX file update process. It first reads the workbook to get all sheet names, then checks the headers of each sheet to filter for valid candidates. Based on the number of candidates, it either proceeds automatically or triggers a new modal to request user input.
-   **Component Breakdown**:
    -   `types.ts`: A new `SheetSelectionRequest` interface is created to hold the file handle and the list of valid sheet names. The `LanguageMappingRequest` is updated to optionally carry the selected `sheetName` through the workflow.
    -   `App.tsx`:
        -   The `handleSpreadsheetFileUpdate` function reads the uploaded workbook, finds all valid sheets (those with an 'id' column), and implements the core decision logic: if 1 valid sheet, proceed; if >1, set the state to show the selection modal.
        -   A new state, `sheetSelectionRequest`, is added to manage the modal's visibility and data.
        -   `processAndAnalyzeSpreadsheet` is a new helper function that takes the file and an optional `sheetName` to continue the update pipeline after a sheet has been selected.
    -   `components/SheetSelectionModal.tsx`: A new, self-contained modal component that receives a `SheetSelectionRequest`, renders a list of radio buttons for the user to choose from, and calls back with the selected sheet name.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User clicks "Update Translation" and selects an `.xlsx` file.
    2.  The application analyzes the file in the background.
    3.  **If** the file has multiple valid sheets, a modal appears, overlaying the screen.
    4.  The modal presents a simple, clear list of the valid sheet names with radio buttons for selection.
    5.  The user selects a sheet and clicks "Continue".
    6.  The modal closes, and the regular update process continues (Language Mapping or Merge Review), using data only from the selected sheet.
-   **Visual Design**: A clean, centered modal that follows the application's existing design language. It clearly states its purpose ("Select a Sheet to Import") and provides a simple list for selection.

## 8. Data Management & Schema

### 8.1. Data Source

The data is sourced from a user-uploaded `.xlsx` file.

### 8.2. Data Schema

This feature does not introduce any changes to the persistent data schema in `IndexedDB`. It uses a temporary, in-memory state object (`SheetSelectionRequest`) to manage the user interaction during the import process.

## 9. Limitations & Known Issues

-   **No Sheet Preview**: The user cannot see a preview of a sheet's content before selecting it. They must rely on the presence of clear, descriptive sheet names in the source file.
-   **Header-Based Validation Only**: The determination of a "valid" sheet is based solely on the presence of an `id` column header in the first row. A sheet could have this header but contain otherwise invalid or irrelevant data, which would only be discovered later in the import process.