# Feature Specification Document: Multi-Language Translation Management

## 1. Executive Summary

-   **Feature**: Multi-Language Translation Management
-   **Status**: Implemented
-   **Summary**: This feature enhances the application by allowing users to add language-specific translations alongside the default string values. Users can dynamically add new language columns to the resource table, edit the translations in-place, and export a separate, valid `strings.xml` or `.strings` file for each language. This transforms the tool from a single-file editor into a basic but powerful localization management platform.

## 2. Problem Statement & Goals

-   **Problem**: The application initially supported only a single, default resource file. The standard mobile development workflow requires managing translations in separate, language-qualified files. The tool did not support this workflow, forcing developers to manage translations manually across many separate files, which is inefficient, tedious, and prone to errors like missing translations or mismatched string IDs.
-   **Goals**:
    -   Enable users to add and manage translations for multiple languages within a single, unified interface.
    -   Provide a clear, side-by-side view of the default string, its context, and all its translations.
    -   Allow for the one-click export of valid, language-specific resource files that can be directly used in a mobile project.
    -   Streamline the localization workflow, reducing complexity and the potential for human error.
-   **Success Metrics**:
    -   A user can successfully add a new language column (e.g., 'es') to the table.
    -   A user can input and edit text within the cells of the new language column.
    -   A user can click a language-specific export button (e.g., "Export (es)") and receive a correctly formatted resource file containing only the translated strings.
    -   A user can remove a language, which will remove the corresponding column and all its translation data.

## 3. Scope

-   **In Scope:**
    -   A UI button to "Add Translation" which prompts the user for a new language code.
    -   Dynamically rendering additional editable columns in the resource table for each added language.
    -   A UI button in each translation column's header to remove that language and its associated data.
    -   Updating the core data structure to store a dictionary of values (keyed by language code) for each string resource.
    -   Dynamically generating "Export Native File" buttons for each language present in the table.
    -   Expanding the CSV and Markdown export functionality to include columns for all added languages.
    -   Persisting the list of languages and all translation data to `IndexedDB` across sessions.
-   **Out of Scope:**
    -   Automatic translation suggestions via third-party APIs (this is handled by a separate AI feature).
    -   Importing multiple resource files simultaneously to populate the table.
    -   Support for complex resource types like `<plurals>` or `<string-array>`.
    -   A system for tracking translation status (e.g., "needs review," "approved").
    -   Validation of user-provided language codes against ISO standards.

## 4. User Stories

-   As a **Developer**, I want to add columns for Spanish ('es') and German ('de') so that I can input and manage all my app's translations in one place without switching between files.
-   As a **Localization Manager**, I want to export a separate resource file for each language so I can easily deliver the final, ready-to-use files to the engineering team.
-   As a **Translator**, I want to see the default string and its context comment directly next to the input field for my language so that I can provide a more accurate and context-aware translation.

## 5. Acceptance Criteria

-   **Scenario: Adding, populating, and persisting a new language**
    -   **Given**: A user is viewing the resource table with only the "default" language visible.
    -   **When**: The user clicks the "Add Translation" button and enters 'de' into the prompt.
    -   **Then**: A new column titled "Value (de) (Editable)" appears in the resource table.
    -   **And**: The user can type a German translation into a cell in the new column.
    -   **And**: After refreshing the browser, the 'de' column and the entered translation are still present.

-   **Scenario: Exporting a translated file**
    -   **Given**: The user has added the 'de' language and provided translations for several strings.
    -   **When**: The user clicks the "de" button in the "Export Native Files" section.
    -   **Then**: The browser initiates a download for a file named appropriately for the platform and language (e.g., `strings-de.xml`).
    -   **And**: The downloaded file contains resource tags only for the resources that had a German translation, and it is a well-formed document.

