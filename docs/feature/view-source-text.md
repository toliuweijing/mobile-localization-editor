# Feature Specification Document: View Source Text

## 1. Executive Summary

-   **Feature**: View Source Text
-   **Status**: Implemented
-   **Summary**: This feature introduces the ability for users to view the original, raw text block (e.g., XML or `.strings` format) for each string resource directly from the table view. Displayed in a modal, this read-only view provides maximum context, including original comments and formatting tags, helping to ensure the highest degree of accuracy during translation and editing.

## 2. Problem Statement & Goals

-   **Problem**: The application's table view provides a simplified, parsed representation of string resources. While clean and user-friendly, this simplification can hide crucial details from the original file, such as formatting tags (`<b>`, `%1$s`), non-translatable parts, or the exact structure of a multi-line comment. Translators and developers often need access to this "source of truth" to make fully informed decisions.
-   **Goals**:
    -   Goal 1: Provide a simple, one-click method for users to view the original source text for any given string resource.
    -   Goal 2: Increase user confidence and translation accuracy by revealing the complete context.
    -   Goal 3: Gracefully handle complex or unsupported resource types (like `<plurals>` or `<string-array>`) by allowing users to at least *see* the original block, even if it cannot be edited in the table.
-   **Success Metrics**:
    -   A user can click an icon in any table row and successfully view a modal containing the exact text block from the originally uploaded file.
    -   The feature is easily discoverable during interaction with the table but does not add significant clutter to the primary UI.

## 3. Scope

-   **In Scope:**
    -   Updating the file parsers (`.xml` and `.strings`) to capture the raw source text for each resource during the initial import.
    -   Adding a `sourceText` field to the `StringResource` data model to store this captured text.
    -   Implementing a UI element (e.g., an icon button) in each table row to trigger the source view.
    -   Creating a modal dialog component to display the read-only source text in a clear, formatted way.
-   **Out of Scope:**
    -   Editing the source text directly within the source view modal. The view is strictly read-only.
    -   Advanced syntax highlighting within the modal (the initial version will present it as pre-formatted plain text).
    -   Real-time mapping of edits made in the table back to the text displayed in the source view modal. The modal will always show the *original* imported text.

## 4. User Stories

-   As a **Translator**, I want to see the original XML or `.strings` entry for a resource so that I can correctly handle any embedded formatting tags, placeholders, or other syntax that might not be visible in the simplified table cell.
-   As a **Developer**, I want to quickly verify how the application parsed a specific entry, including its associated comment, so that I can trust the data presented in the table and diagnose any potential parsing discrepancies.
-   As a **Localization Manager**, I want to view the source of a string that failed to parse correctly (e.g., a `<plurals>` tag) so I can understand why it doesn't appear in the table.

## 5. Acceptance Criteria

-   **Scenario: User views the source for a resource**
    -   **Given**: A user has successfully uploaded a file and is viewing the resource table.
    -   **When**: The user hovers over a table row and clicks the "View Source" icon.
    -   **Then**: A modal dialog appears, overlaying the page.
    -   **And**: The modal displays the exact, original text block (including any preceding comments and the resource tag itself) for that specific string resource as it appeared in the uploaded file.
    -   **And**: The user can close the modal to return to the table view.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The implementation involves capturing more data during the parsing stage and then creating a new UI flow to display it on demand.
-   **Component Breakdown**:
    -   `types.ts`: The `StringResource` interface is updated to include a new field: `sourceText: string;`.
    -   `App.tsx`:
        -   The `parseXmlContent` function is modified to capture the preceding comment node and the `outerHTML` of the `<string>` element together.
        -   The `parseIosStringsContent` function is modified to capture the entire matched text from its regular expression (i.e., `match[0]`) which includes the comment, key, and value.
        -   This captured text is stored in the `sourceText` field of the `StringResource` object.
    -   `ResourceTable.tsx`:
        -   The component manages a new state, `const [selectedResource, setSelectedResource] = useState<StringResource | null>(null);`, to track which resource's source is being viewed.
        -   A new `<button>` with a code icon (`<>`) is added to each table row. It is hidden by default and appears on row hover for a cleaner UI.
        -   The `onClick` handler for this button sets the `selectedResource` state to the resource for that row.
        -   The component renders a new `<SourceViewModal />`, passing it the `selectedResource` and a function to set the state back to `null` as props.
    -   `components/SourceViewModal.tsx`: A new modal component was created. It receives a `resource` prop. If the `resource` is not null, it will render a modal UI displaying the `resource.sourceText` inside a `<pre><code>` block.
    -   `components/icons/CodeIcon.tsx`: A new icon component for the view source button.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User hovers over a row in the resource table.
    2.  A small, subtle "code" icon (`<>`) appears near the String ID.
    3.  User clicks the icon.
    4.  A modal dialog opens, dimming the background.
    5.  The modal displays a title (e.g., "Source for: `app_name`") and a read-only code block containing the original source text.
    6.  User clicks a "Close" button or clicks the dimmed overlay area to dismiss the modal and return to the table.
-   **Visual Design**: The trigger icon is styled to be unobtrusive, appearing only on hover to avoid visual clutter. The modal is clean, centered, and professional, with a clear separation between the header, content, and action areas.

## 8. Data Management & Schema

### 8.1. Data Source

The data is derived directly from the content of the user-uploaded file during the parsing stage.

### 8.2. Data Schema

The `sourceText` field will become part of the `StringResource` object. This means it will be included in the `Project` object stored in `IndexedDB`.

```json
{
  "id": "app_name",
  "context": "The main application name",
  "values": { "default": "My App" },
  "sourceText": "<!-- The main application name -->\n    <string name=\"app_name\">My App</string>"
}
```

### 8.3. Persistence

The `sourceText` for every resource will be persisted in `IndexedDB` as part of the overall project data. This ensures the feature works for returning users loading saved projects.

## 9. Limitations & Known Issues

-   **Increased Storage Usage**: Storing the original source text for every single resource will increase the storage footprint of the application state in `IndexedDB`. For the vast majority of localization files, this increase will be negligible and will not impact performance. However, for exceptionally large files (tens of thousands of strings), it could be a consideration.
-   **Read-Only**: To reiterate, the view is strictly for reference. It provides context for edits made in the table but is not an editor itself.