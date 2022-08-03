const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        clientId: {
            "type":String,
            "required":true
        },
        name: String,
        role:{
            type:Object
        },
        deleted:{
            type: Boolean,
            default: false
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
