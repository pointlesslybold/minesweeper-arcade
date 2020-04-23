var vw, vh;
var grid = document.querySelector(".grid");
var scaleRuler = Array.from(document.querySelectorAll(".scale-group .variant"));
var game = {}, gridFields = [], HTMLFields = [], mines = [];
var scaleHelperWD, scaleHelperHT;

//setting up defaults
game.isOver = true;
game.currentScale = "M";
game.defaultScale = "M";
game.hintsMax = 3;
game.hintsAvailable = 0;
game.currentWidthAmount = 0;
game.currentHeightAmount = 0;
game.currentMines = 0;
game.markedFields = 0;
game.minesSet = false;

window.addEventListener("resize", function(){
    setDimensions();
});

window.addEventListener("load", function(){
    initializeScale(game.defaultScale);
    document.getElementById("start").onclick = function(){
        startGame();
    };
    document.getElementById("stop").onclick = function(){
        stopGame();
    };
    document.getElementById("get-hint").onclick = function(){
        useHint();
    };
    document.querySelector(".notification").onclick = function(){
        if(!document.querySelector(".notification").classList.contains("autohide")){
            document.querySelector(".notification").className = "notification";
        }
    }
});

function startGame(){
    document.querySelector(".notification").className = "notification";
    if((isNaN(document.getElementById("grid-x").value))||(document.getElementById("grid-x").value == "")){
        game.currentWidthAmount = 10;
    }
    else{
        game.currentWidthAmount = document.getElementById("grid-x").value;
    }
    if((isNaN(document.getElementById("grid-y").value))||(document.getElementById("grid-y").value == "")){
        game.currentHeightAmount = 10;
    }
    else{
        game.currentHeightAmount = document.getElementById("grid-y").value;
    }
    if((isNaN(document.getElementById("grid-mine").value))||(document.getElementById("grid-mine").value == "")){
        game.currentMines = 10;
    }
    else{
        game.currentMines = document.getElementById("grid-mine").value;
    }

    if(game.currentMines > ((game.currentHeightAmount * game.currentWidthAmount)) - 9){
        notify("There are currently too many mines or the play area is too small, the game cannot start");
    }
    else if((game.currentWidthAmount>30)||(game.currentHeightAmount>24)){
        notify("The play area is too large. Maximum play area size allowed is 30x24");
    }
    else{
        document.getElementById("stop").className = "option-button";
        game.isOver = false;
        game.elapsedTime = 0;
        game.hintsAvailable = 3;
        game.markedFields = 0;
        game.minesSet = false;
    
        populateField();
        rebalanceGrid();
        clearInterval(game.timer);
        game.timer = setInterval(function(){
            tick()
        }, 1000);
    }
    setDimensions();
}

function stopGame(){
    clearInterval(game.timer);
    game.isOver = true;
    game.minesSet = false;
    game.hintsAvailable = 0;
    document.getElementById("get-hint").className = "option-button greyed";
    document.getElementById("stop").className = "option-button greyed";
}

function refreshHints(){
    game.hintsAvailable = game.hintsMax;
    document.getElementById("get-hint").className = "option-button";
    document.getElementById("get-hint").innerHTML =
    "Hint (" + game.hintsAvailable + "/" + game.hintsMax + ")";
}

function useHint(){
    if(!game.isOver){
        if(game.minesSet){
            if(game.hintsAvailable > 0){
                var hintableMines = [];
                for(var hintedMine of mines){
                    if((gridFields[hintedMine].status != "marked")&&(!HTMLFields[hintedMine].classList.contains("hint"))){
                        hintableMines.push(hintedMine);
                    }
                }
                if(hintableMines.length > 0){
                    HTMLFields[hintableMines.pick()].className = "covered hint";
                }
                else{
                    notify("There are no mines left");
                }
                game.hintsAvailable--;
                document.getElementById("get-hint").innerHTML =
                "Hint (" + game.hintsAvailable + "/" + game.hintsMax + ")";
                if(game.hintsAvailable == 0){
                    document.getElementById("get-hint").className = "option-button greyed";
                }
            }
            else{
                notify("You ran out of hints");
            }
        }
        else{
            notify("Mines are set after your first click, so there's no use for hints yet");
        }
    }
}

