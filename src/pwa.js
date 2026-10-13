const installButton=document.querySelector('[data-install]');let promptEvent;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;installButton.hidden=false});
installButton.addEventListener('click',async()=>{if(!promptEvent)return;await promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;installButton.hidden=true});
window.addEventListener('appinstalled',()=>{installButton.hidden=true});
if('serviceWorker' in navigator){const updating=!!navigator.serviceWorker.controller;let refreshed=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updating&&!refreshed){refreshed=true;location.reload()}});navigator.serviceWorker.register('/sw.js').catch(()=>{});}
