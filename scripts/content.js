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
let sugg_option = 'collapse';
let xpath_recommend = '';
let show_more = 'TEMPLATESTRING';
let DEBUG_MODE = false;
let lang_data = {};

//turns an array of strings into single XPath string
function xs(L){
    return ".//*[text()='"+
        L.join("' or text() ='")+
        "']";
}

function sarray_xpath(sarray, target){
  xxs = ".//*[text()='"+
        sarray.join("' or text() ='")+
        "']";
  res = document.evaluate(xxs, target, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  return res
}

function check_footer(element){
  if(!element) return false;
  //T = element.textContent;
  //L = T.length;
  //showmore_flag = (T.slice(L-show_more.length,L) === show_more);
  return element.innerHTML.includes("www.w3.org/2000/svg")// || showmore_flag;
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
  while(pe && pe.querySelectorAll(':scope > a').length == 0){
    pe = pe.nextElementSibling; 
  }
  if(!pe){
    if(DEBUG_MODE) console.log('missing header:', post_container);
    return;
  }
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
  const check_duplicate = post_container.querySelectorAll('.tgl-btn').length;
  if(check_duplicate) return;
  const btn = document.createElement("button");
  btn.innerText = '⬇️';  
  btn.style.fontSize = 'large';
  btn.style.margin = '10px';
  btn.classList.add('tgl-btn');
  btn.hiding = true;

  const header = find_header(post_container);
  if(!header){
    if(DEBUG_MODE) console.log('failed to add button');
    return;
  }
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

  const sugg_flag = sarray_xpath(['Suggested'],post_container)?.snapshotLength > 0;
  const ad_flag = (sarray_xpath(lang_data.xpath,post_container)?.snapshotLength > 0);
  const rec_flag = (sarray_xpath(lang_data.recommend,post_container)?.snapshotLength > 0)
  let highlight_flag = false;
  let stop_flag = false;
  //if(DEBUG_MODE) console.log(post_container,[ad_flag,rec_flag,highlight_flag,stop_flag]);

  if(sugg_flag){
    set_post_visibility(post_container, false, sugg_option);
    if(sugg_option == 'collapse') add_button(post_container);
    return
  }
  if(rec_flag){
    set_post_visibility(post_container, false, recommend_option);
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

function unprocess_post(pc){
  highlight_post(pc,"")
  set_post_visibility(pc, true, "hide");
  set_post_visibility(pc, true, "collapse");
  btn = document.querySelector('.tgl-btn');
  if(btn) btn.remove();
}

function load_settings(obj){
  console.log('Settings:', obj);
  keywords = obj?.keywords || [];
  stopwords = obj?.stopwords || [];
  initial_hide_delay = obj?.initial_hide_delay || 2000;
  hide_delay = obj?.hide_delay ||  500;
  highlight_color = obj?.highlight_color || "#CCFFCC";
  stop_color = obj?.stop_color || "#555555";
  stop_option = obj?.stop_option || "collapse";
  ad_option = obj?.ad_option || "collapse";
  sugg_option = obj?.sugg_option || "collapse";
  recommend_option = obj?.recommend_option || "collapse";
}

let lastURL = location.href;

const observer = new MutationObserver((mutations) => {
  if(location.href !== lastURL){
    if(location.href.includes("/feed/")){
      const res = sarray_xpath(lang_data.indicator,document);
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

function initial_processing(mode){
  const res = sarray_xpath(lang_data.indicator,document);
  for (let i=0; i<res.snapshotLength; i++){
    const pc = fpc_ascend(res.snapshotItem(i));
    if(DEBUG_MODE) console.log(i,':',pc);
    if (check_footer(pc))
      switch(mode){
        case "refresh":
          unprocess_post(pc);
          setTimeout(() => process_post(pc), hide_delay);
          break;
        case "unprocess":
          unprocess_post(pc);
          break;
        default:
          setTimeout(() => process_post(pc), hide_delay);
      }
  }
}

function main() {
  console.log('L:',lang_data);
  chrome.storage.local.get("status", (s) => {
    console.log('s:',s);
    if(Object.keys(s).length === 0){
      initial_processing();
      observer.observe(document.body, {childList: true, subtree: true});
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.status) {
      switch(changes.status.newValue){
        case "pause":
          console.log('pausing');
          observer.disconnect();
          initial_processing("unprocess");
          console.log('paused');
          break;
        default:
          console.log('resuming');
          initial_processing();
          observer.observe(document.body, {childList: true, subtree: true});
      }
    }
    if (area === "sync" && changes.settings) {
      console.log('new settings!');
      load_settings(changes.settings.newValue);
      chrome.storage.local.get("status", (s) => {
        console.log('s:',s);
        if(Object.keys(s).length === 0){
          observer.disconnect();
          initial_processing("refresh");
          observer.observe(document.body, {childList: true, subtree: true});
        } else { console.log('paused refresh')}
        
      });
    }
  });  
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
    lang_data = data[language];
    xpath_initial_posts = xs(data[language]["indicator"]);
    xpath = xs(data[language]["xpath"]);
    xpath_recommend = xs(data[language]["recommend"]);
    signature_string = data[language]["footer"];
    fail_signature = data[language]["fail"];
    show_more = data[language]["show_more"];
    console.log(data[language]);

    chrome.storage.sync.get(['settings'], function(result) {
      load_settings(result?.settings);
      setTimeout(main, initial_hide_delay);
    });

  })
  .catch((error) => {
    console.error('Error loading JSON:', error);
  });


