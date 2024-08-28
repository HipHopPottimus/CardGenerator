var data;

var settings;

var CARD_SVGS = [];

window.addEventListener("DOMContentLoaded", async () => {
    data = await fileInterface.read();
    settings = document.getElementById("settings");
    for(let cardTypeName in data.types){
        settings.innerHTML += `<label>${cardTypeName}- Qty: <input type="number" id="qty${cardTypeName}" value="1"></input></label><br>`
    }
    settings.innerHTML += `
    <label>Cards/page: <input type="number" value="8" id="cardsPerPage"></label>
    `
});

function addGeneratedCards(){
    for(let card of data.cards){
        let qty = Number(document.getElementById("qty"+card.type).value);
        for(let i = 0;i < qty;i++){
            CARD_SVGS.push(generateSVGObj(card));
        }
    }
}

async function compileExport(){
    addGeneratedCards();
    let output = document.getElementById("printOutput");
    let cardsPerPage = Number(document.getElementById("cardsPerPage").value);
    let currentPage;
    let cardPages = [];
    let cardSet = -1;
    for(let i = 0;i < CARD_SVGS.length;i++){
        if(i % cardsPerPage == 0){
            cardSet += 1;
            cardPages[cardSet] = [];
        }
        cardPages[cardSet].push(CARD_SVGS[i]);
    }
    for(let page of cardPages){
        output.innerHTML += "<div class='page'></div>";
        for(let card of page){
            output.lastChild.innerHTML += card.frontGraphic;
        }
        output.innerHTML += "<div class='page'></div>";
        for(let card of page){
            output.lastChild.innerHTML += card.backGraphic;
        }
    }
    setTimeout(window.print());
}

async function addCustomSet(){
    let getSvgs = async() => {
        await window.showOpenFilePicker(
            {
                types: [{
                    description: "SVG files",
                    accept: {"image/xml+svg":[".svg"]}
                }],
                excludeAcceptAllOption: true,
                multiple: true
            });
    }
    let [frontGraphics,backGraphics] = await Promise.all([null,null].map(async ()=>{}));
}

function generateSVG(svg,properties,typeProperties){
    svg = svg || "";
    for(let property of typeProperties){
        svg = svg.replaceAll(property.replace,properties[property.name]);
    }
    return svg;
}

function generateSVGObj(card){
    let type = data.types[card.type];
    return {
        frontGraphic: card.frontGraphic || generateSVG(type.frontGraphic,card.properties,type.properties),
        backGraphic: card.backGraphic || generateSVG(type.backGraphic,card.properties,type.properties)
    }
}