-   **Scenario: Removing a language**
    -   **Given**: A user is viewing the table which includes columns for 'default' and 'de'.
    -   **When**: The user clicks the trash icon in the header of the "Value (de)" column and confirms the action.
    -   **Then**: The "Value (de)" column is immediately removed from the table.
    -   **And**: The 'de' button in the "Export Native Files" section is also removed.
    -   **And**: All German translation data is permanently deleted from the application state in `IndexedDB`.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The core of this feature involves modifying the application's central data structure to support multiple values per string ID. The UI components will then be updated to dynamically render columns and actions based on this new data structure.
-   **Component Breakdown**:
    -   `types.ts`: The `StringResource` interface is modified. The `value: string` property is replaced with `values: { [langCode: string]: string }`. This is the foundational data model change.
    -   `App.tsx`:
        -   The `Project` type is updated to include `languages: string[]`, to track all active languages, initialized to `['default']`.
        -   The `handleAddLanguage` and `handleRemoveLanguage` functions are created to manage the `languages` array and modify the `resources` data accordingly.
        -   The `handleUpdateResource` function is updated to accept a `langCode` to ensure it updates the correct translation in the `values` object.
        -   The `handleExportXML` and `handleExportIosStrings` functions are modified to accept a `langCode` parameter, generating a file containing only the values for that specific language.
    -   `ResourceTable.tsx`:
        -   The component is modified to accept `languages` and `onRemoveLanguage` as props.
        -   The table header (`<thead>`) and table body (`<tbody>`) are refactored to iterate over the `languages` array, dynamically generating a `<th>` and a `<td>` for each language, respectively.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User uploads a default resource file.
    2.  User sees the table with columns for "String ID", "Context", and "Default Value".
    3.  User clicks the "Add Translation" button located in the main action bar.
    4.  A native browser `prompt()` appears, asking for a language code.
    5.  User enters a code (e.g., 'fr') and clicks "OK".
    6.  A new editable column, "Value (fr)", instantly appears in the table.
    7.  User clicks into the cells of the new column to add translations.
    8.  User navigates to the "Export Options" card and sees a new button labeled "fr" under the "Export Native Files" heading.
    9.  User clicks the "fr" button to download the language-specific file.
-   **Visual Design**: A prominent "Add Translation" button, featuring a plus icon, is added to the header. Language-specific export buttons are styled as small, clickable tags for a compact UI. Each translation column header contains a subtle trash icon for removal.
-   **Copywriting**:
    -   Button Label: "Add Translation"
    -   Prompt Text: "Enter a new language code (e.g., 'es', 'fr', 'de-rDE'):"
    -   Table Headers: "Value ({langCode}) (Editable)"

## 8. Data Management & Schema

### 8.1. Data Source

The data for new languages and their translations comes directly from user input.

### 8.2. Data Schema

The schema for the `Project` object stored in `IndexedDB` is updated to include the `languages` array and to change the structure of `resources`:

```json
{
  "id": "proj_123",
  "name": "My Project",
  "fileName": "strings.xml",
  "platform": "android",
  "languages": ["default", "es"],
  "resources": [
    {
      "id": "app_name",
      "context": "The main application name",
      "values": {
        "default": "My Awesome App",
        "es": "Mi Aplicación Impresionante"
      }
    }
  ]
}
```

### 8.3. Persistence

All state, including the list of languages and all entered translations, is automatically persisted to `IndexedDB` on every change via calls to the database service, ensuring a seamless experience across browser sessions.

## 9. Limitations & Known Issues

-   **No Plurals/Arrays Support**: This feature, like the rest of the application, only supports simple `<string>` tags. If the original file contains `<plurals>` or `<string-array>` resources, they will be ignored, and translation for them is not possible.
-   **Single-File Import**: The workflow is predicated on starting with a single, default resource file. There is no mechanism to import existing translation files (e.g., a `values-es/strings.xml`) to pre-populate the translation columns.
-   **No Language Code Validation**: The application accepts any user-provided string as a language code without validation. Entering an invalid code (e.g., "spanish" instead of "es") could lead to a file that is not correctly recognized by the build system.