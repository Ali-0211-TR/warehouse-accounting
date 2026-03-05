// Add this to your browser console to test dispenser activity tracking
// Run this in the browser console: testDispenserActivity()

window.testDispenserActivity = function () {
    console.log("🧪 Testing Dispenser Activity Tracking");
    console.log("=====================================");

    try {
        // Get the dispenser store
        const { useDispenserStore } = window;
        if (!useDispenserStore) {
            console.error("❌ useDispenserStore not found. Make sure the store is exposed.");
            return;
        }

        const store = useDispenserStore.getState();
        const dispensers = store.dispensers;

        if (dispensers.length === 0) {
            console.log("⚠️ No dispensers found. Make sure dispensers are loaded.");
            return;
        }

        console.log(`📊 Found ${dispensers.length} dispensers`);
        console.log();

        // Test each dispenser
        dispensers.forEach(dispenser => {
            if (dispenser.id) {
                const info = store.getDispenserActivityInfo(dispenser.id);
                console.log(`🏭 Dispenser ${dispenser.id} (${dispenser.name}):`);
                console.log(`   Last Activity: ${info.lastActivity ? new Date(info.lastActivity).toISOString() : 'Never'}`);
                console.log(`   Time Since: ${info.timeSinceLastActivity ? `${info.timeSinceLastActivity}ms` : 'N/A'}`);
                console.log(`   Is Active: ${info.isActive ? '✅' : '❌'}`);
                console.log(`   Is Online: ${info.isOnline ? '🟢' : '🔴'}`);
                console.log(`   Error: ${info.error || 'None'}`);
                console.log();
            }
        });

        // Test manual activity update
        const firstDispenser = dispensers.find(d => d.id);
        if (firstDispenser) {
            console.log(`🔧 Testing manual activity update for dispenser ${firstDispenser.id}...`);
            store.updateDispenserActivity(firstDispenser.id);

            setTimeout(() => {
                const updatedInfo = store.getDispenserActivityInfo(firstDispenser.id);
                console.log(`📈 Updated info for dispenser ${firstDispenser.id}:`);
                console.log(`   Is Active: ${updatedInfo.isActive ? '✅' : '❌'}`);
                console.log(`   Is Online: ${updatedInfo.isOnline ? '🟢' : '🔴'}`);
            }, 100);
        }

    } catch (error) {
        console.error("❌ Error testing dispenser activity:", error);
    }
};

console.log("✅ Test function loaded. Run testDispenserActivity() to test activity tracking.");
