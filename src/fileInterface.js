const storage = new IDBWebStorage("cardGeneratorStorage");
const fileInterface = {
    async getFileHandle(){
        let fileHandle = await storage.getItem("dataFileHandle");
        if(!fileHandle){
            window.location.assign("../file/");

        }
        else if(await fileHandle.queryPermission({mode: "readwrite"}) != "granted"){
            let popup = document.createElement("dialog");
            await (new Promise((resolve,reject) => {
                popup.innerHTML = 
                `
                <p>We need permission to edit your file</p>
                <button id="request-permission-popup-button">Give premission</button>
                `
                document.body.appendChild(popup);
                document.getElementById("request-permission-popup-button").onclick = async () => {
                    if(await fileHandle.requestPermission({mode: "readwrite"}) == "granted"){
                        popup.close();
                        resolve();
                    }
                };
                popup.show();
            }));
        }
        return fileHandle;
    },
    async read(){
        let handle = await this.getFileHandle();
        let file = await handle.getFile();
        return JSON.parse(await file.text());
    },
    async write(newContent){
        let handle = await this.getFileHandle();
        let writeable = await handle.createWritable();
        writeable.write(JSON.stringify(newContent));
        await writeable.close();
    },

    async openFile(){
        let [fileHandle] = await window.showOpenFilePicker(
        {
            types: [{
                description: "CardGenerator JSON files",
                accept: {"application/json":[".json"]}
            }],
            excludeAcceptAllOption: true,
            multiple: false
        }
        );
        await storage.setItem("dataFileHandle",fileHandle);
        window.location.assign("../card-editor");
    },
    
    async createNewFile(){
        let fileHandle = await window.showSaveFilePicker(
        {
            types: [{
                description: "CardGenerator JSON file",
                accept: {"application/json":[".jsoon"]}
            }],
            excludeAcceptAllOption: true,
            suggestedName: "new_project"
        }
        );
        await storage.setItem("dataFileHandle",fileHandle);
        await this.write({
            cards: [],
            types: {}
        });
        window.location.assign("../card-editor");
    }
}

const util = {
    async defineCardType(name,svgUrl,options){
        let responce = await fetch(svgUrl);
        let svg = await responce.text();
        let wrp = document.createElement("div");
        wrp.innerHTML = svg;
        let removeScript = (el) => {
            for(let node of el.childNodes){
                if(node.tagName == "script") node.remove();
                removeScript(node);
            }
        }
        removeScript(wrp);
        let data = await fileInterface.read();
        data.types[name] = {svg: wrp.innerHTML,...options};
        await fileInterface.write(data);
    },

    async removeCardType(name){
        let data = await fileInterface.read();
        delete data.types[name];
        await fileInterface.write(data);
    }
}
