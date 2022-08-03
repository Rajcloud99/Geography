const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        "userId": {
            "type": String,
            "required": true
        },
        "deleted": {
            type: Boolean,
            default: false
        },
        "clientId": {
            "type": Number,
            "required": true
        },
        "name": {
            type: String,
            required: true
        },
        "mobile": {
            type: Number,
            required: true
        },
        "password": {
            type: String,
            "required": true
        },
        "access": {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'accessControl'
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "last_modified_at"
        },
    }
);

UserSchema.index({userId: 1}, {unique: true, partialFilterExpression: {deleted: {$eq: false}}});

module.exports = mongoose.model('User', UserSchema);
