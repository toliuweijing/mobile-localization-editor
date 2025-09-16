# Mobile Localization Editor

> A modern, offline-first, AI-powered localization editor for Android and iOS projects.

<img width="1452" height="782" alt="Screenshot 2025-09-07 at 07 28 12" src="https://github.com/user-attachments/assets/9f8b7e31-cb98-4e70-b0f6-c1c5f4ff70d6" />

A web-based tool designed to streamline the painful process of managing localization files. Import your `strings.xml` (Android) or `.strings` (iOS) files, edit them in a clean table-based UI, add translations with AI assistance, and export them back, ready for your mobile project.

---

## 🚨 Important Note (Alpha v0.1)

This project is currently in an early alpha stage. The initial focus was on building a robust workflow for **Android (`strings.xml`) first**, with iOS support added subsequently. While both platforms are supported, there may be bugs or rough edges.

|AI-Powered Translation|
|-|
|![output](https://github.com/user-attachments/assets/18e85d29-324f-458b-81ab-71b11427740f)|

**[➡️ Try it out here!](https://translator.innosage.co/)**

---


## ✨ Features

*   **Cross-Platform Support:** Natively import, edit, and export for both Android (`strings.xml`) and iOS (`.strings`).
*   **Project-Based Workspace:** Don't lose your work. Create multiple projects, save your progress, and pick up right where you left off. All data is saved in your browser.
*   **In-Place Editing:** A clean, intuitive table interface that allows you to edit string IDs, context comments, and translated values directly.
*   **AI-Powered Translation:** Use Google Gemini to translate your entire file into a new language with a single click, intelligently preserving formatting placeholders.
*   **Safe File Updates:** Update your project from a newer version of your source file or an XLSX from your translation team. A powerful Merge Review modal gives you a visual diff and full control over what gets changed.
*   **Multiple Export Options:** Export your work back to native platform files, or as XLSX or Markdown for collaboration and documentation.
*   **Offline-First:** The app works entirely in your browser. Your files are never uploaded to a server, and you can use it even without an internet connection (AI features excluded).

## 🤔 Why?

Managing localization files is tedious. It often involves manual XML/text editing, which is error-prone. Collaborating with translators often means endless copy-pasting between spreadsheets and source files. This tool aims to solve that by providing a single, powerful, and user-friendly interface for the entire workflow.

## 🚀 Getting Started (as a User)

This is a web application. To use it, simply visit the deployed site.

1.  Click "New Project".
2.  Upload your default `strings.xml` or `Localizable.strings` file.
3.  Start editing!

## 🛠️ Getting Started (as a Developer)

Interested in running the project locally or contributing? Here's how to get started.

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/mobile-localization-editor.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd mobile-localization-editor
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### API Key Setup

The AI translation feature requires a Google Gemini API key. The application is designed to use an API key provided through an environment variable.

1.  Create a `.env` file in the root of the project.
2.  Add your API key to the file:
    ```
    API_KEY=your_gemini_api_key_here
    ```
    *Note: A local development server (like Vite) is required to make this environment variable available to the application as `process.env.API_KEY`.*

### Running the App

To run the application in a local development environment, you will need a simple dev server. If the project is set up with Vite, for example, you would run:

```bash
npm run dev
```

This will start a local server, and you can access the application at `http://localhost:5173` (or a similar address).

## 🏗️ How It Works

*   **Frontend:** Built with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and styled with [Tailwind CSS](https://tailwindcss.com/).
*   **Storage:** All project data is stored client-side in your browser's [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) using the lightweight `idb` library. This enables the offline-first experience.
*   **AI:** Translation features are powered by the Google Gemini API, accessed via the `@google/genai` SDK.

## 🤝 Contributing

Contributions are welcome! Whether it's fixing a bug, adding a feature, or improving documentation, your help is appreciated.

Please read our `CONTRIBUTING.md` guide to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.