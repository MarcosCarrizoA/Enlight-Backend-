import firebase from "firebase-admin"

firebase.initializeApp({
    credential: firebase.credential.cert("./firebase-private-key.json"),
    databaseURL: "https://enlight-f3a1d-default-rtdb.firebaseio.com",
})
console.log("Firebase initialized")

export default firebase
