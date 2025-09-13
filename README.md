# BradChat 💬

A real-time, random chat application built with modern web technologies, allowing users to connect and chat instantly.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/TSMCIDevTest/BradChat)
[![License](https://img.shields.io/badge/license-None-lightgrey)](https://github.com/TSMCIDevTest/BradChat/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/TSMCIDevTest/BradChat?style=social)](https://github.com/TSMCIDevTest/BradChat/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/TSMCIDevTest/BradChat?style=social)](https://github.com/TSMCIDevTest/BradChat/network/members)

![BradChat Preview Image](/preview_example.png)


## ✨ Features

BradChat offers a seamless and engaging experience for connecting with new people.

*   💬 **Real-time Messaging**: Engage in instant conversations with other users through a responsive chat interface.
*   🤝 **Random Matchmaking**: Connect with new people through a simple and efficient matching system.
*   🚀 **Lightweight & Responsive**: Enjoy a smooth user experience across various devices and screen sizes.
*   📦 **Modular Project Structure**: Clear separation of frontend and backend for easier development and maintenance.


## ⚙️ Installation Guide

Follow these steps to set up BradChat on your local machine.

### Prerequisites

Ensure you have Node.js and npm (or Yarn) installed.

*   [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
*   [npm](https://www.npmjs.com/get-npm) (usually comes with Node.js) or [Yarn](https://yarnpkg.com/getting-started/install)

### Step-by-Step Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/TSMCIDevTest/BradChat.git
    cd BradChat
    ```

2.  **Install Backend Dependencies:**

    Navigate to the `backend` directory and install the required packages in the root of the repo.

    ```bash
    npm run build # or yarn install
    ```

3.  **Install Frontend Dependencies:**

    Navigate to the `frontend` directory and install the required packages in the root of the repo.

    ```bash
    npm run build # or yarn install
    ```

4.  **Start the Backend Server:**

    From the `backend` directory, start the server in the root of the repo.

    ```bash
    npm run dev # or node server.js (depending on your backend's main script)
    ```

    The backend server will typically run on `http://localhost:3000` (or a similar port).

5.  **Start the Frontend Development Server:**

    From the `frontend` directory, start the development server in the root of the repo.

    ```bash
    npm run dev # or yarn start
    ```

    The frontend application will usually open in your browser at `http://localhost:5173` (or `http://localhost:3000` if using Create React App, etc.).


## 🚀 Usage Examples

Once both the backend and frontend servers are running, open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).

1.  **Connect to a Chat:** Upon loading the page, you will typically be prompted to connect or automatically matched with another user.
2.  **Send Messages:** Type your message in the input field at the bottom of the chat window and press Enter or click the send button.
3.  **End Chat:** Look for an option to disconnect or find a new chat partner if available.

![BradChat UI Screenshot Placeholder](/usage_screenshot.png)
*A placeholder image showing the main chat interface where users can type and send messages.*


## 🛣️ Project Roadmap

BradChat is continuously evolving. Here are some of the planned features and improvements:

*   **Version 1.1 - DB setup and endpoints**
    *   User authentication and message creation.
    *   Work on endpoints.
    *   Finish backend.
*   **Version 1.2 - Frontend**
    *   Get the backend to connect frontend.
    *   Login and Signup.
    *   Chats page.
*   **Future Goals**
    *   Deployment to a production environment.
    *   Scalability improvements for handling more concurrent users.
    *   Get this completely done and modernlized.


## 🤝 Contribution Guidelines

We welcome contributions to BradChat! To ensure a smooth collaboration process, please follow these guidelines:

### Code Style

*   Adhere to a consistent code style (e.g., ESLint and Prettier configurations, if available).
*   Ensure your code is well-commented and easy to understand.

### Branch Naming

*   Use descriptive branch names:
    *   `feature/your-feature-name` for new features.
    *   `bugfix/issue-description` for bug fixes.
    *   `docs/update-readme` for documentation changes.

### Pull Request Process

1.  **Fork** the repository.
2.  **Create a new branch** from `main` (or `develop` if applicable).
3.  **Commit your changes** with clear and concise commit messages.
4.  **Push your branch** to your forked repository.
5.  **Open a Pull Request** against the `main` branch of the original repository.
6.  **Provide a detailed description** of your changes in the PR, linking to any relevant issues.

### Testing Requirements

*   If applicable, include unit or integration tests for new features or bug fixes.
*   Ensure all existing tests pass before submitting a pull request.


## 📄 License Information

This project currently does not have an explicit license.

Without a specific license, default copyright laws apply, meaning you generally do not have permission to use, distribute, or modify this software without explicit permission from the copyright holder(s) (TSMCIDevTest).

For inquiries regarding licensing or usage, please contact the main contributor.

---

**Main Contributor:** [TSMCIDevTest](https://github.com/TSMCIDevTest)