function rePad(value){
    return "0".substr(Math.floor(value/10))+value;
}

function tick(){
    game.elapsedTime++;
    document.querySelector(".timer .digits").innerHTML = rePad(Math.floor(game.elapsedTime / 60)) + ":" + rePad(game.elapsedTime % 60);
}

function setDimensions(){
    vw = document.querySelector(".grid-outer").clientWidth;
    vh = document.querySelector(".grid-outer").clientHeight;

    var computedWidth = (game.currentWidthAmount * scaleHelperWD) + 2;
    var computedHeight = (game.currentHeightAmount * scaleHelperHT) + 2;

    var scaleVariants = ["XL", "L", "M", "S", "XS"];
    var computedScale = scaleVariants.indexOf(game.currentScale);

    if((computedWidth >= vw)||(computedHeight >= vh)){
        if(!document.querySelector(".grid-outer").classList.contains("non-solid")){
            document.querySelector(".grid-outer").classList.add("non-solid");
        }
        notify("Play area can't fit. Either resize the window or start a new game", 1);
        if((computedScale>-1)&&(computedScale<4)){
            initializeScale(scaleVariants[computedScale + 1]);
        }
    }
    else{
        if(document.querySelector(".grid-outer").classList.contains("non-solid")){
            document.querySelector(".grid-outer").classList.remove("non-solid");
        }
        if(document.querySelector(".notification").classList.contains("autohide")){
            document.querySelector(".notification").className = "notification";
        }

        for(var variant of scaleRuler){
            variant.onclick = function(){
                initializeScale(this.id.split("scale")[1]);
            };
        }
    }
}

function rebalanceGrid(){
    grid.style.width = (game.currentWidthAmount * scaleHelperWD) + 2 + "px";
}

function initializeScale(code){
    game.currentScale = code;
    grid.className = "grid scale"+code;
    document.querySelector(".scale-helper").className = "scale-helper scale"+code;
    var helper = document.querySelector(".scale-helper");
    scaleHelperWD = parseInt(window.getComputedStyle(helper).getPropertyValue('width'));
    scaleHelperHT = parseInt(window.getComputedStyle(helper).getPropertyValue('height'));
    for(var variant of scaleRuler){
        if(variant == document.getElementById("scale"+code)){
            variant.className = "variant selected";
        }
        else{
            variant.className = "variant";
        }
    }

    setDimensions();
    rebalanceGrid();
}

function populateField(){
    //cleaning grid
    while(grid.firstChild){
        grid.removeChild(grid.firstChild);
    }
    gridFields.length = 0;

    //closing all grid fields
    var fieldsAmount = game.currentWidthAmount * game.currentHeightAmount;
    for(var i=0; i<fieldsAmount; i++){
        var field = document.createElement("DIV");
        field.className = "covered";
        field.onclick = function(){ seedMines(this); uncover(this); };
        field.oncontextmenu = function(){ mark(this) };
        grid.appendChild(field);
        gridFields[i] = {
            "isUncovered": false,
            "status": "notMarked",
            "hasMine": false
        };
    }
    HTMLFields = Array.from(document.querySelectorAll(".grid > div"));
}

function getIndexbyCoors(X, Y){
    if(Y * game.currentWidthAmount + X > -1){
        return Y * game.currentWidthAmount + X;
    }
    else{
        return -1;
    }
}

