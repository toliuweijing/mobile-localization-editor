# Feature Specification Document: AI-Powered Translation

## 1. Executive Summary

-   **Feature**: AI-Powered Translation for Language Columns
-   **Status**: Implemented
-   **Summary**: This feature integrates a generative AI model (Gemini) to provide one-click, automated translations to fill in **empty** values for language columns, while preserving any manually entered translations. It adds an "AI Translate" button to each language column, allowing users to populate all missing string translations for that language instantly. This significantly accelerates the localization process, reduces manual effort, and enables a powerful, collaborative workflow between human translators and AI.

## 2. Problem Statement & Goals

-   **Problem**: Manually translating hundreds of string resources is a time-consuming, tedious, and repetitive task. While the application provides the interface for managing translations, the act of translating itself remains a major bottleneck. This manual process is also prone to human error and can be costly if professional translators are required for every minor string.
-   **Goals**:
    -   Provide a near-instant, automated way to translate all **empty** string resources into a specified language.
    -   Drastically reduce the time and effort required for the initial translation pass.
    -   Leverage generative AI to provide high-quality "first draft" translations that users can then review and refine.
    -   **Preserve manual translations**, allowing for a hybrid workflow where human editors and AI can collaborate effectively.
    -   Ensure the AI correctly handles and preserves special formatting placeholders (e.g., `%1$s`, `%@`), which is a critical technical requirement.
-   **Success Metrics**:
    -   A user can successfully populate an entire language column with AI-generated translations with a single click, without overwriting existing work.
    -   The generated translations accurately reflect the meaning of the source text.
    -   Formatting placeholders within the translated strings are preserved without modification.
    -   The feature provides clear loading and error feedback to the user.

## 3. Scope

-   **In Scope:**
    -   Adding an "AI Translate" button to the header of each translation column in the resource table.
    -   Logic to filter for and send **only empty-valued strings** to the translation API.
    -   Integrating the `@google/genai` SDK to communicate with the Gemini model.
    -   Crafting a specific prompt that instructs the AI to translate strings, preserve placeholders, and return data in a structured JSON format.
    -   Implementing a confirmation dialog that informs the user of the number of strings to be filled and clarifies that existing work will be preserved.
    -   Displaying a loading indicator during the API call to provide user feedback.
    -   Handling potential API errors gracefully and notifying the user.
    -   Updating the application state with the returned translations.
-   **Out of Scope:**
    -   Translating strings one-by-one (the feature operates on all empty cells in a column at once).
    -   Providing multiple translation suggestions for a single string.
    -   Tracking which strings were translated by AI versus manually entered.
    -   Allowing users to customize the AI model or the prompt.
    -   A "force re-translate" option to overwrite existing translations.

## 4. User Stories

-   As a **Developer**, I want to click a button to automatically fill in all missing translations for Spanish so I can quickly get a baseline for a new market without spending hours on manual translation.
-   As a **Product Manager**, I want to use the AI feature to generate placeholder translations for a new language so I can test the app's UI layout with realistic text before the professional translations are ready.
-   As a **Localization Manager**, I want to manually translate a few critical, nuanced strings, and then use AI to generate the rest, saving me from the initial effort of translating everything from scratch.

## 5. Acceptance Criteria

-   **Scenario: User performs an AI translation on an empty column**
    -   **Given**: A user has added a new language column (e.g., 'fr') that is currently empty, for a project with 50 strings.
    -   **When**: The user clicks the sparkle icon in the 'fr' column header and confirms the action in a dialog that says it will translate "50 empty strings".
    -   **Then**: A loading spinner appears in place of the icon.
    -   **And**: After a short period, the cells in the 'fr' column are populated with French translations of the default strings.
    -   **And**: Any string that contained a placeholder (e.g., "Welcome, %1$s!") has its translation also contain the exact same placeholder (e.g., "Bienvenue, %1$s!").

-   **Scenario: AI translation preserves existing work in a partially filled column**
    -   **Given**: A user has a language column with some manual translations already entered and other cells that are empty.
    -   **When**: The user clicks the AI Translate button for that column and confirms the action.
    -   **Then**: Only the empty cells are populated with AI-generated translations.
    -   **And**: The cells that already contained manual translations remain completely unchanged.

-   **Scenario: AI translation fails**
    -   **Given**: A user attempts to perform an AI translation.
    -   **When**: The API call to the Gemini model fails due to a network error or API key issue.
    -   **Then**: The loading spinner disappears, and the user is shown an alert message indicating that the translation failed.
    -   **And**: The existing data in the column remains unchanged.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The feature is implemented by creating a client-side handler that calls the Gemini API. The key to success is filtering the data *before* the API call to ensure only necessary work is done, leveraging the model's JSON mode for reliable, structured data return, and crafting a detailed prompt to ensure translation quality and placeholder preservation.
