# Deadlock Detection & Prevention Simulator
> Operating Systems Mini Project · CSE Department

A fully interactive, animated web application that simulates **Deadlock Detection** and **Deadlock Prevention (Banker's Algorithm)** — designed as a laboratory-grade OS mini project.

---

## Features

| Feature | Details |
|---------|---------|
| 🔍 **Deadlock Detection** | Resource-Allocation matrix algorithm with step-by-step trace |
| 🛡 **Banker's Algorithm** | Deadlock avoidance via safe-state analysis |
| 🎞 **Live Visualisation** | Animated step cards, sequence display, resource counters |
| 📋 **Simulation History** | Collapsible panel tracking all runs in the session |
| ⬇ **Export** | Download simulation report as a text file |
| 💡 **Sample Data** | One-click load of classic Silberschatz textbook example |
| 🌗 **Dark / Light Mode** | Toggle between themes |
| 📱 **Responsive** | Works on mobile, tablet, desktop |
| ✅ **Validation** | Full client- and server-side input validation |
| 📖 **Algorithm Panel** | Pseudocode + complexity info for each algorithm |

---

## Project Structure

```
Deadlock-Simulator/
│
├── app.py                  # Flask application & API routes
├── requirements.txt        # Python dependencies
├── README.md
│
├── algorithms/
│   ├── banker.py           # Banker's Algorithm implementation
│   └── deadlock.py         # Deadlock Detection Algorithm
│
├── templates/
│   └── index.html          # Single-page frontend
│
├── static/
│   ├── css/
│   │   └── style.css       # Full responsive stylesheet
│   └── js/
│       └── script.js       # All frontend logic
│
└── data/
    └── sample.json         # Textbook example data
```

---

## Installation & Setup

### Prerequisites
- Python 3.8+
- pip

### Steps

```bash
# 1. Clone / extract the project
cd Deadlock-Simulator

# 2. (Optional) create a virtual environment
python -m venv venv
source venv/bin/activate      # Linux/macOS
venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python app.py
```

Open your browser at **http://localhost:5000**

---

## API Reference

### POST `/api/detect`
Run Deadlock Detection Algorithm.

**Request body:**
```json
{
  "allocation": [[0,1,0],[2,0,0],[3,0,3],[2,1,1],[0,0,2]],
  "request":    [[0,0,0],[2,0,2],[0,0,0],[1,0,0],[0,0,2]],
  "available":  [0, 0, 0]
}
```

**Response:**
```json
{
  "deadlock": true,
  "sequence": [0, 2],
  "deadlocked_processes": [1, 3, 4],
  "steps": [...],
  "final_work": [0, 2, 0]
}
```

---

### POST `/api/banker`
Run Banker's Algorithm (Deadlock Prevention).

**Request body:**
```json
{
  "allocation": [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]],
  "maximum":    [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]],
  "available":  [3, 3, 2]
}
```

**Response:**
```json
{
  "safe": true,
  "sequence": [1, 3, 4, 0, 2],
  "need": [[7,4,3],[1,2,2],[6,0,0],[0,1,1],[4,3,1]],
  "steps": [...],
  "final_work": [10, 5, 7]
}
```

---

## Algorithms

### Deadlock Detection
- **Concept:** Simulates a "Work" vector starting from Available. Iteratively finds processes whose Request ≤ Work and marks them finished.
- **Deadlocked processes** are those that cannot finish.
- **Time Complexity:** O(n² · r)
- **Space Complexity:** O(n + r)

### Banker's Algorithm
- **Concept:** Uses Need = Maximum − Allocation. Finds a safe sequence where every process can be allocated its maximum need.
- **Safe state** ≡ a safe sequence exists.
- **Time Complexity:** O(n² · r)
- **Space Complexity:** O(n · r)

---

## Screenshots

> Add screenshots here after first run.

- `screenshots/hero.png`
- `screenshots/detection_result.png`
- `screenshots/banker_safe.png`
- `screenshots/banker_unsafe.png`

---

## References

- Silberschatz, Galvin & Gagne — *Operating System Concepts*, 10th Edition
- Tanenbaum — *Modern Operating Systems*, 4th Edition

---

## Author

**Shreyansh Tiwari**  
B.Tech CSE (CY) · Acropolis Institute of Technology and Research, Indore  
Enrollment: 0827CY241063
