const user = JSON.parse(localStorage.getItem("user"));
let ARTICLES_INDEX_FROM = JSON.parse(localStorage.getItem("from")) || 0;
let ARTICLES_INDEX_TO = JSON.parse(localStorage.getItem("to")) || 10;

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
    const DYNAMIC_BLOCK = document.querySelector(".dynamic-block");
    const ARTICLE_LIST_TEMPLATE = document.querySelector("#template-article-list");
    const ARTICLE_TEMPLATE = document.querySelector("#template-article");
    const TAG_TEMPLATE = document.querySelector("#template-tag");
    const TAG_LIST = ARTICLE_TEMPLATE.content.querySelector(".tag-list");
    const FILTERS_TEMPLATE = document.querySelector("#template-filters");
    const PAGINATOR_TEMPLATE = document.querySelector("#template-paginator");
    const NEXT_BUTTON_TEMPLATE = document.querySelector("#template-pagination-next-button");
    const PREV_BUTTON_TEMPLATE = document.querySelector("#template-pagination-prev-button");
    let ARTICLE_LIST;
    let PAGINATOR;

    function appendArticles(articles) {
        document.querySelector(".feed").textContent = "Лента новостей";
        DYNAMIC_BLOCK.appendChild(ARTICLE_LIST_TEMPLATE.content.querySelector(".article-list").cloneNode(true));
        ARTICLE_LIST = document.querySelector(".article-list");
        createArticles(articles).forEach(function (article) {
            ARTICLE_LIST.appendChild(article);
        });
        ARTICLE_LIST.addEventListener("click", handleArticleListButtonClick);
        DYNAMIC_BLOCK.appendChild(FILTERS_TEMPLATE.content.querySelector(".filters").cloneNode(true));
        DYNAMIC_BLOCK.appendChild(PAGINATOR_TEMPLATE.content.querySelector(".paginator").cloneNode(true));
        PAGINATOR = document.querySelector(".paginator");
        if (articlesService.numberOfArticles() > ARTICLES_INDEX_TO) {
            PAGINATOR.appendChild(NEXT_BUTTON_TEMPLATE.content.querySelector(".pagination-next-button").cloneNode(true));
        }
        if (ARTICLES_INDEX_FROM > 0) {
            PAGINATOR.appendChild(PREV_BUTTON_TEMPLATE.content.querySelector(".pagination-prev-button").cloneNode(true));
        }
        PAGINATOR.addEventListener("click", handlePaginatorClick);
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
        ARTICLE_TEMPLATE.content.querySelector(".content-block").innerHTML = "";
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
        headerConfig: headerConfig
    };
}());

let articleView = (function () {
    const DYNAMIC_BLOCK = document.querySelector(".dynamic-block");
    const ARTICLE_TEMPLATE = document.querySelector("#template-article");
    const TAG_TEMPLATE = document.querySelector("#template-tag");
    const TAG_LIST = ARTICLE_TEMPLATE.content.querySelector(".tag-list");
    const RETURN_BUTTON_TEMPLATE = document.querySelector("#template-return-button");

    function loadArticle() {
        let article;
        DYNAMIC_BLOCK.innerHTML = "";
        document.querySelector(".feed").textContent = "Просмотр новости";
        DYNAMIC_BLOCK.appendChild(RETURN_BUTTON_TEMPLATE.content.querySelector(".return-button-block").cloneNode(true));
        article = createArticle();
        article.className = "article-view";
        console.log(article.className);
        console.log(DYNAMIC_BLOCK.className);
        DYNAMIC_BLOCK.appendChild(article);
        document.querySelector(".return-button-block").addEventListener("click", handleReturnButtonClick);
    }

    function createArticle() {
        const ARTICLE_ACTIONS = ARTICLE_TEMPLATE.content.querySelector(".article-actions");
        const ARTICLE_CONTENT_BLOCK = ARTICLE_TEMPLATE.content.querySelector(".content-block");
        const EDIT_BUTTON_TEMPLATE = document.querySelector("#template-edit-button");
        const DELETE_BUTTON_TEMPLATE = document.querySelector("#template-delete-button");
        const ARTICLE_CONTENT_TEMPLATE = document.querySelector("#template-content");
        let article = articlesService.getArticle(JSON.parse(localStorage.getItem("articleID")));
        TAG_LIST.innerHTML = "";
        ARTICLE_ACTIONS.innerHTML = "";
        ARTICLE_CONTENT_BLOCK.innerHTML = "";
        ARTICLE_TEMPLATE.content.querySelector(".article").dataset.id = article.id;
        ARTICLE_TEMPLATE.content.querySelector(".title").textContent = article.title;
        ARTICLE_TEMPLATE.content.querySelector(".author").textContent = article.author;
        ARTICLE_TEMPLATE.content.querySelector(".date").textContent = dateToString(article.createdAt);
        ARTICLE_TEMPLATE.content.querySelector(".summary").textContent = "";
        ARTICLE_CONTENT_TEMPLATE.content.querySelector(".content").textContent = article.content;
        ARTICLE_CONTENT_BLOCK.appendChild(ARTICLE_CONTENT_TEMPLATE.content.querySelector(".content").cloneNode(true));
        article.tags.forEach(function (tag) {
            TAG_TEMPLATE.content.querySelector(".tag").textContent = tag;
            TAG_LIST.appendChild(TAG_TEMPLATE.content.querySelector(".tag").cloneNode(true));
        });
        if (user != null) {
            ARTICLE_ACTIONS.appendChild(EDIT_BUTTON_TEMPLATE.content.querySelector(".edit-button").cloneNode(true));
            ARTICLE_ACTIONS.appendChild(DELETE_BUTTON_TEMPLATE.content.querySelector(".delete-button").cloneNode(true));
        }
        return ARTICLE_TEMPLATE.content.querySelector(".article").cloneNode(true);
    }

    function dateToString(date) {
        return date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + " " + date.getHours() + ":" +
            date.getMinutes();
    }

    return {
        loadArticle: loadArticle
    };
}());