-   **Component Breakdown**:
    -   `App.tsx`:
        -   A new state, `aiTranslating: { [langCode: string]: boolean }`, is added to manage the loading state on a per-language basis.
        -   The `handleAiTranslate` `async` function is implemented to:
            1.  **Filter** the project's resources to create an array of strings that have an empty or null value for the `targetLangCode`.
            2.  If the filtered array is empty, show an alert and exit.
            3.  Show a `window.confirm` dialog that now includes the **count** of strings to be translated and clarifies that existing translations will be preserved.
            4.  Set the loading state for the target language to `true`.
            5.  Initialize the `GoogleGenAI` client.
            6.  Construct a prompt containing **only the filtered list** of strings to translate and specific instructions.
            7.  Call `ai.models.generateContent` with a `responseSchema` to enforce a JSON array output.
            8.  On success, parse the JSON response, create a `Map` of ID-to-translation for efficient lookup, and update the main `resources` state.
            9.  Use a `try...catch...finally` block to handle errors and ensure the loading state is always set back to `false`.
    -   `ResourceTable.tsx`:
        -   The component now accepts `onAiTranslate` and `aiTranslating` as props.
        -   The table header for each language conditionally renders an "AI Translate" button.
        -   The button displays either a `SparkleIcon` or a `LoaderIcon` based on the `aiTranslating` state for that language and is disabled during the request.
    -   `components/icons/SparkleIcon.tsx` and `components/icons/LoaderIcon.tsx`: New SVG icon components are created for the UI.

## 7. UI/UX Flow & Requirements

-   **User Flow**:
    1.  User has a table with a default language and at least one added translation language (e.g., 'de').
    2.  User locates the header for the "Value (de)" column.
    3.  User clicks the sparkle icon button in the header.
    4.  A browser confirmation dialog appears: "This will use AI to translate [X] empty strings from 'default' to 'de'. Existing translations will be preserved. Do you want to proceed?"
    5.  User clicks "OK".
    6.  The sparkle icon changes to a spinning loader.
    7.  After the API call completes, the loader reverts to a sparkle icon, and the previously empty cells in the "Value (de)" column are filled with the new German translations.
-   **Visual Design**: The new button is small and integrated directly into the column header, styled to match the existing "Remove Language" button for a cohesive look. The purple hover effect distinguishes it as a special "AI" action.
-   **Copywriting**: The confirmation dialog text clearly explains the action is non-destructive and quantifies the number of strings that will be affected.

## 8. Data Management & Schema

### 8.1. Data Source

The primary data source is the application's in-memory state, specifically the array of `StringResource` objects. The default values (`values.default`) of strings with empty translations are sent to the Google Gemini API, which acts as the source for the translated text.

### 8.2. Data Schema

This feature does not introduce a new internal data schema but relies on structured data for its API communication.

-   **API Request Payload**: The data sent to the Gemini API is a JSON string representing an array of objects:
    ```json
    [{ "id": "string_id", "value": "string_value_to_translate" }, ...]
    ```
-   **API Response Payload**: The expected response, enforced by a `responseSchema`, is a JSON string with a similar structure:
    ```json
    [{ "id": "string_id", "translation": "translated_value" }, ...]
    ```

### 8.3. Persistence

The newly fetched translations are stored in the main `resources` state by updating the `values` object for each `StringResource`. This state is automatically persisted to `IndexedDB` by the existing persistence mechanism, ensuring AI translations are saved across sessions.

## 9. Limitations & Known Issues

-   **Translation Quality**: AI-generated translations are intended as a "first draft" and may contain inaccuracies, cultural insensitivities, or grammatical errors. They should always be reviewed by a human, preferably a native speaker, before being used in production.
-   **API Dependency**: The feature is entirely dependent on the Google Gemini API. It requires a valid API key, an active internet connection, and is subject to the API's availability and rate limits.
-   **Contextual Awareness**: The AI translates each string in isolation. It may miss broader contextual cues from the application's UI or purpose that a human translator would naturally understand, potentially leading to mistranslations for ambiguous terms.
-   **Potential Cost**: Use of the Gemini API may incur costs based on the volume of text processed. This should be considered before performing large-scale translations.
-   **Placeholder Integrity**: While the prompt is engineered to preserve formatting placeholders, there is a small risk that very complex or non-standard placeholders could be misinterpreted or altered by the AI model.
-   **No 'Force Re-translate' Option**: The feature is designed to be non-destructive. If a user wishes to re-translate an entire column (including strings that already have a translation), they must first manually clear the values they want to overwrite. There is no one-click option to force a full re-translation.
