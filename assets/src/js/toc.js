let toc = document.querySelector("#TableOfContents"),
    tocItems = Array.from(toc.querySelectorAll("li")),
    titles = getTitles(tocItems),
    options = {
      root: null, // get the viewport
      rootMargin: "0px",
      threashold: 1.0
    },
    observer = new IntersectionObserver(observerCallback, options),
    currentElement = null;

activeObserver(titles);

function isInViewPort(element) {
  let rect = element.getBoundingClientRect();
  return rect.top >= -1 && rect.left >= 0 && rect.bottom <=(window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}

/**
 * Select the elements to be observed
 * elements {NodeList} a list of elements
 */
function activeObserver(elements) {
  elements.forEach(e => {
    observer.observe(e);
  });
}

function clearClass(elements, className) {
    elements.forEach((element) => {
        element.classList.remove(className);
    });
}

/**
 * Iter over the toc items an search the title
 * with the same id of the anchor that is inside the list item
 * @param {NodeList} elements
 */
function getTitles(elements) {
  const titlesList = [];
  for (let element of elements) {
    const href = element.querySelector("a").getAttribute("href")
    titlesList.push(document.querySelector(href));
  }
  return titlesList;
}

function observerCallback(entries, observer) {
  const visibleEntries = new Set(
    entries
      .filter(entry => entry.isIntersecting)
      .map(entry => entry.target));

  let before = false;
  for (let section of titles) {
    if (isInViewPort(section) || visibleEntries.has(section)) {
      const elem = tocItems.filter(item => isHref(item, `#${section.id}`))[0];
    if (elem.offsetTop > currentElement?.offsetTop) before = true
      clearClass(tocItems, "up"); 
      clearClass(tocItems, "bottom"); 
      if (before) {
        if (currentElement) currentElement.classList.add("bottom");
        elem.classList.add("up")
      }
      else {
        if (currentElement) currentElement.classList.add("up");
        elem.classList.add("bottom");
      }
      currentElement?.classList.remove("active");
      currentElement = elem;
      elem.classList.add('active');
      break;
    }
    
  }
}

function isHref(item, href) {
  let a = Array.from(item.childNodes)
    .filter(el => {
      if (el.getAttribute) return (el.getAttribute("href") == href)
    });
  return a.length > 0;
}

/*
document.addEventListener("scroll", () => {
  let position = window.scrollY;
  for (let i = Object.keys(titles).length - 1; i>=0; i--) {
    const item = titles[i];
    if (item.pos <= position) {
        tocItems[i].classList.add("active");
        break;
    }
  }
});
*/

