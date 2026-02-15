# Deployment Guide (Public Live Link)

To generate a **LIVE public link** for your assignment, you need to deploy your code. Since you have separate `client` (frontend) and `server` (backend) folders, the easiest way is to deploy them separately.

## Prerequisites

1.  **GitHub Account** (You need to push your code to GitHub first, as explained in the chat).
2.  **Render Account** (Free hosting for backend).
3.  **Vercel Account** (Free hosting for frontend).

---

## Step 1: Push Code to GitHub

*(If you haven't already done this)*

1.  Create a new repository on GitHub named `real-time-poll`.
2.  Run these commands in your project terminal:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/real-time-poll.git
    git branch -M main
    git push -u origin main
    ```

---

## Step 2: Deploy Backend (Server) to Render

1.  Go to [dashboard.render.com](https://dashboard.render.com/).
2.  Click **"New +"** -> **"Web Service"**.
3.  Connect your GitHub repository (`real-time-poll`).
4.  Configure the settings:
    *   **Name:** `real-time-poll-server`
    *   **Root Directory:** `server` (Important!)
    *   **Environment:** Node
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start` (or `node server.js`)
5.  Click **"Deploy Web Service"**.
6.  Wait for it to finish. Copy the **Service URL** (e.g., `https://real-time-poll-server.onrender.com`).
    *   *Note this URL down! You'll need it for the frontend.*

---

## Step 3: Update Frontend Config

Before deploying the frontend, you need to tell it where your live backend is (instead of `localhost`).

1.  Open `client/vite.config.js` or create an `.env` file.
2.  Or simpler: Just use a `.env` variable for the backend URL.
    *   **(Wait! I, the AI, will update your code to support this environment variable in the next step so you don't have to manually edit files!)**

---

## Step 4: Deploy Frontend (Client) to Vercel

1.  Go to [vercel.com](https://vercel.com).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `real-time-poll` repository.
4.  Configure the settings:
    *   **Framework Preset:** Vite
    *   **Root Directory:** `client` (Important!)
    *   **Environment Variables:**
        *   Add a variable named `VITE_API_URL`.
        *   Value: Your Render Backend URL from Step 2 (e.g., `https://real-time-poll-server.onrender.com`).
5.  Click **"Deploy"**.

Once deployed, Vercel will give you a **Deployment URL** (e.g., `https://real-time-poll.vercel.app`).

**🎉 THIS IS YOUR LIVE LINK!**
You can submit this Vercel link.
