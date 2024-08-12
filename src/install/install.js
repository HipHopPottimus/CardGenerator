var installEvent;

window.addEventListener("beforeinstallprompt",(e) => {
    e.preventDefault();
    installEvent = e;
});

async function install(){
    if(!navigator.serviceWorker) return alert("There was an error installing: service workers are not avalible.");
    navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;
    let {outcome} = await installEvent.prompt();
    if(outcome == "accepted") window.location.assign("../open-file");
}