function getNeighbors(field){
    var neighbors = [];
    var width = game.currentWidthAmount;
    var height = game.currentHeightAmount;
    var fieldDigit = HTMLFields.indexOf(field);
    
    //get coordinates
    var Y = Math.floor(fieldDigit/width);
    var X = fieldDigit%width;

    var correlations = [
        [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ];

    for(var link in correlations){
        if((X + correlations[link][0] > -1)&&(X + correlations[link][0] < width)&&(Y + correlations[link][1] > -1)&&(Y + correlations[link][1] < height)){
            neighbors.push(
                getIndexbyCoors(X + correlations[link][0], Y + correlations[link][1])
            );
        }
    };
    return neighbors;
}

function seedMines(field){
    if(!game.minesSet){
        mines.length = 0;
        var neighbors = getNeighbors(field);
        while(mines.length < game.currentMines){
            var r = Math.floor(Math.random() * gridFields.length);
            if((mines.indexOf(r) === -1)&&(HTMLFields[r]!=field)){
                if(
                    (game.currentWidthAmount > 3)&&(game.currentHeightAmount > 3)&&(game.currentMines < gridFields.length - 9)
                ){
                    if(neighbors.indexOf(r)==-1){
                        mines.push(r);
                        gridFields[r].hasMine = true;
                    }
                }
                else{
                    mines.push(r);
                    gridFields[r].hasMine = true;
                }
            }
        }
        refreshHints();
        game.minesSet = true;
    }
}

function countCovered(){
    var openCounter = 0;
    for(var i=0; i<gridFields.length; i++){
        if(gridFields[i].status == "open"){
            openCounter++;
        }
    }
    return gridFields.length - openCounter;
}

function getDigit(field){
    var neighbors = getNeighbors(field);
    var containingDigit = 0;
    for(var newField of neighbors){
        if(gridFields[newField].hasMine){
            containingDigit++;
        }
    }
    return containingDigit;
}

function explodeMines(){
    for(let i=0; i<gridFields.length; i++){
        if(gridFields[i].hasMine == true){
            gridFields[i].status == "exploded";
            HTMLFields[i].className = "mine exploded";
        }
        else{
            uncover(HTMLFields[i]);
        }
    }
}

function uncover(field){
    var logicField = gridFields[HTMLFields.indexOf(field)];
    if((field.classList.contains("covered"))&&(logicField.status == "notMarked")&&(!game.isOver)){
        if(logicField.hasMine){
            explodeMines();
            notify("You lose");
            stopGame();
        }
        else{
            logicField.isUncovered = true;
            logicField.status = "open";
            var neighbors = getNeighbors(field);
            var containingDigit = 0;
            for(var newField of neighbors){
                if(gridFields[newField].hasMine){
                    containingDigit++;
                }
                else if(getDigit(field)==0){
                    uncover(HTMLFields[newField]);
                }
            }
            if(containingDigit > 0){
                field.className = "prox-"+containingDigit;
            }
            else{
                field.className = "";
            }
            if(countCovered() == game.currentMines){
                notify("You Win");
                stopGame();
            }
        }
    }
}

function mark(field){
    event.preventDefault();
    var logicField = gridFields[HTMLFields.indexOf(field)];
    if(field.classList.contains("covered")){
        if((!field.classList.contains("flag"))&&(!field.classList.contains("question"))){
            if(game.markedFields < game.currentMines){
                logicField.status = "marked";
                field.className = "covered flag";
                game.markedFields++;
            }
        }
        else if(field.classList.contains("flag")){
            logicField.status = "questioned";
            field.className = "covered question";
            game.markedFields--;
        }
        else{
            logicField.status = "notMarked";
            field.className = "covered";
        }
    }
}

function notify(msg, option){
    option = option || 0;
    var noteText = document.querySelector(".notification");
    noteText.innerHTML = msg;
    if(option==0){
        noteText.className = "notification visible";
    }
    else{
        noteText.className = "notification visible autohide";
    }
}

Array.prototype.pick = function(){
    return this[Math.floor(Math.random()*this.length)];
}