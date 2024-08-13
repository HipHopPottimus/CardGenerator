var installEvent = {prompt: () => alert("An error occured")};

window.addEventListener("beforeinstallprompt",(e) => {
    e.preventDefault();
    installEvent = e;
});

async function install(){
    if(!navigator.serviceWorker) return alert("There was an error installing: service workers are not avalible.");
    navigator.serviceWorker.register("../sw.js");
    await navigator.serviceWorker.ready;
    let {outcome} = await installEvent.prompt();
    if(outcome == "accepted") window.location.assign("../card-editor/index.html");
}

window.addEventListener("DOMContentLoaded",() => {
    if(window.location.href.includes("?return=true")){
        setTimeout(() => history.back(),1000);
    }
});