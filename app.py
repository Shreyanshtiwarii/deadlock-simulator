"""
Deadlock Detection & Prevention Simulator - Flask Backend
OS Mini Project
"""

from flask import Flask, render_template, request, jsonify
from algorithms.deadlock import detect_deadlock
from algorithms.banker import bankers_algorithm

app = Flask(__name__)


# ─── Helper: validate matrix dimensions & values ────────────────────────────

def validate_matrix(matrix, name, n_processes, n_resources, max_matrix=None):
    if len(matrix) != n_processes:
        return f"{name} must have {n_processes} rows (one per process)."
    for i, row in enumerate(matrix):
        if len(row) != n_resources:
            return f"{name} row {i} must have {n_resources} values."
        for j, val in enumerate(row):
            if not isinstance(val, (int, float)) or val < 0:
                return f"{name}[{i}][{j}] must be a non-negative number."
            if max_matrix is not None:
                if val > max_matrix[i][j]:
                    return (f"Allocation[{i}][{j}]={val} exceeds "
                            f"Maximum[{i}][{j}]={max_matrix[i][j]}.")
    return None


def validate_vector(vector, name, n_resources):
    if len(vector) != n_resources:
        return f"{name} must have {n_resources} values."
    for i, val in enumerate(vector):
        if not isinstance(val, (int, float)) or val < 0:
            return f"{name}[{i}] must be a non-negative number."
    return None


# ─── Routes ─────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/detect", methods=["POST"])
def api_detect():
    """Deadlock Detection endpoint."""
    data = request.get_json(force=True)

    try:
        allocation = [[int(v) for v in row] for row in data["allocation"]]
        req_matrix = [[int(v) for v in row] for row in data["request"]]
        available  = [int(v) for v in data["available"]]
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input format: {e}"}), 400

    n = len(allocation)
    r = len(available)

    # Validate
    err = validate_matrix(allocation, "Allocation", n, r)
    if err:
        return jsonify({"error": err}), 400
    err = validate_matrix(req_matrix, "Request", n, r)
    if err:
        return jsonify({"error": err}), 400
    err = validate_vector(available, "Available", r)
    if err:
        return jsonify({"error": err}), 400

    result = detect_deadlock(allocation, req_matrix, available)
    return jsonify(result)


@app.route("/api/banker", methods=["POST"])
def api_banker():
    """Banker's Algorithm (Deadlock Prevention) endpoint."""
    data = request.get_json(force=True)

    try:
        allocation = [[int(v) for v in row] for row in data["allocation"]]
        maximum    = [[int(v) for v in row] for row in data["maximum"]]
        available  = [int(v) for v in data["available"]]
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input format: {e}"}), 400

    n = len(allocation)
    r = len(available)

    # Validate
    err = validate_matrix(maximum, "Maximum", n, r)
    if err:
        return jsonify({"error": err}), 400
    err = validate_matrix(allocation, "Allocation", n, r, max_matrix=maximum)
    if err:
        return jsonify({"error": err}), 400
    err = validate_vector(available, "Available", r)
    if err:
        return jsonify({"error": err}), 400

    result = bankers_algorithm(allocation, maximum, available)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
