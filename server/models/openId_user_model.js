const mongoose = require('mongoose');
const OpenIdUser = new mongoose.Schema(
    {
        name: { type: String, require: true },
        email: { type: String, require: true, unique: true },
        quote: { type: String },
    },
    {
        collection: 'openid_user_data'
    }
)

const model = mongoose.model('OpenIdUserData', OpenIdUser)

module.exports = model