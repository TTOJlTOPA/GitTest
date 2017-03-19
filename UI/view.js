let user = JSON.parse(localStorage.getItem("user"));

let articleView = (function () {
    const USER_NAME = document.querySelector(".user");
    const HEADER_ACTIONS = document.querySelector(".header-actions");
    const TAG_TEMPLATE = document.querySelector("#template-tag");
    const TAG_LIST = document.querySelector(".tag-list");

    function view(article) {
        const ARTICLE_ACTIONS = document.querySelector(".article-actions");
        const EDIT_BUTTON = document.querySelector("#template-edit-button");
        const DELETE_BUTTON = document.querySelector("#template-delete-button");
        TAG_LIST.innerHTML = "";
        ARTICLE_ACTIONS.innerHTML = "";
        document.querySelector(".article-view").dataset.id = article.id;
        document.querySelector(".title").textContent = article.title;
        document.querySelector(".author").textContent = article.author;
        document.querySelector(".date").textContent = dateToString(article.createdAt);
        document.querySelector(".content").textContent = article.content;
        article.tags.forEach(function (tag) {
            TAG_TEMPLATE.content.querySelector(".tag").textContent = tag;
            TAG_LIST.appendChild(TAG_TEMPLATE.content.querySelector(".tag").cloneNode(true));
        });
        if (user != null) {
            ARTICLE_ACTIONS.appendChild(EDIT_BUTTON.content.querySelector(".edit-button").cloneNode(true));
            ARTICLE_ACTIONS.appendChild(DELETE_BUTTON.content.querySelector(".delete-button").cloneNode(true));
        }
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
        view: view,
        headerConfig: headerConfig
    };
}());

document.addEventListener("ArticleLoader", loadArticle());

function loadArticle() {
    let article = JSON.parse(localStorage.getItem("article"), function (key, value) {
        if (key == 'createdAt') {
            return new Date(value);
        }
        return value;
    });
    articleView.headerConfig();
    articleView.view(article);
}

let loginLogout = document.querySelector(".login-logout-button");
loginLogout.addEventListener("click", handleLoginLogoutClick);

function handleLoginLogoutClick() {
    if(user != null) {
        localStorage.setItem("user", JSON.stringify(null));
    }
}