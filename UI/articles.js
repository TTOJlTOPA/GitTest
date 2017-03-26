let user = JSON.parse(sessionStorage.getItem("user"));
let ARTICLES_INDEX_FROM = 0;
let ARTICLES_INDEX_TO = 10;

let articlesService = (function () {
    let articles = JSON.parse(localStorage.getItem("articles"), function (key, value) {
        if (key == "createdAt") {
            return new Date(value);
        }
        return value;
    });
    let tags = JSON.parse(localStorage.getItem("tags"));

    function getArticles(skip, top, filterConfig) {
        let result = articles;
        let from = skip || 0;
        let number = top || 10;
        result = result.filter(function (element) {
            return !element.isHidden;
        });
        if (filterConfig != undefined) {
            if (filterConfig.author != undefined && filterConfig.author != "") {
                result = result.filter(function (element) {
                    return element.author == filterConfig.author;
                })
            }
            if (filterConfig.dateFrom != undefined && filterConfig.dateFrom != null) {
                result = result.filter(function (element) {
                    return element.createdAt.getTime() >= filterConfig.dateFrom.getTime();
                })
            }
            if (filterConfig.dateTo != undefined && filterConfig.dateTo != null) {
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
        articles = result.slice(0, articles.length);
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
        resetArticles();
        if (!validateArticle(article)) {
            return false;
        } else {
            newSize = articles.push(article);
            if (prevSize != newSize) {
                localStorage.setItem("articles", JSON.stringify(articles));
            }
            return prevSize != newSize;
        }
    }

    function removeArticle(removeId) {
        let removeIndex = articles.findIndex(function (element) {
            return element.id == removeId;
        });
        resetArticles();
        if (removeIndex != -1) {
            articles.splice(removeIndex, 1);
            localStorage.setItem("articles", JSON.stringify(articles));
            return true;
        } else {
            return false;
        }
    }

    function editArticle(editId, article) {
        let editIndex = articles.findIndex(function (element) {
            return element.id == editId;
        });
        resetArticles();
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
        localStorage.setItem("articles", JSON.stringify(articles));
        return true;
    }

    function numberOfArticles() {
        return articles.length;
    }

    function resetArticles() {
        ARTICLES_INDEX_FROM = 0;
        ARTICLES_INDEX_TO = 10;
        articles = JSON.parse(localStorage.getItem("articles"), function (key, value) {
            if (key == 'createdAt') {
                return new Date(value);
            }
            return value;
        });
        sessionStorage.removeItem("filters");
    }

    function hideArticle(id) {
        let mainArticles = JSON.parse(localStorage.getItem("articles"));
        let article = mainArticles.find(function (element) {
            return element.id == id;
        });
        if (article != undefined) {
            article.isHidden = true;
        }
        article = getArticle(id);
        if (article != undefined) {
            article.isHidden = true;
        }
    }

    return {
        getArticles: getArticles,
        getArticle: getArticle,
        validateArticle: validateArticle,
        addArticle: addArticle,
        removeArticle: removeArticle,
        editArticle: editArticle,
        numberOfArticles: numberOfArticles,
        resetArticles: resetArticles,
        hideArticle: hideArticle
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

    function loadArticles(articles) {
        articlesLogic.headerConfig();
        document.querySelector(".feed").textContent = "Лента новостей";
        DYNAMIC_BLOCK.appendChild(ARTICLE_LIST_TEMPLATE.content.querySelector(".article-list").cloneNode(true));
        ARTICLE_LIST = document.querySelector(".article-list");
        createArticles(articles).forEach(function (article) {
            ARTICLE_LIST.appendChild(article);
        });
        ARTICLE_LIST.addEventListener("click", handleArticleListButtonClick);
        DYNAMIC_BLOCK.appendChild(appendFilters());
        DYNAMIC_BLOCK.appendChild(PAGINATOR_TEMPLATE.content.querySelector(".paginator").cloneNode(true));
        PAGINATOR = document.querySelector(".paginator");
        if (articlesService.numberOfArticles() > ARTICLES_INDEX_TO) {
            PAGINATOR.appendChild(NEXT_BUTTON_TEMPLATE.content.querySelector(".pagination-next-button").cloneNode(true));
        }
        if (ARTICLES_INDEX_FROM > 0) {
            PAGINATOR.appendChild(PREV_BUTTON_TEMPLATE.content.querySelector(".pagination-prev-button").cloneNode(true));
        }
        PAGINATOR.addEventListener("click", handlePaginatorClick);
        document.querySelector(".add-tag-filter").addEventListener("click", handleTagAddFilterButtonClick);
        document.querySelector(".confirm-filter").addEventListener("click", handleConfirmFilterButtonClick);
        document.querySelector(".reset-filter").addEventListener("click", handleResetFilterButtonClick);
        document.querySelectorAll(".chosen-tag").forEach(function (tag) {
            tag.addEventListener("click", handleChosenTagClick);
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
        ARTICLE_TEMPLATE.content.querySelector(".content-block").innerHTML = "";
        article.tags.forEach(function (tag) {
            TAG_TEMPLATE.content.querySelector(".tag").textContent = tag;
            TAG_LIST.appendChild(TAG_TEMPLATE.content.querySelector(".tag-holder").cloneNode(true));
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

    function dateInputToString(date) {
        return date.getFullYear() + "-" + ((date.getMonth() + 1 > 9) ? date.getMonth() + 1 : "0" + (date.getMonth() + 1)) +
            "-" + ((date.getDate() > 9) ? date.getDate() : "0" + date.getDate());
    }

    function appendFilters() {
        const CHOSEN_TAG_TEMPLATE = document.querySelector("#template-chosen-tag");
        const CHOSEN_TAGS_LIST = FILTERS_TEMPLATE.content.querySelector(".chosen-tags-list");
        const AUTHORS_DATALIST = FILTERS_TEMPLATE.content.querySelector("#authors");
        const TAGS_DATALIST = FILTERS_TEMPLATE.content.querySelector("#tags");
        const OPTION_TEMPLATE = document.querySelector("#template-option");
        let filters = JSON.parse(sessionStorage.getItem("filters"), function (key, value) {
            if (key == "dateFrom" || key == "dateTo") {
                return new Date(value);
            }
            return value;
        });
        let tags = JSON.parse(localStorage.getItem("tags"));
        let authors = JSON.parse(localStorage.getItem("users")).map(function (user) {
            return user.login;
        });
        CHOSEN_TAGS_LIST.innerHTML = "";
        AUTHORS_DATALIST.innerHTML = "";
        TAGS_DATALIST.innerHTML = "";
        if (filters != null && filters != undefined) {
            FILTERS_TEMPLATE.content.querySelector(".author-input").value = (filters.author != undefined) ? filters.author : "";
            FILTERS_TEMPLATE.content.querySelector(".date-from").value = (filters.dateFrom != undefined && filters.dateFrom != null) ? dateInputToString(filters.dateFrom) : "";
            FILTERS_TEMPLATE.content.querySelector(".date-to").value = (filters.dateTo != undefined && filters.dateTo != null) ? dateInputToString(filters.dateTo) : "";
            FILTERS_TEMPLATE.content.querySelector(".tags-input").value = "";
            if (filters.tags != undefined) {
                filters.tags.forEach(function (tag) {
                    CHOSEN_TAG_TEMPLATE.content.querySelector(".chosen-tag").textContent = tag;
                    CHOSEN_TAGS_LIST.appendChild(CHOSEN_TAG_TEMPLATE.content.querySelector(".tag-holder").cloneNode(true));
                });
            }
        } else {
            FILTERS_TEMPLATE.content.querySelector(".author-input").value = "";
            FILTERS_TEMPLATE.content.querySelector(".date-from").value = "";
            FILTERS_TEMPLATE.content.querySelector(".date-to").value = "";
            FILTERS_TEMPLATE.content.querySelector(".tags-input").value = "";
        }
        if (authors != undefined) {
            authors.forEach(function (author) {
                OPTION_TEMPLATE.content.querySelector(".option").value = author;
                AUTHORS_DATALIST.appendChild(OPTION_TEMPLATE.content.querySelector(".option").cloneNode(true));
            });
        }
        if (tags != undefined) {
            tags.forEach(function (tag) {
                OPTION_TEMPLATE.content.querySelector(".option").value = tag;
                TAGS_DATALIST.appendChild(OPTION_TEMPLATE.content.querySelector(".option").cloneNode(true));
            });
        }
        return FILTERS_TEMPLATE.content.querySelector(".filters").cloneNode(true);
    }

    function headerConfig() {
        const ADD_ARTICLE_TEMPLATE = document.querySelector("#template-add-article");
        const ADD_ARTICLE_HOLDER = HEADER_ACTIONS.querySelector(".add-article-holder");
        const LOGIN_LOGOUT_BUTTON = HEADER_ACTIONS.querySelector(".login-logout-button");
        ADD_ARTICLE_HOLDER.innerHTML = "";
        if (user == null) {
            USER_NAME.textContent = "Гость";
            LOGIN_LOGOUT_BUTTON.textContent = "Войти";
        } else {
            ADD_ARTICLE_HOLDER.appendChild(ADD_ARTICLE_TEMPLATE.content.querySelector(".add-article").cloneNode(true));
            USER_NAME.textContent = user;
            LOGIN_LOGOUT_BUTTON.textContent = "Выйти";
            ADD_ARTICLE_HOLDER.addEventListener("click", handleAddArticleClick);
        }
    }

    function handleConfirmFilterButtonClick() {
        let filters = JSON.parse(sessionStorage.getItem("filters"), function (key, value) {
                if (key == "dateFrom" || key == "dateTo") {
                    return new Date(value);
                }
                return value;
            }) || {};
        let buf;
        filters.author = document.forms.filters.elements.authorInput.value;
        buf = document.forms.filters.elements.dateFrom.value;
        filters.dateFrom = (buf != "") ? new Date(buf) : undefined;
        buf = document.forms.filters.elements.dateTo.value;
        filters.dateTo = (buf != "") ? new Date(buf) : undefined;
        sessionStorage.setItem("filters", JSON.stringify(filters));
        ARTICLES_INDEX_FROM = 0;
        ARTICLES_INDEX_TO = 10;
        appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
    }

    function handleTagAddFilterButtonClick() {
        const CHOSEN_TAGS_LIST = document.querySelector(".chosen-tags-list");
        const CHOSEN_TAG_TEMPLATE = document.querySelector("#template-chosen-tag");
        let filters = JSON.parse(sessionStorage.getItem("filters"), function (key, value) {
                if (key == "dateFrom" || key == "dateTo") {
                    return new Date(value);
                }
                return value;
            }) || {};
        let tags = JSON.parse(localStorage.getItem("tags"));
        let tag;
        filters.tags = filters.tags || [];
        tag = document.forms.filters.elements.tagsInput.value;
        if (filters.tags.length < 5 && tags.indexOf(tag) != -1 && filters.tags.indexOf(tag) == -1) {
            filters.tags.push(tag);
            sessionStorage.setItem("filters", JSON.stringify(filters));
            document.forms.filters.elements.tagsInput.value = "";
            CHOSEN_TAGS_LIST.innerHTML = "";
            filters.tags.forEach(function (tag) {
                CHOSEN_TAG_TEMPLATE.content.querySelector(".chosen-tag").textContent = tag;
                CHOSEN_TAGS_LIST.appendChild(CHOSEN_TAG_TEMPLATE.content.querySelector(".tag-holder").cloneNode(true));
            });
            document.querySelectorAll(".chosen-tag").forEach(function (tag) {
                tag.addEventListener("click", handleChosenTagClick);
            });
        } else {
            alert("Невозможно добавить тег!");
        }
    }

    function handleChosenTagClick(event) {
        const CHOSEN_TAGS_LIST = document.querySelector(".chosen-tags-list");
        const CHOSEN_TAG_TEMPLATE = document.querySelector("#template-chosen-tag");
        let filters = JSON.parse(sessionStorage.getItem("filters"), function (key, value) {
            if (key == "dateFrom" || key == "dateTo") {
                return new Date(value);
            }
            return value;
        });
        filters.tags.splice(filters.tags.indexOf(event.target.textContent), 1);
        sessionStorage.setItem("filters", JSON.stringify(filters));
        CHOSEN_TAGS_LIST.innerHTML = "";
        if (filters.tags.length > 0) {
            filters.tags.forEach(function (tag) {
                CHOSEN_TAG_TEMPLATE.content.querySelector(".chosen-tag").textContent = tag;
                CHOSEN_TAGS_LIST.appendChild(CHOSEN_TAG_TEMPLATE.content.querySelector(".tag-holder").cloneNode(true));
            });
            document.querySelectorAll(".chosen-tag").forEach(function (tag) {
                tag.addEventListener("click", handleChosenTagClick);
            });
        }
    }

    function handleResetFilterButtonClick() {
        ARTICLES_INDEX_FROM = 0;
        ARTICLES_INDEX_TO = 10;
        sessionStorage.removeItem("filters");
        articlesService.resetArticles();
        appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
    }

    return {
        appendArticles: loadArticles,
        headerConfig: headerConfig
    };
}());

let articleView = (function () {
    const DYNAMIC_BLOCK = document.querySelector(".dynamic-block");
    const ARTICLE_TEMPLATE = document.querySelector("#template-article");
    const TAG_TEMPLATE = document.querySelector("#template-tag");
    const TAG_LIST = ARTICLE_TEMPLATE.content.querySelector(".tag-list");
    const RETURN_BUTTON_TEMPLATE = document.querySelector("#template-return-button");

    function loadArticle(id) {
        let article;
        DYNAMIC_BLOCK.innerHTML = "";
        document.querySelector(".feed").textContent = "Просмотр новости";
        DYNAMIC_BLOCK.appendChild(RETURN_BUTTON_TEMPLATE.content.querySelector(".return-button-block").cloneNode(true));
        article = createArticle(id);
        article.className = "article-view";
        DYNAMIC_BLOCK.appendChild(article);
        document.querySelector(".return-button-block").addEventListener("click", handleReturnButtonClick);
        document.querySelector(".edit-button").addEventListener("click", handleArticleEditButtonClick);
        document.querySelector(".delete-button").addEventListener("click", handleArticleDeleteButtonClick);
    }

    function createArticle(id) {
        const ARTICLE_ACTIONS = ARTICLE_TEMPLATE.content.querySelector(".article-actions");
        const ARTICLE_CONTENT_BLOCK = ARTICLE_TEMPLATE.content.querySelector(".content-block");
        const EDIT_BUTTON_TEMPLATE = document.querySelector("#template-edit-button");
        const DELETE_BUTTON_TEMPLATE = document.querySelector("#template-delete-button");
        const ARTICLE_CONTENT_TEMPLATE = document.querySelector("#template-content");
        let article = articlesService.getArticle(id);
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
            TAG_LIST.appendChild(TAG_TEMPLATE.content.querySelector(".tag-holder").cloneNode(true));
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

    function handleArticleEditButtonClick() {
        editForm.loadEditForm(document.querySelector(".article-view").dataset.id);
    }

    function handleArticleDeleteButtonClick() {
        articlesService.hideArticle(document.querySelector(".article-view").dataset.id);
        appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
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
        document.querySelector(".login-button-block").addEventListener("click", handleLoginButtonClick);
    }

    function handleLoginButtonClick() {
        let users = JSON.parse(localStorage.getItem("users"));
        let userFind = users.find(function (userInfo) {
            return userInfo.login == document.forms[0].elements[0].value;
        });
        if (userFind != undefined && userFind.password == document.forms[0].elements[1].value) {
            user = userFind.login;
            sessionStorage.setItem("user", JSON.stringify(user));
            appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
        } else {
            alert("Неверный логин или пароль!");
        }
    }

    return {
        loadForm: loadForm
    };
}());

let editForm = (function () {
    const DYNAMIC_BLOCK = document.querySelector(".dynamic-block");
    const EDIT_FORM_TEMPLATE = document.querySelector("#template-edit-form");
    const RETURN_BUTTON_TEMPLATE = document.querySelector("#template-return-button");
    let article = {};

    function loadEditForm(id) {
        DYNAMIC_BLOCK.innerHTML = "";
        DYNAMIC_BLOCK.appendChild(RETURN_BUTTON_TEMPLATE.content.querySelector(".return-button-block").cloneNode(true));
        if (id != null || id != undefined) {
            document.querySelector(".feed").textContent = "Редактирование новости";
            DYNAMIC_BLOCK.appendChild(loadExistentArticle(id));
        } else {
            document.querySelector(".feed").textContent = "Добавление новости";
            DYNAMIC_BLOCK.appendChild(loadNewArticle());
        }
        document.querySelector(".return-button-block").addEventListener("click", handleReturnButtonClick);
        document.querySelector(".add-article-button-block").addEventListener("click", handleAddChangeArticleConfirmClick);
        document.querySelector(".existent-tags-list").addEventListener("click", handleExistentTagClick);
        document.querySelector(".add-tag-button").addEventListener("click", handleAddTagButtonClick);
    }

    function loadExistentArticle(id) {
        article = articlesService.getArticle(id);
        EDIT_FORM_TEMPLATE.content.querySelector(".id-edit").textContent = article.id;
        EDIT_FORM_TEMPLATE.content.querySelector(".author-edit").textContent = article.author;
        EDIT_FORM_TEMPLATE.content.querySelector(".date-edit").textContent = dateToString(article.createdAt);
        EDIT_FORM_TEMPLATE.content.querySelector("#title-input").textContent = article.title;
        EDIT_FORM_TEMPLATE.content.querySelector("#tag-input").textContent = "";
        EDIT_FORM_TEMPLATE.content.querySelector("#summary-input").textContent = article.summary;
        EDIT_FORM_TEMPLATE.content.querySelector("#content-input").textContent = article.content;
        EDIT_FORM_TEMPLATE.content.querySelector(".add-article-button").textContent = "Принять изменения";
        loadExistentTags(EDIT_FORM_TEMPLATE.content);
        return EDIT_FORM_TEMPLATE.content.querySelector(".edit-form").cloneNode(true);
    }

    function loadNewArticle() {
        article.tags = [];
        EDIT_FORM_TEMPLATE.content.querySelector(".id-edit").textContent = (JSON.parse(localStorage.getItem("articles")).length + 1);
        EDIT_FORM_TEMPLATE.content.querySelector(".author-edit").textContent = user;
        EDIT_FORM_TEMPLATE.content.querySelector(".date-edit").textContent = dateToString(new Date());
        EDIT_FORM_TEMPLATE.content.querySelector("#title-input").textContent = "";
        EDIT_FORM_TEMPLATE.content.querySelector("#tag-input").textContent = "";
        EDIT_FORM_TEMPLATE.content.querySelector("#summary-input").textContent = "";
        EDIT_FORM_TEMPLATE.content.querySelector("#content-input").textContent = "";
        EDIT_FORM_TEMPLATE.content.querySelector(".add-article-button").textContent = "Добавить новость в ленту";
        loadExistentTags(EDIT_FORM_TEMPLATE.content);
        return EDIT_FORM_TEMPLATE.content.querySelector(".edit-form").cloneNode(true);
    }

    function loadExistentTags(existentTagsList) {
        const EXISTENT_TAGS_LIST = existentTagsList.querySelector(".existent-tags-list");
        const EXISTENT_TAG_TEMPLATE = document.querySelector("#template-existent-tag");
        const CHOSEN_TAG_TEMPLATE = document.querySelector("#template-chosen-tag");
        EXISTENT_TAGS_LIST.innerHTML = "";
        JSON.parse(localStorage.getItem("tags")).forEach(function (tag) {
            if (article.tags.indexOf(tag) != -1) {
                CHOSEN_TAG_TEMPLATE.content.querySelector(".chosen-tag").textContent = tag;
                EXISTENT_TAGS_LIST.appendChild(CHOSEN_TAG_TEMPLATE.content.querySelector(".tag-holder").cloneNode(true));
            } else {
                EXISTENT_TAG_TEMPLATE.content.querySelector(".tag").textContent = tag;
                EXISTENT_TAGS_LIST.appendChild(EXISTENT_TAG_TEMPLATE.content.querySelector(".tag-holder").cloneNode(true));
            }
        });
    }

    function handleAddChangeArticleConfirmClick() {
        article.id = document.querySelector(".id-edit").textContent;
        article.author = document.querySelector(".author-edit").textContent;
        article.createdAt = article.createdAt || new Date();
        article.title = document.querySelector("#title-input").value;
        article.summary = document.querySelector("#summary-input").value;
        article.content = document.querySelector("#content-input").value;
        if (articlesService.validateArticle(article)) {
            if (articlesService.getArticle(article.id) != undefined) {
                articlesService.editArticle(article.id, article);
            } else {
                articlesService.addArticle(article);
            }
            appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
        } else {
            alert("Некорректная новость!");
        }
    }

    function handleExistentTagClick(event) {
        if (event.target.classList.contains("tag")) {
            if (article.tags.length < 5) {
                article.tags.push(event.target.textContent);
                event.target.classList.remove("tag");
                event.target.classList.add("chosen-tag");
            } else {
                alert("Невозможно добавить тег!");
            }
        } else if (event.target.classList.contains("chosen-tag")) {
            article.tags.splice(article.tags.indexOf(event.target.textContent), 1);
            event.target.classList.remove("chosen-tag");
            event.target.classList.add("tag");
        }
    }

    function handleAddTagButtonClick() {
        let tags = JSON.parse(localStorage.getItem("tags"));
        if (document.querySelector("#tag-input").value.trim() != "" && tags.indexOf(document.querySelector("#tag-input").value) == -1) {
            tags.push(document.querySelector("#tag-input").value);
            tags.sort();
            localStorage.setItem("tags", JSON.stringify(tags));
            document.querySelector("#tag-input").value = "";
            loadExistentTags(document);
        } else if (tags.indexOf(document.querySelector("#tag-input").value) != -1) {
            alert("Данный тег уже существует.");
        }
    }

    function dateToString(date) {
        return date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + " " + date.getHours() + ":" +
            date.getMinutes();
    }

    return {
        loadEditForm: loadEditForm
    };
}());

document.addEventListener("FeedLoader", appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO));

document.querySelector(".login-logout-button").addEventListener("click", handleLoginLogoutClick);

function appendArticles(from, to) {
    document.querySelector(".dynamic-block").innerHTML = "";
    articlesLogic.headerConfig();
    articlesLogic.appendArticles(articlesService.getArticles(from, to, JSON.parse(sessionStorage.getItem("filters"), function (key, value) {
        if (key == "dateFrom" || key == "dateTo") {
            return new Date(value);
        }
        return value;
    })));
}

function handleReturnButtonClick() {
    appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
}

function handleArticleListButtonClick(event) {
    if (event.target.textContent == "Показать новость") {
        articleView.loadArticle(event.target.parentNode.parentNode.dataset.id);
    }
    if (event.target.textContent == "Редактировать") {
        editForm.loadEditForm(event.target.parentNode.parentNode.dataset.id);
    }
    if (event.target.textContent == "Удалить") {
        articlesService.hideArticle(event.target.parentNode.parentNode.dataset.id);
        appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
    }
}

function handleLoginLogoutClick(event) {
    if (event.target.textContent == "Выйти") {
        user = null;
        localStorage.setItem("user", null);
        appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
    } else {
        authorizationForm.loadForm();
    }
}

function handleAddArticleClick() {
    editForm.loadEditForm();
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
    appendArticles(ARTICLES_INDEX_FROM, ARTICLES_INDEX_TO);
}