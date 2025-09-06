# Feature Specification Document: IndexedDB Persistence

## 1. Executive Summary

-   **Feature**: IndexedDB Persistence for Application State
-   **Status**: Implemented
-   **Summary**: This feature enhances the Mobile Localization Editor by migrating all application state persistence from the browser's `localStorage` to `IndexedDB`, using the lightweight `idb` wrapper library. This migration addresses the core limitations of `localStorage`, providing a much larger storage capacity and asynchronous, non-blocking database operations. This ensures a reliable and highly performant experience for users with many large projects.

## 2. Problem Statement & Goals

-   **Problem**: The previous persistence model relied on `localStorage`, which is synchronous and has a small storage limit (typically 5-10MB). This posed a significant risk of data loss for users with many projects or very large localization files. Furthermore, synchronous read/write operations could potentially block the main thread and cause UI stuttering.
-   **Goals**:
    -   Migrate all data persistence from `localStorage` to the more robust `IndexedDB` API.
    -   Eliminate the risk of data loss due to storage quota limitations.
    -   Improve UI responsiveness by using asynchronous database operations that do not block the main thread.
    -   Establish a scalable data layer that can support future features more effectively.
-   **Success Metrics**:
    -   A returning user's projects are loaded seamlessly from IndexedDB on application startup.
    -   All changes made to a project (edits, adding languages, renaming) are reliably saved to IndexedDB without blocking the user interface.
    -   The application can handle a significantly larger amount of project data than was possible with `localStorage`.

## 3. Scope

-   **In Scope:**
    -   Integrating the `idb` library to simplify `IndexedDB` interactions.
    -   Creating an abstract database service (`services/database.ts`) to encapsulate all data access logic.
    -   Refactoring `App.tsx` to perform all create, read, update, and delete (CRUD) operations asynchronously against the new database service.
    -   Removing all `localStorage`-related code.
    -   Ensuring all existing project data structures are compatible with `IndexedDB`'s object store.
-   **Out of Scope:**
    -   Syncing state across different browsers or devices.
    -   A migration script to move existing `localStorage` data to `IndexedDB`. (For this implementation, it's a clean switch).
    -   Complex database queries beyond simple key-based lookups and getting all records.

## 4. User Stories

-   As a **User**, I want my projects to be saved reliably without any risk of data loss, no matter how many strings I have or how many projects I create.
-   As a **Power User**, I want the application to remain fast and responsive even when I am working with very large localization files.

## 5. Acceptance Criteria

-   **Scenario: First-time user visits the application**
    -   **Given**: A user opens the application for the first time.
    -   **When**: The application loads.
    -   **Then**: The application initializes a new IndexedDB database in the background.
    -   **And**: After the user creates a new project and uploads a file, the project data is saved to an `IndexedDB` object store.

-   **Scenario: Returning user visits the application**
    -   **Given**: A user has previously created projects.
    -   **When**: The user opens the application in the same browser.
    -   **Then**: The application asynchronously fetches the project list from `IndexedDB` and populates the sidebar.

-   **Scenario: A user edits a project**
    -   **Given**: A user is viewing a project.
    -   **When**: The user edits a string value in the table.
    -   **Then**: The change is sent to the database service and saved to `IndexedDB` in the background, without freezing the UI.

-   **Scenario: Application encounters a database error**
    -   **Given**: The `IndexedDB` database is in a corrupted state or cannot be accessed.
    -   **When**: A user opens the application.
    -   **Then**: The application catches the error, displays an informative message to the user, and loads into a safe empty state.

## 6. Technical Design & Implementation (As-Is State)

-   **`idb` Library**: The `idb` library has been added to the project to provide a simple, `Promise`-based API for `IndexedDB`.
-   **`services/database.ts`**: A new service module was created to manage all database interactions.
    -   It handles opening the database, defining the schema in an `upgrade` callback (creating a `projects` object store), and versioning.
    -   It exports async functions: `getAllProjects()`, `saveProject(project)`, and `deleteProject(id)`.
-   **`App.tsx`**:
    -   The `useEffect` hook that previously loaded from `localStorage` has been rewritten to be `async` and call `getAllProjects()` on mount.
    -   The `useEffect` hook that automatically saved the entire `projects` array on every change has been **removed**.
    -   All handler functions that mutate data (`handleNewProject`, `handleSaveProject`, `handleDeleteProject`, `handleRenameProject`, and the helper `updateActiveProject`) have been updated to call the appropriate `async` database service function to explicitly persist each change. This makes saving more granular and predictable.

## 7. UI/UX Flow & Requirements

-   **User Flow**: The user experience remains largely the same, but with improved performance and reliability. The change is primarily architectural.
    -   Data loads on startup.
    -   Changes are saved automatically in the background as they are made.
    -   The "Save" button's primary role is to name a new project and clear the "dirty" state, not to perform the only save action.
-   **Visual Design**: No direct UI changes. The feature is a backend/architectural improvement.

## 8. Data Management & Schema

This feature relies on the client-side `IndexedDB` API.

### 8.1. Database and Store

-   **Database Name**: `mobile-localization-editor-db`
-   **Object Store Name**: `projects`

### 8.2. Data Schema

The `projects` object store holds `Project` objects.
-   **`keyPath`**: The `id` property of the `Project` object is used as the unique key for the store.
-   **Indexes**: An index on the `lastModified` property is created to allow for efficient, sorted retrieval of projects.

The `Project` object schema remains the same as before:
```json
{
  "id": "proj_1678886400000",
  "name": "My Awesome App - Android",
  "lastModified": 1678886400000,
  "resources": [...],
  "fileName": "strings.xml",
  "platform": "android",
  "languages": ["default", "es"]
}
```

### 8.3. Limitations & Considerations

-   **Data Scope**: The data is scoped to the user's browser profile and the site's origin. It will not be available in a different browser, on a different device, or in most incognito/private browsing modes.
-   **Security**: `IndexedDB` is not an encrypted or secure storage mechanism for highly sensitive data. As this application handles non-sensitive string resource files, this is an acceptable implementation.