var express = require('express');
var router = express.Router();
var MyPost = require("../models/mypost.js");
var User = require("../models/user.js");
var md5 = require("md5");
// dang xuat
router.get('/logout', function (req, res, next) {
    req.session.userId = undefined,
    req.session.username = undefined;
    res.redirect("/");
});
// dang nhap xong ẩn register va login trên menu
router.get('*', function (req, res, next) {
    res.locals.userId = req.session.userId;
    next()
});
/* GET home page. */
router.get('/',async function (req, res, next) {
    let tranghientai = req.query.page || 1;
    let baivietmoitrang = 3;
    const tongsobaiviet = await MyPost.find({}).countDocuments();
    const trangcuoicung = Math.ceil(tongsobaiviet / baivietmoitrang);
    const Posts = await MyPost.find()
        .sort('field -createdAt')
        .skip((tranghientai - 1) * baivietmoitrang)
        .limit(baivietmoitrang)
    if (Posts) {
        res.render("index.ejs", { posts: Posts, tranghientai, tongsobaiviet, trangcuoicung, edit: false })
    }

});
// pagination page
router.get('/pagination', function (req, res, next) {
    res.redirect("/pagination/1")
});
router.get('/pagination/:page', function (req, res, next) {
    let perPage = 3;
    let page = req.params.page || 1;

    MyPost.find()
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec((err, posts) => {
            MyPost.countDocuments((err, count) => {
                if (err) return next(err);
                res.render("pagination.ejs", {
                    posts,
                    current: page,
                    pages: Math.ceil(count / perPage)
                })
            })
        })
});
// -----------------------post page--------------------
router.get('/post/:id', async function (req, res, next) {
    const Post = await MyPost.findById({ _id: req.params.id })
    if (Post){
        Post.save(err=>res.render('post', { dulieu: Post })) 
    }
});
// ---------------------contact page----------------
router.get('/contact', function (req, res, next) {
    res.render('contact');
});
// -------------------create page------------------------
router.get('/create', function (req, res, next) {
    if (req.session.userId) {
        res.render('./admin/create.ejs', { uName: req.session.username });
    } else {
        res.redirect('/login');
    }
});
router.post('/create', function (req, res, next) {
    if (!req.body.username || !req.body.title || !req.body.subtitle || !req.body.content || !req.files) {
        res.redirect("/create");
    } else {
        let hinhanh = req.files.hinhnen;
        let myPath = 'public/assets/img/posts/' + hinhanh.name;
        hinhanh.mv(myPath, err => {
            if (err) return res.status(500).send(err);
            const mp = new MyPost({
                username: req.body.username,
                title: req.body.title,
                subtitle: req.body.subtitle,
                content: req.body.content,
                image: hinhanh.name
            })
            mp.save(error => res.redirect("/"));
        })
    }
});
// -------------------------register-----------------------------
router.get('/register', function (req, res, next) {
    res.render('register.ejs');
});
router.post("/register", function (req, res, next) {
    if (req.body.username.length === 0 || req.body.email.length === 0 || req.body.password.length === 0 || req.body.fullName.length === 0) {
        res.redirect("/register")
    } else {
        if (!req.files) {
            let user = new User({
                username: req.body.username,
                email: req.body.email,
                password: md5(req.body.password),
                fullName: req.body.fullName,
                age: req.body.age,
                address: req.body.address,
                img: ""
            });
            user.save(error => {
                if (error) return res.redirect("/register")
                res.redirect("/")
            })
        } else {
            let hinhanh = req.files.img;
            let myPath = 'public/assets/img/avatar/' + hinhanh.name;
            hinhanh.mv(myPath, (err) => {
                if (err) return res.status(500).send(err);
                let user = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: md5(req.body.password),
                    fullName: req.body.fullName,
                    age: req.body.age,
                    address: req.body.address,
                    img: hinhanh.name
                });
                user.save(error => {
                    if (error) return res.redirect("/register")
                    res.redirect("/")
                })
            })
        }
    }
});
// --------------------------login------------------------------
router.get('/login', function (req, res, next) {
    res.render('login.ejs');
});
router.post('/login', async function (req, res, next) {
    const { email, password } = req.body;
    if (email.length === 0 || password.length === 0) {
        res.redirect("/login");
    } else {
        const nguoidung = await User.findOne({ email: email });
        if (nguoidung) {
            // const isValid = await bcrypt.compare(req.body.password, nguoidung.password);
            const isValid = (md5(password) === nguoidung.password) ? true : false;
            if (isValid) {
                req.session.userId = nguoidung._id;
                req.session.username = nguoidung.username
                res.redirect("/");
            } else res.redirect("/login");
        } else {
            res.redirect("/login")
        }
    }
});
// ----------------------------Info------------------------------
router.get('/info', async (req, res, next) => {
    if (req.session.userId) {
        const nguoidung = await User.findById({ _id: req.session.userId })
        if (nguoidung)
            res.render("./admin/info.ejs", { dl: nguoidung, admin: true, follow:false });
        else res.redirect("/")
    } else res.redirect("/login")
})
router.get('/editInfo/:id', async (req, res, next) => {
    const nguoidung = await User.findById({ _id: req.params.id });
    if (nguoidung)
        res.render("./admin/editInfo.ejs", { dl: nguoidung });
})
router.post('/editInfo', async (req, res, next) => {
    if (req.body.username.length === 0 || req.body.email.length === 0 || req.body.fullName.length === 0 || req.body.age.length === 0 || req.body.address.length === 0) {
        res.redirect(`/editInfo/${req.body.id}`)
    } else {
        const nguoidung = await User.findById({ _id: req.body.id });
        if (nguoidung) {
            nguoidung.username = req.body.username;
            nguoidung.email = req.body.email;
            nguoidung.fullName = req.body.fullName;
            nguoidung.age = req.body.age;
            nguoidung.address = req.body.address;
            if (!req.files || Object.keys(req.files).length === 0) {
                nguoidung.save(error => res.redirect(`/info`));
            } else {
                let hinhanh = req.files.img;
                let myPath = 'public/assets/img/avatar/' + hinhanh.name;
                hinhanh.mv(myPath, (err) => {
                    if (err) return res.status(500).send(err);
                    nguoidung.img = hinhanh.name;
                    nguoidung.save(error => res.redirect("/info"))
                })
            }
        }

    }
})
router.get('/editPassword/:id', async (req, res, next) => {
    const nguoidung = await User.findById({ _id: req.params.id });
    if (nguoidung)
        res.render("./admin/editPassword.ejs", { dl: nguoidung });
})
router.post('/editPassword', async (req, res, next) => {
    const { id, passwordold, passwordnew } = req.body;
    if (passwordold.length === 0 || passwordnew.length === 0) {
        res.redirect(`/editPassword/${id}`);
    } else {
        const nguoidung = await User.findById({ _id: id });
        if (nguoidung) {
            const isValid = (md5(password) === nguoidung.password) ? true : false;
            if (isValid) {
                nguoidung.password = passwordnew;
                res.redirect(`/info`);
            } else
                res.redirect(`/editPassword/${id}`);
        } else
            res.redirect(`/editPassword/${id}`);
    }
})
router.get("/info/:username", async (req, res, next) => {
    
    const nguoidung = await User.findOne({ "username": req.params.username });
    if (nguoidung){
        if (nguoidung.username === req.session.username) {
            res.redirect("/info");
        }else{
            if(req.session.userId)
                res.render("./admin/info.ejs", { dl: nguoidung, admin: false, follow:true});
            else res.render("./admin/info.ejs", { dl: nguoidung, admin: false, follow:false });
        }
    }
    else res.redirect("/");
})
// --------------------------edit/delete post----------------------------
router.get("/myposts", async function (req, res, next) {
    let tranghientai = req.query.page || 1;
    let baivietmoitrang = 3;
    const tongsobaiviet = await MyPost.find({ username: req.session.username }).countDocuments();
    const trangcuoicung = Math.ceil(tongsobaiviet / baivietmoitrang);
    const Posts = await MyPost.find({ username: req.session.username })
        .sort('field -createdAt')
        .skip((tranghientai - 1) * baivietmoitrang)
        .limit(baivietmoitrang)
    if (Posts) {
        res.render("index.ejs", { posts: Posts, tranghientai, tongsobaiviet, trangcuoicung, edit: true })
    }
})
router.get("/editPost/:id", async (req, res, next) => {
    const Post = await MyPost.findById({ _id: req.params.id });
    if (Post)
        res.render("./admin/editPost.ejs", { dl: Post });
    else res.redirect("/");
})
router.post("/editPost", async (req, res, next) => {
    if (!req.body.username || !req.body.title || !req.body.subtitle || !req.body.content)
        res.redirect(`/editPost/${req.body.id}`);
    else {
        const Post = await MyPost.findById({ _id: req.body.id });
        if (Post) {
            Post.title = req.body.title;
            Post.subtitle = req.body.subtitle;
            Post.content = req.body.content;
            if (!req.files || Object.keys(req.files).length === 0)
                Post.save(error => res.redirect(`/myposts`));
            else {
                let hinhanh = req.files.img;
                let myPath = 'public/assets/img/posts/' + hinhanh.name;
                hinhanh.mv(myPath, (err) => {
                    if (err) return res.status(500).send(err);
                    Post.image = hinhanh.name;
                    Post.save(error => res.redirect("/myposts"))
                })
            }
        }
    }
})
router.get("/deletePost/:id", async (req, res, next) => {
    const id = req.params.id;
    const Post = await MyPost.deleteOne({ _id: id });
    if (!Post) return handleError(err);
    else res.redirect("/");
});
module.exports = router;
