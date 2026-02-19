# 🚀 GitHub Setup & Team Collaboration Guide
## ChipTrace AI — 24-Hour Hackathon

---

## STEP 1: One person creates the GitHub repo (takes 5 minutes)

1. Go to **github.com** → Sign in → Click **"New repository"** (green button, top-right)
2. Fill in:
   - **Repository name:** `chiptrace-ai`
   - **Visibility:** Public (so teammate can clone without token)
   - **DO NOT** check "Add README" (we already have one)
   - Click **"Create repository"**

3. GitHub will show you a page with commands. **Copy your repo URL** — it looks like:
   ```
   https://github.com/YOUR_USERNAME/chiptrace-ai.git
   ```

---

## STEP 2: Push the project files to GitHub (Person 1 — Backend dev)

Open terminal in the folder where you downloaded chiptrace-ai:

```bash
# Navigate into the project
cd chiptrace-ai

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "feat: initial project scaffold - ChipTrace AI"

# Connect to your GitHub repo (replace with YOUR actual URL)
git remote add origin https://github.com/YOUR_USERNAME/chiptrace-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

✅ Done — your code is now on GitHub.

---

## STEP 3: Add your teammate as a collaborator

1. Go to your repo on GitHub: `github.com/YOUR_USERNAME/chiptrace-ai`
2. Click **Settings** (top menu) → **Collaborators** (left sidebar)
3. Click **"Add people"** → Enter your teammate's GitHub username
4. They'll get an email — they need to **Accept the invitation**

---

## STEP 4: Teammate clones the repo (Person 2 — Frontend dev)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/chiptrace-ai.git

# Go into it
cd chiptrace-ai

# Create your branch (IMPORTANT — never work on main directly)
git checkout -b frontend/dashboard
```

---

## STEP 5: Branching Strategy for the Hackathon

Use these branch names. **Never commit directly to `main`.**

| Branch | Who | What |
|--------|-----|-------|
| `main` | Auto-merged | Always working, deployable code |
| `backend/api` | Person 1 | FastAPI routes, DB, services |
| `backend/ml` | Person 1 | Model training scripts |
| `frontend/dashboard` | Person 2 | Dashboard + Metric Tree D3 |
| `frontend/compare` | Person 2 | Flat vs Hierarchical page |

```bash
# Person 1 — backend branch
git checkout -b backend/api

# Person 2 — frontend branch
git checkout -b frontend/dashboard
```

---

## STEP 6: The Git Loop — How to work simultaneously

### Every time you start working:
```bash
git pull origin main          # Get latest from teammates
git checkout your-branch      # Switch to your branch
git merge main                # Merge any updates into your branch
```

### While you're working — commit often (every 30–60 min):
```bash
git add .
git commit -m "feat: add supplier router endpoint"
git push origin backend/api
```

### When a feature is done — merge to main:
```bash
git checkout main
git pull origin main
git merge backend/api
git push origin main
```

### Teammate picks up your changes:
```bash
git checkout frontend/dashboard
git pull origin main
git merge main               # Gets backend changes
```

---

## STEP 7: What to do if you get a MERGE CONFLICT

This happens when both people edit the same file. Don't panic — it's easy:

```bash
# Git will tell you which files have conflicts
git status

# Open the conflicted file — you'll see:
# <<<<<<< HEAD
# (your code)
# =======
# (teammate's code)
# >>>>>>> main

# Keep the correct code, delete the markers, save the file

# Then:
git add conflicted-file.py
git commit -m "fix: resolved merge conflict in routes"
```

**Best practice to AVOID conflicts:**
- Person 1 owns everything in `/backend/`
- Person 2 owns everything in `/frontend/`
- Never edit each other's files without talking first

---

## STEP 8: Useful Git Commands for Hackathons

```bash
git status                    # What files changed?
git log --oneline -10         # See last 10 commits
git diff                      # What exactly changed?
git stash                     # Save work temporarily (if you need to pull)
git stash pop                 # Bring stashed work back
git checkout -- filename      # UNDO changes to a file (dangerous!)
```

---

## Work Division

### Person 1 — Backend + ML

**Hours 0–4:** Environment setup + data generation
```
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python data/generate_dataset.py
python data/seed_db.py
uvicorn main:app --reload
# Verify: http://localhost:8000/docs
```

**Hours 4–10:** Metric tree engine + all API routes
- Test `/api/metric-tree/snapshot` works
- Test `/api/metric-tree/alerts` returns RED nodes
- Test `/api/compare/flat-vs-tree`

**Hours 10–16:** Train all 3 ML models
```
python ml/train_delay_model.py
python ml/train_resolution_model.py
python ml/train_impact_model.py
# Test: GET /api/predict/full
```

**Hours 16–24:** Polish + WebSocket alerts + help frontend with API

---

### Person 2 — Frontend

**Hours 0–4:** Environment setup + scaffold
```
cd frontend
npm install
npm start
# Verify: http://localhost:3000 shows nav
```

**Hours 4–10:** Dashboard + D3 Metric Tree
- Get tree snapshot from API
- Render D3 collapsible tree
- Add GREEN/AMBER/RED node colors

**Hours 10–16:** Compare page + Disruption Log page
- Side-by-side flat vs hierarchical view
- Make the "insight diff" section visually pop

**Hours 16–20:** Prediction cards + Simulate panel
- Wire up all 3 ML prediction calls
- Trigger disruption + watch tree update live

**Hours 20–24:** Polish + presentation slides

---

## Communication During the Hackathon

| Situation | What to do |
|-----------|-----------|
| Backend API is ready for a route | Text teammate: "GET /api/metric-tree/snapshot is live, returns X shape" |
| Frontend needs a new field in API response | Ask backend to add it, don't change backend files yourself |
| Something is broken | `git log --oneline` to find last working commit |
| Need to merge urgently | Both stop, merge to main together, re-pull |

---

## Quick Setup Checklist

### Person 1 (Backend)
- [ ] Created GitHub repo
- [ ] Pushed initial code
- [ ] Added teammate as collaborator
- [ ] PostgreSQL running locally (or Docker)
- [ ] `uvicorn main:app --reload` working
- [ ] `/docs` shows all API endpoints

### Person 2 (Frontend)
- [ ] Accepted GitHub collaboration invite
- [ ] Cloned repo
- [ ] Created `frontend/dashboard` branch
- [ ] `npm install` completed
- [ ] `npm start` shows app at localhost:3000
- [ ] API calls to backend returning data
