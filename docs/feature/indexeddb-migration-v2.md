# Feature Specification Document: IndexedDB Schema Migration (v2) - Data Separation

## 1. Executive Summary

-   **Feature**: IndexedDB Schema Migration (v2) - Data Separation
-   **Status**: Planned
-   **Summary**: This document proposes a schema migration for the application's IndexedDB database from version 1 to 2. The migration will separate project metadata (name, last modified date, etc.) from the large `resources` data array into two distinct object stores. This architectural enhancement will significantly improve initial application load time and reduce memory consumption by loading only the lightweight project metadata for the sidebar, fetching the full resource data on-demand only when a project is selected.

## 2. Problem Statement & Goals

-   **Problem**: Currently, loading the project list for the sidebar requires fetching *all* data for *every* project from the `projects` IndexedDB store. This includes the `resources` array, which can contain thousands of objects and be several megabytes in size per project. As users create more projects or work with larger localization files, the initial application load time will degrade, and memory usage will increase unnecessarily, leading to a sluggish and unresponsive user experience.
-   **Goals**:
    -   Goal 1: Drastically improve the perceived initial load time of the application.
    -   Goal 2: Reduce the application's memory footprint on startup.
    -   Goal 3: Establish a more scalable and performant database architecture that can support future growth.
    -   Goal 4: Perform a seamless, backward-compatible data migration for existing users without any data loss.
-   **Success Metrics**:
    -   A measurable decrease in the time from application start to the project list being fully rendered in the sidebar.
    -   The initial data fetch on application load will only transfer lightweight metadata objects, not the full project data.
    -   Existing user data from v1 of the database is successfully migrated to the new v2 schema, verified by the user's projects being fully intact and functional.

## 3. Scope

-   **In Scope:**
    -   Incrementing the IndexedDB database version from 1 to 2.
    -   Writing a migration script within the `onupgradeneeded` callback of the `idb` `openDB` function.
    -   The migration script will create two new object stores: `projects_meta` and `projects_data`.
    -   The script will iterate through all records in the old `projects` store, split each record into a "meta" and a "data" part, and insert them into the new respective stores.
    -   The old `projects` store will be deleted upon successful migration.
    -   Refactoring the `services/database.ts` module to support the new schema (e.g., `getAllProjectMeta()`, `getProjectData(id)`).
    -   Updating the `App.tsx` component to adopt the new data fetching pattern: fetch all metadata on load, then fetch a single project's data when it's selected.
-   **Out of Scope:**
    -   Any significant UI changes. The change should be architecturally transparent to the user.
    -   Further database optimizations beyond this data separation (e.g., adding more complex indexes).
    -   A UI for the user to manually trigger or monitor the migration. It must be automatic and silent.

## 4. User Stories

-   As a **Power User** with many large projects, I want the application to load instantly so that I can quickly select a project without waiting for all my data to be loaded into memory.
-   As a **Developer**, I want a scalable data architecture so that I can be confident in the application's performance as we add more features and attract more users.

## 5. Acceptance Criteria

-   **Scenario: An existing user opens the updated application for the first time**
    -   **Given**: A user has project data stored in the v1 database schema (`projects` object store).
    -   **When**: They open the new version of the application.
    -   **Then**: The `onupgradeneeded` event fires, and the migration script runs silently in the background.
    -   **And**: The user's project list is correctly and quickly displayed in the sidebar.
    -   **And**: When the user clicks a project, its resource data loads correctly into the main view.
    -   **And**: The user can successfully create, edit, and delete projects, confirming that the new data layer is fully functional.
    -   **And**: No user data is lost during the migration process.

## 6. Technical Design & Implementation

-   **`services/database.ts`**:
    -   The `DB_VERSION` constant will be incremented from `1` to `2`.
    -   The `openDB` `upgrade` callback will contain the migration logic, guarded by `if (oldVersion < 2)`.
    -   **Migration Logic**:
        1.  Create two new `IDBObjectStore`s: `projects_meta` (keyPath: `id`) and `projects_data` (keyPath: `projectId`).
        2.  Get a cursor to iterate over all objects in the existing `projects` store.
        3.  For each `project` object, create two new objects:
            -   `meta`: Contains all properties *except* `resources`.
            -   `data`: Contains `projectId: project.id` and the `resources` array.
        4.  Put the `meta` object into the `projects_meta` store and the `data` object into the `projects_data` store.
        5.  After the cursor completes, delete the old `projects` object store using `db.deleteObjectStore('projects')`.
    -   **Service Methods Refactoring**:
        -   `getAllProjects()` will become `getAllProjectMeta()`.
        -   A new `getProjectResources(projectId: string)` method will be created.
        -   `saveProject(project)` will be refactored to take both parts and perform two `put` operations in a transaction.
        -   `deleteProject(id)` will be updated to delete from both `projects_meta` and `projects_data` in a transaction.
-   **`App.tsx`**:
    -   The `Project` type will be split into `ProjectMeta` and `ProjectResources`.
    -   The main `projects` state will now hold `ProjectMeta[]`.
    -   When a project is selected via `handleSelectProject`, it will trigger an async call to `getProjectResources` and store the result in a new state (e.g., `activeProjectResources`).

## 7. UI/UX Flow & Requirements

-   **User Flow**: The change should be completely transparent to the user.
    -   The only noticeable effect should be a positive one: a significantly faster initial load time.
    -   There are no new UI elements or interactions associated with this change.
-   **Visual Design**: No changes.

## 8. Data Management & Schema

### 8.1. Data Source

The data is sourced from the user's existing IndexedDB database and transformed in place.

### 8.2. New Data Schema (Version 2)

-   **Object Store 1: `projects_meta`**
    -   **Purpose**: Stores lightweight project metadata for fast loading.
    -   **`keyPath`**: `id`
    -   **Schema**:
        ```json
        {
          "id": "proj_1678886400000",
          "name": "My Awesome App - Android",
          "lastModified": 1678886400000,
          "fileName": "strings.xml",
          "platform": "android",
          "languages": ["default", "es"]
        }
        ```

-   **Object Store 2: `projects_data`**
    -   **Purpose**: Stores the heavy resource data, fetched on demand.
    -   **`keyPath`**: `projectId`
    -   **Schema**:
        ```json
        {
          "projectId": "proj_1678886400000",
          "resources": [
            { "id": "app_name", "context": "...", "values": { "default": "..." }, "sourceText": "..." }
          ]
        }
        ```

## 9. Limitations & Known Issues

-   **One-Time Migration Delay**: The migration script runs as a blocking operation during the initial database connection. For a user with an exceptionally large amount of stored data (many gigabytes), this could cause a noticeable, one-time delay on the very first application load after the update is deployed. This is a standard and acceptable trade-off for significant long-term performance gains.
-   **Transactional Integrity**: The migration must be performed within a single transaction to ensure that if any step fails, the entire process is rolled back, preventing a partially migrated, corrupted database state. The `idb` library's `upgrade` callback handles this automatically.