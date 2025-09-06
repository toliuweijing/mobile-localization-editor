# Feature Specification Document: AI-Powered Translation

## 1. Executive Summary

-   **Feature**: AI-Powered Translation for Language Columns
-   **Status**: Implemented
-   **Summary**: This feature integrates a generative AI model (Gemini) to provide one-click, automated translations for entire language columns. It adds an "AI Translate" button to each language column, allowing users to populate all string translations for that language instantly. This significantly accelerates the localization process, reduces manual effort, and transforms the application into a powerful, semi-automated translation management tool.

## 2. Problem Statement & Goals

-   **Problem**: Manually translating hundreds of string resources is a time-consuming, tedious, and repetitive task. While the application provides the interface for managing translations, the act of translating itself remains a major bottleneck. This manual process is also prone to human error and can be costly if professional translators are required for every minor string.
-   **Goals**:
    -   Provide a near-instant, automated way to translate all string resources into a specified language.
    -   Drastically reduce the time and effort required for the initial translation pass.
    -   Leverage generative AI to provide high-quality "first draft" translations that users can then review and refine.
    -   Ensure the AI correctly handles and preserves special Android formatting placeholders (e.g., `%1$s`), which is a critical technical requirement.
-   **Success Metrics**:
    -   A user can successfully populate an entire language column with AI-generated translations with a single click.
    -   The generated translations accurately reflect the meaning of the source text.
    -   Formatting placeholders within the translated strings are preserved without modification.
    -   The feature provides clear loading and error feedback to the user.

## 3. Scope

-   **In Scope:**
    -   Adding an "AI Translate" button to the header of each translation column in the resource table.
    -   Integrating the `@google/genai` SDK to communicate with the Gemini model.
    -   Crafting a specific prompt that instructs the AI to translate Android strings, preserve placeholders, and return data in a structured JSON format.
    -   Implementing a confirmation dialog to prevent accidental overwrites of existing translations.
    -   Displaying a loading indicator during the API call to provide user feedback.
    -   Handling potential API errors gracefully and notifying the user.
    -   Updating the application state with the returned translations.
-   **Out of Scope:**
    -   Translating strings one-by-one (the feature operates on the entire column at once).
    -   Providing multiple translation suggestions for a single string.
    -   Tracking which strings were translated by AI versus manually entered.
    -   Allowing users to customize the AI model or the prompt.

## 4. User Stories

-   As a **Developer**, I want to click a button to automatically translate all my strings into Spanish so I can quickly get a baseline translation for a new market without spending hours on manual translation.
-   As a **Product Manager**, I want to use the AI feature to generate placeholder translations for a new language so I can test the app's UI layout with realistic text before the professional translations are ready.
-   As a **Localization Manager**, I want to generate a complete set of translations with AI and then review and correct them in the table, saving me from the initial effort of translating from scratch.

## 5. Acceptance Criteria

-   **Scenario: User performs an AI translation on an empty column**
    -   **Given**: A user has added a new language column (e.g., 'fr') that is currently empty.
    -   **When**: The user clicks the sparkle icon in the 'fr' column header and confirms the action.
    -   **Then**: A loading spinner appears in place of the icon.
    -   **And**: After a short period, the cells in the 'fr' column are populated with French translations of the default strings.
    -   **And**: Any string that contained a placeholder (e.g., "Welcome, %1$s!") has its translation also contain the exact same placeholder (e.g., "Bienvenue, %1$s!").

-   **Scenario: User performs an AI translation on a partially filled column**
    -   **Given**: A user has a language column with some manual translations already entered.
    -   **When**: The user clicks the AI Translate button for that column and confirms the action.
    -   **Then**: The AI-generated translations overwrite all existing text in that column.

-   **Scenario: AI translation fails**
    -   **Given**: A user attempts to perform an AI translation.
    -   **When**: The API call to the Gemini model fails due to a network error or API key issue.
    -   **Then**: The loading spinner disappears, and the user is shown an alert message indicating that the translation failed.
    -   **And**: The existing data in the column remains unchanged.

## 6. Technical Design & Implementation

-   **High-Level Approach**: The feature is implemented by creating a client-side handler that calls the Gemini API. The key to success is leveraging the model's JSON mode for reliable, structured data return and crafting a detailed prompt to ensure translation quality and placeholder preservation.
-   **Component Breakdown**:
    -   `App.tsx`:
        -   A new state, `aiTranslating: { [langCode: string]: boolean }`, is added to manage the loading state on a per-language basis.
        -   A new handler, `handleAiTranslate`, is created. This `async` function:
            1.  Shows a `window.confirm` dialog.
            2.  Sets the loading state for the target language to `true`.
            3.  Initializes the `GoogleGenAI` client.
            4.  Constructs a prompt containing the strings to translate and specific instructions.
            5.  Calls `ai.models.generateContent` with a `responseSchema` to enforce a JSON array output.
            6.  On success, parses the JSON response, creates a `Map` of ID-to-translation for efficient lookup, and updates the main `resources` state.
            7.  Uses a `try...catch...finally` block to handle errors and ensure the loading state is always set back to `false`.
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
    4.  A browser confirmation dialog appears: "This will use AI to translate all strings... Existing translations... will be overwritten. Do you want to proceed?"
    5.  User clicks "OK".
    6.  The sparkle icon changes to a spinning loader.
    7.  After the API call completes, the loader reverts to a sparkle icon, and the cells in the "Value (de)" column are filled with the new German translations.
-   **Visual Design**: The new button is small and integrated directly into the column header, styled to match the existing "Remove Language" button for a cohesive look. The purple hover effect distinguishes it as a special "AI" action.
-   **Copywriting**: The confirmation dialog text clearly explains that the action is destructive and will overwrite existing translations.

## 8. Data Management & Schema

### 8.1. Data Source

The primary data source is the application's in-memory state, specifically the array of `StringResource` objects. The default values (`values.default`) are sent to the Google Gemini API, which acts as the source for the translated text.

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

The newly fetched translations are stored in the main `resources` state by updating the `values` object for each `StringResource`. This state is automatically persisted to `localStorage` by the existing persistence mechanism, ensuring AI translations are saved across sessions.

## 9. Limitations & Known Issues

-   **Translation Quality**: AI-generated translations are intended as a "first draft" and may contain inaccuracies, cultural insensitivities, or grammatical errors. They should always be reviewed by a human, preferably a native speaker, before being used in production.
-   **API Dependency**: The feature is entirely dependent on the Google Gemini API. It requires a valid API key, an active internet connection, and is subject to the API's availability and rate limits.
-   **Contextual Awareness**: The AI translates each string in isolation. It may miss broader contextual cues from the application's UI or purpose that a human translator would naturally understand, potentially leading to mistranslations for ambiguous terms.
-   **Potential Cost**: Use of the Gemini API may incur costs based on the volume of text processed. This should be considered before performing large-scale translations.
-   **Placeholder Integrity**: While the prompt is engineered to preserve formatting placeholders, there is a small risk that very complex or non-standard placeholders could be misinterpreted or altered by the AI model.