const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongo = require('./db');
const app = express();

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
    }, (username, password, done) => {
        let user;
        mongo.getUsers()
            .then(value => {
                user = value.find(userCur => userCur.login === username);
                done(null, (!user || user.password !== password) ? false : user);
            })
            .catch(error => console.log(error));
}));

passport.serializeUser((user, done) => done(null, user.login));

passport.deserializeUser((login, done) => {
    let user;
    mongo.getUsers()
        .then(value => {
            user = value.find(userCur => userCur.login === login);
            done(null, (user) ? user : false);
        })
        .catch(error => console.log(error));
});

app.set('port', (process.env.PORT || 3000));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

mongo.connect('mongodb://localhost:27017/siteEP', (err) => {
    if (err) {
        console.log(err);
    } else {
        app.listen(app.get('port'), () => console.log("Server running in the 90's on port: ", app.get('port')));
    }
});

app.get('/user', (req, res) => mongo.getUsers()
    .then(value => res.json(value.sort((a, b) => {
        if (a.login.toLowerCase() < b.login.toLowerCase()) {
            return -1;
        }
        if (a.login.toLowerCase() > b.login.toLowerCase()) {
            return 1;
        }
        return 0;
    })))
    .catch(error => console.log(error)));
        
app.get('/authors', (req, res) => mongo.getUsers()
    .then(value => res.json(value.map(user => user.login).sort((a, b) => {
            if (a.toLowerCase() < b.toLowerCase()) {
                return -1;
            }
            if (a.toLowerCase() > b.toLowerCase()) {
                return 1;
            }
            return 0;
        })))
    .catch(error => console.log(error)));

app.get('/article', (req, res) => mongo.getArticles()
    .then(value => res.json(value.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())))
    .catch(error => console.log(error)));

app.get('/article/:id', (req, res) => mongo.getArticleById(req.query.id)
    .then(value => res.json(value))
    .catch(error => console.log(error)));

app.get('/length', (req, res) => mongo.getArticles()
    .then(value => res.json(value.length))
    .catch(error => console.log(error)));

app.get('/tags', (req, res) => mongo.getTags()
    .then(value => res.json((req.query.tag) ? value.map(tagObj => tagObj.tag).find(tag => req.query.tag === tag) :
        value.map(tagObj => tagObj.tag).sort((a, b) => {
        if (a.toLowerCase() < b.toLowerCase()) {
            return -1;
        }
        if (a.toLowerCase() > b.toLowerCase()) {
            return 1;
        }
        return 0;
    })))
    .catch(error => console.log(error)));

app.get('/login', (req, res) => res.json(null));

app.post('/article', (req, res) => {
    const article = {
        id: req.body.id,
        title: req.body.title,
        summary: req.body.summary,
        createdAt: new Date(req.body.createdAt),
        author: req.body.author,
        tags: req.body.tags,
        content: req.body.content,
        isHidden: false,
    };
    mongo.insertArticle(article)
        .then(() => mongo.getArticles()
            .then(value => res.json(value.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())))
            .catch(error => console.log(error)))
        .catch(error => console.log(error));
});

app.post('/tag', (req, res) => mongo.insertTag({tag: req.body.tag})
    .then(() => mongo.getTags()
        .then(value => res.json(value.map(tagObj => tagObj.tag).sort((a, b) => {
        if (a.toLowerCase() < b.toLowerCase()) {
            return -1;
        }
        if (a.toLowerCase() > b.toLowerCase()) {
            return 1;
        }
        return 0;
    })))
        .catch(error => console.log(error)))
    .catch(error => console.log(error)));

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => res.json(req.user.login));

app.put('/article', (req, res) => mongo.getArticleById(req.body.id)
    .then(value => {
        value.summary = req.body.summary;
        value.title = req.body.title;
        value.tags = req.body.tags;
        value.content = req.body.content;
        mongo.editArticle(value.id, value)
            .then(() => mongo.getArticles()
                .then(articles => res.json(articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())))
                .catch(error => console.log(error)))
            .catch(error => console.log(error))
        })
    .catch(error => console.log(error)));

app.delete('/article', (req, res) => mongo.getArticleById(req.body.id)
    .then(value => {
        value.isHidden = true;
        mongo.editArticle(value.id, value)
            .then(() => mongo.getArticles()
                .then(articles => res.json(articles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())))
                .catch(error => console.log(error)))
            .catch(error => console.log(error))
    })
    .catch(error => console.log(error)));
