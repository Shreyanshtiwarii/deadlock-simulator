"""
Banker's Algorithm for Deadlock Prevention (Deadlock Avoidance)
Determines if system is in a safe state by finding a safe sequence.
Time Complexity: O(n^2 * r) where n = processes, r = resources
Space Complexity: O(n * r)
"""

def bankers_algorithm(allocation, maximum, available):
    """
    Run Banker's Algorithm to determine safe state.
    
    Args:
        allocation: List of lists - resources currently allocated to each process
        maximum: List of lists - maximum resources each process may need
        available: List - currently available resources
    
    Returns:
        dict with safe state, safe sequence, need matrix, and steps
    """
    n = len(allocation)       # number of processes
    r = len(available)        # number of resources

    # Calculate Need matrix: Need[i][j] = Maximum[i][j] - Allocation[i][j]
    need = []
    for i in range(n):
        need_row = [maximum[i][j] - allocation[i][j] for j in range(r)]
        need.append(need_row)

    work = available[:]       # work vector
    finish = [False] * n      # finish vector
    sequence = []             # safe sequence
    steps = []                # step-by-step trace

    changed = True
    iteration = 0

    while changed:
        changed = False
        iteration += 1

        for i in range(n):
            if finish[i]:
                continue

            # Check if need[i] <= work
            can_proceed = all(need[i][j] <= work[j] for j in range(r))

            if can_proceed:
                prev_work = work[:]
                # Simulate process completion: release all allocated resources
                for j in range(r):
                    work[j] += allocation[i][j]

                finish[i] = True
                sequence.append(i)
                changed = True

                steps.append({
                    "iteration": iteration,
                    "process": i,
                    "action": f"P{i} can be allocated resources (Need ≤ Work). Process executes and releases.",
                    "work_before": prev_work[:],
                    "work_after": work[:],
                    "need": need[i][:],
                    "allocation": allocation[i][:],
                    "max": maximum[i][:]
                })

    safe = all(finish)

    if safe:
        steps.append({
            "iteration": -1,
            "process": -1,
            "action": f"Safe sequence found: {' → '.join([f'P{p}' for p in sequence])}. System is in a SAFE state.",
            "work_before": work[:],
            "work_after": work[:],
            "need": [],
            "allocation": [],
            "max": []
        })
    else:
        unsafe_procs = [i for i in range(n) if not finish[i]]
        steps.append({
            "iteration": -1,
            "process": -1,
            "action": f"No safe sequence exists. Processes {[f'P{p}' for p in unsafe_procs]} cannot proceed. UNSAFE state.",
            "work_before": work[:],
            "work_after": work[:],
            "need": [],
            "allocation": [],
            "max": []
        })

    return {
        "safe": safe,
        "sequence": sequence,
        "need": need,
        "steps": steps,
        "final_work": work
    }
