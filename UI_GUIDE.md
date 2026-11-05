# UI Guide: read this before touching the UI

**Rule #1: you do not change anything in `frontend/` without the UI skill.**
The rules live in [`.claude/skills/ui/SKILL.md`](.claude/skills/ui/SKILL.md). Every pull
request is checked against them automatically, and `main` will not accept anything that fails.
Why we decided this: [`docs/adr/`](docs/adr/README.md).

## Using the skill with your AI
- **Claude Code** (terminal / VS Code): open the repo and the skill loads by itself. Start your
  request with `/ui` or "use the ui skill" to be sure.
- **Any other AI** (ChatGPT, Copilot, Cursor, etc.): paste the full contents of `SKILL.md` into the chat
  **first**, then ask for your wireframe.
- Either way, run `npm run check:ui` before you commit. It tells you which rule you broke.

## One-time setup
Install [Node.js 20+](https://nodejs.org), then:
```bash
git clone https://github.com/eligone/dfwsheltercoordination.git
cd dfwsheltercoordination/frontend
npm install
```

## Make your wireframe
1. Get the latest code and make a branch (you cannot push to `main`):
   ```bash
   git checkout main && git pull
   git checkout -b wf/<your-name>-<what>        # e.g. wf/anais-match-results
   ```
2. Copy the example into **your** folder:
   `frontend/src/wireframes/shared/sign-in.wf.jsx` → `frontend/src/wireframes/<your-name>/<what>.wf.jsx`
3. Edit `meta` (your UC number, title, name, states) and build the UI using only the components in
   `frontend/src/components/ui/`. See the component list in the skill.
4. See it live:
   ```bash
   npm run dev          # open the printed http://localhost:5173 link
   ```
   The sidebar lists everyone's wireframes. Click your name to show only yours.

## Take screenshots
Each gray-labeled box in the viewer is one screenshot (it shows the UC, title, state and owner).
- **Chrome / Edge (exact crop):** right-click the box → Inspect → in the Elements panel right-click
  the highlighted `<figure>` → **Capture node screenshot**.
- **Mac:** `Cmd + Shift + 4`, then drag around the box.
- **Windows:** `Win + Shift + S`, then drag around the box.

Save as `UC-5_find-shelters_no-match.png` style names so they're easy to drop into the SE doc.

## Submit your work
```bash
cd frontend
npm run check:ui && npm run build    # both must pass
git add src/wireframes/<your-name>
git commit -m "UC-5: find available shelters wireframe"
git push -u origin wf/<your-name>-<what>
```
Open a pull request on GitHub, fill in the checklist, attach your screenshots. When the **ui-check**
job is green it can be merged.

## Need something shared changed?
New component, token or mock-data change, or a change to the skill: open a **separate** PR for just
that. It needs approval from a code owner (see `.github/CODEOWNERS`) because everyone depends on it.
