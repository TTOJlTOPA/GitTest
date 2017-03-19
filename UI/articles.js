const user = JSON.parse(localStorage.getItem("user"));
let ARTICLES_INDEX_FROM = JSON.parse(sessionStorage.getItem("from")) || 0;
let ARTICLES_INDEX_TO = JSON.parse(sessionStorage.getItem("to")) || 10;

let articlesService = (function () {
    let articles = JSON.parse(localStorage.getItem("articles"), function (key, value) {
        if (key == 'createdAt') {
            return new Date(value);
        }
        return value;
    });

    let tags = JSON.parse(localStorage.getItem("tags"));

    function getArticles(skip, top, filterConfig) {
        let result = articles;
        let from = skip || 0;
        let number = top || 10;
        if (filterConfig != undefined) {
            if (filterConfig.author != undefined) {
                result = result.filter(function (element) {
                    return element.author == filterConfig.author;
                })
            }
            if (filterConfig.dateFrom != undefined) {
                result = result.filter(function (element) {
                    return element.createdAt.getTime() >= filterConfig.dateFrom.getTime();
                })
            }
            if (filterConfig.dateTo != undefined) {
                result = result.filter(function (element) {
                    return element.createdAt.getTime() <= filterConfig.dateTo.getTime();
                })
            }
            if (filterConfig.tags != undefined && filterConfig.tags.length != 0) {
                result = result.filter(function (element) {
                    return filterConfig.tags.every(function (tag) {
                        return element.tags.indexOf(tag) >= 0;
                    })
                })
            }
        }
        result.sort(function (a, b) {
            return b.createdAt.getTime() - a.createdAt.getTime();
        });
        return result.slice(from, from + number);
    }

    function getArticle(findId) {
        return articles.find(function (element) {
            return element.id == findId;
        });
    }

    function validateArticle(article) {
        if (article.id != undefined &&
            (typeof(article.id) != "string" || article.id.length == 0) && articles.filter(function (element) {
                return element.id == article.id;
            }).length != 0) {
            return false;
        } else if (article.title != undefined &&
            (typeof(article.title) != "string" || article.title.length > 100 || article.title.length == 0)) {
            return false;
        } else if (article.tags != undefined &&
            (!(article.tags instanceof Array) || article.tags.length == 0 || article.tags.length > 5)) {
            return false;
        } else if (article.summary != undefined &&
            (typeof(article.summary) != "string" || article.summary.length == 0 || article.summary.length > 200)) {
            return false;
        } else if (article.createdAt != undefined && !(article.createdAt instanceof Date)) {
            return false;
        } else if (article.author != undefined && (typeof(article.author) != "string" || article.author.length == 0)) {
            return false;
        } else if (article.content != undefined && (typeof(article.content) != "string" || article.content.length == 0)) {
            return false;
        } else return !(article.tags != undefined && !article.tags.every(function (tag) {
            return tags.indexOf(tag) >= 0 && typeof(tag) == "string";
        }));
    }

    function addArticle(article) {
        let prevSize = articles.length;
        let newSize;
        if (!validateArticle(article)) {
            return false;
        } else {
            newSize = articles.push(article);
            if (prevSize != newSize) {
                localStorage.setItem("articles", articles);
            }
            return prevSize != newSize;
        }
    }

    function removeArticle(removeId) {
        let removeIndex = articles.findIndex(function (element) {
            return element.id == removeId;
        });
        if (removeIndex != -1) {
            articles.splice(removeIndex, 1);
            localStorage.setItem("articles", articles);
            return true;
        } else {
            return false;
        }
    }

    function editArticle(editId, article) {
        let editIndex = articles.findIndex(function (element) {
            return element.id == editId;
        });
        if (!validateArticle(article) || editIndex < 0) {
            return false;
        }
        if (article.title != undefined) {
            articles[editIndex].title = article.title;
        }
        if (article.summary != undefined) {
            articles[editIndex].summary = article.summary;
        }
        if (article.tags != undefined) {
            articles[editIndex].tags = article.tags;
        }
        if (article.content != undefined) {
            articles[editIndex].content = article.content;
        }
        localStorage.setItem("articles", articles);
        return true;
    }

    function numberOfArticles() {
        return articles.length;
    }

    return {
        getArticles: getArticles,
        getArticle: getArticle,
        validateArticle: validateArticle,
        addArticle: addArticle,
        removeArticle: removeArticle,
        editArticle: editArticle,
        numberOfArticles: numberOfArticles
    };
}());

