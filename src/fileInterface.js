const storage = new IDBWebStorage("cardGeneratorStorage");
const fileInterface = {
    async getFileHandle(){
        let fileHandle = await storage.getItem("dataFileHandle");
        if(!fileHandle || await fileHandle.queryPermission({mode: "readwrite"}) != "granted"){
            window.location.assign("../file/");

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
        fileHandle = (await window.showOpenFilePicker())[0];
        await storage.setItem("dataFileHandle",fileHandle);
        window.location.assign("../card-editor");
    },
    
    async createNewFile(){
        
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
