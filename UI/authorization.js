let inputForm = document.forms[0];
let loginInput = inputForm.elements[0];
let passwordInput = inputForm.elements[1];

loginInput.addEventListener("input", handleLoginInput);
passwordInput.addEventListener("input", handlePasswordInput);

function handleLoginInput() {
    localStorage.setItem("user", JSON.stringify(loginInput.value));
}

function handlePasswordInput() {

}