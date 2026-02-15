# Real-Time Polling Application

A full-stack real-time polling application built with React, Node.js, Express, Socket.io, and SQLite.

## Features

- **Create Polls:** Users can create polls with a question and multiple options.
- **Real-Time Updates:** Vote counts update instantly across all connected clients using WebSockets (Socket.io).
- **Shareable Links:** Each poll has a unique URL that can be shared.
- **Fairness Mechanisms:**
  1. **Browser Fingerprinting:** A local storage token prevents simple double-voting from the same browser.
  2. **IP Address Tracking:** The backend records IP addresses for each vote to prevent spam from the same network source.
- **Persistence:** Polls and votes are stored in a SQLite database (`polls.db`).

## Tech Stack

- **Frontend:** React (Vite), Recharts (Visualization), Socket.io-client, React Router.
- **Backend:** Node.js, Express, Socket.io, SQLite3.

## Setup & Running Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd real_time_poll
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   node server.js
   ```
   The backend will run on `http://localhost:5000`.

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   The frontend will typically run on `http://localhost:3000` or `http://localhost:5001`.

## Fairness & Anti-Abuse Mechanisms

1.  **Browser Fingerprinting:**
    -   When a user visits a poll, a unique fingerprint is generated and stored in `localStorage`.
    -   When voting, this fingerprint is sent to the specific poll API.
    -   The server checks if this fingerprint has already voted on this poll.

2.  **IP Address Rate Limiting (Simple):**
    -   The server captures the request IP address.
    -   Before recording a vote, it checks the database to see if a vote for the specific poll already exists from this IP.
    -   *Note: In a production environment with NAT/proxies, this might limit legitimate users on the same network (e.g., an office), but it satisfies the assignment requirement for an anti-abuse mechanism.*

## Edge Cases Handled

-   **Poll Not Found:** Users engaging with an invalid poll ID are shown a friendly error message.
-   **Already Voted:** Users who try to vote again are informed they have already participated.
-   **Real-time Synchronization:** Users joining late or refreshing receive the latest current state immediately.
-   **Minimum Options:** Creation is blocked if fewer than 2 distinct options are provided.

## Known Limitations

-   **IP Check Rigidity:** Users on shared Wi-Fi (NAT) might be blocked if someone else on the network voted.
-   **Fingerprint clearing:** Savvy users can clear `localStorage` or open Incognito mode to bypass the browser fingerprint, though the IP check will still catch them.
-   **Scalability:** SQLite is great for development but would need to be replaced with PostgreSQL/Redis for high-scale production use handling thousands of concurrent writes.
