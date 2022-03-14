const db = require("mongoose");
db.connect("mongodb://127.0.0.1:27017/mypost", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const userSchema = db.Schema({
    username: {
        type: String,
        require: true,
        unique: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    },
    fullName: String,
    age: Number,
    address: String,
    img : String,
    createdAt:{
        type: Date,
        default: new Date()
    }
});

const User = db.model("User", userSchema);
module.exports = User;