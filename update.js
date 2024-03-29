require("dotenv").config();
const fs = require("fs");
const admZip = require("adm-zip");
function update() {
    const zip = new admZip();
    fs.readdirSync(__dirname).forEach((value) => {
        if (value == ".env" || value == "serverstartup" || value == "node_modules" || value == ".git") return;
        if (fs.statSync(`${__dirname}/${value}`).isDirectory()) zip.addLocalFolder(`${__dirname}/${value}`, `/${value}`);
        else zip.addLocalFile(`${__dirname}/${value}`);
    });
    const formData = new FormData();
    formData.append("zipFile", new Blob([zip.toBuffer()], { type: "application/zip" }), "zip.zip");
    fetch(`http://${process.env.SERVER_IP_ADDRESS}:3000`, {
        method: "POST",
        body: formData
    }).then(response => response.text().then(result => console.log(result))).catch((error) => console.log(error));
}
update();