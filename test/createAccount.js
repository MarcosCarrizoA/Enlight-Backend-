fetch("http://localhost/account", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        email: "pedroramirezneira@gmail.com",
        password: "pedro123",
        name: "Pedro",
        birth_date: "2004-01-10",
        address: "Pedro's House"
    })
});