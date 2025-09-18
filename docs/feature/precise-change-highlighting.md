# Feature Specification Document: Precise Change Highlighting

## 1. Executive Summary

-   **Feature**: Precise Change Highlighting in Resource Table
-   **Status**: Implemented
-   **Summary**: This feature enhances the file update review process by replacing the full-row-only highlighting with a hybrid approach. A subtle background color is applied to the entire row of an updated resource for discoverability, while a stronger, more distinct highlight is applied specifically to the cells (context or value) that have actually changed. This provides users with immediate, at-a-glance precision about what was modified.

## 2. Problem Statement & Goals

-   **Problem**: Highlighting the entire row for any updated string is ambiguous and creates high cognitive load. Users have to manually scan and compare values to determine if the context, the default value, or a specific translation was changed. This creates visual noise, especially when many strings are updated at once.
-   **Goals**:
    -   Improve the clarity and precision of the change review process in the main table.
    -   Reduce visual clutter and the user effort required to identify specific changes.
    -   Provide immediate visual feedback on the exact scope of an update (i.e., which fields were affected).
-   **Success Metrics**:
    -   Users can identify the specific cells that have changed within an updated row without needing to read and compare the text.
    -   User feedback indicates the new highlighting system is clearer and more efficient for reviewing updates post-merge.

## 3. Scope

-   **In Scope:**
    -   Updating the `StringResource` data model to track which specific fields (`context` or language values) have changed.
    -   Modifying the file update comparison logic to populate this new data.
    -   Implementing a hybrid rendering strategy in the `ResourceTable`:
        -   A subtle background color on the `<tr>` for any updated item.
        -   A stronger background color on the specific `<td>` cells that contain new data.
    -   Ensuring the "Acknowledge Change" feature correctly clears this new detailed status.
-   **Out of Scope:**
    -   A character-by-character "diff" view within the cell (this is handled by the Merge Review modal, not the main table).
    -   Allowing users to configure the highlight colors.

## 4. User Stories

-   As a **Developer**, I want to see exactly which translation was updated in a file merge, so I can quickly verify the changes without having to compare every column.
-   As a **Localization Manager**, I want the UI to pinpoint the exact changes in a file update from my translation team, so I can review their work more efficiently and with greater accuracy.

## 5. Acceptance Criteria

-   **Scenario: A string's context is updated**
    -   **Given**: A user updates a project from a source file where only the context/comment for string `str1` has changed.
    -   **When**: The user views the resource table after applying the merge.
    -   **Then**: The entire row for `str1` has a subtle yellow background.
    -   **And**: Only the "Context" cell for `str1` has a stronger, more prominent yellow background. The value cells are not specially highlighted.

-   **Scenario: A specific translation value is updated**
    -   **Given**: A user updates a project from a spreadsheet where only the Spanish ('es') value for `str1` has changed.
    -   **When**: The user views the resource table after applying the merge.
    -   **Then**: The entire row for `str1` has a subtle yellow background.
    -   **And**: Only the "Value (es)" cell for `str1` has a stronger yellow background. The "Context" and other language value cells are not specially highlighted.

## 6. Technical Design & Implementation

-   `types.ts`: The `StringResource.status` object is enhanced to include an optional `updatedFields` array of strings (e.g., `['context', 'es']`).
-   `App.tsx`: The `handleApplyMerge` function is modified. When processing an update, it now identifies which specific fields have changed (context or value languages) and populates the `status.updatedFields` array for that `StringResource`.
-   `components/ResourceTable.tsx`: The component's rendering logic is updated.
    -   It applies a base highlight class (`bg-yellow-50 dark:bg-yellow-900/30`) to the `<tr>` if `resource.status.type === 'updated'`.
    -   Within the row, it checks the `resource.status.updatedFields` array. If the array contains 'context', a stronger highlight class is applied to the context `<td>`. If it contains a language code, the stronger highlight is applied to that language's value `<td>`.

## 7. UI/UX Flow & Requirements

-   **User Flow**: The change is integrated into the existing file update workflow. After a user applies changes from the Merge Review modal, the main table view will automatically render with the new highlighting.
-   **Visual Design**:
    -   **Row Highlight**: A subtle, light yellow (`bg-yellow-50 dark:bg-yellow-900/30`).
    -   **Cell Highlight**: A stronger, more saturated yellow (`bg-yellow-100 dark:bg-yellow-800/50`).
    -   The highlighting is transient and is removed when the user clicks the "Acknowledge Change" checkmark icon for that row.

## 8. Data Management & Schema

### 8.1. Data Schema

The `StringResource` schema is updated to include the `status.updatedFields` property. This is persisted to `IndexedDB` as part of the `Project` object.
```json
{
  "id": "app_name",
  "context": "The main app name",
  "values": { "default": "My App", "es": "Mi App" },
  "sourceText": "...",
  "status": {
    "type": "updated",
    "updatedFields": ["es"]
  }
}
```

### 8.2. Persistence

The new detailed status is generated during the file merge process and is cleared when the user acknowledges the change. It is saved to `IndexedDB` with the rest of the project data.

## 9. Limitations & Known Issues

-   **Merge-Only Highlighting**: The cell-specific highlighting is based on the state at the time of the merge. If a user manually edits a cell after a merge, the cell-specific highlight will not appear. The highlighting only reflects changes from the file update process.