const storage = new IDBWebStorage("cardGeneratorStorage");
const fileInterface = {
    async getFileHandle(){
        let userGesture = () => {
            return new Promise((resolve,reject) => {
                let popup = document.createElement("dialog");
                popup.innerHTML =`We need premision to read and write to your data file.<br><button id='popup-select'>Select</button`;
                document.body.appendChild(popup);
                popup.show();
                document.getElementById("popup-select").onclick = () => {
                    popup.remove();
                    resolve();
                }
            });
        }
        let fileHandle = await storage.getItem("dataFileHandle");
        if(!fileHandle){
            await userGesture(1);
            fileHandle = (await window.showOpenFilePicker())[0];
            await storage.setItem("dataFileHandle",fileHandle);
            window.location.reload();
        }
        else if(await fileHandle.queryPermission({mode: "readwrite"}) != "granted"){
            let result;
            await userGesture(2);
            await fileHandle.requestPermission({mode: "readwrite"});
            await storage.setItem("dataFileHandle",fileHandle);
            window.location.reload();
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