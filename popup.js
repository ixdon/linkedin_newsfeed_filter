function paint(s){
  switch(s){
    case "pause":
      document.getElementById("status").style.backgroundColor="yellow";
      document.getElementById("status").innerText="Paused";
      document.getElementById("start").style.backgroundColor="";
      document.getElementById("pause").style.backgroundColor="yellow";
      break;
    default:
      document.getElementById("status").style.backgroundColor="green";
      document.getElementById("status").innerText="Running";
      document.getElementById("start").style.backgroundColor="green";
      document.getElementById("pause").style.backgroundColor="";
    };
}

chrome.storage.local.get("status", (s) => paint(s.status));

document.getElementById('openSettings').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

document.getElementById("start").addEventListener("click", () => {
  chrome.storage.local.remove("status");
  //chrome.storage.local.set({ status: "start" });
});

document.getElementById("pause").addEventListener("click", () => {
  chrome.storage.local.set({ status: "pause" });
});


chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.status) {
    new_status = changes.status.newValue;
    document.getElementById("status").value = new_status;
    paint(new_status); 
    }
  });