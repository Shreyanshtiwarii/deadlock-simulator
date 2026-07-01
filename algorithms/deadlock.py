"""
Deadlock Detection Algorithm
Uses the resource allocation graph / matrix-based detection approach.
Time Complexity: O(n^2 * r) where n = processes, r = resources
Space Complexity: O(n + r)
"""

def detect_deadlock(allocation, request, available):
    """
    Detect deadlock using the deadlock detection algorithm.
    
    Args:
        allocation: List of lists - resources currently allocated to each process
        request: List of lists - resources currently requested by each process
        available: List - currently available resources
    
    Returns:
        dict with deadlock status, safe sequence, deadlocked processes, and steps
    """
    n = len(allocation)       # number of processes
    r = len(available)        # number of resources

    work = available[:]       # work vector (copy of available)
    finish = [False] * n      # finish vector
    sequence = []             # safe execution sequence
    steps = []                # step-by-step trace

    # Mark processes with no allocation as finished
    for i in range(n):
        if all(allocation[i][j] == 0 for j in range(r)):
            finish[i] = True

    changed = True
    iteration = 0

    while changed:
        changed = False
        iteration += 1

        for i in range(n):
            if finish[i]:
                continue

            # Check if request[i] <= work
            can_proceed = all(request[i][j] <= work[j] for j in range(r))

            if can_proceed:
                # Simulate process completion: release its allocated resources
                prev_work = work[:]
                for j in range(r):
                    work[j] += allocation[i][j]

                finish[i] = True
                sequence.append(i)
                changed = True

                steps.append({
                    "iteration": iteration,
                    "process": i,
                    "action": f"P{i} can proceed (Request ≤ Work). Releasing resources.",
                    "work_before": prev_work[:],
                    "work_after": work[:],
                    "request": request[i][:],
                    "allocation": allocation[i][:]
                })

    # Processes that couldn't finish are deadlocked
    deadlocked = [i for i in range(n) if not finish[i]]

    if deadlocked:
        steps.append({
            "iteration": -1,
            "process": -1,
            "action": f"Deadlock detected! Processes {[f'P{p}' for p in deadlocked]} are deadlocked.",
            "work_before": work[:],
            "work_after": work[:],
            "request": [],
            "allocation": []
        })
    else:
        steps.append({
            "iteration": -1,
            "process": -1,
            "action": "All processes completed successfully. System is safe.",
            "work_before": work[:],
            "work_after": work[:],
            "request": [],
            "allocation": []
        })

    return {
        "deadlock": len(deadlocked) > 0,
        "sequence": sequence,
        "deadlocked_processes": deadlocked,
        "steps": steps,
        "final_work": work
    }
