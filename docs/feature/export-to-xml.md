# Feature Specification Document: Export to Android strings.xml

## 1. Executive Summary

-   **Feature**: Export string resource table back to Android `strings.xml` format.
-   **Status**: Implemented
-   **Summary**: This feature completes the application's primary workflow by allowing users to export the parsed string resources from the table back into a valid Android `strings.xml` file. This transforms the tool from a simple viewer into a utility for formatting, cleaning, and managing string resource files, laying the essential groundwork for future translation and editing capabilities.

## 2. Problem Statement & Goals

-   **Problem**: The application initially provided a one-way data flow: `XML -> Table`. Users could view their data but could not get it back out in its original, structured format. This limited the tool's utility, as any corrections or standardizations viewed in the table could not be saved. The workflow was a dead end.
-   **Goals**:
    -   Establish a round-trip data workflow: `Import XML -> View in Table -> Export XML`.
    -   Enable users to generate a clean, consistently formatted `strings.xml` file from their imported data.
    -   Provide the foundational export mechanism necessary for future in-app editing and translation management features.
-   **Success Metrics**:
    -   A user can successfully download a `.xml` file that is well-formed.
    -   The downloaded `strings.xml` file can be placed into an Android project's `res/values/` directory and be correctly parsed by the Android build tools without causing compilation errors.

## 3. Scope

-   **In Scope:**
    -   Implementing an "Export XML" button in the UI, grouped with other export actions.
    -   Logic to convert the `StringResource[]` array into a valid XML string, including the `<?xml ... ?>` declaration and the root `<resources>` element.
    -   Re-creating XML comments (`<!-- ... -->`) from the `context` field for each string resource.
    -   Properly escaping special XML characters (e.g., `<`, `>`, `&`, `"`, `'`) in both attribute values and element content to ensure file validity.
    -   Triggering a browser file download with the original filename and `.xml` extension.
-   **Out of Scope:**
    -   Re-creating complex Android resource types that are not currently parsed (e.g., `<plurals>`, `<string-array>`). The export function only supports simple `<string>` tags.
    -   Preserving the exact original formatting, whitespace, or ordering of non-string elements from the source file.
    -   In-app editing of string values (this export feature is a prerequisite for making such edits useful).

## 4. User Stories

-   As a **Developer**, I want to export the resources back to a `strings.xml` file so I can replace my original file with a version that has standardized formatting and comments.
-   As a **Team Lead**, I want to process a `strings.xml` file through the tool and export it to ensure it is clean and valid before committing it to the repository.
-   As a **Future Translator**, I want to be able to edit the string values in the table and then export a fully translated `strings.xml` file for a new language.

## 5. Acceptance Criteria

-   **Scenario: User exports data as XML**
    -   **Given**: A user has successfully uploaded a `strings.xml` file and is viewing the resource table.
    -   **When**: The user clicks the "Export XML" button.
    -   **Then**: The browser initiates a download for a `.xml` file.
    -   **And**: The file is a well-formed XML document starting with `<?xml version="1.0" encoding="utf-8"?>`.
    -   **And**: The file contains a single root `<resources>` element.
    -   **And**: For each row in the table, a corresponding `<string name="...">...</string>` tag exists inside `<resources>`.
    -   **And**: If a row has a `context` other than the default, it is preceded by a correctly formatted XML comment (`<!-- context -->`).
    -   **And**: All special characters within the `name` attribute and the string's text content are correctly escaped (e.g., `&` becomes `&amp;`).

## 6. Technical Design & Implementation

-   **`App.tsx`**:
    -   A new handler function, `handleExportXML`, has been added.
    -   This function iterates through the `resources` state array.
    -   For each `StringResource` object, it constructs a string snippet containing the XML comment (if applicable) and the `<string>` tag.
    -   A dedicated `escapeXml` helper function is used to handle the replacement of special characters, ensuring the generated XML is robust and valid.
    -   The collected snippets are joined together and wrapped within the XML declaration and the `<resources>` tags.
    -   The final XML string is passed to the existing `triggerDownload` utility function to initiate the browser download.
-   **UI Changes**:
    -   A new "Export XML" button has been added to the action bar that appears after a file is loaded.
    -   It is styled consistently with the "Export CSV" and "Export MD" buttons and includes the `DownloadIcon` for clear visual affordance.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User uploads a `strings.xml` file and views the data in the resource table.
    2.  User locates the action bar containing the filename and a set of buttons.
    3.  User clicks the "Export XML" button.
    4.  A file download begins immediately. The user's view of the application remains unchanged.
-   **Visual Design**: The button is a secondary action, visually grouped with the other export options to create a cohesive user experience.

## 8. Data Management & Schema

This feature is a data transformation and download feature. It does not alter the application's state.

### 8.1. XML Schema

The output is a standard Android `strings.xml` file.

-   **Encoding**: `utf-8`
-   **Root Element**: `<resources>`
-   **Child Elements**: The `<resources>` tag contains a list of nodes. Each node is either:
    -   An XML Comment: `<!-- Comment providing context for the following string. -->`
    -   A String Element: `<string name="your_string_id">Your string value</string>`
-   **Example Structure**:
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <resources>
        <!-- The main application name -->
        <string name="app_name">My Awesome App</string>
        
        <string name="welcome_message">Hello, World!</string>
    </resources>
    ```

## 9. Limitations & Known Issues

This section documents the current limitations ("cons") of the export functionality, which can be addressed in future iterations.

-   **Data Loss with Complex Resource Files**: The application's parser is designed exclusively for simple `<string>` tags and their immediate preceding comments. It does not recognize or preserve other Android resource types such as `<plurals>`, `<string-array>`, or styled string formatting tags (e.g., `<b>`, `<i>`, `<u>`). If the original `strings.xml` file contains these elements, they will be **lost upon export**. The generated file will only contain the simple strings that were successfully parsed.

-   **Limited Utility Without Editing**: In its current form, the export feature's primary benefit is re-formatting and standardizing a `strings.xml` file. Since in-app editing of string values is not yet implemented, the exported XML will be functionally identical to the imported XML in terms of content. The true potential of this feature will be unlocked once editing capabilities are introduced.

-   **Loss of Original File Structure**: The export process generates a new file based on the parsed data. It does not preserve the original file's whitespace, line breaks, or the relative order of comments and string tags if they were not immediately adjacent. The output is standardized but not identical in structure to the input.
