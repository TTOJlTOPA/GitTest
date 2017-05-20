const mongoose = require('mongoose');
let mongodb;

const ArticleSchema = mongoose.Schema({
    id: String,
    title: String,
    summary: String,
    createdAt: Date,
    author: String,
    tags: Array,
    content: String,
    isHidden: Boolean,
});
const TagSchema = mongoose.Schema({
    tag: String,
});
const UserSchema = mongoose.Schema({
    login: String,
    password: String,
});

const Articles = mongoose.model('Articles', ArticleSchema);
const Tags = mongoose.model('Tags', TagSchema);
const Users = mongoose.model('Users', UserSchema);

function connect(url, done) {
    mongoose.connect(url);
    mongodb = mongoose.connection;
    mongodb.on('error', () => console.log('error'));
    mongodb.once('open', () => {
        console.log('connected');
        done();
    });
}

function getArticles() {
    return Articles.find();
}

function getArticleById(articleId) {
    return Articles.findOne({ id: articleId });
}

function getTags() {
    return Tags.find();
}

function getUsers() {
    return Users.find();
}

function insertArticle(article) {
    return Articles.create(article);
}

function insertTag(tag) {
    return Tags.create(tag);
}

function editArticle(articleId, newArticle) {
    return Articles.update({ id: articleId }, newArticle);
}

module.exports = {
    connect,
    getArticles,
    getArticleById,
    getTags,
    getUsers,
    insertArticle,
    insertTag,
    editArticle,
};