console.log('LinkedIn Filter: Script injected on:', location.href);

const language = document.documentElement.lang
let keywords = ['SQL', 'Python'];
let signature_string = '';
let fail_signature = ''
let xpath = '';
let xpath_initial_posts = '';
let hide_delay = 500;

//turns an array of strings into single XPath string
function xs(L){
    return ".//*[text()='"+
        L.join("' or text() ='")+
        "']";
}

function check_footer(element){
  if(!element) return false;
  return element.innerHTML.includes("www.w3.org/2000/svg");
}

function fpc_ascend(element){
  let pe = element;
  while(pe.parentElement && !check_footer(pe.parentElement)){
    if(pe.parentElement.textContent.slice(0,fail_signature.length) === fail_signature){
      return; //this means that the ascent started from a non-post item;
    }
    pe = pe.parentElement;
  }
  if(!pe.parentElement) return;
  return pe.parentElement;
}

function fpc_descend(element){
  let pe = element;
  while(pe.parentElement && check_footer(pe)){
    pe = pe.firstElementChild;
  }
  if(!pe) return;
  return pe.parentElement;
}

function find_header(post_container){
  let pe = post_container.firstElementChild;
  while(pe && pe.querySelectorAll(':scope > a').length !== 2){
    pe = pe.nextElementSibling; 
  }
  if(!pe) return;
  return pe
}

function set_post_visibility(post_container, show_flag){
  const header = find_header(post_container);
  if(!header) return;
  let sibling = header.nextElementSibling;
  while(sibling){
    sibling.style.display = show_flag ? '' : 'none';
    sibling = sibling.nextElementSibling;
  }
}

function highlight_post(post_container){
  const header = find_header(post_container);
  if(!header) return;
  //header.style.backgroundColor = '#CCFFCC';
  header.style.backgroundColor = highlight_color;

}

function add_button(post_container){
  const btn = document.createElement("button");
  btn.innerText = '⬇️';  
  btn.style.fontSize = 'large';
  btn.style.margin = '10px';
  btn.hiding = true;

  const header = find_header(post_container);
  if(!header) return;
  header.appendChild(btn);

  btn.addEventListener("click", function(){
    set_post_visibility(post_container,btn.hiding);
    btn.hiding = !btn.hiding;
    btn.textContent = btn.hiding ? '⬇️' : '⬆️';

  });
}

function process_post(post_container){
  if(!post_container){
    return;
  }
  console.log('processing post:',post_container);
  const res = document.evaluate(xpath, post_container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  if(res.snapshotLength){
    set_post_visibility(post_container, false);
    add_button(post_container);
  }

  let highlight_flag = false;
  keywords.forEach((k) => {
    if(post_container.textContent.includes(k)) highlight_flag = true;
  });
  if(highlight_flag) highlight_post(post_container);
}

function main() {
  const res = document.evaluate(xpath_initial_posts, 
                                document, 
                                null, 
                                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                                null);
  for (let i=0; i<res.snapshotLength; i++){
    const pc = fpc_ascend(res.snapshotItem(i));
    if (check_footer(pc)) {
      setTimeout(() => process_post(pc), hide_delay);
    }
  }
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.tagName !== 'DIV') return;

        if (node.className.includes('legacyNotifLineHeight')) return;
        //console.log('2:',node);
        if (!check_footer(node)) return;
        //console.log('3:',node);
        const pc = fpc_descend(node);
        setTimeout(() => process_post(pc), hide_delay);
      });
    });
  });
  observer.observe(document.body, {childList: true, subtree: true});
}

const fileUrl = chrome.runtime.getURL('locales.json');

fetch(fileUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then((data) => {
    const supported_languages = Object.keys(data);
    console.log('Supported languages: ', supported_languages);
    if(!supported_languages.includes(language)){
      throw new Error('unsupported language:' + language);
    }
    xpath_initial_posts = xs(data[language]["indicator"]);
    xpath = xs(data[language]["xpath"]);
    signature_string = data[language]["footer"];
    fail_signature = data[language]["fail"];
    console.log(data[language]);
    chrome.storage.sync.get(['settings'], function(result) {
      console.log('Settings:', result.settings);
      keywords = result?.settings?.keywords;
      initial_hide_delay = result?.settings?.initial_hide_delay; if(!initial_hide_delay) initial_hide_delay = 2000;
      hide_delay = result?.settings?.hide_delay; if(!hide_delay) hide_delay = 500;
      highlight_color = result?.settings?.highlight_color; if(!highlight_color) highlight_color = "#CCFFCC";
      setTimeout(() => main(), initial_hide_delay);
    });

    
  })
  .catch((error) => {
    console.error('Error loading JSON:', error);
  });


