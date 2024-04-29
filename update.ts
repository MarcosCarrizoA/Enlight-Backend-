import admZip from "adm-zip"
import { readdirSync, statSync } from "node:fs"
function update() {
    const zip = new admZip()
    readdirSync(__dirname).forEach((value) => {
        if (
            value == ".env" ||
            value == "serverstartup" ||
            value == "node_modules" ||
            value == ".git"
        )
            return
        if (statSync(`${__dirname}/${value}`).isDirectory())
            zip.addLocalFolder(`${__dirname}/${value}`, `/${value}`)
        else zip.addLocalFile(`${__dirname}/${value}`)
    })
    const formData = new FormData()
    formData.append(
        "zipFile",
        new Blob([zip.toBuffer()], { type: "application/zip" }),
        "zip.zip"
    )
    fetch(`http://${Bun.env.SERVER_IP_ADDRESS}:3000`, {
        method: "POST",
        body: formData,
    })
        .then((response) =>
            response.text().then((result) => console.log(result))
        )
        .catch((error) => console.log(error))
}

update()