let articlesLogic = (function () {
    const USER_NAME = document.querySelector(".user");
    const HEADER_ACTIONS = document.querySelector(".header-actions");
    const ARTICLE_TEMPLATE = document.querySelector("#template-article");
    const ARTICLE_LIST = document.querySelector(".article-list");
    const TAG_TEMPLATE = document.querySelector("#template-tag");
    const TAG_LIST = ARTICLE_TEMPLATE.content.querySelector(".tag-list");

    function appendArticles(articles) {
        createArticles(articles).forEach(function (article) {
            ARTICLE_LIST.appendChild(article);
        });

    }

    function createArticles(articles) {
        return articles.map(function (article) {
            return createArticle(article);
        });
    }

    function createArticle(article) {
        const ARTICLE_ACTIONS = ARTICLE_TEMPLATE.content.querySelector(".article-actions");
        const VIEW_BUTTON_TEMPLATE = document.querySelector("#template-view-button");
        const EDIT_BUTTON_TEMPLATE = document.querySelector("#template-edit-button");
        const DELETE_BUTTON_TEMPLATE = document.querySelector("#template-delete-button");
        TAG_LIST.innerHTML = "";
        ARTICLE_ACTIONS.innerHTML = "";
        ARTICLE_TEMPLATE.content.querySelector(".article").dataset.id = article.id;
        ARTICLE_TEMPLATE.content.querySelector(".title").textContent = article.title;
        ARTICLE_TEMPLATE.content.querySelector(".author").textContent = article.author;
        ARTICLE_TEMPLATE.content.querySelector(".date").textContent = dateToString(article.createdAt);
        ARTICLE_TEMPLATE.content.querySelector(".summary").textContent = article.summary;
        article.tags.forEach(function (tag) {
            TAG_TEMPLATE.content.querySelector(".tag").textContent = tag;
            TAG_LIST.appendChild(TAG_TEMPLATE.content.querySelector(".tag").cloneNode(true));
        });
        if (user != null) {
            ARTICLE_ACTIONS.appendChild(EDIT_BUTTON_TEMPLATE.content.querySelector(".edit-button").cloneNode(true));
        }
        ARTICLE_ACTIONS.appendChild(VIEW_BUTTON_TEMPLATE.content.querySelector(".view-button").cloneNode(true));
        if (user != null) {
            ARTICLE_ACTIONS.appendChild(DELETE_BUTTON_TEMPLATE.content.querySelector(".delete-button").cloneNode(true));
        }
        return ARTICLE_TEMPLATE.content.querySelector(".article").cloneNode(true);
    }

    function dateToString(date) {
        return date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + " " + date.getHours() + ":" +
            date.getMinutes();
    }

    function removeArticlesAll() {
        ARTICLE_LIST.innerHTML = "";
    }

    function headerConfig() {
        const ADD_ARTICLE_TEMPLATE = document.querySelector("#template-add-article");
        const LOGIN_BUTTON_TEMPLATE = document.querySelector("#template-header-login-button");
        const LOGOUT_BUTTON_TEMPLATE = document.querySelector("#template-header-logout-button");
        const ADD_ARTICLE_HOLDER = HEADER_ACTIONS.querySelector(".add-article-holder");
        const LOGIN_LOGOUT_HOLDER = HEADER_ACTIONS.querySelector(".login-logout-holder");
        ADD_ARTICLE_HOLDER.innerHTML = "";
        LOGIN_LOGOUT_HOLDER.innerHTML = "";
        if (user == null) {
            USER_NAME.textContent = "Гость";
            LOGIN_LOGOUT_HOLDER.appendChild(LOGIN_BUTTON_TEMPLATE.content.querySelector(".login-logout-button").cloneNode(true));
        } else {
            ADD_ARTICLE_HOLDER.appendChild(ADD_ARTICLE_TEMPLATE.content.querySelector(".add-article").cloneNode(true));
            USER_NAME.textContent = user;
            LOGIN_LOGOUT_HOLDER.appendChild(LOGOUT_BUTTON_TEMPLATE.content.querySelector(".login-logout-button").cloneNode(true));
        }
    }

    return {
        appendArticles: appendArticles,
        removeArticlesAll: removeArticlesAll,
        headerConfig: headerConfig
    };
}());

document.addEventListener("FeedLoader", loadFeed());

function loadFeed() {
    articlesLogic.headerConfig();
    appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
}

function appendArticles(from, to) {
    const PAGINATOR = document.querySelector(".paginator");
    const NEXT_BUTTON_TEMPLATE = document.querySelector("#template-pagination-next-button");
    const PREV_BUTTON_TEMPLATE = document.querySelector("#template-pagination-prev-button");
    PAGINATOR.innerHTML = "";
    articlesLogic.removeArticlesAll();
    articlesLogic.appendArticles(articlesService.getArticles(from, to));
    if (articlesService.numberOfArticles() > ARTICLES_INDEX_TO) {
        PAGINATOR.appendChild(NEXT_BUTTON_TEMPLATE.content.querySelector(".pagination-next-button").cloneNode(true))
    }
    if (ARTICLES_INDEX_FROM > 0) {
        PAGINATOR.appendChild(PREV_BUTTON_TEMPLATE.content.querySelector(".pagination-prev-button").cloneNode(true))
    }
}

let articlesList = document.querySelector(".article-list");
articlesList.addEventListener("click", handleButtonClick);

function handleButtonClick(event) {
    if (event.target.textContent == "Показать новость") {
        localStorage.setItem("article", JSON.stringify(articlesService.getArticle(event.target.parentNode.parentNode.dataset.id)));
        return;
    }
}

let loginLogout = document.querySelector(".login-logout-button");
loginLogout.addEventListener("click", handleLoginLogoutClick);

function handleLoginLogoutClick() {
    if(user != null) {
        localStorage.setItem("user", JSON.stringify(null));
    }
}

let paginatorButtons = document.querySelector(".paginator");
paginatorButtons.addEventListener("click", handlePaginatorClick);

function handlePaginatorClick(event) {
    if (event.target.textContent.includes("Далее")) {
        sessionStorage.setItem("from", JSON.stringify(ARTICLES_INDEX_FROM + 10));
        sessionStorage.setItem("to", JSON.stringify(ARTICLES_INDEX_TO + 10));
    }
    if (event.target.textContent.includes("Назад")) {
        sessionStorage.setItem("from", JSON.stringify(ARTICLES_INDEX_FROM - 10));
        sessionStorage.setItem("to", JSON.stringify(ARTICLES_INDEX_TO - 10));
    }
}