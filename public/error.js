let user = JSON.parse(localStorage.getItem("user"));

let errorView = (function () {
    const USER_NAME = document.querySelector(".user");
    const HEADER_ACTIONS = document.querySelector(".header-actions");

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
        headerConfig: headerConfig
    };
}());

document.addEventListener("Error", errorLoad());

function errorLoad() {
    errorView.headerConfig();
}

let loginLogout = document.querySelector(".login-logout-button");
loginLogout.addEventListener("click", handleLoginLogoutClick);

function handleLoginLogoutClick() {
    if(user != null) {
        localStorage.setItem("user", JSON.stringify(null));
    }
}