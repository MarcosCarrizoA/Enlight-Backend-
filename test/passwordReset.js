fetch("http://localhost/password-reset/request", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "email": "pedroramirezneira@gmail.com"
    })
}).then((response) => console.log(response));