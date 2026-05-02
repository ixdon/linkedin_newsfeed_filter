console.log('LinkedIn Filter: Script injected on:', location.href);

const language = document.documentElement.lang
let keywords = [];
let stopwords = [];
let signature_string = '';
let fail_signature = '';
let xpath = '';
let xpath_initial_posts = '';
let hide_delay = 500;
let stop_option = 'collapse';
let ad_option = 'collapse';
let recommend_option = 'collapse';
let xpath_recommend = '';
let show_more = '';

//turns an array of strings into single XPath string
function xs(L){
    return ".//*[text()='"+
        L.join("' or text() ='")+
        "']";
}

function check_footer(element){
  if(!element) return false;
  T = element.textContent;
  L = T.length;
  showmore_flag = (T.slice(L-show_more.length,L) === show_more);
  return element.innerHTML.includes("www.w3.org/2000/svg") || showmore_flag;
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
  const res = document.evaluate(xpath_recommend, post_container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  const r_flag = (res.snapshotLength > 0)
  if(r_flag){
    return post_container.children[1].firstChild;
  }
  let pe = post_container.firstElementChild;
  while(pe && pe.querySelectorAll(':scope > a').length !== 2){
    pe = pe.nextElementSibling; 
  }
  if(!pe) return;
  return pe
}

function set_post_visibility(post_container, show_flag, mode){
  switch(mode){
    case "hide":
      post_container.style.display = show_flag ? '' : 'none';
      break;
    case "collapse":
      const header = find_header(post_container);
      if(!header) return;
      let sibling = header.nextElementSibling;
      while(sibling){
        sibling.style.display = show_flag ? '' : 'none';
        sibling = sibling.nextElementSibling;
      }
      break;
    default:
      console.log('ignoring');  
  }

}

function highlight_post(post_container,c){
  const header = find_header(post_container);
  if(!header) return;
  header.style.backgroundColor = c;
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
    set_post_visibility(post_container,btn.hiding,"collapse");
    btn.hiding = !btn.hiding;
    btn.textContent = btn.hiding ? '⬇️' : '⬆️';

  });
}

function process_post(post_container){
  if(!post_container){
    return;
  }
  const res_recommend = document.evaluate(xpath_recommend, 
                                post_container, 
                                null, 
                                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                                null);
  const res = document.evaluate(xpath, post_container, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

  const ad_flag = (res.snapshotLength > 0);
  const rec_flag = (res_recommend.snapshotLength > 0)
  let highlight_flag = false;
  let stop_flag = false;
  if(rec_flag){
    set_post_visibility(post_container, false, recommend_option);
    console.log(recommend_option);
    if(recommend_option == 'collapse') add_button(post_container);
    return
  }
  keywords.forEach((k) => {
    if(post_container.textContent.includes(k)) highlight_flag = true;
  });
  stopwords.forEach((s) => {
    if(post_container.textContent.includes(s)) stop_flag = true;
  });
  if(ad_flag){
    set_post_visibility(post_container, false,ad_option);
    if(stop_flag) highlight_post(post_container, stop_color);
    if(ad_option=="collapse") add_button(post_container);
  }
  if(highlight_flag && stop_flag){
    //console.log('conflict',post_container);
    highlight_post(post_container, 'teal')
    set_post_visibility(post_container, false,"collapse");
    add_button(post_container);
  };
  if(highlight_flag && !stop_flag) {
    highlight_post(post_container, highlight_color)
  };
  if(!highlight_flag && stop_flag && !ad_flag) {
    set_post_visibility(post_container, false,stop_option);
    highlight_post(post_container, stop_color)
    if(stop_option=="collapse") add_button(post_container);
  };

}

function main() {
  let lastURL = location.href;
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
    if(location.href !== lastURL){
      if(location.href.includes("/feed/")){
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
      }
      lastURL = location.href;
    }
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.tagName !== 'DIV') return;

        if (node.className.includes('legacyNotifLineHeight')) return;
        if (!check_footer(node)) return;
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
    xpath_recommend = xs(data[language]["recommend"]);
    signature_string = data[language]["footer"];
    fail_signature = data[language]["fail"];
    console.log(data[language]);
    chrome.storage.sync.get(['settings'], function(result) {
      console.log('Settings:', result.settings);

      keywords = result?.settings?.keywords || [];
      stopwords = result?.settings?.stopwords || [];
      initial_hide_delay = result?.settings?.initial_hide_delay || 2000;
      hide_delay = result?.settings?.hide_delay ||  500;
      highlight_color = result?.settings?.highlight_color || "#CCFFCC";
      stop_color = result?.settings?.stop_color || "#555555";
      stop_option = result?.settings?.stop_option || "collapse";
      ad_option = result?.settings?.ad_option || "collapse";
      recommend_option = result?.settings?.recommend_option || "collapse";

      setTimeout(() => main(), initial_hide_delay);
    });

    
  })
  .catch((error) => {
    console.error('Error loading JSON:', error);
  });


