const bcrypt = require("bcrypt");
/**
 * 
 * @param {string} password 
 * @returns {Promise<string>}
 */
async function encrypt(password) {
    return new Promise(async (resolve, reject) => {
        try {
            const salt = await bcrypt.genSalt();
            const encrypted = await bcrypt.hash(password, salt);
            resolve(encrypted);
        } catch (error) {
            reject(error);
        }
    });
}
/**
 * 
 * @param {string} password 
 * @param {string} encrypted 
 * @returns {Promise<boolean>}
 */
async function verify(password, encrypted) {
    return new Promise(async (resolve, reject) => {
        try {
            verified = await bcrypt.compare(password, encrypted);
            resolve(verified);
        } catch (error) {
            reject(error);
        }
    });
}
module.exports = { encrypt, verify };