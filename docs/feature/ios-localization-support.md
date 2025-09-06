# Feature Specification Document: iOS Localization Support

## 1. Executive Summary

-   **Feature**: iOS Localization Support (`.strings` file format)
-   **Status**: Implemented
-   **Summary**: This feature has extended the application's capabilities to support the import, editing, and export of iOS localization files (`.strings` format). This enhancement has transformed the tool from a niche Android utility into a comprehensive mobile localization editor, serving both Android and iOS developers and providing a unified workflow for cross-platform teams.

## 2. Problem Statement & Goals

-   **Problem**: The application was initially limited to the Android `strings.xml` format, completely excluding the large community of iOS and macOS developers. Development teams building for both platforms were forced to use separate, inconsistent workflows for managing their string resources, leading to inefficiency, potential for mismatched translations, and a disjointed developer experience.
-   **Goals**:
    -   Goal 1: Enable the import and parsing of the standard iOS `.strings` file format, including comments for context.
    -   Goal 2: Allow for the in-place editing of iOS string values and their associated context.
    -   Goal 3: Enable the export of data back into valid, language-specific `.strings` files that can be directly used in an Xcode project.
    -   Goal 4: Broaden the application's user base and value proposition by providing a single, cohesive tool for the two major mobile platforms.
-   **Success Metrics**:
    -   Metric 1: A user can successfully upload a `.strings` file, and the data (IDs, values, comments) is correctly parsed and displayed in the resource table.
    -   Metric 2: All existing features (multi-language management, in-place editing, AI translation, CSV/MD export) function correctly with the loaded iOS data.
    -   Metric 3: A user can export a valid `.strings` file for any language, and it is correctly interpreted by Xcode without errors.

## 3. Scope

-   **In Scope:**
    -   Implementing platform detection on file upload to differentiate between `.xml` and `.strings` files.
    -   Creating a new parser specifically for the `.strings` file format, capable of handling `"key" = "value";` syntax and `/* comment */` blocks.
    -   Creating a new exporter to generate well-formed `.strings` files from the application's state.
    -   Updating the UI and application copy to be platform-neutral (e.g., renaming the app to "Mobile Localization Editor").
    -   Adapting the AI translation prompt to ensure it recognizes and preserves iOS-specific formatting placeholders (e.g., `%@`, `%d`).
    -   Storing the detected platform (`android` or `ios`) in `IndexedDB` as part of the project data to maintain context across sessions.
-   **Out of Scope:**
    -   Support for the more complex iOS plurals format found in `.stringsdict` files. This will be considered for a future release.
    -   Importing an entire `.lproj` directory or an Xcode project. The workflow will remain focused on single-file import/export.
    -   Automatic conversion between Android (`%1$s`) and iOS (`%@`) placeholder formats. The tool will only preserve the format present in the source file.

## 4. User Stories

-   As an **iOS Developer**, I want to upload my `Localizable.strings` file so that I can easily edit values, add context comments, and then export the file back for use in my Xcode project.
-   As a **Cross-Platform Team Lead**, I want my team to use a single tool for managing both Android and iOS strings so that we can ensure consistency in translations and context across both platforms.
-   As a **Localization Manager**, I want to import a default `.strings` file, add a new language column, use the AI feature to generate a "first draft" translation, and then export the new translated `.strings` file for the iOS development team.

## 5. Acceptance Criteria

-   **Scenario: User uploads, edits, and exports an iOS `.strings` file**
    -   **Given**: A user has a valid `Localizable.strings` file.
    -   **When**: They upload the file to the application.
    -   **Then**: The application correctly identifies the platform as "ios" and displays a corresponding badge.
    -   **And**: The table is populated with the correct string IDs, values, and contexts derived from `/* comments */`.
    -   **And**: The user can edit a value in the table.
    -   **And**: When the user exports the file, the browser downloads a valid `.strings` file containing the edited value.

