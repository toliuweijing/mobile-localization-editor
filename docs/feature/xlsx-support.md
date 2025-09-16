# Feature Specification Document: XLSX Support for Import & Export

## 1. Executive Summary

-   **Feature**: XLSX (Excel) Support for Import & Export
-   **Status**: Implemented
-   **Summary**: This feature introduces support for the `.xlsx` (Microsoft Excel) file format for both exporting project data and importing translation updates. This upgrade replaces the previous CSV-based functionality, providing a significantly more robust, reliable, and user-friendly workflow for teams collaborating on localization using spreadsheet software.

## 2. Problem Statement & Goals

-   **Problem**: While the previous CSV import/export feature enabled spreadsheet-based workflows, the CSV format itself has inherent limitations. It lacks a standard for character encoding (leading to garbled text), has inconsistent handling of commas and quotes across different software, and provides a generally poorer user experience. This created friction for non-technical users and could lead to data corruption.
-   **Goals**:
    -   Replace the fragile CSV format with the robust, standardized XLSX format for all spreadsheet operations.
    -   Eliminate common data integrity issues related to character encoding and special character escaping.
    -   Improve the overall user experience for localization managers, translators, and other stakeholders who work primarily in spreadsheet applications like Excel or Google Sheets.
    -   Maintain the safe, "update-only" import workflow, ensuring the native source file remains the single source of truth for the string manifest.
-   **Success Metrics**:
    -   A user can successfully export a project to an `.xlsx` file that opens correctly in all major spreadsheet software.
    -   A user can import a modified `.xlsx` file, and the application correctly parses all data without corruption.
    -   The "Merge Review" modal functions correctly with data imported from the `.xlsx` file.
    -   User feedback indicates a smoother and more reliable collaboration workflow compared to the previous CSV-based system.

## 3. Scope

-   **In Scope:**
    -   Integrating a client-side JavaScript library (`SheetJS/xlsx`) to handle reading and writing of `.xlsx` files.
    -   Creating a new `handleExportXLSX` function to generate and trigger the download of a valid `.xlsx` file from the project data.
    -   Creating a new `parseXlsxContent` function to read an `.xlsx` file (as an `ArrayBuffer`) and convert its first sheet into a structured data format usable by the application.
    -   Replacing all UI elements and logic related to CSV import/export with their XLSX equivalents.
    -   Updating all relevant documentation (`README.md`, other FSDs) to reflect this change.
-   **Out of Scope:**
    -   Supporting the older `.xls` format.
    -   Reading data from multiple sheets within a single workbook (only the first sheet is used).
    -   Advanced Excel features like formulas, macros, or cell styling. The import/export is for raw data only.
    -   Maintaining backward compatibility for importing old CSV files.

## 4. User Stories

-   As a **Localization Manager**, I want to export the project to a single `.xlsx` file so I can send it to my translators, who all use Microsoft Excel, without having to explain CSV import settings.
-   As a **Translator**, I want to receive an `.xlsx` file because it's a familiar format that I can easily edit without worrying about breaking the file by using commas or special characters in my translations.
-   As a **Developer**, I want the translation update process to be as reliable as possible, so I prefer importing an `.xlsx` file to avoid the data corruption issues I've faced with CSVs in the past.

## 5. Acceptance Criteria

-   **Scenario: User exports data to XLSX**
    -   **Given**: A user is viewing a loaded project.
    -   **When**: They click the "Download .xlsx" button.
    -   **Then**: The browser downloads a valid `.xlsx` file.
    -   **And**: The file's first sheet contains the correct headers and data corresponding to the project's state.

-   **Scenario: User imports an updated XLSX file**
    -   **Given**: A user has an `.xlsx` file that was previously exported from the application and subsequently edited.
    -   **When**: They use the "Update Translation" feature to upload this file.
    -   **Then**: The application successfully parses the file.
    -   **And**: The "Merge Review" modal appears, showing a correct visual diff of the changes made in the spreadsheet.
    -   **And**: After applying the changes, the project table is updated correctly.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The core of this feature is the integration of the SheetJS (`xlsx`) library, which is capable of handling all parsing and writing operations on the client side. The application's existing data handling pipeline for updates is then adapted to use this new parser.
-   **Component Breakdown**:
    -   `index.html`: The SheetJS library is loaded via a CDN `<script>` tag, making the `XLSX` global object available to the application.
    -   `App.tsx`: The component is refactored to replace all CSV-related logic with XLSX logic.
-   **Key Logic**:
    -   The `handleExportCSV` function is removed and replaced with `handleExportXLSX`, which uses `XLSX.utils.json_to_sheet` and `XLSX.writeFile` to create and download the file.
    -   The CSV parsing functions are removed and replaced with `parseXlsxContent`, which uses `XLSX.read` and `XLSX.utils.sheet_to_json` to process an `ArrayBuffer` of the file.
    -   The file update handler functions (`handleSpreadsheetFileUpdate`, `handleProcessFileUpdate`) are updated to read the file as an `ArrayBuffer` and use the new XLSX parser.

## 7. UI/UX Flow & Requirements

-   **User Flow**: The user flow is identical to the previous CSV workflow, providing a seamless transition for existing users.
    1.  User clicks "Download .xlsx" to get the translation template.
    2.  User edits the file in their preferred spreadsheet software.
    3.  User clicks "Update Translation" and selects their edited `.xlsx` file.
    4.  User reviews and applies changes in the Merge Review modal.
-   **Visual Design**:
    -   A "Download .xlsx" button replaces the previous "Download .csv" button.
    -   The title of the export section is changed to "Export Spreadsheet".
    -   The `accept` attribute on the file input for translation updates is changed to `.xlsx`.
-   **Copywriting**:
    -   Export Button Label: "Download .xlsx"

## 8. Data Management & Schema

### 8.1. Data Source

User-provided `.xlsx` files.

### 8.2. Data Schema

The expected XLSX schema is defined by the application's export format.
-   **Sheet**: The application reads data from the **first sheet** in the workbook. The sheet name itself does not matter.
-   **Headers**: The first row of the sheet must contain the headers. It must include an `id` column, and may include a `context` column and one or more value columns formatted as `value_{langCode}` (e.g., `value_default`, `value_es`).
-   **Data Types**: The application will treat all cell values as strings, regardless of their type in Excel (e.g., numbers will be converted to strings).

### 8.3. Persistence

Once changes from an imported `.xlsx` file are approved and applied, the updated project state is saved to `IndexedDB`.

## 9. Limitations & Known Issues

-   **Update-Only Workflow**: As with the previous CSV implementation, the XLSX import is strictly for **updating** values of existing strings. It cannot add new strings or remove existing ones. The native `.xml` or `.strings` file is the sole source of truth for the project's string manifest.
-   **First Sheet Only**: The application will only read data from the first sheet in the uploaded workbook. Any additional sheets will be ignored.
-   **Strict Header Requirement**: The import process relies on the header names matching the export format exactly (e.g., `value_es`). There is no support for custom column mapping or fuzzy matching.
