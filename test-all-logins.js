async function testLogin(email, password, role) {
    try {
        const res = await fetch("http://localhost:3002/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok) {
            console.log(`✅ ${role.toUpperCase()} LOGIN SUCCESS`);
            console.log(`   Email: ${email}`);
            console.log(`   User: ${data.user.name}`);
            console.log(`   Role: ${data.user.role}\n`);
            return true;
        } else {
            console.log(`❌ ${role.toUpperCase()} LOGIN FAILED`);
            console.log(`   Email: ${email}`);
            console.log(`   Error: ${data.error}\n`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${role.toUpperCase()} ERROR: ${error.message}\n`);
        return false;
    }
}

async function runTests() {
    console.log("🔐 Testing all account logins...\n");
    
    const results = [];
    results.push(await testLogin("donor@blox.com", "Donor123!", "donor"));
    results.push(await testLogin("association@blox.com", "Association123!", "association"));
    results.push(await testLogin("admin@blox.com", "Admin123!", "admin"));
    
    const allPassed = results.every(r => r);
    console.log(allPassed ? "✅ ALL TESTS PASSED!" : "❌ SOME TESTS FAILED");
}

runTests();
