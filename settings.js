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

  document.getElementById('keywords-container').append(new_div);
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
    if(!keywords || keywords?.length==0){
      hide_settings = false;
    } else
    keywords.forEach((k) => {
      append_keyword(k);
    });
    hide_delay = result.settings.hide_delay;
    document.getElementById("hide-delay").value = hide_delay;
    highlight_color = result.settings.highlight_color;
    document.getElementById("highlight-color").value = highlight_color;
    document.getElementById("highlight-example").style.backgroundColor = highlight_color;
      
  }
  
  append_keyword("");
});

document.getElementById('apply').addEventListener('click', () => {
  let keyWords=[];
  const divCollection = document.getElementsByClassName("keywords");
  divArray = Array.from(divCollection);
  divArray.forEach((e) => {
    if(e.value){
      keyWords.push(e.value)
    };
  });
  hide_delay = document.getElementById("hide-delay").value;
  highlight_color = document.getElementById("highlight-color").value;
  settings = {
    "hide_delay":hide_delay,
    "highlight_color":highlight_color,
    "keywords":keyWords
  }
  chrome.storage.sync.set({"settings": settings}, function() {
    status_message('Settings saved!');
    console.log('Settings saved');
  });
  document.getElementById("highlight-example").style.backgroundColor = highlight_color;
  console.log(settings);
  document.getElementById('status').textContent = 'Done!';
  //console.log('result: ', keyWords);
});

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.sync.clear();
  status_message('Settings have been reset to default.');
  console.log('Keywords reset');
});

document.getElementById('new').addEventListener('click', () => {
  append_keyword("");
});