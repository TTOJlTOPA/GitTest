const MongoClient = require('mongodb').MongoClient;
let mongodb;

function connect(url, done) {
    if (mongodb) {
        done();
    } else {
        MongoClient.connect(url, (err, db) => {
            if (err) {
                done(err);
            } else {
                mongodb = db;
                done();
            }
        });
    }
}

function getArticles() {
    return mongodb.collection('articles').find().toArray();
}

function getArticleById(articleId) {
    return mongodb.collection('articles').findOne({id: articleId});
}

function getTags() {
    return mongodb.collection('tags').find().toArray();
}

function getUsers() {
    return mongodb.collection('users').find().toArray();
}

function insertArticle(article) {
    return mongodb.collection('articles').insert(article);
}

function insertTag(tag) {
    return mongodb.collection('tags').insert(tag);
}

function editArticle(articleId, newArticle) {
    return mongodb.collection('articles').updateOne({id: articleId}, newArticle);
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