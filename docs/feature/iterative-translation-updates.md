# Feature Specification Document: Iterative Translation Updates via Row Duplication

## 1. Executive Summary

-   **Feature**: Iterative Translation Updates via Row Duplication
-   **Status**: **Superseded**. This document outlines an initial concept for handling file updates. It was evaluated and superseded by the "Merge Review Modal" feature, which provides a more robust and user-friendly workflow.
-   **Summary**: This feature proposed a method for users to update a localization project by uploading a new source file. For any string resource where the default value changed, a new row would be inserted into the table directly below the original, creating a duplicate string ID. The system would then block any export attempts until the user manually edited the string IDs to ensure uniqueness, thereby forcing a manual review of all changes.

## 2. Problem Statement & Goals

-   **Problem**: Source files in a software project are not static; they are constantly being updated with new strings, corrections, and removals. The application needed a mechanism to handle these updates, allowing users to see what has changed and decide how to proceed without losing existing translation work.
-   **Goals**:
    -   Provide a clear, visual indication of which strings have been modified in a new version of a source file.
    -   Ensure every single change to a string's default value is explicitly acknowledged and resolved by a human user.
    -   Preserve the history of a string's value by keeping the old and new versions visible side-by-side in the main data table.
-   **Success Metrics**:
    -   When a user uploads a new version of a file, they can see both the old and new values for changed strings in the table.
    -   An export attempt will fail if there are unresolved (duplicate) string IDs.
    -   An export attempt will succeed after the user has manually edited the duplicate IDs to make them unique.

## 3. Scope

-   **In Scope:**
    -   An update mechanism where a new source file can be uploaded for an existing project.
    -   Logic to compare the default values of strings between the old and new files.
    -   The ability to insert new rows into the resource table, creating intentional duplicate string IDs.
    -   A validation check during the export process that blocks the action if any duplicate string IDs are found.
    -   Adding a timestamp to each row to indicate when it was added.
-   **Out of Scope:**
    -   A dedicated UI or modal for reviewing changes (the table itself is the review UI).
    -   Automatic merging or conflict resolution.
    -   Handling for strings that are newly added or completely removed in the updated file (the focus was on modified strings).
    -   A visual "diff" view to highlight specific character changes.

## 4. User Stories

-   As a **Developer**, I want to update my project with a newer version of my source file so that I can see the previous and current values for any modified strings in the same view.
-   As a **Localization Manager**, I want the system to force me to resolve every single conflict by hand before I can export, so that I can be absolutely certain that no unintended change is overlooked.

## 5. Acceptance Criteria

-   **Scenario: User uploads a file with updated strings**
    -   **Given**: A user has a project loaded with a string resource having ID `welcome_message` and value "Hello".
    -   **When**: The user uploads a new version of the source file where `welcome_message` now has the value "Hello there!".
    -   **Then**: The resource table now displays two rows with the ID `welcome_message`; one with the old value and one with the new value.

-   **Scenario: User attempts to export with duplicate IDs**
    -   **Given**: The resource table contains two or more rows with the same string ID.
    -   **When**: The user attempts to export the project to any format (XML, CSV, etc.).
    -   **Then**: An error message is displayed, informing the user that duplicate IDs must be resolved.
    -   **And**: The file download is prevented.

-   **Scenario: User resolves duplicates and successfully exports**
    -   **Given**: The resource table has two rows with the ID `welcome_message`.
    -   **When**: The user edits the ID of the older row to `welcome_message_old`.
    -   **And**: The user then initiates an export.
    -   **Then**: The validation passes, and the file download begins successfully.

## 6. Technical Design & Implementation

-   **High-Level Approach**: This design would require a fundamental change to the application's data model and assumptions. The core principle that one string ID maps to one resource object would be broken.
-   **Component Breakdown**:
    -   `types.ts`: The `Project.resources` array would no longer hold objects with unique `id`s. The data structure would need to support multiple entries for the same ID.
    -   `App.tsx`: The parsing and file update logic would need to be changed to insert new `StringResource` objects instead of updating existing ones.
    -   `ResourceTable.tsx`: The `key` prop for rendering rows could no longer rely solely on `resource.id`, it would need a more unique identifier. The component would need to be able to render multiple rows associated with the same logical string.
    -   Export Handlers: All export functions (`handleExportXML`, `handleExportIosStrings`, etc.) would need to be prefaced with a validation step to scan the `resources` array for duplicate `id`s.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User has an active project.
    2.  User clicks an "Update from File" button and selects a new version of their source file.
    3.  The main table view re-renders. For every string ID that had a different default value in the new file, there are now two rows.
    4.  The user must now manually edit the string IDs in the table to resolve these duplicates (e.g., by renaming `app_title` to `app_title_v1`).
    5.  Once all IDs are unique, the user can successfully use the export functions.
-   **Visual Design**: The primary UI is the main table. There is no separate screen for this workflow. The visual indication of a change is the presence of a duplicate row.

## 8. Data Management & Schema

-   **Data Schema**: The `StringResource` object would need an additional property to store its creation date.
    ```json
    {
      "id": "app_name",
      "dateAdded": 1678886400000,
      "context": "The main application name",
      "values": { "default": "My App" }
    }
    ```
-   **Persistence**: The `IndexedDB` store would contain `Project` objects where the `resources` array could contain multiple objects with the same `id`. This complicates querying and data integrity.

## 9. Limitations & Known Issues

This section documents the significant drawbacks of this proposed design, which led to it being superseded.

-   **Critical Usability Flaw**: Forcing users to **edit the string ID** is highly dangerous. String IDs are programmatic keys referenced in the application's source code. Renaming an ID in the localization tool would break the link to the code, causing bugs or crashes. This approach encourages a practice that is fundamentally unsafe in software development.

-   **Poor User Experience**: The main data table, which should be the single source of truth, becomes cluttered and confusing with duplicate keys. This violates user expectations and creates a high cognitive load, especially when dealing with a large number of changes.

-   **Lack of Scalability**: While the workflow might be manageable for 1-2 changes, it becomes extremely tedious and error-prone if an update involves dozens or hundreds of modified strings, requiring the user to perform an equal number of manual resolutions.

-   **High Technical Complexity**: Allowing duplicate keys in the primary data structure would require a major and complex refactoring of nearly every feature in the application that interacts with string resources.
