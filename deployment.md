# DFW Shelter Coordination — Local Demo Guide

We chose to run the demo locally so the TA can test the application on her own Windows computer. The repository is public, so she can clone it without signing in to GitHub or requesting access. The application uses bundled demo data for shelter accounts, kennel capacity, and transfer requests. It requires no `.env` file, database, API keys, or cloud account.

## 1. Install and check prerequisites

Use **Windows PowerShell** and a web browser such as **Microsoft Edge**. Install **Git for Windows** and **Node.js 24**, which includes npm. Open a new PowerShell window after installing them and run:

```powershell
git --version
node --version
npm.cmd --version
```

Each command should print a version number. Use `npm.cmd` in PowerShell to invoke npm directly.

## 2. Clone the repository and start the demo

Run these commands in PowerShell, one line at a time:

```powershell
cd $HOME
git clone https://github.com/eligone/dfwsheltercoordination.git
cd dfwsheltercoordination\frontend
npm.cmd install
npm.cmd run dev
```

Keep this PowerShell window open while testing. If you already cloned the repository, open PowerShell in your existing `frontend` folder and start with `npm.cmd install`.

## 3. Open the demo and sign in

Open a **second PowerShell window** and run:

```powershell
Start-Process "http://localhost:5173/app.html"
```

If Vite prints a different port, replace `5173` with that port.

| Demo account | Email | Password |
|---|---|---|
| Richardson shelter staff | `jdoe@richardson.example` | `pw-rich` |
| Collin County shelter staff | `staff@collin.example` | `pw-collin` |

## 4. Verify the application

1. Sign in as **Richardson**. Go to **Home → Update Capacity**, change the **Available kennels** count, and click **Save changes**. Open **Settings → Capacity History** and confirm the update appears.
2. Return to **Home → Find Match**, select **Duke**, and send a transfer request to **Collin County Animal Services**.
3. Sign out and sign in as **Collin County** in the same browser tab. Open Duke’s alert using the bell icon and accept the request.
4. Sign back in as **Richardson**, open **My Dogs**, and confirm that Duke’s transfer status is **Accepted**.

Keep the same browser tab open when switching accounts. Refreshing restores the original demo data. To stop the demo, press **Ctrl+C** in the PowerShell window running Vite.
