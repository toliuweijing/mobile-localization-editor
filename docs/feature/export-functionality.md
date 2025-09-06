
# Feature Specification Document: Export Functionality

## 1. Executive Summary

-   **Feature**: Export string resource table to common file formats.
-   **Status**: Implemented
-   **Summary**: This feature allows users to export the parsed Android string resources from the on-screen table into two widely-used formats: Comma-Separated Values (CSV) and Markdown (MD). This enhances the application's utility by enabling offline workflows, easier collaboration with translators, and simplified documentation generation.

## 2. Problem Statement & Goals

-   **Problem**: The application was primarily a viewer. To use the parsed data elsewhere (e.g., in a spreadsheet, in documentation, or with a translation team), users had to manually copy and paste the information, which is tedious and error-prone.
-   **Goals**:
    -   Provide a one-click method to download the entire string resource table.
    -   Support common, human-readable, and machine-parsable formats.
    -   Enable users to process and share the string data using external tools.
-   **Success Metrics**:
    -   A user can successfully download a `.csv` file containing all the string resources.
    -   A user can successfully download a `.md` file with the string resources formatted as a Markdown table.
    -   The downloaded files are correctly formatted and accurately represent the data shown in the UI.

## 3. Scope

-   **In Scope:**
    -   Implementing "Export CSV" and "Export Markdown" buttons in the UI.
    -   Logic to convert the `StringResource[]` array into valid CSV and Markdown strings.
    -   Properly escaping special characters (commas, quotes in CSV; pipe characters in Markdown) to ensure file integrity.
    -   Triggering a browser file download with a sensible filename (e.g., `original_filename.csv`).
-   **Out of Scope:**
    -   Exporting to other formats (e.g., JSON, XML, XLIFF).
    -   Customizing the export output (e.g., choosing columns, delimiters).
    -   Importing data from these formats back into the application.

## 4. User Stories

-   As a **Developer**, I want to export the string list to a CSV file so I can share it with my translation team to get localized versions.
-   As a **Technical Writer**, I want to export the string list to a Markdown table so I can easily embed it in our project's documentation.
-   As a **Product Manager**, I want to download the list of strings to review them offline in a spreadsheet application.

## 5. Acceptance Criteria

-   **Scenario: User exports data as CSV**
    -   **Given**: A user has successfully uploaded a `strings.xml` file and is viewing the resource table.
    -   **When**: The user clicks the "Export CSV" button.
    -   **Then**: The browser initiates a download for a `.csv` file.
    -   **And**: The file contains a header row (`id,context,value`) and subsequent rows for each string resource, with fields correctly escaped.

-   **Scenario: User exports data as Markdown**
    -   **Given**: A user is viewing the resource table.
    -   **When**: The user clicks the "Export MD" button.
    -   **Then**: The browser initiates a download for a `.md` file.
    -   **And**: The file contains a correctly formatted Markdown table with headers and rows for each string resource. Special characters are handled to prevent breaking the table structure.

## 6. Technical Design & Implementation

-   **`App.tsx`**:
    -   Two new handler functions, `handleExportCSV` and `handleExportMD`, have been added.
    -   Each function serializes the `resources` state into the appropriate string format.
    -   **CSV Generation**: Handles escaping of quotes and commas by enclosing relevant fields in double quotes.
    -   **Markdown Generation**: Handles escaping of pipe (`|`) characters and converts newlines to `<br/>` tags to maintain table integrity.
    -   Both functions use the standard web pattern for triggering downloads: create a `Blob`, generate an object URL (`URL.createObjectURL`), create a temporary `<a>` element with `href` and `download` attributes, programmatically click it, and then clean up the element and object URL.
-   **UI Changes**:
    -   The header section (visible after a file upload) now includes two new buttons: "Export CSV" and "Export MD".
    -   A new `DownloadIcon` component has been created and is used in the export buttons for better visual communication.
    -   The button group has been styled for clarity, separating the export actions from the "Upload New File" action.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User uploads `strings.xml` file and views the data table.
    2.  User sees the filename and a set of action buttons: "Export CSV", "Export MD", and "Upload New File".
    3.  User clicks an export button.
    4.  A file download begins immediately. The user remains on the same page.
-   **Visual Design**: The new export buttons are styled as secondary actions, using a lighter theme than the primary "Upload New File" button to create a clear visual hierarchy. Icons are used to quickly convey the action.

## 8. Data Management & Schema

This feature is stateless and does not involve data storage. It is a pure data transformation and download feature.

### 8.1. CSV Schema

The output CSV file follows a simple schema:
-   **Header**: `id,context,value`
-   **Rows**: Each row corresponds to a `StringResource` object.

### 8.2. Markdown Schema

The output Markdown file is a standard GitHub-flavored Markdown table:
```markdown
| String ID | Context | Default Value |
|---|---|---|
| `app_name` | The main application name | My Awesome App |
```
