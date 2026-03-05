// Simple test to verify the isDispenserActive logic
function testDispenserActivity() {
    console.log("Testing dispenser activity logic...\n");

    // Simulate the store state
    const state = {
        lastActivity: {},
        inactiveThreshold: 5000, // 5 seconds
    };

    // Simulate the isDispenserActive function
    function isDispenserActive(dispenserId) {
        const lastActivityTime = state.lastActivity[dispenserId];

        // If no activity has been recorded yet, consider the dispenser active
        // This handles the initial state before any events are received
        if (!lastActivityTime) return true;

        return (Date.now() - lastActivityTime) < state.inactiveThreshold;
    }

    // Simulate updateDispenserActivity function
    function updateDispenserActivity(dispenserId) {
        const now = Date.now();
        state.lastActivity[dispenserId] = now;
        console.log(`Updated activity for dispenser ${dispenserId} at ${new Date(now).toISOString()}`);
    }

    // Test Case 1: New dispenser (no activity recorded)
    console.log("Test 1: New dispenser with no activity");
    console.log(`Dispenser 1 is active: ${isDispenserActive(1)}`); // Should be true
    console.log();

    // Test Case 2: Recent activity
    console.log("Test 2: Dispenser with recent activity");
    updateDispenserActivity(2);
    console.log(`Dispenser 2 is active: ${isDispenserActive(2)}`); // Should be true
    console.log();

    // Test Case 3: Old activity (simulate waiting)
    console.log("Test 3: Dispenser with old activity (simulating 6 seconds ago)");
    const sixSecondsAgo = Date.now() - 6000;
    state.lastActivity[3] = sixSecondsAgo;
    console.log(`Set dispenser 3 activity to ${new Date(sixSecondsAgo).toISOString()}`);
    console.log(`Dispenser 3 is active: ${isDispenserActive(3)}`); // Should be false
    console.log();

    // Test Case 4: Activity just within threshold
    console.log("Test 4: Dispenser with activity just within threshold (4 seconds ago)");
    const fourSecondsAgo = Date.now() - 4000;
    state.lastActivity[4] = fourSecondsAgo;
    console.log(`Set dispenser 4 activity to ${new Date(fourSecondsAgo).toISOString()}`);
    console.log(`Dispenser 4 is active: ${isDispenserActive(4)}`); // Should be true
    console.log();

    console.log("All tests completed!");
}

testDispenserActivity();
