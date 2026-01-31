# Think Bits • Treasure Hunt Hub (Front-end)

This is a **TV / big monitor** “central hub” web app for your Think Bits QR treasure hunt.

It’s designed around your event doc:
- Teams compete in groups (teams of five), solve riddles, find QR codes, and decode binary data to reach the final solution.
- A **central hub near the cafeteria TV** is used for coordination and guidance.
- Rules include **no sharing QR locations**, **no damage to property**, and **follow volunteers’ instructions**.

(These points are taken from your Treasure Hunt Event Documentation PDF.)

---

## What the website does

1) Team leader types a **unique team name** and presses **Enter** (registers the team).  
2) Team appears in the **left sidebar** list.  
3) Tap a team → the main panel shows their **current riddle**.  
4) When the team finds a QR, they paste **binary** (optional) or type the **decoded text**.  
5) Press **Check & Unlock** → when correct, **Generate Next Riddle** becomes available.  
6) Repeat until the **Final** step.

Everything is **front-end only** and saved in the browser using **localStorage**.

---

## Run it (recommended)

Because the app loads `data/riddles.json`, you should run it through a local server:

### Option A — VS Code (easiest)
1. Open this folder in VS Code
2. Install the **Live Server** extension
3. Right click `index.html` → **Open with Live Server**

### Option B — Python server
From the project folder:
```bash
python -m http.server 5500
```
Then open:
- http://localhost:5500

---

## Edit riddles

Open:
- `data/riddles.json`

Each item looks like:
```json
{
  "title": "Riddle 1",
  "clue": "Your clue text...",
  "expected": "Your expected decoded answer..."
}
```

### About binary
The hub can decode:
- 7-bit or 8-bit binary
- space/newline separated binary chunks (e.g., `1000010 1101001`)
- or one long binary string that can be split into 7/8-bit groups

---

## Admin

Click **Admin** (top right).

Default PIN:
- `thinkbits`  (change in `app.js`)

Admin actions:
- Export progress as JSON
- Reset all teams/progress

---

## Files

- `index.html` — layout
- `styles.css` — Think Bits tech UI theme
- `app.js` — logic (teams, steps, decode, persistence)
- `data/riddles.json` — your riddles (edit here)
- `assets/thinkbits-logo.png` — your logo

---

## Notes / Upgrades (if you want later)

If you ever add a backend later (Firebase/Supabase), you can:
- sync teams across multiple devices
- add timestamps + leaderboards
- allow QR scanning directly on phones

