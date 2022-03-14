const db = require("mongoose");
db.connect("mongodb://127.0.0.1:27017/mypost", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const postSchema = db.Schema({
    username:String,
    title: String,
    subtitle: String,
    content: String,
    image: String,
    createdAt:{
        type: Date,
        default: new Date()
    }
})
const Post = db.model("Post", postSchema);
module.exports = Post;