-   **Scenario: AI Translation correctly handles iOS placeholders**
    -   **Given**: A user has loaded a `.strings` file containing an entry like `"Welcome, %@!";`.
    -   **When**: They use the AI Translate feature to generate a Spanish translation.
    -   **Then**: The resulting translation correctly preserves the placeholder, resulting in a value like `"¡Bienvenido, %@!";`.

-   **Scenario: Platform context is persisted**
    -   **Given**: A user has uploaded a `.strings` file.
    -   **When**: They refresh the browser page.
    -   **Then**: The application reloads the project with the iOS data, and the platform is still identified as "ios", ensuring the correct export format is used.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The core strategy is to use a `platform` property within each `Project` object. This property dictates which parsing and exporting logic to use. The central `StringResource[]` data structure is platform-agnostic and does not require changes, demonstrating a robust initial design.
-   **Component Breakdown**:
    -   `App.tsx`:
        -   The `Project` type includes a `platform` property: `'android' | 'ios' | null`.
        -   `handleFileSelect` checks the file extension. If it ends in `.strings`, it calls `parseIosStringsContent` and sets `platform` to `'ios'`.
        -   `parseIosStringsContent(content: string): StringResource[]` uses regular expressions to extract comments, keys, and values.
        -   `handleExportIosStrings(langCode: string)` iterates through resources and builds a valid `.strings` file as a string.
        -   UI elements, such as the export buttons, conditionally call either `handleExportXML` or `handleExportIosStrings` based on the active project's `platform`.
    -   `FileUpload.tsx`: The `accept` attribute of the `<input>` element includes `.strings`. The descriptive text informs users that both file types are supported.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User visits the application and sees the main title "Mobile Localization Editor".
    2.  The file upload component prompts the user to upload an `Android (.xml)` or `iOS (.strings)` file.
    3.  User uploads their `Localizable.strings` file.
    4.  The application loads the data. A small "ios" badge appears next to the filename in the header.
    5.  The user interacts with the table as usual (editing, adding languages, using AI).
    6.  The user navigates to the "Export Options" card. Under "Export Native Files," the language buttons are now configured to export in the `.strings` format.
    7.  Clicking a language button (e.g., "es") triggers the download of a `Localizable-es.strings` file.
-   **Visual Design**: The primary visual change is rebranding to be platform-neutral. A small, subtle badge indicating the current project's platform ('android' or 'ios') is added next to the filename for clarity.
-   **Copywriting**:
    -   Application Title: "Mobile Localization Editor"
    -   Upload Prompt: "Android (.xml) or iOS (.strings)"
    -   Export Section Header: "Export Native Files"

## 8. Data Management & Schema

### 8.1. Data Source

The data originates from user-uploaded `.strings` files.

### 8.2. Data Schema

The `IndexedDB` data schema is updated to include the `platform` key within the `Project` object to maintain session context.

```json
{
  "id": "proj_123",
  "name": "My iOS Project",
  "fileName": "Localizable.strings",
  "platform": "ios",
  "languages": ["default", "es"],
  "resources": [
    {
      "id": "welcome_message",
      "context": "Message displayed on the home screen",
      "values": {
        "default": "Welcome!",
        "es": "¡Bienvenido!"
      }
    }
  ]
}
```

### 8.3. Persistence

The `platform` property is saved to and loaded from `IndexedDB` as part of the overall `Project` object, ensuring a fully persistent state.

## 9. Limitations & Known Issues

-   **No `.stringsdict` Support**: The implementation does not parse or export the XML-based `.stringsdict` format used for pluralization in iOS. Strings defined in such files will be ignored. This is the most significant limitation for apps with complex localization needs.
-   **File Encoding**: The application exports `.strings` files in UTF-8 encoding, which is standard for the web. While modern Xcode handles UTF-8 well, the traditional and default encoding for `.strings` files is UTF-16. This minor technical discrepancy is unlikely to cause issues but is a known difference from the native format.
-   **No Format Conversion**: The tool will not attempt to convert string format placeholders between Android and iOS. It is designed to preserve the placeholders of the originally imported file type.