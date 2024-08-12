window.addEventListener("DOMContentLoaded",async () => {
    await fileInterface.getFileHandle();
    await refreshData();
    reloadCardTypeSelect();
    generateEditingUI();
});

window.addEventListener("keydown",(e) => {
    if(e.key == "s" && e.ctrlKey){
        e.preventDefault();
        save();
    }
})

window.addEventListener("beforeunload",(e) => {
    if(!saved){
        e.preventDefault();
    }
});

var saved = true;

async function refreshData(){
    tempData = await fileInterface.read();
    saved = true;     
}

async function save(){
    await fileInterface.write(tempData);
    saved = true;
    let title = document.getElementsByTagName("title")[0];
    title.innerHTML = title.innerHTML.substring(0,title.innerHTML.indexOf(" *") != -1 ? title.innerHTML.indexOf(" *") : title.innerHTML.length);
}

function modify(){
    saved = false;
    let title = document.getElementsByTagName("title")[0];
    if(!title.innerHTML.endsWith("*")) title.innerHTML += " *";
}

function reloadCardTypeSelect(){
    let cardTypeSelect = document.getElementById("cardTypeSelect");
    let originalValue = cardTypeSelect.value;
    cardTypeSelect.innerHTML = "";
    let cardType;
    for(cardType in tempData.types){
        cardTypeSelect.innerHTML += `<option value="${cardType}">${cardType}</option>`;
    }
    cardTypeSelect.innerHTML += `<option value="^">Create new type</option>`;
    cardTypeSelect.value = originalValue || cardType;
    cardTypeSelect.value = cardTypeSelect.value || cardType;
}

function generateEditingUI(){
    document.getElementById("output").innerHTML = "";
    let typeName = document.getElementById("cardTypeSelect").value;
    if(!typeName){
        document.getElementById("output").innerHTML = `<p>No card types found.</p><button onclick="createNewType();generateEditingUI()">Create a type</button>`;
        return;
    }
    if(typeName == "^"){
        typeName = createNewType();
    }
    
    let type = tempData.types[typeName];
    let content = "";
    content += `<label>Type name: <input value="${typeName}" onchange="changeTypeName('${typeName}',this.value)"></label>`;
    content += `<div>${type.frontGraphic}</div>`;
    content += `<button onclick="uploadSVG('${typeName}')">Upload new SVG</button>`;
    content += `<table id="cardType${typeName}"><tbody>`;
    content += `<tr><th>Property name</th><th>Replace value</th><th class="noBorder"></th></tr>`;
    for(let i = 0;i < type.properties.length;i++){
        let property = type.properties[i];
        content +=`
        <tr><td><span class="editableTableValue" data-typePropertyIndex="${i}" data-representing="name">${property.name}</span></td>
        <td><span class="editableTableValue" data-typePropertyIndex="${i}" data-representing="replace">${property.replace}</span></td>
        <td class="noBorder"><button onclick="deleteProperty('${typeName}',${i})">Delete</button></td></tr>
        `
    }
    content += `</tbody></table>`;
    content += `<button onclick="addProperty('${typeName}')">Add property</button><br>`;
    content += `<button onclick="deleteType('${typeName}')">Delete type</button>`;
    
    document.getElementById("output").innerHTML = content;

    for(let tv of document.getElementsByClassName("editableTableValue")){
        tv.setAttribute("contenteditable","");
        tv.onkeydown = (e) => {
            if(e.key == "Enter"){
                e.preventDefault();
            }
        }
        tv.onblur = (e) => {
            modify();
            tempData.types[typeName].properties[Number(tv.getAttribute("data-typePropertyIndex"))][tv.getAttribute("data-representing")] = tv.innerHTML;
        }
    }
}

function createNewType(){
    modify();
    typeName = prompt("What is the new card type called?");
    if(typeName){
        tempData.types[typeName] = {
            frontGraphic: "<p>No svg supplied</p>",
            backGraphic: "<p>No svg supplied</p>",
            properties: []
        }
        reloadCardTypeSelect();
        document.getElementById("cardTypeSelect").value = typeName;
        return typeName;
    }
    else{
        document.getElementById("cardTypeSelect").value = false;
        reloadCardTypeSelect();
        generateEditingUI();
    }
}

function changeTypeName(from,to){
    modify();
    tempData.types[to] = tempData.types[from];
    delete tempData.types[from];
    reloadCardTypeSelect();
    document.getElementById("cardTypeSelect").value = to;
    generateEditingUI();
}

function addProperty(typeName){
    modify();
    tempData.types[typeName].properties.push({
        name: "",
        replace: ""
    });
    generateEditingUI();    
}

function deleteProperty(typeName,index){
    modify();
    index = Number(index);
    let properties = tempData.types[typeName].properties;
    tempData.types[typeName].properties = properties.slice(0,index).concat(properties.slice(index + 1));
    generateEditingUI();
}

function deleteType(typeName){
    modify();
    delete tempData.types[typeName];
    reloadCardTypeSelect();
    generateEditingUI();
}

async function uploadSVG(cardType,front = true){
    modify();
    let [handle] = await window.showOpenFilePicker(
    {
        types: [{
            description: "SVG files",
            accept: {"image/svg+xml":[".svg"]}
        }],
        excludeAcceptAllOption: true,
    }
    );
    let content = await (await handle.getFile()).text();
    tempData.types[cardType][front?"frontGraphic":"backGraphic"] = content;
    generateEditingUI(cardType);
}