# Feature Specification Document: Project Management Workspace

## 1. Executive Summary

-   **Feature**: Project Management Workspace via Sidebar
-   **Status**: Implemented
-   **Summary**: This feature fundamentally evolves the application from a single-use utility into a persistent, project-based workspace. It introduces a sidebar that allows users to create, save, load, and delete distinct translation projects. This enables users to manage work across multiple apps (e.g., iOS and Android versions) or sessions without losing their progress.

## 2. Problem Statement & Goals

-   **Problem**: The application was previously stateless, forgetting all user work upon a page refresh or when a new file was uploaded. This forced users to start from scratch in every session, making it impractical for any ongoing translation work. There was no way to manage localization for more than one app at a time.
-   **Goals**:
    -   Transform the application into a stateful workspace where user progress is saved.
    -   Allow users to manage multiple, distinct localization projects simultaneously.
    -   Provide an explicit and intuitive save mechanism to give users control and confidence that their work is persisted.
    -   Eliminate the repetitive need to re-upload the same file for every session.
-   **Success Metrics**:
    -   A user can save their current work as a named project, close the browser, and reload that exact state later.
    -   A user can switch between different projects (e.g., an Android XML project and an iOS `.strings` project) from the sidebar.
    -   The application clearly indicates when a project has unsaved changes and prevents accidental data loss.

## 3. Scope

-   **In Scope:**
    -   A new sidebar UI component to display a list of saved projects.
    -   "New Project" and "Save Project" buttons to manage the project lifecycle.
    -   Functionality to select a project from the list to load it into the main editor view.
    -   Functionality to delete a project from the list.
    -   A "dirty" state indicator to show when the active project has unsaved changes.
    -   Storing all project data in the browser's `IndexedDB`.
-   **Out of Scope:**
    -   Cloud-based synchronization of projects across different devices or browsers.
    -   Advanced project management features like versioning, branching, or merging.
    -   Real-time collaboration or project sharing between users.

## 4. User Stories

-   As a **Developer**, I want to save my translation session as a project so that I can close my browser and continue my work later without having to re-upload and re-translate everything.
-   As a **Cross-Platform Developer**, I want to create separate projects for my Android and iOS apps so I can manage both localization efforts within the same tool.
-   As a **Localization Manager**, I want to see a list of all the apps I'm working on and easily switch between them to make quick edits.

## 5. Acceptance Criteria

-   **Scenario: User creates and saves a new project**
    -   **Given**: A user opens the app with no active project.
    -   **When**: The user clicks "New Project", uploads a file, and makes an edit.
    -   **Then**: The "Save Project" button becomes enabled, and the project in the sidebar shows an indicator for unsaved changes (e.g., an asterisk).
    -   **And**: When the user clicks "Save Project", they are prompted for a name.
    -   **And**: After providing a name, the project is saved, the indicator disappears, and the "Save Project" button becomes disabled.

-   **Scenario: Returning user loads an existing project**
    -   **Given**: A returning user has several projects saved.
    -   **When**: The user clicks on a project in the sidebar list.
    -   **Then**: The main content area populates with the file data, languages, and translations from that specific project.

-   **Scenario: User switches projects with unsaved changes**
    -   **Given**: The user has made unsaved changes to the currently active project.
    -   **When**: The user clicks on a different project in the sidebar.
    -   **Then**: The browser shows a confirmation dialog warning them that their unsaved changes will be lost.
    -   **And**: If they confirm, the application switches to the new project; otherwise, it stays on the current project.

-   **Scenario: User deletes a project**
    -   **Given**: A user is viewing their list of projects.
    -   **When**: The user clicks the delete icon next to a project name and confirms the action.
    -   **Then**: The project is permanently removed from the sidebar list and from `IndexedDB`.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The implementation shifts the data persistence model from a single object to an array of `Project` objects stored in `IndexedDB`. The `App` component is refactored to manage the list of all projects, the ID of the currently active project, and a boolean `isDirty` state. A new `Sidebar` component is introduced to handle the UI and user interactions for project management.
-   **Component Breakdown**:
    -   `App.tsx`: Refactored to hold all project-related state (`projects`, `activeProjectId`, `isDirty`). Contains all the core logic for CRUD (Create, Read, Update, Delete) operations on projects by calling a dedicated database service.
    -   `Sidebar.tsx`: A new presentational component that receives the project list and active state as props and calls back to `App.tsx` when a user interacts with the buttons (New, Save, Select, Delete).
    -   `services/database.ts`: A new module that encapsulates all `IndexedDB` logic.
    -   `NewFileIcon.tsx`, `SaveIcon.tsx`: New icon components for the sidebar actions.
-   **Key Logic**:
    -   A `useEffect` hook now loads the entire array of projects from `IndexedDB` on initial mount.
    -   Data mutations (e.g., `handleUpdateResource`, `handleAddLanguage`) directly call `async` functions from the database service to persist changes. The implicit "save-on-change" `useEffect` hook has been removed in favor of explicit saving.
    -   All state mutations that modify the active project also set the `isDirty` flag to `true`.
    -   Saving a project updates its `lastModified` timestamp and sets `isDirty` to `false`.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  On first load, the user sees an empty project list in the sidebar and a welcome message in the main area.
    2.  User clicks "New". A new "Untitled Project" appears in the sidebar and becomes active. The main area shows the file upload component.
    3.  User uploads a file. The data loads. Any subsequent edit enables the "Save" button.
    4.  User clicks "Save". A prompt asks for a project name. After saving, the project is renamed in the sidebar.
    5.  The user can create more projects or click on existing ones to load them.
-   **Visual Design**: A fixed-width sidebar is added to the left of the screen. It contains a header, action buttons ("New", "Save"), and a scrollable list of projects. The currently active project is visually highlighted. Projects with unsaved changes are marked with an asterisk.
-   **Copywriting**:
    -   Sidebar Header: "Projects"
    -   Empty State: "No projects found. Click 'New' to start."
    -   Unsaved Changes Indicator: `*`

## 8. Data Management & Schema

### 8.1. Storage Key

The data is stored in an `IndexedDB` database.
-   **Database Name**: `mobile-localization-editor-db`

### 8.2. Data Schema

The data is stored in an object store named `projects`, which contains an array of `Project` objects:

```json
[
  {
    "id": "proj_1678886400000",
    "name": "My Awesome App - Android",
    "lastModified": 1678886400000,
    "resources": [
        { "id": "app_name", "context": "...", "values": { "default": "..." } }
    ],
    "fileName": "strings.xml",
    "platform": "android",
    "languages": ["default", "es"]
  },
  {
    "id": "proj_1678886500000",
    "name": "My Awesome App - iOS",
    "lastModified": 1678886500000,
    "resources": [
        { "id": "welcome_message", "context": "...", "values": { "default": "..." } }
    ],
    "fileName": "Localizable.strings",
    "platform": "ios",
    "languages": ["default", "fr"]
  }
]
```

## 9. Limitations & Known Issues

-   **Browser-Scoped Data**: All project data is stored locally in the user's browser. It is not synced across devices or backed up to the cloud, making it vulnerable to data loss if the user clears their browser data.
-   **No Conflict Resolution**: The system does not support collaborative editing or have any mechanism for merging changes if the app were to be opened in two tabs simultaneously. The last-saved state will overwrite any others.