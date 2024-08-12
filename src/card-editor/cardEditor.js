window.addEventListener("DOMContentLoaded",async () => {
    await refreshData();
    reloadCardTypeSelect();
    reloadTables();
});

window.addEventListener("keydown",(e) => {
    if(e.key == "s" && e.ctrlKey){
        e.preventDefault();
        save();
    }
    if(e.key == "o" && e.ctrlKey){
        e.preventDefault();
        fileInterface.openFile();
    }
    if(e.key == "n" && e.ctrlKey && e.altKey){
        e.preventDefault();
        fileInterface.createNewFile();
    }
})

window.addEventListener("beforeunload",(e) => {
    if(!saved){
        e.preventDefault();
    }
});

(new BroadcastChannel("SWComms")).addEventListener("message",(e) => {
    let {data} = e;
    if(data.type == "update"){
        let popup  = document.createElement("dialog");
        popup.innerHTML = `
        <h1>An update has been installed</h1>
        <p>Version: ${data.version}</p>
        <p>Change notes:</p>
        <p>${data.notes}</p>
        <b><p>This app requires to be restarted for updates to take effect</p></b>
        <button onclick="window.location.reload()">Restart</button>
        `;
        popup.onfocusout = () => popup.click();
        document.body.appendChild(popup);
        popup.show()
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
    reloadCardTypeSelect();
}

function reloadCardTypeSelect(){
    let cardTypeSelect = document.getElementById("cardTypeSelect");
    let originalValue = cardTypeSelect.value;
    cardTypeSelect.innerHTML = "";
    let cardType;
    for(cardType in tempData.types){
        cardTypeSelect.innerHTML += `<option value="${cardType}">${cardType}</option>`;
    }
    cardTypeSelect.innerHTML += `<option value="*">All types</option>`;
    cardTypeSelect.value = originalValue || cardType;
}

var tempData;

async function reloadTables(){
    document.getElementById("tableArea").innerHTML = "";
    let cardType = document.getElementById("cardTypeSelect").value;
    if(!cardType){
        document.getElementById("tableArea").innerHTML = "No card types found.";
        return;
    }
    if(cardType == "*"){
        for(let type in tempData.types){
            generateTable(type);
        }
    }
    else{
        generateTable(cardType);
    }
}

async function generateTable(cardType){
    let content = "";
    content += `
        <p>${cardType} cards</p>
        <table id="${cardType}Table"><tbody>
    `;
    
    let properties = tempData.types[cardType].properties;

    content += "<tr>";
    for(let property of properties){
        content += `<th>${property.name}</th>`;
    }
    content += `<td class="noBorder"><td class="noBorder"></tr>`;
    let cards = tempData.cards.filter((card) => card.type == cardType);
    for(let row = 0;row < cards.length;row++){
        let card = cards[row];
        
        let cardIndex;
        for(let c = 0;c < tempData.cards.length;c++){
            if(JSON.stringify(tempData.cards[c]) == JSON.stringify(card)){
                cardIndex = c;
                break;
            }
        }

        content += "<tr>";
        for(let cell = 0;cell < properties.length;cell++){
            let property = properties[cell]
            content += `<td><span class="editableTableValue" data-property="${property.name}" data-cellNum="${cell}" data-rowNum="${row}" data-cardIndex="${cardIndex}">${card.properties[property.name]}</span></td>`;
        }

        content += `<td class="noBorder"><button onclick="deleteCard(${cardIndex})">Delete</button></td><td class="noBorder" ><button onclick="previewCard(${cardIndex})">Preview</button></td></tr>`;
    }
    content += `
    </tbody></table>
    <button onclick="createCard('${cardType}')">Create a new card</button>
    `;
    
    document.getElementById("tableArea").innerHTML += content;
    for(let tv of document.getElementsByClassName("editableTableValue")){
        tv.setAttribute("contenteditable","");
        tv.onkeydown = (e) => {
            //prevent enter from being pressed
            if(e.key == "Enter"){
                e.preventDefault();
                let table = document.getElementById(cardType+"Table");
                let rowNumber = Number(tv.getAttribute("data-rowNum")) + 1;
                if((rowNumber + 2) > table.rows.length){
                    createCard(cardType);
                    table = document.getElementById(cardType+"Table");
                }
                let row = table.rows[rowNumber];
                table.rows[rowNumber + 1].cells[Number(tv.getAttribute("data-cellNum"))].children[0].focus();
            }
        }
        tv.onblur = (e) => {
            modify();
            tempData.cards[Number(tv.getAttribute("data-cardIndex"))].properties[tv.getAttribute("data-property")] = tv.innerHTML;
        }
    }
}

function createCard(type){
    let newCard = {type,properties: {}};
    for(let property of tempData.types[type].properties){
        newCard.properties[property.name] = " ";
    }
    tempData.cards.push(newCard);
    modify();
    reloadTables();
}

function deleteCard(index){
    modify();
    tempData.cards = tempData.cards.slice(0,index).concat(tempData.cards.slice(index + 1));
    reloadTables();
}

function previewCard(index){
    let popup = document.createElement("dialog");
    popup.innerHTML = generateSVG(tempData.cards[index]);
    popup.innerHTML += `<br><button onclick="this.parentElement.remove()">Close</button>`;
    document.body.appendChild(popup);
    popup.show();
}

function generateSVG(card){
    let type = tempData.types[card.type];
    let svg = type.frontGraphic;
    for(let property of type.properties){
        svg = svg.replaceAll(property.replace,card.properties[property.name]);
    }
    return svg;
}