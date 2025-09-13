# Android Setup Guide

This guide describes the necessary steps to set up the native Android project for development.

## Prerequisites

-   **Java 17**: Ensure you have JDK 17 installed.
-   **Android Studio**: The latest stable version of Android Studio is recommended.
-   **Android SDK**: Make sure you have the Android SDK Platform for API Level 34 (or higher) installed via the Android Studio SDK Manager.

## First-Time Setup

If you have cloned the repository for the first time or the `android/` directory is missing, follow these steps:

1.  **Install Dependencies**:
    ```sh
    npm ci
    ```

2.  **Sync Capacitor Project**: This command generates the native Android project.
    ```sh
    npx cap sync android
    ```

3.  **Open in Android Studio**:
    ```sh
    npx cap open android
    ```

## Running the App

Once the project is open in Android Studio:

1.  **Sync Gradle**: Android Studio should automatically sync the Gradle files. If not, click "Sync Project with Gradle Files".
2.  **Select Device**: Choose a connected physical device or a configured Android Emulator.
3.  **Run**: Click the "Run 'app'" button (the green play icon) to build and deploy the app to your selected device.
