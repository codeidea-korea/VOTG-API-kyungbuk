const crypto = require('crypto')
const ENCRYPTION_KEY = process.env.CRT_SECRET

module.exports = (password) => {
    const textParts = password.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    const decrypted = decipher.update(encryptedText)

    return Buffer.concat([decrypted, decipher.final()]).toString()
}