let authorizationForm = (function () {
    const DYNAMIC_BLOCK = document.querySelector(".dynamic-block");
    const RETURN_BUTTON_TEMPLATE = document.querySelector("#template-return-button");
    const AUTHORIZATION_INPUT_TEMPLATE = document.querySelector("#template-authorization-input-block");
    const LOGIN_BUTTON_TEMPLATE = document.querySelector("#template-login-button");

    function loadForm() {
        DYNAMIC_BLOCK.innerHTML = "";
        document.querySelector(".feed").textContent = "Авторизация";
        DYNAMIC_BLOCK.appendChild(RETURN_BUTTON_TEMPLATE.content.querySelector(".return-button-block").cloneNode(true));
        document.querySelector(".return-button-block").addEventListener("click", handleReturnButtonClick);
        DYNAMIC_BLOCK.appendChild(AUTHORIZATION_INPUT_TEMPLATE.content.querySelector(".authorization-input-block").cloneNode(true));
        DYNAMIC_BLOCK.appendChild(LOGIN_BUTTON_TEMPLATE.content.querySelector(".login-button-block").cloneNode(true));
        document.querySelector(".authorization-input-block").addEventListener("input", handleAuthorizationInput);
        document.querySelector(".login-button-block").addEventListener("click", handleLoginButtonClick);
    }

    return {
        loadForm: loadForm
    };
}());

document.addEventListener("FeedLoader", loadFeed());

document.querySelector(".login-logout-button").addEventListener("click", handleLoginLogoutClick);

function loadFeed() {
    articlesLogic.headerConfig();
    appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
}

function appendArticles(from, to) {
    document.querySelector(".dynamic-block").innerHTML = "";
    articlesLogic.appendArticles(articlesService.getArticles(from, to));
}

function handleReturnButtonClick() {
    appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
}

function handleArticleListButtonClick(event) {
    if (event.target.textContent == "Показать новость") {
        localStorage.setItem("articleID", JSON.stringify(event.target.parentNode.parentNode.dataset.id));
        articleView.loadArticle();
    }
}

function handleLoginLogoutClick() {
    if(user != null) {
        localStorage.setItem("user", JSON.stringify(null));
        document.querySelector(".user").innerHTML = "Гость";
    } else {
        authorizationForm.loadForm();
    }
}

function handlePaginatorClick(event) {
    if (event.target.textContent.includes("Далее")) {
        ARTICLES_INDEX_FROM += 10;
        ARTICLES_INDEX_TO += 10;
    }
    if (event.target.textContent.includes("Назад")) {
        ARTICLES_INDEX_FROM -= 10;
        ARTICLES_INDEX_TO -= 10;
    }
    localStorage.setItem("from", JSON.stringify(ARTICLES_INDEX_FROM));
    localStorage.setItem("to", JSON.stringify(ARTICLES_INDEX_TO));
    appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
}

function handleAuthorizationInput() {
    localStorage.setItem("user", JSON.stringify(document.forms[0].elements[0].value));
    appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
}

function handleLoginButtonClick() {
    appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
}