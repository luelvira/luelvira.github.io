let menuButton = document.querySelector(".navbar .menu");
let menu       = document.querySelector(".navbar");
menuButton.addEventListener("click", e => {
  menu.classList.toggle("open");
});


/**
 * When the page is load, only will be display the last N jobs experience.
 * The user will be able of load more press the button asociate with this action
*/
(function hideExperience() {
  const experienceBlock = document.querySelector(".content:nth-child(1)");
  if (!experienceBlock) return;
  const experienceArticles = document.querySelectorAll(".content:nth-child(1) article");
  let visibleExperience = 3;
  const visibleIncrement = 3;
  function updateVisibles() {
    experienceArticles.forEach((article, index) => {
      index >= visibleExperience ? article.style.display = "none" : article.removeAttribute("style");
    });
  }
  updateVisibles();
  const buttonCont = document.createElement("div");
  const button = document.createElement("button");
  button.innerHTML = "Load more";
  buttonCont.appendChild(button);
  experienceBlock.appendChild(buttonCont);
  button.addEventListener("click", function show(e) {
    visibleExperience += visibleIncrement;
    updateVisibles();
    if (visibleExperience >= experienceArticles.length)
      this.setAttribute("disabled", true);
  });
  
})();
