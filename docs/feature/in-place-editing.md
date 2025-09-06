# Feature Specification Document: In-Place Table Editing

## 1. Executive Summary

-   **Feature**: In-Place Editing of String Resources in the Table
-   **Status**: Implemented
-   **Summary**: This feature enhances the application by making the "Context" and "Value" cells within the resource table directly editable. It transforms the application from a passive viewer into an interactive editor, unlocking the full potential of the export functionalities. Users can now make corrections, add translations, or refine comments directly in the UI, and then export the modified data.

## 2. Problem Statement & Goals

-   **Problem**: The application's workflow was incomplete. While users could import and export a `strings.xml` file, they could not modify the content in between. This meant the export feature's primary utility was limited to re-formatting the original file. To make any actual changes, users had to leave the application and use a separate text editor, defeating the purpose of a convenient web-based tool.
-   **Goals**:
    -   Allow users to directly edit the `context` and `value` of each string resource within the table.
    -   Provide an intuitive and seamless editing experience without complex forms or pop-ups.
    -   Ensure that any edits made by the user are accurately reflected in all subsequent exports (XML, CSV, MD).
    -   Persist user edits across browser sessions using IndexedDB.
-   **Success Metrics**:
    -   A user can click into a "Value" or "Context" cell, modify its text, and see the change reflected in the UI.
    -   When a user exports the data after an edit, the downloaded file contains the modified content.
    -   If a user edits a string and refreshes the page, their edit is preserved and visible upon reload.

## 3. Scope

-   **In Scope:**
    -   Making the `<td>` elements for the "Context" and "Value" columns editable, likely using the `contentEditable` attribute.
    -   Implementing an `onBlur` event handler to capture changes when the user clicks away from an edited cell.
    -   Updating the application's central state (`resources` array in `App.tsx`) with the new values.
    -   Leveraging the existing `IndexedDB` persistence to automatically save any edits.
    -   Adding visual cues (e.g., focus outline) to indicate which cell is being actively edited.
-   **Out of Scope:**
    -   Editing the string resource ID (`name` attribute). This is a key and should generally not be modified.
    -   Rich text editing (e.g., bold, italics). The editor supports plain text only.
    -   Input validation (e.g., preventing empty values).
    -   An explicit "Save" button or an "Undo/Redo" functionality. Changes are saved automatically on blur.

## 4. User Stories

-   As a **Developer**, I want to correct a typo in a string's value directly in the table so I can quickly fix it and export the corrected `strings.xml` file.
-   As a **Technical Writer**, I want to add or clarify a comment in the "Context" column to improve documentation for my team, then export the updated file.
-   As a **Localization Manager**, I want to paste a translated string into the "Value" cell to update a resource, and then export the result for a new language-specific `strings.xml` file.

## 5. Acceptance Criteria

-   **Scenario: User edits a string value**
    -   **Given**: A user is viewing the resource table.
    -   **When**: The user clicks on a cell in the "Value" column, types new text, and then clicks outside the cell.
    -   **Then**: The table cell displays the new text.
    -   **And**: When the user clicks "Export XML", the downloaded file contains the `<string>` tag with the updated value.

-   **Scenario: User edits a string's context**
    -   **Given**: A user is viewing the resource table.
    -   **When**: The user clicks on a cell in the "Context" column, types new text, and clicks away.
    -   **Then**: The table cell displays the new text.
    -   **And**: When the user clicks "Export XML", the downloaded file contains an XML comment with the updated context.

-   **Scenario: Edits are persisted across sessions**
    -   **Given**: A user has edited a value in the table.
    -   **When**: The user refreshes the browser page.
    -   **Then**: The application reloads, and the table displays the value with the user's edit still intact.

## 6. Technical Design & Implementation

-   **`ResourceTable.tsx`**:
    -   The `<td>` elements for "Context" and "Value" are given the `contentEditable` and `suppressContentEditableWarning={true}` attributes.
    -   An `onBlur` event is attached to these cells. The event handler (`handleBlur`) reads the `textContent` of the cell.
    -   `handleBlur` compares the new text with the original value. If it has changed, it calls the `onUpdateResource` function passed down from `App.tsx` with the resource `id`, the `field` being updated (`'context'` or `'value'`), and the `newValue`.
    -   Table headers have been updated to "(Editable)" to clearly communicate this functionality to the user.
-   **`App.tsx`**:
    -   A new memoized callback function, `handleUpdateResource`, is created.
    -   This function receives the `id`, `field`, and `newValue` from the `ResourceTable` component.
    -   It updates the application state, which then triggers an asynchronous save to the database via the database service.
    -   This `handleUpdateResource` function is passed as a prop to `<ResourceTable />`.
    -   The existing `IndexedDB` persistence automatically saves the changes whenever the state is updated and the database service is called.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User identifies a cell in the "Context" or "Value" column they wish to edit.
    2.  User clicks the cell. A focus outline appears, and a text cursor is visible.
    3.  User types or pastes new text into the cell.
    4.  User clicks outside the cell (or tabs away) to trigger the `blur` event.
    5.  The focus outline disappears, and the new text is saved to the application state and persisted to the database.
    6.  The user can then proceed to export the updated data.
-   **Visual Design**:
    -   Editable cells have a `cursor-text` style to indicate they are interactive.
    -   When a cell is focused for editing, it receives a distinct outline (`focus:outline-blue-500`) to provide clear visual feedback.
    -   The table headers for editable columns include the word "(Editable)" for discoverability.

## 8. Data Management & Schema

This feature does not introduce a new data schema. It directly modifies the existing `StringResource` objects held in the `resources` state array.

-   **State Management**: Edits trigger a state update in `App.tsx`.
-   **Persistence**: The existing `IndexedDB` persistence feature (documented separately) automatically saves the modified `Project` object, ensuring that edits are not lost between sessions.

## 9. Limitations & Known Issues

-   **Plain Text Only**: Pasting rich text (e.g., from a word processor) may result in the loss of formatting, as the component is designed to handle plain text only. The use of `textContent` helps strip any unwanted HTML tags.
-   **No Undo**: There is no built-in mechanism to undo an edit. Once a user clicks away from a cell, the change is saved. Refreshing the page or re-uploading the original file are the only ways to revert changes.
-   **No Validation**: The application does not validate user input. A user can, for example, delete the entire content of a value, resulting in an empty `<string>` tag upon export.