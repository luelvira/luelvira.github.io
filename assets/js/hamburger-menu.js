let menuButton = document.querySelector(".navbar .menu");
let menu       = document.querySelector(".navbar");
menuButton.addEventListener("click", e => {
  menu.classList.toggle("open");
});

