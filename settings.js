let keywords = [];
let hide_settings = true;

function append_keyword(kw){
  const new_div=document.createElement("div");
  new_div.className="k";
  
  const new_textinput = document.createElement("input");
  new_textinput.className = "keywords";
  new_textinput.value = kw;
  new_textinput.placeholder = "insert a keyword here..."
  new_div.append(new_textinput);

  const new_delete_btn = document.createElement("button")
  new_delete_btn.textContent = "remove";
  new_delete_btn.addEventListener('click', (new_delete_btn) => {
    new_div.remove();
  });
  new_div.append(new_delete_btn);

  document.getElementById('keywords-list-container').append(new_div);
  new_textinput.addEventListener("keyup", ({key}) => {
    if (key === "Enter") {
       //let arr = [];
       //keyword_inputs = Array.from(document.getElementsByClassName("keywords"));
       //keyword_inputs.forEach(e => {arr.push(e.value.length)});
       //console.log(arr);
       append_keyword("");
    }
})
  new_textinput.focus();
}

function append_stopword(sw){
  const new_div=document.createElement("div");
  new_div.className="k";
  
  const new_textinput = document.createElement("input");
  new_textinput.className = "stopwords";
  new_textinput.value = sw;
  new_textinput.placeholder = "insert a keyword here..."
  new_div.append(new_textinput);

  const new_delete_btn = document.createElement("button")
  new_delete_btn.textContent = "remove";
  new_delete_btn.addEventListener('click', (new_delete_btn) => {
    new_div.remove();
  });
  new_div.append(new_delete_btn);

  document.getElementById('stopwords-list-container').append(new_div);
  new_textinput.addEventListener("keyup", ({key}) => {
    if (key === "Enter") {
       //let arr = [];
       append_stopword("");
    }
})
  new_textinput.focus();
}

function status_message(s, c){
  d = document.getElementById('status');
  d.textContent = s;
  if(c) d.style.fontColor=c;
  setTimeout(() => {
    d.textContent="";
    d.style="";
  }, 1500);

}

chrome.storage.sync.get(['settings'], function(result) {
  console.log('Settings:', result.settings);
  if(result.settings){
    keywords = result.settings.keywords;
    if(keywords && keywords?.length > 0) keywords.forEach((k) => {append_keyword(k)});
    stopwords = result.settings.stopwords;
    if(stopwords && stopwords?.length > 0) stopwords.forEach((s) => {append_stopword(s)});
    hide_delay = result.settings.hide_delay;
    document.getElementById("hide-delay").value = hide_delay;
    highlight_color = result.settings.highlight_color;
    stop_color = result.settings.stop_color;
    stop_option = result.settings.stop_option || "collapse";
    ad_option = result.settings.ad_option || "collapse";
    recommend_option = result.settings.recommend_option || "collapse";
    document.getElementById("highlight-color").value = highlight_color;
    document.getElementById("highlight-example").style.backgroundColor = highlight_color;
    document.getElementById("stop-color").value = stop_color;
    document.getElementById("stop-example").style.backgroundColor = stop_color;
    document.getElementById("stop-selector").value = stop_option;
    document.getElementById("ad-selector").value = ad_option;
    document.getElementById("recommend-selector").value = recommend_option;
      
  }
  append_keyword("");
  append_stopword("");
});

document.getElementById('apply').addEventListener('click', () => {
  let keyWords = [];
  const divCollection = document.getElementsByClassName("keywords");
  divArray = Array.from(divCollection);
  divArray.forEach((e) => {
    if(e.value) keyWords.push(e.value);
  });
  let stopWords = [];
  Array.from(document.getElementsByClassName("stopwords")).forEach((e) => {
    if(e.value) stopWords.push(e.value);
  });
  initial_hide_delay = document.getElementById("initial-hide-delay").value;
  hide_delay = document.getElementById("hide-delay").value;
  highlight_color = document.getElementById("highlight-color").value;
  stop_color = document.getElementById("stop-color").value;
  stop_option = document.getElementById("stop-selector").value;
  ad_option = document.getElementById("ad-selector").value;
  recommend_option = document.getElementById("recommend-selector").value;
  settings = {
    "initial_hide_delay":initial_hide_delay,
    "hide_delay":hide_delay,
    "highlight_color":highlight_color,
    "keywords":keyWords,
    "stop_color":stop_color,
    "stopwords":stopWords,
    "stop_option":stop_option,
    "ad_option":ad_option,
    "recommend_option":recommend_option
  }
  chrome.storage.sync.set({"settings": settings}, function() {
    status_message('Settings saved!');
    console.log('Settings saved');
  });
  document.getElementById("highlight-example").style.backgroundColor = highlight_color;
  document.getElementById("stop-example").style.backgroundColor = stop_color;
  console.log(settings);
  document.getElementById('status').textContent = 'Done!';
});

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.sync.clear();
  status_message('Settings have been reset to default.');
  console.log('Keywords reset');
});

document.getElementById('new-keyword').addEventListener('click', () => {
  append_keyword("");
});

document.getElementById('new-stopword').addEventListener('click', () => {
  append_stopword("");
});