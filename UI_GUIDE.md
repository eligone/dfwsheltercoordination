# UI Guide

**Don't touch the UI without the UI skill.** Your AI must use
[`.claude/skills/ui/SKILL.md`](.claude/skills/ui/SKILL.md) for every UI change. The prompts below make sure it does.

## 1. Set up (once)
Install [Node.js](https://nodejs.org), then:
```bash
git clone https://github.com/eligone/dfwsheltercoordination.git
cd dfwsheltercoordination/frontend
npm install
npm run dev        # open http://localhost:5173 to see all wireframes
```

## 2. Make a branch
```bash
git checkout main && git pull
git checkout -b wf/<your-name>
```

## 3. Prompt your AI
Copy the prompt for your tool. Replace the `<...>` parts. Your use cases are in the table in `SKILL.md`.

### Claude Code
```
/ui Make a wireframe for <UC-5 Find Available Shelters> in
frontend/src/wireframes/<your-name>/. Show these states: <default, no-match>.
Follow every rule in the skill, then run npm run check:ui and fix any errors.
```

### GitHub Copilot (VS Code Chat, Agent mode)
```
#file:.claude/skills/ui/SKILL.md Follow these rules exactly. Make a wireframe for
<UC-5 Find Available Shelters> in frontend/src/wireframes/<your-name>/.
Show these states: <default, no-match>. Then run npm run check:ui in frontend/ and fix any errors.
```

**To change your wireframe later**, start every prompt the same way (`/ui` or `#file:.claude/skills/ui/SKILL.md`),
for example: `/ui In my <find-shelters> wireframe, add a "Widen search" button to the no-match state.`

## 4. Check it
```bash
npm run check:ui   # must say ✓ UI check passed
```
Look at it in the browser (`npm run dev`). Click your name in the sidebar.

## 5. Screenshot
Each gray-labeled box is one screenshot.
- **Mac:** `Cmd + Shift + 4` and drag around the box
- **Windows:** `Win + Shift + S` and drag around the box

## 6. Submit
```bash
git add frontend/src/wireframes/<your-name>
git commit -m "<UC-5>: <find available shelters> wireframe"
git push -u origin wf/<your-name>
```
Open a pull request on GitHub and attach your screenshots.

---
Need a new shared component or color? Ask the team first. Don't add it inside your own folder.
Why we set things up this way: [`docs/adr/`](docs/adr/README.md).
