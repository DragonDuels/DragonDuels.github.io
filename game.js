let scale;
let gameWidth = 1000;  //zawsze 1000 takich to 95% z width w resizeGame()     by obliczyć prawdziwą wartość w pikselach wystarczy:
let gameHeight = 600; //zawsze 600 takich to 95% z height w resizeGame()           gameWidth * scale albo gameHeight * scale

const board = document.getElementById("board");

const netCanvas = document.getElementById("net");
const netCtx = netCanvas.getContext("2d");

const backgroundCanvas = document.getElementById("background");
const backgroundCtx = backgroundCanvas.getContext("2d");

function resizeGame()
{
    let width = window.innerWidth;
    let height = Math.floor(width * 0.6);         //height = 60% width

    if(height > window.innerHeight){               //jesli 60% z width większa niż wysokość okna
        height = window.innerHeight;                //Dopasowanie wysokości do okna
        width = height / 0.6;                        //Dopasowanie szerokości proporcjonalnie
    }
    scale = width / 1000 * 0.99;                     //Dopasowanie skali
    width = width * 0.99;
    height = height * 0.99;                          //height === gameHeight * scale
    let left = (window.innerWidth - width) / 2/* + scale * 39*/;
    let top = (window.innerHeight - height) / 2/* + scale * 33;*/ //Dopasowanie położenia planszy do okna

    //board div
    board.style.width = width + "px";
    board.style.height = height + "px";                          //Dopasowanie wielkości planszy do okna
    board.style.left = left + "px";     //odejmujemy szerokość planszy od szerokości okna i dzielimy przez 2
    board.style.top = top + "px";       //Dopasowanie położenia planszy do okna

    //net canvas
    netCanvas.style.width = width + "px";
    netCanvas.width = width * devicePixelRatio;
    
    netCanvas.style.height = height + "px";                         //Dopasowanie wielkości canvasa do okna
    netCanvas.height = height * devicePixelRatio;
    
    netCanvas.style.left = left + "px";       //dostajemy 5% szerokości okna
    netCanvas.style.top = top + "px";           //Dopasowanie położenia planszy do okna

    //background canvas
    backgroundCanvas.style.width = window.innerWidth + "px";
    backgroundCanvas.width = window.innerWidth * devicePixelRatio;
    backgroundCanvas.style.height = window.innerHeight + "px"; //Dopasowanie wielkości tła do okna
    backgroundCanvas.height = window.innerHeight * devicePixelRatio;
    backgroundCanvas.style.left = "0px";       //tło zawsze w lewym górnym rogu
    backgroundCanvas.style.top = "0px";           //Dopasowanie położenia tła do okna

    lobby.drawBackground(); //Rysowanie tła planszy
    
    if(lobby.mode === "game"){
        net.draw();
        player1.draw();
        player2.draw();
        if(currentPlayer === "player1"){
            player2.ui.drawHealth(player2);
            if(!timeoutIsActive){
                player1.ui.drawAll(player1);
            }else{
                player1.ui.drawHealth(player1);
                player1.ui.drawEnergy(player1);
            }
        }else{
            player1.ui.drawHealth(player1);
            if(!timeoutIsActive){
                player2.ui.drawAll(player2);
            }else{
                player2.ui.drawHealth(player2);
                player2.ui.drawEnergy(player2);
            }
        }   
    }
    lobby.draw();
    
}
function goFullscreen() 
{
    if(board.requestFullscreen){
        board.requestFullscreen();
    }else if(board.webkitRequestFullscreen){
        board.webkitRequestFullscreen();
    }else if(board.msRequestFullscreen){ 
        board.msRequestFullscreen();
    }
}
function Hexagon(left, top, width, height, lineColor, fillColor, lineOpacity, fillOpacity)
{
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.color = {
        line: lineColor,
        lineOpacity: lineOpacity,
        fill: fillColor,
        fillOpacity: fillOpacity
    };

    this.draw = function(left, top, width, height, lineColor, fillColor, lineOpacity, fillOpacity) 
    {
        if(!(left === null))
            this.left = left;
        if(!(top === null))
            this.top = top;
        if(!(width === null))   
            this.width = width;
        if(!(height === null))
            this.height = height;
        if(lineColor)
            this.color.line = lineColor;
        if(fillColor)
            this.color.fill = fillColor;
        if(lineOpacity === 0 || lineOpacity)
            this.color.lineOpacity = lineOpacity;
        if(fillOpacity === 0 || fillOpacity)
            this.color.fillOpacity = fillOpacity;

        // Rysowanie sześciokąta z dwiema poziomymi podstawami
        //jak dodac kolor i grubość linii?
        netCtx.strokeStyle = this.color.line;
        netCtx.fillStyle = this.color.fill;
        netCtx.lineWidth = this.width / 100 * scale;
        netCtx.beginPath();
        netCtx.moveTo(
            (this.left + 0.25 * this.width) * scale, 
            this.top * scale
        );
        netCtx.lineTo(
            (this.left + 0.75 * this.width) * scale, 
            this.top * scale
        );
        netCtx.lineTo(
            (this.left + this.width) * scale, 
            (this.top + 0.5 * this.height) * scale
        );
        netCtx.lineTo(
            (this.left + 0.75 * this.width) * scale, 
            (this.top + this.height) * scale
        );
        netCtx.lineTo(
            (this.left + 0.25 * this.width) * scale, 
            (this.top + this.height) * scale
        );
        netCtx.lineTo(
            this.left * scale, 
            (this.top + 0.5 * this.height) * scale
        );
        netCtx.closePath();
        
        netCtx.globalAlpha = this.color.fillOpacity;
        netCtx.fill();
        netCtx.globalAlpha = this.color.lineOpacity;
        netCtx.stroke();
        
        netCtx.globalAlpha = 1;
    }
}
function Net(rows, columns, left, top, width, height, lineColor, fillColor, lineOpacity, fillOpacity) 
{
    this.left = left;
    this.firstLeft = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.color = {
        line: lineColor,
        lineOpacity: lineOpacity, 
        fill: fillColor,
        fillOpacity: fillOpacity
    };
    this.firstColor = {
        line: lineColor,
        lineOpacity: lineOpacity, 
        fill: fillColor,
        fillOpacity: fillOpacity
    };

    this.rows = rows;
    if(columns)
        this.columns = columns;
    else
        this.columns = Math.floor(this.height / this.width * this.rows);    
    this.info = [];
    this.hexagonWidth = this.width / (0.75 * (rows - 1) + 1);  //(this.width + (this.width / this.rows / 4) * (this.rows - 1)) / this.rows;  
    this.hexagonHeight = this.height / (this.columns + 0.5);              
    //tworzenie siatki z sześciokątów
    for(let i = 0; i < this.rows; i++){

        let column = [];
        
        if(i % 2 === 0 || i === 0){
            for(let j = 0; j < this.columns; j++){
                column.push(new Hexagon(
                    this.left + i * this.hexagonWidth * 0.75, 
                    this.top + j * this.hexagonHeight, 
                    this.hexagonWidth, 
                    this.hexagonHeight, 
                    this.color.line, 
                    this.color.fill,
                    this.color.lineOpacity,
                    this.color.fillOpacity
                ));
            }
        }else{
            for(let j = 0; j < this.columns; j++){
                column.push(new Hexagon(
                    this.left + i * this.hexagonWidth * 0.75, 
                    this.top + j * this.hexagonHeight + this.hexagonHeight / 2, 
                    this.hexagonWidth, 
                    this.hexagonHeight, 
                    this.color.line, 
                    this.color.fill,
                    this.color.lineOpacity,
                    this.color.fillOpacity
                ));
            }
        }

        this.info.push(column);                //net.info[numer kolumny][numer rzędu w tej kolumnie]  proste? proste! 
    }

    this.draw = function(lineColor, fillColor, lineOpacity, fillOpacity)
    {
        //dawanie obrazku w tle
        //netCtx.drawImage(backgroundImage, 0, 0, netCanvas.width, netCanvas.width);
        this.color.line = false;
        this.color.fill = false;
        this.color.lineOpacity = false;
        this.color.fillOpacity = false;
        if(lineColor)
            this.color.line = lineColor;
        if(fillColor)
            this.color.fill = fillColor;
        if(lineOpacity === 0 || lineOpacity)
            this.color.lineOpacity = lineOpacity;
        if(fillOpacity === 0 || fillOpacity)
            this.color.fillOpacity = fillOpacity;
        for(let i = 0; i < this.rows; i++){
            for(let j = 0; j < this.columns; j++){
                net.info[i][j].draw(this.left + i * this.hexagonWidth * 0.75, null, null, null, this.color.line , this.color.fill, this.color.lineOpacity, this.color.fillOpacity); //rysowanie sześciokątów oraz zmiana koloru
            }
        }  
    }   
    this.drawFirstVersion = function()
    {
        this.draw(this.firstColor.line, this.firstColor.fill, this.firstColor.lineOpacity, this.firstColor.fillOpacity);
    }
}
function hexDistance(aRow, aCol, bRow, bCol) {
    let aX = aCol - (aRow - (aRow&1)) / 2;
    let aZ = aRow;
    let aY = -aX - aZ;

    let bX = bCol - (bRow - (bRow&1)) / 2;
    let bZ = bRow;
    let bY = -bX - bZ;

    return Math.max(Math.abs(aX - bX), Math.abs(aY - bY), Math.abs(aZ - bZ));
}
function antiSpiritWalk(dragon, enemyDragon = null, distance = dragon.goDistance, row, column) 
{
    const distToTarget = hexDistance(dragon.row, dragon.column, row, column);
    if(distToTarget > distance) return false;

    if(enemyDragon === null) return true;

    // Odległości
    const d1 = hexDistance(dragon.row, dragon.column, enemyDragon.row, enemyDragon.column);
    const d2 = hexDistance(enemyDragon.row, enemyDragon.column, row, column);

    // Sprawdź, czy enemyDragon jest na drodze
    if(d1 + d2 === distToTarget){
        return false; // BLOKUJE drogę
    }

    return true; // NIE blokuje drogi
}
function highlightDragonRange(dragon, enemyDragon = null, color = "rgb(0, 255, 0)", distance = dragon.goDistance) {
    for(let i = 0; i < net.rows; i++){
        for(let j = 0; j < net.columns; j++){
            if(antiSpiritWalk(dragon, enemyDragon, distance, i, j)){
                net.info[i][j].draw(null, null, null, null, color, color, 0.5, 0.4);
            }
        }
    }
}
let clickedHex = null;
let mouseMoveHex = null;
function enableHexHoverPreview(x, y)
{
    for(let i = 0; i < net.rows; i++){
        for(let j = 0; j < net.columns; j++){
            let hex = net.info[i][j];
            if(x >= hex.left + hex.width / 10 && x <= hex.left + hex.width * 0.9 && y >= hex.top + hex.height / 10 && y <= hex.top + hex.height * 0.9){
                return{row: i, column: j};
            }
        }
    }
    return null;
}
netCanvas.addEventListener("mousemove", (event) => {
    let hex = enableHexHoverPreview(event.offsetX / scale, event.offsetY / scale);
    if(hex && lobby.mode === "game"){
        mouseMoveHex = hex;
    }else{
        mouseMoveHex = null;
    }
});
netCanvas.addEventListener("click", (event) => {
    let hex = enableHexHoverPreview(event.offsetX / scale, event.offsetY / scale);
    if(hex && lobby.mode === "game"){
        clickedHex = hex;
    }else{
        clickedHex = null;
    }
    if(lobby.mode !== "game" || true){ 
        lobby.scan(event.offsetX / scale, event.offsetY / scale);
    }
});

function Lobby(left, top, width, height, lineColor, fillColor, lineOpacity, fillOpacity)
{
    this.firstBackgroundSizePx;
    this.getFirstBackgroundSizePx = function()
    {
        if(backgroundCanvas.width > backgroundCanvas.height){
            this.firstBackgroundSizePx = backgroundCanvas.width;
        }else{
            this.firstBackgroundSizePx = backgroundCanvas.height;
        }
    }
    this.mode = "start"; //tryb startu gry
    this.selectedDragons = [0, 0]; //tablica wybranych smoków
    this.selectDragon = function(delta, player)
    {
        if(player === 1){
            this.selectedDragons[0] += delta; //zmiana wybranego smoka gracza 1
            if(this.selectedDragons[0] + delta < -1)
                this.selectedDragons[0] = dragons.length - 1;
            if(this.selectedDragons[0] + delta > dragons.length)
                this.selectedDragons[0] = 0;
        }
        if(player === 2){
            this.selectedDragons[1] += delta; //zmiana wybranego smoka gracza 1
            if(this.selectedDragons[1] + delta < -1)
                this.selectedDragons[1] = dragons.length - 1;
            if(this.selectedDragons[1] + delta > dragons.length)
                this.selectedDragons[1] = 0;
        }
        //console.log("Wybrano smoki:", this.selectedDragons);
    } 

    this.createButton = function(tekst, left, top, width, height, color, image, imageLeft, imageTop, imageWidth, imageHeight, onClick, isPlayer = false)
    {
        let button = {
            tekst: tekst,
            left: left,
            top: top,
            width: width,
            height: height,
            color: {
                line: color[0] !== null ? color[0] : "#00ff00",
                fill: color[1] !== null ? color[1] : "#00ff00",
                lineOpacity: color[2] !== null ? color[2] : 0.5,
                fillOpacity: color[3] !== null ? color[3] : 0.5
            },
            image: image || null, //obrazek przycisku
            imageLeft: imageLeft !== null ? imageLeft : null, //położenie obrazka przycisku
            imageTop: imageTop !== null ? imageTop : null, //położenie obrazka przycisku
            imageWidth: imageWidth !== null ? imageWidth : null, //szerokość obrazka przycisku
            imageHeight: imageHeight !== null ? imageHeight : null, //wysokość obrazka przycisku
            function: onClick || null, //funkcja wywoływana po kliknięciu w przycisk
            isPlayer: isPlayer //czy przycisk jest dla gracza
        };
        return button;
    }
    let buttonsForAllModes = {
        start: [
            this.createButton(
                "",                                    // tekst
                left + width / 2 - 125,                // left
                top + height / 2 - 90,                 // top
                250,                                   // width
                170,                                   // height
                ["#00ff00", "white", 0, 0],            // color
                "images/start.png",                    // image
                left + width / 2 - 250,                // imageLeft
                top + height / 2 - 250,                // imageTop
                500,                                   // imageWidth
                500,                                   // imageHeight
                () => {
                    preloadDragonImages(dragonImages, () => {
                        this.changeMode("lobby");
                    });
                    
                }                                   // onClick
            )
        ],
        loading: [
            this.createButton(
                "LOADING",
                left + width / 2 - 290, // left
                top + height / 2 - 300, // top
                600,                    // width
                200,                    // height
                ["orange", "orange", 0, 0], // color jako tablica
                "images/loading.png",   // image
                left + width / 2 - 300, // imageLeft
                top + height / 2 - 220, // imageTop
                600,                    // imageWidth
                600,                    // imageHeight
                null                    // onClick
            )
        ],
        lobby: [
            this.createButton(
                "PLAY", //tekst przycisku
                left + width / 2 - 100, //położenie przycisku
                top + height / 2 + 125, //położenie przycisku
                200, //szerokość przycisku
                130, //wysokość przycisku
                ["yellow", "yellow", 0.2, 0], //kolory przycisku
                "images/startDuel.png", //brak obrazka
                left + width / 2 - 150, //brak położenia obrazka
                top + height / 2 + 80, //brak położenia obrazka
                300, //brak szerokości obrazka
                220, //brak wysokości obrazka  
                () => {
                    resetDragons(dragons[this.selectedDragons[0]], dragons[this.selectedDragons[1]]);
                    timeoutIsActive = false;
                    this.changeMode("game"); //zmiana trybu na lobby
                }
            ),
            this.createButton(//player 1
                "PLAYER 1", //tekst przycisku
                left + width / 2 - 330, //położenie przycisku
                top + height / 2 - 275, //położenie przycisku
                250, //szerokość przycisku
                100, //wysokość przycisku
                ["blue", "purple", 0.05, 0.25], //kolory przycisku
                null, //obrazek przycisku
                left + width / 2 - 349, //położenie obrazka
                top + height / 2 - 149, //położenie obrazka
                248, //szerokość obrazka
                248, //wysokość obrazka  
                null //brak funkcji po kliknięciu
            ),
            this.createButton(//player 2
                "PLAYER 2", //tekst przycisku
                left + width / 2 + 80, //położenie przycisku
                top + height / 2 - 275, //położenie przycisku
                250, //szerokość przycisku
                100, //wysokość przycisku
                ["blue", "purple", 0.05, 0.25], //kolory przycisku
                null, //obrazek przycisku
                left + width / 2 - 349, //położenie obrazka
                top + height / 2 - 149, //położenie obrazka
                248, //szerokość obrazka
                248, //wysokość obrazka  
                null //brak funkcji po kliknięciu
            ),
            this.createButton(//dragon 1
                "", //tekst przycisku
                left + width / 2 - 350, //położenie przycisku
                top + height / 2 - 150, //położenie przycisku
                250, //szerokość przycisku
                250, //wysokość przycisku
                ["yellow", "black", 0.2, 0.1], //kolory przycisku
                "images/dragon1/run/0.png", //obrazek przycisku
                left + width / 2 - 349, //położenie obrazka
                top + height / 2 - 149, //położenie obrazka
                248, //szerokość obrazka
                248, //wysokość obrazka  
                null, //brak funkcji po kliknięciu
                1
            ),
            this.createButton(//<--
                "<---", //tekst przycisku
                left + width / 2 - 350, //położenie przycisku
                top + height / 2 + 100, //położenie przycisku
                95, //szerokość przycisku
                50, //wysokość przycisku
                ["yellow", "black", 0.2, 0.1], //kolory przycisku
                null, //obrazek przycisku
                left + width / 2 - 349, //położenie obrazka
                top + height / 2 - 149, //położenie obrazka
                248, //szerokość obrazka
                248, //wysokość obrazka  
                () => {this.selectDragon(-1, 1)} //brak funkcji po kliknięciu
            ),
            this.createButton(//-->
                "--->", //tekst przycisku
                left + width / 2 - 255, //położenie przycisku
                top + height / 2 + 100, //położenie przycisku
                95, //szerokość przycisku
                50, //wysokość przycisku
                ["yellow", "black", 0.2, 0.1], //kolory przycisku
                null, //obrazek przycisku
                left + width / 2 - 349, //położenie obrazka
                top + height / 2 - 149, //położenie obrazka
                248, //szerokość obrazka
                248, //wysokość obrazka  
                () => {this.selectDragon(1, 1)} //brak funkcji po kliknięciu
            ),
            this.createButton(//dragon 2
                "", //tekst przycisku
                left + width / 2 + 100, //położenie przycisku
                top + height / 2 - 150, //położenie przycisku
                250, //szerokość przycisku
                250, //wysokość przycisku
                ["yellow", "black", 0.2, 0.1], //kolory przycisku
                "images/dragon1/run/4.png", //obrazek przycisku
                left + width / 2 + 101, //położenie obrazka
                top + height / 2 - 149, //położenie obrazka
                248, //szerokość obrazka
                248, //wysokość obrazka  
                null, //brak funkcji po kliknięciu
                2 
            ),
            this.createButton(//<--
                "<---", //tekst przycisku
                left + width / 2 + 160, //położenie przycisku
                top + height / 2 + 100, //położenie przycisku
                95, //szerokość przycisku
                50, //wysokość przycisku
                ["yellow", "black", 0.2, 0.1], //kolory przycisku
                null, //obrazek przycisku
                left + width / 2 - 349, //położenie obrazka
                top + height / 2 - 149, //położenie obrazka
                248, //szerokość obrazka
                248, //wysokość obrazka  
                () => {this.selectDragon(-1, 2)} //brak funkcji po kliknięciu
            ),
            this.createButton(//-->
                "--->", //tekst przycisku
                left + width / 2 + 255, //położenie przycisku
                top + height / 2 + 100, //położenie przycisku
                95, //szerokość przycisku
                50, //wysokość przycisku
                ["yellow", "black", 0.2, 0.1], //kolory przycisku
                null, //obrazek przycisku
                left + width / 2 - 349, //położenie obrazka
                top + height / 2 - 149, //położenie obrazka
                248, //szerokość obrazka
                248, //wysokość obrazka  
                () => {this.selectDragon(1, 2)} //brak funkcji po kliknięciu
            )
        ],
        game: [

        ],
        settings: [
            this.createButton(
                "END GAME AND BACK TO THE LOBBY", //tekst przycisku
                left + width / 2 - 125, //położenie przycisku
                top + height - 300, //położenie przycisku
                250, //szerokość przycisku
                80, //wysokość przycisku
                ["yellow", "orange", 0.5, 0.5], //kolory przycisku
                null, //obrazek przycisku
                null, //położenie obrazka
                null, //położenie obrazka
                null, //szerokość obrazka
                null, //wysokość obrazka  
                () => {
                    this.mode = "settings2"; //zmiana trybu na menu
                } //funkcja po kliknięciu
            ),
            this.createButton(
                "CONTINUE GAME", //tekst przycisku
                left + width / 2 - 150, //położenie przycisku
                top + height - 100, //położenie przycisku
                300, //szerokość przycisku
                80, //wysokość przycisku
                ["black", "green", 0.5, 0.5], //kolory przycisku
                null, //obrazek przycisku
                null, //położenie obrazka
                null, //położenie obrazka
                null, //szerokość obrazka
                null, //wysokość obrazka  
                () => {
                    this.changeMode("game"); //zmiana trybu na menu
                } //funkcja po kliknięciu
            )
        ],
        settings2: [
            this.createButton(
                "BACK TO LOBBY AND CANCEL CURRENT FIGHT?", //tekst przycisku
                left + width / 2 - 100, //położenie przycisku
                top + height - 300, //położenie przycisku
                200, //szerokość przycisku
                80, //wysokość przycisku
                ["yellow", "red", 0.5, 0.5], //kolory przycisku
                null, //obrazek przycisku
                null, //położenie obrazka
                null, //położenie obrazka
                null, //szerokość obrazka
                null, //wysokość obrazka  
                () => {
                    this.changeMode("lobby"); //zmiana trybu na menu
                } //funkcja po kliknięciu
            ),
            this.createButton(
                "BACK TO SETTINGS", //tekst przycisku
                left + width / 2 - 150, //położenie przycisku
                top + height - 100, //położenie przycisku
                300, //szerokość przycisku
                80, //wysokość przycisku
                ["black", "green", 0.5, 0.5], //kolory przycisku
                null, //obrazek przycisku
                null, //położenie obrazka
                null, //położenie obrazka
                null, //szerokość obrazka
                null, //wysokość obrazka  
                () => {
                    this.mode = "settings"; //zmiana trybu na menu
                } //funkcja po kliknięciu
            )
        ],
        beatDefeat: [
            this.createButton(//player 1
                "PLAYER 1", //tekst przycisku
                left + width / 2 - 330, //położenie przycisku
                top + height / 2 - 275, //położenie przycisku
                250, //szerokość przycisku
                100, //wysokość przycisku
                ["blue", "purple", 0.05, 0.25], //kolory przycisku
                "images/dragon1/run/0.png", //obrazek przycisku
                left + width / 2 - 389, //położenie obrazka
                top + height / 2 - 189, //położenie obrazka
                328, //szerokość obrazka
                328, //wysokość obrazka  
                null, //brak funkcji po kliknięciu
                1
            ),
            this.createButton(//player 2
                "PLAYER 2", //tekst przycisku
                left + width / 2 + 80, //położenie przycisku
                top + height / 2 - 275, //położenie przycisku
                250, //szerokość przycisku
                100, //wysokość przycisku
                ["blue", "purple", 0.05, 0.25], //kolory przycisku
                "images/dragon1/run/0.png", //obrazek przycisku
                left + width / 2 + 40, //położenie obrazka
                top + height / 2 - 189, //położenie obrazka
                328, //szerokość obrazka
                328, //wysokość obrazka  
                null, //brak funkcji po kliknięciu
                2
            ),
            this.createButton(//winner p1?
                "winner", //tekst przycisku
                left + width / 2 - 500, //położenie przycisku
                top + height / 2 + 145, //położenie przycisku
                460, //szerokość przycisku
                125, //wysokość przycisku
                ["white", "gray", 0, 0.1], //kolory przycisku
                null, //obrazek przycisku
                left + width / 2 - 389, //położenie obrazka
                top + height / 2 - 189, //położenie obrazka
                328, //szerokość obrazka
                328, //wysokość obrazka  
                null, //brak funkcji po kliknięciu
                3
            ),
            this.createButton(//winner p2?
                "defeat", //tekst przycisku
                left + width / 2 + 40, //położenie przycisku
                top + height / 2 + 145, //położenie przycisku
                410, //szerokość przycisku
                125, //wysokość przycisku
                ["white", "gray", 0, 0.1], //kolory przycisku
                null, //obrazek przycisku
                left + width / 2 + 40, //położenie obrazka
                top + height / 2 - 189, //położenie obrazka
                328, //szerokość obrazka
                328, //wysokość obrazka  
                null, //brak funkcji po kliknięciu
                4
            ),
            this.createButton(
                "RETRY", //tekst przycisku
                left + width / 2 - 100, //położenie przycisku
                top + height - 100, //położenie przycisku
                200, //szerokość przycisku
                80, //wysokość przycisku
                ["white", "gray", 1, 1], //kolory przycisku
                null, //obrazek przycisku
                null, //położenie obrazka
                null, //położenie obrazka
                null, //szerokość obrazka
                null, //wysokość obrazka  
                () => {
                    this.changeMode("lobby"); //zmiana trybu na menu
                } //funkcja po kliknięciu
            )
        ]
    };
    for(let mode in buttonsForAllModes){
        if(buttonsForAllModes.hasOwnProperty(mode)){
            for(let i = 0; i < buttonsForAllModes[mode].length; i++){
                if(buttonsForAllModes[mode][i].image !== null && typeof buttonsForAllModes[mode][i].image === "string"){
                    let image = new Image();
                    image.src =  buttonsForAllModes[mode][i].image;
                    buttonsForAllModes[mode][i].image = image; //zamiana stringa na obiekt Image
                }else{
                    buttonsForAllModes[mode][i].image = null; //jeśli nie ma obrazka to ustawiamy na null
                }
            }
        }
    }

    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.color = {
        line: lineColor,
        lineOpacity: lineOpacity,
        fill: fillColor,
        fillOpacity: fillOpacity
    };
    this.backgrounds = {
        start: "images/background1.png",
        loading: "images/background2.png",
        lobby: "images/background3.png",
        game: "images/backgroundBattleArena2.png",
        beatDefeat: "images/background4.png",
        settings: "images/background5.png",
        settings2: "images/background5.png"
    };
    for(let background in this.backgrounds){
        if(this.backgrounds.hasOwnProperty(background)){
            let image = new Image();
            image.src = this.backgrounds[background];
            this.backgrounds[background] = image; //zamiana stringa na obiekt Image
        }
    }
    this.changingMode = false; //czy zmieniamy tryb
    this.changeMode = function(newMode)
    {
        if(this.mode !== newMode && !this.changingMode){
            this.changingMode = true; //blokada zmiany trybu
            let time = 1000; //czas zmiany trybu w ms
            let timer = 0;
            let intervalId = setInterval(
                () => {
                    if(timer < time / 2){
                        board.style.opacity = 1 - timer / (time / 2); //zmniejszanie przezroczystości
                    }else if(timer < time){
                        if(this.mode !== "loading"){
                            this.mode = "loading";
                        }
                        board.style.opacity = (timer - time / 2) / (time / 2); //zwiększanie przezroczystości
                    }else if(timer >= time){
                        board.style.opacity = 1;
                        clearInterval(intervalId);
                        timer = 0;
                        setTimeout(() => {
                            intervalId = setInterval(
                                () => {
                                    if(timer < time / 2){
                                        board.style.opacity = 1 - timer / (time / 2); //zmniejszanie przezroczystości
                                    }else if(timer < time){
                                        if(this.mode !== newMode){
                                            this.mode = newMode;
                                            //console.log("Zmieniono tryb na:", this.mode);
                                        }
                                        board.style.opacity = (timer - time / 2) / (time / 2); //zwiększanie przezroczystości
                                    }else if(timer >= time){
                                        board.style.opacity = 1;
                                        this.changingMode = false;
                                        clearInterval(intervalId);
                                    }
                                    timer += time / 100;
                                    //console.log("Zmiana trybu: " + this.mode + " -> " + newMode + ", timer: " + timer); 
                                }, 
                                time / 100
                            );
                        }, 850);
                                
                    }
                    timer += time / 100;
                    //console.log("Zmiana trybu: " + this.mode + " -> " + newMode + ", timer: " + timer); 
                }, 
                time / 100
            );             
        }
    } 
    this.drawBackground = function()
    {
        this.getFirstBackgroundSizePx();
        let left = (backgroundCanvas.width - this.firstBackgroundSizePx) / 2;
        let top = (backgroundCanvas.height - this.firstBackgroundSizePx) / 2;

        if(this.backgrounds[this.mode]){
            backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height); //czyszczenie tła
            if(this.mode === "game"){
                //console.log("Rysowanie tła dla trybu gry");
                backgroundCtx.drawImage(this.backgrounds[this.mode], left + (net.left - 60) * scale, top, this.firstBackgroundSizePx + 60 * scale, this.firstBackgroundSizePx);
            }else{
                backgroundCtx.drawImage(this.backgrounds[this.mode], left, top, this.firstBackgroundSizePx, this.firstBackgroundSizePx);
            }
        }else{
            backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height); //czyszczenie tła
            //console.log("Brak tła dla trybu:", this.mode);
        }
    }
    this.drawButtons = function()
    {
        for(let i = 0; i < buttonsForAllModes[this.mode].length; i++){
            if(buttonsForAllModes[this.mode][i].image !== null){
                if(buttonsForAllModes[this.mode][i].isPlayer === 1 && buttonsForAllModes[this.mode][i].image !== dragons[this.selectedDragons[0]]?.images?.main[0]){
                    if(dragons[this.selectedDragons[0]]?.images?.main[0])
                        buttonsForAllModes[this.mode][i].image = dragons[this.selectedDragons[0]].images.main[0]; //zmiana obrazka przycisku na obrazek smoka
                }else if(buttonsForAllModes[this.mode][i].isPlayer === 2 && buttonsForAllModes[this.mode][i].image !== dragons[this.selectedDragons[1]]?.images?.main[0]){
                    if(dragons[this.selectedDragons[1]]?.images?.main[0])
                        buttonsForAllModes[this.mode][i].image = dragons[this.selectedDragons[1]].images.main[0]; //zmiana obrazka przycisku na obrazek smoka
                }
                netCtx.drawImage(buttonsForAllModes[this.mode][i].image, buttonsForAllModes[this.mode][i].imageLeft * scale, buttonsForAllModes[this.mode][i].imageTop * scale, buttonsForAllModes[this.mode][i].imageWidth * scale, buttonsForAllModes[this.mode][i].imageHeight * scale);
            }

            if(buttonsForAllModes[this.mode][i].isPlayer === 3){
                //console.log("Zmiana tekstu przycisku na wynik gry");
                if(player1.health > 0 && player2.health <= 0)
                    buttonsForAllModes[this.mode][i].tekst = "winner"; //zmiana tekstu 
                else if(player2.health > 0 && player1.health <= 0)
                    buttonsForAllModes[this.mode][i].tekst = "defeat"; //zmiana tekstu 
                else if(player1.health <= 0 && player2.health <= 0)
                    buttonsForAllModes[this.mode][i].tekst = "draw"; //zmiana tekstu 
                else
                    buttonsForAllModes[this.mode][i].tekst = "???"; //zmiana tekstu 

            }else if(buttonsForAllModes[this.mode][i].isPlayer === 4){
                if(player2.health > 0 && player1.health <= 0)
                    buttonsForAllModes[this.mode][i].tekst = "winner"; //zmiana tekstu 
                else if(player1.health > 0 && player2.health <= 0)
                    buttonsForAllModes[this.mode][i].tekst = "defeat"; //zmiana tekstu 
                else if(player2.health <= 0 && player1.health <= 0)
                    buttonsForAllModes[this.mode][i].tekst = "draw"; //zmiana tekstu 
                else
                    buttonsForAllModes[this.mode][i].tekst = "???"; //zmiana tekstu 
            }
            netCtx.fillStyle = buttonsForAllModes[this.mode][i].color.fill;
            netCtx.strokeStyle = buttonsForAllModes[this.mode][i].color.line;
            netCtx.lineWidth = 4 * scale;
            netCtx.globalAlpha = buttonsForAllModes[this.mode][i].color.fillOpacity;
            netCtx.fillRect(buttonsForAllModes[this.mode][i].left * scale, buttonsForAllModes[this.mode][i].top * scale, buttonsForAllModes[this.mode][i].width * scale, buttonsForAllModes[this.mode][i].height * scale);
            netCtx.globalAlpha = buttonsForAllModes[this.mode][i].color.lineOpacity;
            netCtx.strokeRect(buttonsForAllModes[this.mode][i].left * scale, buttonsForAllModes[this.mode][i].top * scale, buttonsForAllModes[this.mode][i].width * scale, buttonsForAllModes[this.mode][i].height * scale);
            netCtx.globalAlpha = 1;
            netCtx.font = "bold " + (buttonsForAllModes[this.mode][i].width / 6) * scale + "px Georgia";
            netCtx.fillStyle = buttonsForAllModes[this.mode][i].color.line;
            netCtx.textAlign = "center";
            netCtx.fillText(buttonsForAllModes[this.mode][i].tekst, (buttonsForAllModes[this.mode][i].left + buttonsForAllModes[this.mode][i].width / 2) * scale, (buttonsForAllModes[this.mode][i].top + buttonsForAllModes[this.mode][i].height / 1.5) * scale);
        }
    }
    this.draw = function(){
        netCtx.strokeStyle = this.color.line;
        netCtx.fillStyle = this.color.fill;
        netCtx.lineWidth = this.width / 100 * scale;
        netCtx.globalAlpha = this.color.fillOpacity;
        netCtx.fillRect(this.left * scale, this.top * scale, this.width * scale, this.height * scale);
        netCtx.globalAlpha = this.color.lineOpacity;
        netCtx.strokeRect(this.left * scale, this.top * scale, this.width * scale, this.height * scale);
        netCtx.globalAlpha = 1;   
        netCtx.save();
        this.drawButtons(); //rysowanie przycisków 
        netCtx.restore();
    }
    this.scan = function(x, y)
    {
        for(let i = 0; i < buttonsForAllModes[this.mode].length; i++){
            if(x >= buttonsForAllModes[this.mode][i].left && x <= buttonsForAllModes[this.mode][i].left + buttonsForAllModes[this.mode][i].width && y >= buttonsForAllModes[this.mode][i].top && y <= buttonsForAllModes[this.mode][i].top + buttonsForAllModes[this.mode][i].height){
                if(buttonsForAllModes[this.mode][i].function)
                    buttonsForAllModes[this.mode][i].function(); //wywołanie funkcji przypisanej do przycisku 
                //console.log("Kliknięto przycisk " + this.mode);
            }
        }
    }
}
function Dragon(row, column, rowWidth, columnHeight, left, top, width, height, rightMode, goDistance, armor, maxEnergy, health, speed, strenght = 100)
{
    this.row = row;
    this.column = column;
    this.rowWidth = rowWidth;
    this.columnHeight = columnHeight;

    this.left = left;
    this.top = top + net.top;
    this.width = width;
    this.height = height;
    this.rightMode = rightMode || false;
    
    this.goDistance = goDistance;
    this.armor = armor;
    this.energy = maxEnergy;
    this.maxEnergy = maxEnergy;
    this.powers = {heal: [], attack: [], defense: [], walk: [], other: []};
    this.powerIsActive = false;
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.strenght = strenght;
    
    this.images = {
        main: [
            "images/dragon1/run/0.png"
        ], 
        run: [
            "images/dragon1/run/0.png", 
            "images/dragon1/run/1.png",
            "images/dragon1/run/2.png",
            "images/dragon1/run/3.png",
            "images/dragon1/run/4.png",
            "images/dragon1/run/5.png",
            "images/dragon1/run/6.png",
            "images/dragon1/run/7.png",
            "images/dragon1/run/8.png",
            "images/dragon1/run/9.png",
            "images/dragon1/run/10.png",
            "images/dragon1/run/11.png",
            "images/dragon1/run/12.png",
            "images/dragon1/run/13.png",
        ], 
        attack: [
            "images/dragon1/run/5.png"
        ]
    };
    this.mainImage = null;
    this.imagesId = 0;
    this.oldImagesName = null;
    this.canGetNewMainImage = true;
    this.getNewMainImage = function(name)
    {
        if(!this.canGetNewMainImage) return;

        this.canGetNewMainImage = false;
        if(this.oldImagesName !== name && name !== "none"){ // Zmieniamy animację, resetuj licznik klatek
            this.imagesId = 0;
            this.oldImagesName = name;
        }
        if(this.oldImagesName === null){ // Jeśli to pierwsze uruchomienie, ustaw domyślną animację
            this.imagesId = 0;
            this.oldImagesName = "main";
        }
        let imageArray = this.images[this.oldImagesName]; // Pobieramy tablicę obrazków dla danej animacji
        if(!imageArray || imageArray.length === 0){    // Jeśli nie znaleziono animacji — nic nie rób
            console.warn("Brak klatek animacji dla:", this.oldImagesName);
            this.canGetNewMainImage = true;
            return;
        }
        this.mainImage = imageArray[this.imagesId]; // Ustawiamy główny obrazek na aktualną klatkę animacji
        this.imagesId++;
        if(this.imagesId >= imageArray.length) this.imagesId = 0;
        this.canGetNewMainImage = true;
    }
    
    this.draw = function(row, column)
    {
        if(row === 0 || row)
            this.row = row;
        if(column === 0 || column)
            this.column = column;
        netCtx.fillStyle = "red";

        if(this.row % 2 === 0 || this.row === 0){
            if(this.mainImage !== null && this.rightMode){
                netCtx.save();
                netCtx.translate((this.width + this.row * this.rowWidth + this.left + net.left) * scale, 0);
                netCtx.scale(-1, 1);
                netCtx.drawImage(this.mainImage, 0, (this.column * this.columnHeight + this.top) * scale, this.width * scale, this.height * scale);
                netCtx.restore();      
            }else if(this.mainImage !== null && !this.rightMode){
                netCtx.drawImage(this.mainImage, (this.row * this.rowWidth + this.left + net.left) * scale, (this.column * this.columnHeight + this.top) * scale, this.width * scale, this.height * scale);
            }else if(this.mainImage === null){
                netCtx.fillRect((this.row * this.rowWidth + this.left + net.left) * scale, (this.column * this.columnHeight + this.top) * scale, this.width * scale, this.height * scale);
            }
        }else{
            if(this.mainImage !== null && this.rightMode){
                netCtx.save();
                netCtx.translate((this.width + this.row * this.rowWidth + this.left + net.left) * scale, 0);
                netCtx.scale(-1, 1);
                netCtx.drawImage(this.mainImage, 0, (this.column * this.columnHeight + this.columnHeight / 2 + this.top) * scale, this.width * scale, this.height * scale);
                netCtx.restore();
            }else if(this.mainImage !== null && !this.rightMode){
                netCtx.drawImage(this.mainImage, (this.row * this.rowWidth + this.left + net.left) * scale, (this.column * this.columnHeight + this.columnHeight / 2 + this.top) * scale, this.width * scale, this.height * scale);
            }else if(this.mainImage === null){
                netCtx.fillRect((this.row * this.rowWidth + this.left + net.left) * scale, (this.column * this.columnHeight + this.columnHeight / 2 + this.top) * scale, this.width * scale, this.height * scale);
            }
        }
    }

    this.drawing = false;
    this.go = function(row, column, goingTime, newPosition)
    {
        this.drawing = true;    
        if(!newPosition){
            row += this.row;
            column += this.column;
        }

        if(row - this.row > 0)
            this.rightMode = true;
        else if(row - this.row < 0)
            this.rightMode = false;

        let Δrow = row - this.row;  //różnica między wierszami
        let Δcolumn = column - this.column;
        let x = Δrow * this.rowWidth;  //szerokość róznicy między wierszami
        let y;
        if(row % 2 === 0 && this.row % 2 === 0 || row % 2 === 1 && this.row % 2 === 1){
            y = Δcolumn * this.columnHeight;
        }else{
            if((Δrow <= 0 || Δcolumn <= 0) && row % 2 === 0 || row % 2 === 0)
                y = Δcolumn * this.columnHeight - this.columnHeight / 2;
            else
                y = Δcolumn * this.columnHeight + this.columnHeight / 2;
        }
            
        let oldLeft = this.left;
        let oldTop = this.top;
        let i = 0;
        let sqrt = Math.sqrt(Δrow * Δrow + Δcolumn * Δcolumn);  //jaka rónżnica jakby na skos razem, średnio
        let time = goingTime;  //szybkość wystarczająca do przejścia dystansu mnożąc prędkość na jeden taki element przez ilość takich elementów czyli sqrt
        if(time < 50){
            sqrt = sqrt * time;
            time = 1;
        }else{
            sqrt = sqrt * 50;
            time = time / 50;
        }
        x  = x / sqrt;
        y  = y / sqrt;

        let timer = 0;
        let moveStep = () => {
            //netCtx.clearRect(0, 0, netCanvas.width, netCanvas.height); //czyszczenie planszy
            //net.draw();
            this.ui.drawHealth(this);
            //this.ui.drawEnergy(this);
            if(i < sqrt){
                if(this.row !== row)
                    this.left += x;
                if(y)
                    this.top += y;
                this.draw();
                //this.ui.drawAll(this);
                i++;
                timer += time;
                setTimeout(moveStep, time);
            }else{
                this.row = row;
                this.column = column;
                this.left = oldLeft;
                this.top = oldTop;
                this.draw();
                this.drawing = false;
                //console.log("koniec");
                //console.log("time: " + timer, "for one step: " + goingTime)
            }
        }
        moveStep();
    }  
    
    this.calculateDamageHealth = function(damage)
    {
        if(this.armor > 0 && damage > 0){ 
            damage -= damage * this.armor / 100;
        }
        if(damage < 0)
            damage = 0;
        return this.health - damage;
    }

    this.getDamage = function(damage)
    {
        if(this.armor > 0 && damage > 0){ 
            let oldDamage = damage;
            damage -= damage * this.armor / 100;
            this.armor -= /*damage / this.armor*/ this.armor * oldDamage / this.maxHealth;
        }
        if(damage < 0)
            damage = 0;
        if(this.armor < 0)
            this.armor = 0;
        this.health -= damage;
        //console.log("damage: " + damage);
        //console.log("health: " + this.health);
        //console.log("armor: " + this.armor);
    }

    this.addPower = function(type, powerKey)
    {
        const power = allDragonPowers[type]?.[powerKey];
        if(power){
            this.ui.activeButton = null;
            const copiedPower = JSON.parse(JSON.stringify(power));     // Jeśli moc ma funkcje (np. .use), to trzeba je dodać ręcznie
            copiedPower.use = power.use;                              // Zakładamy, że każda moc ma metodę .use
            this.powers[type].push(copiedPower);
            //console.log(`Dodano moc ${power.name} do smoka`);
        }else{
            console.warn(`Nie znaleziono mocy ${powerKey} w kategorii ${type}`);
        }
    }

    this.activatePower = function(powerKey, nullMode = false){
        if(!this.drawing && !this.powerIsActive){
            this.powerIsActive = powerKey;
            clickedHex = null;
            mouseMoveHex = null;
            if(nullMode) this.ui.changeMode(null);
        }
    }
}
function UI(dragon, health, energy, moveControls)
{
    this.drawing = false;
    this.dragon = dragon;
    this.oldHealth = dragon.health;
    this.healthCords = health;
    this.healthMode = "left";
    this.energyCords = energy;
    this.energyCords.angle = [0, 0, 0];
    this.energyCords.color = {red: {low: 135, high: 245}, green: {low: 25, high: 45}, blue: {low: 100, high: 185}};
    this.energy = 0;
    this.energyCords.lowCharge = 0;
    this.moveControlsCords = moveControls;
    this.moveControlsCords.mode = "heal";
    this.buttons = [];
    this.activeButton = null;
    //a więc krok 1: rysujemy ilość zdrowia
    //krok 2: rysujemy ilość energii
    //krok 3: rysujemy 4 rodzaje przyciskow: poruszanie, atak, obrona, inne tak by dalo sie to kliknac i rozwinac by zobaczyc moce :D
    
    this.drawHealth = function(dragon)
    {
        this.drawing = true;
        this.dragon = dragon;
        if(this.dragon.health < 0)
            this.dragon.health = 0;
        if(this.dragon.health > this.dragon.maxHealth)
            this.dragon.health = this.dragon.maxHealth;

        netCtx.fillStyle = "black";
        netCtx.fillRect((this.healthCords.left + net.left) * scale, this.healthCords.top * scale, this.healthCords.width * scale, this.healthCords.height * scale);
        if(this.dragon.health !== this.oldHealth){
            if(this.dragon.health < this.oldHealth){
                this.oldHealth -= (this.oldHealth - this.dragon.health) / this.dragon.maxHealth * 5;
            }else{
                this.oldHealth += (this.dragon.health - this.oldHealth) / this.dragon.maxHealth * 5;
            }
            netCtx.fillStyle = "red";
            if(this.healthMode === "left")
                netCtx.fillRect((this.healthCords.left + net.left) * scale, this.healthCords.top * scale, this.healthCords.width / this.dragon.maxHealth * this.oldHealth * scale, this.healthCords.height * scale);
            else if(this.healthMode === "right")
                netCtx.fillRect((this.healthCords.left + net.left + this.healthCords.width - this.healthCords.width / this.dragon.maxHealth * this.oldHealth) * scale, this.healthCords.top * scale, this.healthCords.width / this.dragon.maxHealth * this.oldHealth * scale, this.healthCords.height * scale);

            this.drawing = false;
        }else{
            netCtx.fillStyle = "red";
            netCtx.fillRect((this.healthCords.left + net.left + this.healthCords.width - this.healthCords.width / this.dragon.maxHealth * this.dragon.health) * scale, this.healthCords.top * scale, this.healthCords.width / this.dragon.maxHealth * this.dragon.health * scale, this.healthCords.height * scale);
            this.drawing = false;
        }
    }
    this.drawEnergy = function(dragon)
    {
        this.drawing = true;
        this.dragon = dragon;
        
        if(this.dragon.energy < 0)
            this.dragon.energy = 0;
        if(this.dragon.energy > this.dragon.maxEnergy)
            this.dragon.energy = this.dragon.maxEnergy;
        
        if(this.energy < dragon.energy)
            this.energy += (dragon.energy - this.energy) / 100
        else if(this.energy > dragon.energy)
            this.energy -= (this.energy - dragon.energy) / 100;

        const energyRatio = this.energy / dragon.maxEnergy;
        
        let red = this.energyCords.color.red.low + (this.energyCords.color.red.high - this.energyCords.color.red.low) * energyRatio;
        let green = this.energyCords.color.green.low + (this.energyCords.color.green.high - this.energyCords.color.green.low) * energyRatio;
        let blue = this.energyCords.color.blue.low + (this.energyCords.color.blue.high - this.energyCords.color.blue.low) * energyRatio;

        const centerX = (this.energyCords.left + this.energyCords.width / 2) * scale;
        const centerY = (this.energyCords.top + this.energyCords.height / 2) * scale;

        // Aktualizacja bufora lowCharge
        if(energyRatio < 0.01){
            this.energyCords.lowCharge = Math.min(this.energyCords.lowCharge + 0.01, 1);
        }else if(energyRatio > 0.1) {
            this.energyCords.lowCharge = Math.max(this.energyCords.lowCharge - 0.05, 0);
        }
        
        // Normalizacja i ograniczenie wpływu lowCharge
        const lowChargeBoost = (this.energyCords.lowCharge / 10) * 0.05; // max +0.05

        // Finalna prędkość obrotu
        let rotationSpeed = (energyRatio / 10) + lowChargeBoost;


        netCtx.save(); // Zapisz aktualny stan
        netCtx.translate(centerX, centerY); // Przesuń punkt (0,0) na środek
        //pierwszy kwadrat najwiekszy
        netCtx.rotate(this.energyCords.angle[0]); 
        netCtx.fillStyle = "rgb(" + Math.floor(red * 0.5) + ", " + Math.floor(green * 0.5) + ", " + Math.floor(blue * 0.5) + ")";
        //console.log("rgb(" + Math.floor(red * 0.5) + ", " + Math.floor(green * 0.5) + ", " + Math.floor(blue * 0.5) + ")");
        netCtx.fillRect(-this.energyCords.width / 2 * scale, -this.energyCords.height / 2 * scale, this.energyCords.width * scale, this.energyCords.height * scale); // Rysuj kwadrat od środka
        //drugi kwadrat sredni
        netCtx.rotate(this.energyCords.angle[1]); 
        netCtx.fillStyle = "rgb(" + Math.floor(red * 0.8) + ", " + Math.floor(green * 0.8) + ", " + Math.floor(blue * 0.8) + ")";
        netCtx.fillRect(-this.energyCords.width / 2.2 * scale, -this.energyCords.height / 2.2 * scale, this.energyCords.width / 1.1 * scale, this.energyCords.height / 1.1 * scale); // Rysuj kwadrat od środka
        //trzeci kwadrat najmniejszy
        netCtx.rotate(this.energyCords.angle[2]); 
        netCtx.fillStyle = "rgb(" + Math.floor(red + red * energyRatio) + ", " + Math.floor(green + green * energyRatio) + ", " + Math.floor(blue + blue * energyRatio) + ")";
        netCtx.fillRect(-this.energyCords.width / 3 * scale, -this.energyCords.height / 3 * scale, this.energyCords.width / 1.5 * scale, this.energyCords.height / 1.5 * scale); // Rysuj kwadrat od środka

        netCtx.restore(); // Przywróć wcześniejszy stan
        netCtx.font = "bold " + this.energyCords.height / 1.5 * scale + "px Georgia";
        netCtx.fillStyle = "#66ccff";
        netCtx.strokeStyle = "#ccffff";
        netCtx.lineWidth = this.energyCords.height / 15 * scale;
        
        netCtx.globalAlpha = 0.6;
        netCtx.strokeText(this.dragon.energy, (this.energyCords.left + this.energyCords.width / 3.5) * scale, (this.energyCords.top + this.energyCords.height / 1.6) * scale);
        netCtx.fillText(this.dragon.energy, (this.energyCords.left + this.energyCords.width / 3.5) * scale, (this.energyCords.top + this.energyCords.height / 1.6) * scale);
        netCtx.globalAlpha = 1;

        this.energyCords.angle[0] += rotationSpeed;
        //console.log(this.energyCords.angle[0]);
        this.energyCords.angle[1] -= rotationSpeed * 2;
        this.energyCords.angle[2] += rotationSpeed * 5;
        this.drawing = false;
    }
    this.drawMoveControls = function(dragon)
    {
        this.dragon = dragon;

        if(this.moveControlsCords.mode === "main"){
            this.buttons = [];
            if(dragon.powers.attack.length > 0)
                this.buttons.push({icon: "🔥", mode: "attack"});
            if(dragon.powers.defense.length > 0)
                this.buttons.push({icon: "🛡️", mode: "defense"});
            if(dragon.powers.heal.length > 0)
                this.buttons.push({icon: "✨", mode: "heal"});
            if(dragon.powers.walk.length > 0)
                this.buttons.push({icon: "🔧", mode: "walk"});
            if(dragon.powers.other.length > 0)
                this.buttons.push({icon: "🌀", mode: "other"});

            this.buttons.push({icon: "⚙️", mode: "settings"});
            this.drawButtons();

        }else if(this.moveControlsCords.mode === "attack"){
            this.buttons = [];
            for(let i in dragon.powers.attack){
                i = parseInt(i);
                this.buttons.push(i);
            }
            this.drawButtons();
        }else if(this.moveControlsCords.mode === "defense"){
            this.buttons = [];
            for(let i in dragon.powers.defense){
                i = parseInt(i);
                this.buttons.push(i);
            }
            this.drawButtons();
        }else if(this.moveControlsCords.mode === "heal"){
            this.buttons = [];  
            for(let i in dragon.powers.heal){
                i = parseInt(i);
                this.buttons.push(i);
            }   
            this.drawButtons();
        }else if(this.moveControlsCords.mode === "walk"){
            this.buttons = [];
            for(let i in dragon.powers.walk){
                i = parseInt(i);
                this.buttons.push(i);
            }
            this.drawButtons();
        }else if(this.moveControlsCords.mode === "other"){
            this.buttons = [];
            for(let i in dragon.powers.other){
                i = parseInt(i);
                this.buttons.push(i);
            }
            this.drawButtons();
        }else if(this.moveControlsCords.mode === "settings"){
            this.buttons = [];
            //console.log("Zmieniono tryb na settings");
            lobby.changeMode("settings");
            this.changeMode("main");
        }else if(this.moveControlsCords.mode === null){
            this.buttons = [];
            this.drawButtons();
        }

        //console.log(dragon.powers.heal)
    }
    this.drawButton = function(left, top, width, image)
    {
        let centerX = (left + width / 2) * scale;
        let centerY = (top + width / 2) * scale;
        radius = width / 2 * scale;

        netCtx.beginPath();
        netCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        netCtx.fillStyle = "orange";
        netCtx.fill();
        netCtx.strokeStyle = "gold";
        netCtx.lineWidth = radius / 10;
        netCtx.stroke();

        netCtx.font = "bold " + radius + "px Georgia";

        netCtx.globalAlpha = 0.8;
        netCtx.strokeText(image, centerX - radius / 2, centerY + radius / 2);
        netCtx.globalAlpha = 1;


        return {x: centerX - radius / 2, y: centerY - radius / 2, width: radius, height: radius};
    }
    this.drawButtons = function()
    {
        let powerType = dragon.powers[this.moveControlsCords.mode];
        if(this.moveControlsCords.mode === "main"){
            for(let i in this.buttons){
                //console.log(this.buttons[i]);
                i = parseInt(i);
                this.drawButton(this.moveControlsCords.left, this.moveControlsCords.top + this.moveControlsCords.width * 1.065 * i, this.moveControlsCords.width, this.buttons[i].icon);
            }
        }else if(powerType !== null && powerType){
            for(let i in powerType){
                //console.log(powerType[this.buttons[i]].icon);
                i = parseInt(i);
                this.drawButton(this.moveControlsCords.left, this.moveControlsCords.top + this.moveControlsCords.width * 1.065 * i, this.moveControlsCords.width, powerType[this.buttons[i]].icon);
            }
        }
    }
    this.getButtonByPosition = function(x, y)
    {
        for(let i in this.buttons){
            i = parseInt(i);
            let button = {
                x: this.moveControlsCords.left + this.moveControlsCords.width * 0.08, 
                y: (this.moveControlsCords.top + this.moveControlsCords.width * i + this.moveControlsCords.width * 0.08), 
                width: this.moveControlsCords.width - this.moveControlsCords.width * 0.16, 
            };
            if(x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.width){
                //console.log("Kliknięto przycisk: " + i);
                return i;
            }
        }
        //console.log("Kliknięto przycisk: null");
        return null;
    }
    this.changeMode = function(mode)
    {
        this.moveControlsCords.mode = mode;
        this.activeButton = null;
    }
    this.drawAll = function(dragon)
    {
        this.drawHealth(dragon);
        this.drawMoveControls(dragon);
        this.drawEnergy(dragon);
    }

    netCanvas.addEventListener("click", (event) => {
        let powerType = dragon.powers[this.moveControlsCords.mode];
        let x = (event.clientX - netCanvas.getBoundingClientRect().left) / scale;
        let y = (event.clientY - netCanvas.getBoundingClientRect().top) / scale;
        //console.log("x: " + x, "y: " + y);
        this.activeButton = this.getButtonByPosition(x, y);
        let key = this.buttons[this.activeButton];
        if(this.buttons.length > this.activeButton && this.activeButton !== null && lobby.mode === "game"){
            if(typeof this.activeButton === "number" && this.moveControlsCords.mode === "main"){
                //key.icon = "🌀";
                this.changeMode(key.mode);
                this.activeButton = null;
            }else if(typeof key === "number" && powerType && powerType[key]){
                //powerType[key].icon = "🌀";
                if(this.dragon.energy > 0 && this.dragon.powerIsActive === false)
                    powerType[key].use(this.dragon);
                this.activeButton = null;
            }
        }
        //console.log("////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////")
        //console.log("mode:", this.moveControlsCords.mode);
        //console.log("activeButton:", this.activeButton);
        //console.log("buttonKey:", this.buttons[this.activeButton]);
        //onsole.log("powerType:", powerType);
        //console.log("powerType[buttonKey]:", powerType?.[this.buttons[this.activeButton]]);
    
    });

}

let ending = false;
function endTurn()
{
    if(player1.health > 0 && player2.health > 0 && !timeoutIsActive){
        if(currentPlayer === "player1" && player1.energy <= 0){
            player1.powerIsActive = false;
            player1.ui.activeButton = null;
            player1.energy = 0;
            player1.ui.changeMode(null);

            player2.ui.activeButton = null;
            player2.energy = player2.maxEnergy;
            player2.ui.changeMode("main");

            clickedHex = null;
            mouseMoveHex = null;

            if(!player1.drawing && !ending){
                ending = true;
                setTimeout(
                    () => {
                        currentPlayer = "player2";
                        ending = false;
                    }, 
                    1000
                );   
            }
        }else if(currentPlayer === "player2" && player2.energy <= 0){
            player2.powerIsActive = false;
            player2.ui.activeButton = null;
            player2.energy = 0;
            player2.ui.changeMode(null);

            player1.ui.activeButton = null;
            player1.energy = player1.maxEnergy;
            player1.ui.changeMode("main");

            clickedHex = null;
            mouseMoveHex = null;

            if(!player2.drawing && !ending){
                ending = true;
                setTimeout(
                    () => {
                        currentPlayer = "player1";
                        ending = false;
                    }, 
                    1000
                );   
            }
        }
    }
}

/*
function Powers(whichYouAreWant)
{
    let listaMocy = {};
    //jakieś moce
    this.fire = function()
    {}

    
    let pakietMocy = "Randomowe funkcje mocy np. this.ogien(pozycja{start i koniec}, maxZasięg)";
    return pakietMocy;
}

*/
// Uruchom na początku i przy każdej zmianie rozmiaru okna
let lobby = new Lobby(3, 3, 994, 594, "#00ff00", "black", 0, 0);
//let hexagon = new Hexagon(0, 0, 800, 600, "#00ff00", "black");
window.addEventListener("resize", resizeGame);
resizeGame();
lobby.getFirstBackgroundSizePx();
let net = new Net(13, 7, 60, 36, 940, 564, "black", "#00ff00", 0, 0);
let player1 = new Dragon(1, 1, net.hexagonWidth * 0.75, net.hexagonHeight, (net.hexagonWidth - net.hexagonHeight) / 2 - net.hexagonHeight * 0.15, -net.hexagonHeight * 0.15, net.hexagonHeight * 1.3, net.hexagonHeight * 1.3, true, 2, 25, 3, 100, 100, 100);
let player2 = new Dragon(3, 2, net.hexagonWidth * 0.75, net.hexagonHeight, (net.hexagonWidth - net.hexagonHeight) / 2, 0, net.hexagonHeight, net.hexagonHeight, false, 2, 0, 3, 100, 100, 100);

let currentPlayer = ["player1", "player2"][Math.floor(Math.random() * 2)];

const allDragonPowers = {   
    attack: {
        comeback: {
            name: "Back to main",
            icon: "🔙",
            use(dragon){
                dragon.ui.changeMode("main");
            }
        },
        fireBreath: {
            name: "Fire Breath",
            description: "Zadaje obrażenia ogniem przed sobą.",
            icon: "🥊",
            use(dragon){
                dragon.activatePower("fireBreath", 1);
            }
        },
        healBreath: {
            name: "Heal Breath",
            description: "Leczy smoka w obszarze przed nim.",
            icon: "🥊",
            use(dragon){
                dragon.activatePower("healBreath", 1);
            }
        },
        tailStrike: {
            name: "Tail Strike",
            description: "Zadaje mocny fizyczny cios ogonem.",
            icon: "🦴",
            use(dragon) {
                dragon.activatePower(false, 0);
            }
        },
        wingSlash: {
            name: "Wing Slash",
            description: "Uderza przeciwnika skrzydłem, zadając obrażenia.",
            icon: "💨",
            use(dragon) {
                dragon.activatePower(false, 0);
            }
        }
    },
    heal: {
        comeback: {
            name: "Back to main",
            icon: "🔙",
            use(dragon){
                dragon.ui.changeMode("main");
            }
        },
        smallHeal: {
            name: "Small Heal",
            description: "Leczy niewielką ilość zdrowia.",
            icon: "💚",
            use(dragon) {
                const amount = 10;
                if(dragon.energy > 0){
                    dragon.health = Math.min(dragon.health + amount, dragon.maxHealth);
                    dragon.energy = 0;
                }
            }
        },
        regeneration: {
            name: "Regeneration",
            description: "Stopniowo leczy smoka przez kilka tur.",
            icon: "🌱",
            use(dragon) {
                dragon.effects = dragon.effects || [];
                dragon.effects.push({ type: "healOverTime", turns: 3, amount: 10 });
                //console.log(`${dragon.name} zyskuje regenerację`);
            }
        },
        megaHeal: {
            name: "Mega Heal",
            description: "Leczy dużo zdrowia.",
            icon: "💖",
            use(dragon) {
                const amount = 7;
                if(dragon.energy >= dragon.maxEnergy){
                    dragon.health = Math.min(dragon.health + amount, dragon.maxHealth);
                    dragon.energy = 0;
                }
            }
        }
    },
    defense: {
        comeback: {
            name: "Back to main",
            icon: "🔙",
            use(dragon){
                dragon.ui.changeMode("main");
            }
        },
        shield: {
            name: "Shield",
            description: "Zwiększa pancerz na jedną turę.",
            icon: "🛡️",
            use(dragon){
                //dragon.effects = dragon.effects || [];
                //dragon.effects.push({ type: "shield", turns: 1, armorBoost: 20 });
                //console.log(`${dragon.name} aktywuje tarczę`);
                if(dragon.energy > 0 && dragon.armor < 100){
                    dragon.armor += 15;
                    dragon.energy--;
                }   
            }
        },
        reflect: {
            name: "Reflect",
            description: "Odbija część obrażeń z powrotem.",
            icon: "🔄",
            use(dragon) {
                dragon.effects = dragon.effects || [];
                dragon.effects.push({ type: "reflect", turns: 2, ratio: 0.25 });
                //console.log(`${dragon.name} aktywuje efekt odbicia obrażeń`);
            }
        },
        fortify: {
            name: "Fortify",
            description: "Zwiększa maksymalne zdrowie tymczasowo.",
            icon: "🏰",
            use(dragon) {
                dragon.maxHealth += 20;
                dragon.health += 20;
                //console.log(`${dragon.name} wzmacnia swoje ciało`);
            }
        }
    },
    walk: {
        comeback: {
            name: "Back to main",
            icon: "🔙",
            use(dragon){
                dragon.ui.changeMode("main");
            }
        },
        move: {
            name: "Move",
            description: "Porusza się w wybranym kierunku.",
            icon: "➡️",
            use(dragon){
                dragon.activatePower("move", 1);
            }
        },
    },
    other: {
        comeback: {
            name: "Back to main",
            icon: "🔙",
            use(dragon){
                dragon.ui.changeMode("main");
            }
        },
        invisibility: {
            name: "Invisibility",
            description: "Smok staje się niewidzialny przez 1 turę.",
            icon: "👻",
            use(dragon) {
                dragon.effects = dragon.effects || [];
                dragon.effects.push({ type: "invisible", turns: 1 });
                //console.log(`${dragon.name} znika z pola widzenia`);
            }
        },
        teleport: {
            name: "Teleport",
            description: "Przenosi smoka w dowolne miejsce na mapie.",
            icon: "🌀",
            use(dragon) {
                if(dragon.energy >= dragon.maxEnergy) dragon.activatePower("teleport", 1);
            }
        }
    }
};
const dragonImages = {
    "Dragon1": {
        main: [
            "images/dragon1/run/0.png"
        ], 
        run: [
            "images/dragon1/run/0.png", 
            "images/dragon1/run/1.png",
            "images/dragon1/run/2.png",
            "images/dragon1/run/3.png",
            "images/dragon1/run/4.png",
            "images/dragon1/run/5.png",
            "images/dragon1/run/6.png",
            "images/dragon1/run/7.png",
            "images/dragon1/run/8.png",
            "images/dragon1/run/9.png",
            "images/dragon1/run/10.png",
            "images/dragon1/run/11.png",
            "images/dragon1/run/12.png",
            "images/dragon1/run/13.png",
        ], 
        attack: [
            "images/dragon1/run/5.png"
        ]
    },
    "Dragon2": {
        main: [
            "images/dragon2/run/0.png"
        ], 
        run: [
            "images/dragon2/run/0.png", 
            "images/dragon2/run/1.png",
            "images/dragon2/run/2.png",
            "images/dragon2/run/3.png",
            "images/dragon2/run/4.png",
            "images/dragon2/run/5.png",
            "images/dragon2/run/6.png",
            "images/dragon2/run/7.png",
            "images/dragon2/run/8.png",
            "images/dragon2/run/9.png",
            "images/dragon2/run/10.png",
            "images/dragon2/run/11.png",
            "images/dragon2/run/12.png",
            "images/dragon2/run/13.png",
        ], 
        attack: [
            "images/dragon2/run/5.png"
        ]
    },
    "Dragon3": {
        main: [
            "images/dragon3/run/0.png"
        ], 
        run: [
            "images/dragon3/run/0.png", 
            "images/dragon3/run/1.png",
            "images/dragon3/run/2.png",
            "images/dragon3/run/3.png",
            "images/dragon3/run/4.png",
            "images/dragon3/run/5.png",
            "images/dragon3/run/6.png",
            "images/dragon3/run/7.png",
            "images/dragon3/run/8.png",
            "images/dragon3/run/9.png",
            "images/dragon3/run/10.png",
            "images/dragon3/run/11.png",
            "images/dragon3/run/12.png",
            "images/dragon3/run/13.png",
        ], 
        attack: [
            "images/dragon3/run/5.png"
        ]
    },
    "Dragon4": {
        main: [
            "images/dragon4/run/0.png"
        ], 
        run: [
            "images/dragon4/run/0.png", 
            "images/dragon4/run/1.png",
            "images/dragon4/run/2.png",
            "images/dragon4/run/3.png",
            "images/dragon4/run/4.png",
            "images/dragon4/run/5.png",
            "images/dragon4/run/6.png",
            "images/dragon4/run/7.png",
            "images/dragon4/run/8.png",
            "images/dragon4/run/9.png",
            "images/dragon4/run/10.png",
            "images/dragon4/run/11.png",
            "images/dragon4/run/12.png",
            "images/dragon4/run/13.png",
        ], 
        attack: [
            "images/dragon4/run/5.png"
        ]
    },
    "Dragon5": {
        main: [
            "images/dragon5/run/0.png"
        ], 
        run: [
            "images/dragon5/run/0.png", 
            "images/dragon5/run/1.png",
            "images/dragon5/run/2.png",
            "images/dragon5/run/3.png",
            "images/dragon5/run/4.png",
            "images/dragon5/run/5.png",
            "images/dragon5/run/6.png",
            "images/dragon5/run/7.png",
            "images/dragon5/run/8.png",
            "images/dragon5/run/9.png",
            "images/dragon5/run/10.png",
            "images/dragon5/run/11.png",
            "images/dragon5/run/12.png",
            "images/dragon5/run/13.png",
        ], 
        attack: [
            "images/dragon5/run/5.png"
        ]
    }         
};
let preloading = false;
function preloadDragonImages(dragonImages, callback) 
{
    if(preloading) return; // zapobiega wielokrotnemu wywołaniu funkcji
    preloading = true;
    let total = 0;
    let loaded = 0;

    for(let dragon in dragonImages){
        for(let action in dragonImages[dragon]){
            total += dragonImages[dragon][action].length;
        }
    }

    for(let dragon in dragonImages){
        for(let action in dragonImages[dragon]){
            for (let i = 0; i < dragonImages[dragon][action].length; i++) {
                const path = dragonImages[dragon][action][i];
                const img = new Image();
                img.src = path;

                img.onload = () => {
                    loaded++;
                    if (loaded === total) {
                        console.log("✅ Wszystkie obrazy smoków zostały załadowane.");
                        callback();
                    }
                };

                img.onerror = () => {
                    console.warn("⚠️ Błąd wczytywania obrazka:", path);
                    loaded++;
                    if (loaded === total) {
                        console.log("⚠️ Załadowano, choć niektóre obrazki nie działają.");
                        callback();
                    }
                };

                dragonImages[dragon][action][i] = img; // zamień ścieżkę na obiekt Image
            }
        }
    }
}
const dragons = [
    {
        name: "Dragon1",
        left: (net.hexagonWidth - net.hexagonHeight) / 2 - net.hexagonHeight * 0.15,
        top: -net.hexagonHeight * 0.15,
        width: net.hexagonHeight * 1.3,
        height: net.hexagonHeight * 1.3,
        range: 3,
        armor: 10,
        energy: 3,
        health: 100,
        speed: 50,
        strenght: 20,
        powers: {
            attack: ["comeback", "fireBreath"],
            heal: [],
            defense: [],
            walk: ["comeback", "move"],
            other: ["comeback", "teleport"]
        },
        images: dragonImages["Dragon1"]
    },
    {
        name: "dragon2",
        left: (net.hexagonWidth - net.hexagonHeight) / 2,
        top: 0,
        width: net.hexagonHeight,
        height: net.hexagonHeight,
        range: 2,
        armor: 5,
        energy: 4,
        health: 40,
        speed: 60,
        strenght: 30,
        powers: {
            attack: ["comeback", "fireBreath"],
            heal: [],
            defense: ["comeback", "shield"],
            walk: ["comeback", "move"],
            other: []
        },
        images: dragonImages["Dragon2"]
    },
    {
    name: "pyroDrake",
        left: (net.hexagonWidth - net.hexagonHeight) / 2 - net.hexagonHeight * 0.15,
        top: -net.hexagonHeight * 0.15,
        width: net.hexagonHeight * 1.3,
        height: net.hexagonHeight * 1.3,
        range: 2,
        armor: 10,
        energy: 3,
        health: 80,
        speed: 45,
        strenght: 35,
        powers: {
            attack: ["comeback", "fireBreath"],
            heal: [],
            defense: [],
            walk: ["comeback", "move"],
            other: []
        },
        images: dragonImages["Dragon3"]
    },
    {
        name: "cryoWing",
        left: (net.hexagonWidth - net.hexagonHeight) / 2 - net.hexagonHeight * 0.15,
        top: -net.hexagonHeight * 0.15,
        width: net.hexagonHeight * 1.3,
        height: net.hexagonHeight * 1.3,
        range: 3,
        armor: 45,
        energy: 2,
        health: 100,
        speed: 30,
        strenght: 20,
        powers: {
            attack: ["comeback", "healBreath"],
            heal: [],
            defense: [],
            walk: ["comeback", "move"],
            other: []
        },
        images: dragonImages["Dragon4"]
    },
    {
        name: "voltShadow",
        left: (net.hexagonWidth - net.hexagonHeight) / 2 - net.hexagonHeight * 0.15,
        top: -net.hexagonHeight * 0.15,
        width: net.hexagonHeight * 1.3,
        height: net.hexagonHeight * 1.3,
        range: 4,
        armor: 4,
        energy: 4,
        health: 60,
        speed: 70,
        strenght: 25,
        powers: {
            attack: ["comeback", "fireBreath"],
            heal: ["comeback", "megaHeal"],
            defense: [],
            walk: ["comeback", "move"],
            other: []
        },
        images: dragonImages["Dragon5"]
    }
];
function resetDragons(p1 = false, p2 = false)
{
    player1.ui.changeMode("main");
    player2.ui.changeMode("main");
    player1.powerIsActive = false;
    player2.powerIsActive = false;
    if(p1){
        player1.rightMode = true;
        player1.left = p1.left;
        player1.top = p1.top + net.top;
        player1.width = p1.width;
        player1.height = p1.height;
        player1.goDistance = p1.range;
        player1.armor = p1.armor;
        player1.maxEnergy = p1.energy;
        player1.energy = p1.energy;
        player1.maxHealth = p1.health;
        player1.health = p1.health;
        player1.speed = 10000 / p1.speed;
        player1.strenght = p1.strenght;
        player1.powers = {attack: [], heal: [], defense: [], walk: [], other: []};
        for(let i = 0; i < p1.powers.attack.length; i++){
            player1.addPower("attack", p1.powers.attack[i]);
        }
        for(let i = 0; i < p1.powers.heal.length; i++){
            player1.addPower("heal", p1.powers.heal[i]);
        }
        for(let i = 0; i < p1.powers.defense.length; i++){
            player1.addPower("defense", p1.powers.defense[i]);
        }
        for(let i = 0; i < p1.powers.walk.length; i++){
            player1.addPower("walk", p1.powers.walk[i]);
        }
        for(let i = 0; i < p1.powers.other.length; i++){
            player1.addPower("other", p1.powers.other[i]);
        }
        player1.images = p1.images;
        player1.row = Math.floor(Math.random() * net.rows / 2);
        player1.column = Math.floor(Math.random() * net.columns);
    }
    if(p2){
        player2.rightMode = false;
        player2.left = p2.left;
        player2.top = p2.top + net.top;
        player2.width = p2.width;
        player2.height = p2.height;
        player2.goDistance = p2.range;
        player2.armor = p2.armor;
        player2.maxEnergy = p2.energy;
        player2.energy = p2.energy;
        player2.maxHealth = p2.health;
        player2.health = p2.health;
        player2.speed = 10000 / p2.speed;
        player2.strenght = p2.strenght;
        player2.powers = {attack: [], heal: [], defense: [], walk: [], other: []};
        for(let i = 0; i < p2.powers.attack.length; i++){
            player2.addPower("attack", p2.powers.attack[i]);
        }
        for(let i = 0; i < p2.powers.heal.length; i++){
            player2.addPower("heal", p2.powers.heal[i]);
        }
        for(let i = 0; i < p2.powers.defense.length; i++){
            player2.addPower("defense", p2.powers.defense[i]);
        }
        for(let i = 0; i < p2.powers.walk.length; i++){
            player2.addPower("walk", p2.powers.walk[i]);
        }
        for(let i = 0; i < p2.powers.other.length; i++){
            player2.addPower("other", p2.powers.other[i]);
        }
        player2.images = p2.images;
        do{
            player2.row = Math.floor(net.rows / 2 + Math.random() * net.rows / 2);
        }while(player2.row === player1.row);

        do{
            player2.column = Math.floor(Math.random() * net.columns);
        }while(player2.column === player1.column)
    }
    player1.getNewMainImage("main");
    player2.getNewMainImage("main");
}

player1.ui = new UI(player1, {left: 20, top: 4.5, width: 390, height: 27}, {left: 10, top: 10, width: 60, height: 60}, {left: 2, top: net.hexagonHeight * 1.02, width: net.hexagonWidth * 0.75});  //dragon.ui = new UI(dragon, {left: 60, top: 4.5, width: 400, height: 27}
player1.addPower("walk", "comeback");
player1.addPower("attack", "comeback");

player2.ui = new UI(player2, {left: 530, top: 4.5, width: 390, height: 27}, {left: 930, top: 10, width: 60, height: 60}, {left: 998 - net.hexagonWidth * 0.75, top: net.hexagonHeight * 1.02, width: net.hexagonWidth * 0.75}); 
player2.ui.healthMode = "right";

if(currentPlayer === "player1")
    player1.ui.changeMode("main");
else
    player2.ui.changeMode("main");

let timeoutIsActive = false;
function isDragonDie(health)
{
    if(health <= 0 && !timeoutIsActive){
        timeoutIsActive = true;
        //console.log("akcja aktywacja jeeej :(");
        setTimeout(
            () => {
                lobby.changeMode("beatDefeat");
                //timeoutIsActive = false;
            }, 
            5000
        );
    }
}
setInterval(() => {
    try{
        //player1.getNewMainImage("none");
        netCtx.clearRect(0, 0, netCanvas.width, netCanvas.height); 
        lobby.drawBackground();
        if(lobby.mode === "game"){
            net.drawFirstVersion();
            if(currentPlayer === "player1"){
                endTurn();   
                if(net.left < 60)
                    net.left += 5;
                if(net.left > 60)
                    net.left = 60;

                if(player1.ui.moveControlsCords.mode === null){
                    if(player1.powerIsActive === "move"){
                        highlightDragonRange(player1, player2, "yellow");
                        //console.log(mouseMoveHex);
                        let newHexDistance;
                        let newClickHexDistance;
                        let okDistance;
                        let okClickDistance;
                        if(mouseMoveHex !== null){
                            newHexDistance = hexDistance(player1.row, player1.column, mouseMoveHex.row, mouseMoveHex.column);
                            okDistance = newHexDistance <= player1.goDistance && antiSpiritWalk(player1, player2, player1.goDistance, mouseMoveHex.row, mouseMoveHex.column);
                        }
                        if(clickedHex !== null){
                            newClickHexDistance = hexDistance(player1.row, player1.column, clickedHex.row, clickedHex.column);
                            okClickDistance = newClickHexDistance <= player1.goDistance && antiSpiritWalk(player1, player2, player1.goDistance, clickedHex.row, clickedHex.column);
                        }

                        if(mouseMoveHex && !clickedHex && okDistance){
                            net.info[mouseMoveHex.row][mouseMoveHex.column].draw(null, null, null, null, "black", "black", 0.5, 0.8);
                        }else if(clickedHex && (clickedHex.row || clickedHex.row === 0) && (clickedHex.column || clickedHex.column === 0) && okDistance && okClickDistance){
                            if(clickedHex.row !== player2.row || clickedHex.column !== player2.column){
                                if(newClickHexDistance === 0 && newHexDistance === 0){
                                    player1.powerIsActive = false;
                                    player1.ui.changeMode("walk");
                                    //brak kosztów energii
                                }else{
                                    //player1.oldImagesName = "run"; //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                    //player1.getNewMainImage("run");
                                    player1.go(clickedHex.row, clickedHex.column, player1.speed, true);
                                    let interval = setInterval(
                                        () => {
                                            if(player1.drawing === false){
                                                player1.getNewMainImage("main");
                                                clearInterval(interval);
                                            }else{
                                                player1.getNewMainImage("run");
                                            }
                                        }, 
                                        player1.speed / 10
                                    );
                                    player1.powerIsActive = false;
                                    player1.ui.changeMode("walk");
                                    player1.energy -= 1;
                                }    
                            }
                        }    
                        clickedHex = null;      
                    }else if(player1.powerIsActive === "fireBreath" || player1.powerIsActive === "healBreath"){
                        highlightDragonRange(player1, null, "red", 1);
                        //console.log(mouseMoveHex);
                        let newHexDistance;
                        let newClickHexDistance;
                        let okDistance;
                        let okClickDistance;
                        if(mouseMoveHex){
                            newHexDistance = hexDistance(player1.row, player1.column, mouseMoveHex.row, mouseMoveHex.column);
                            okDistance = newHexDistance <= 1;
                        }
                        if(clickedHex){
                            newClickHexDistance = hexDistance(player1.row, player1.column, clickedHex.row, clickedHex.column);
                            okClickDistance = newClickHexDistance < 1 || newClickHexDistance === 1 && clickedHex.row === player2.row && clickedHex.column === player2.column;
                        }

                        if(mouseMoveHex && !clickedHex && okDistance){
                            net.info[mouseMoveHex.row][mouseMoveHex.column].draw(null, null, null, null, "orange", "red", 0.5, 0.8);
                        }else if(clickedHex && (clickedHex.row || clickedHex.row === 0) && (clickedHex.column || clickedHex.column === 0) && okDistance && okClickDistance){
                            if(newClickHexDistance === 0 && newHexDistance === 0){
                                player1.powerIsActive = false;
                                player1.ui.changeMode("attack");
                                //brak kosztów energii
                            }else{
                                if(player1.row > player2.row)
                                    player1.rightMode = false;
                                else if(player1.row < player2.row)
                                    player1.rightMode = true;
                                
                                let damage = 30 * player1.strenght / 100;
                                isDragonDie(player2.calculateDamageHealth(damage));

                                setTimeout(
                                    () => {
                                        player1.getNewMainImage("attack");
                                        player2.getDamage(damage);
                                        setTimeout(
                                            () => {
                                                player1.getNewMainImage("main");
                                            }, 
                                            player1.speed
                                        );
                                    }, 
                                    player1.speed
                                );
                                if(player1.powerIsActive === "healBreath"){
                                    setTimeout(
                                        () => {
                                            player1.health = Math.min(player1.health + damage * 0.4, player1.maxHealth);
                                        }, 
                                        player1.speed
                                    );
                                } 

                                player1.powerIsActive = false;
                                player1.ui.changeMode("attack");
                                player1.energy -= 1;
                            }    
                            //clickedHex = null;
                        }    
                        clickedHex = null;      
                    }else if(player1.powerIsActive === "teleport"){
                        highlightDragonRange(player1, null, "aqua", net.rows);
                        //console.log(mouseMoveHex);
                        let newHexDistance;
                        let newClickHexDistance;
                        let okDistance;
                        let okClickDistance;
                        if(mouseMoveHex){
                            newHexDistance = hexDistance(player1.row, player1.column, mouseMoveHex.row, mouseMoveHex.column);
                            okDistance = newHexDistance <= net.rows && mouseMoveHex.column <= net.columns;
                        }
                        if(clickedHex){
                            newClickHexDistance = hexDistance(player1.row, player1.column, clickedHex.row, clickedHex.column);
                            okClickDistance = newClickHexDistance <= net.rows && clickedHex.column <= net.columns;
                        }

                        if(mouseMoveHex && !clickedHex && okDistance){
                            net.info[mouseMoveHex.row][mouseMoveHex.column].draw(null, null, null, null, "green", "aqua", 0.5, 0.8);
                        }else if(clickedHex && (clickedHex.row || clickedHex.row === 0) && (clickedHex.column || clickedHex.column === 0) && okDistance && okClickDistance){
                            if(newClickHexDistance === 0 && newHexDistance === 0){
                                player1.powerIsActive = false;
                                player1.ui.changeMode("other");
                                //brak kosztów energii
                            }else{
                                player1.getNewMainImage("attack");
                                player1.go(clickedHex.row, clickedHex.column, 1, true);
                                setTimeout(
                                    () => {
                                        player1.getNewMainImage("main");
                                        player1.rightMode = !player1.rightMode;
                                    }, 
                                    newClickHexDistance
                                );
                                
                                player1.powerIsActive = false;
                                player1.ui.changeMode("other");
                                player1.energy = 0;
                            }    
                            //clickedHex = null;
                        }    
                        clickedHex = null;      
                    }
                }
                player1.draw();
                if(!timeoutIsActive){
                    player1.ui.drawAll(player1);
                }else{
                    player1.ui.drawHealth(player1);
                    player1.ui.drawEnergy(player1);
                }
                player2.draw();
                player2.ui.drawHealth(player2);
            }else if(currentPlayer === "player2"){
                endTurn();
                if(net.left > 0)
                    net.left -= 5;
                if(net.left < 0)
                    net.left = 0;

                if(player2.ui.moveControlsCords.mode === null){
                    if(player2.powerIsActive === "move"){
                        highlightDragonRange(player2, player1, "yellow");
                        //console.log(mouseMoveHex);
                        let newHexDistance;
                        let newClickHexDistance;
                        let okDistance;
                        let okClickDistance;
                        if(mouseMoveHex !== null){
                            newHexDistance = hexDistance(player2.row, player2.column, mouseMoveHex.row, mouseMoveHex.column);
                            okDistance = newHexDistance <= player2.goDistance && antiSpiritWalk(player2, player1, player2.goDistance, mouseMoveHex.row, mouseMoveHex.column);
                        }
                        if(clickedHex !== null){
                            newClickHexDistance = hexDistance(player2.row, player2.column, clickedHex.row, clickedHex.column);
                            okClickDistance = newClickHexDistance <= player2.goDistance && antiSpiritWalk(player2, player1, player2.goDistance, clickedHex.row, clickedHex.column);
                        }

                        if(mouseMoveHex && !clickedHex && okDistance){
                            net.info[mouseMoveHex.row][mouseMoveHex.column].draw(null, null, null, null, "black", "black", 0.5, 0.8);
                        }else if(clickedHex && (clickedHex.row || clickedHex.row === 0) && (clickedHex.column || clickedHex.column === 0) && okDistance && okClickDistance){
                            if(clickedHex.row !== player1.row || clickedHex.column !== player1.column){
                                if(newClickHexDistance === 0 && newHexDistance === 0){
                                    player2.powerIsActive = false;
                                    player2.ui.changeMode("walk");
                                    //brak kosztów energii
                                }else{
                                    player2.go(clickedHex.row, clickedHex.column, player2.speed, true);
                                    let interval = setInterval(
                                        () => {
                                            if(player2.drawing === false){
                                                player2.getNewMainImage("main");
                                                clearInterval(interval);
                                            }else{
                                                player2.getNewMainImage("run");
                                            }
                                        }, 
                                        player2.speed / 10
                                    );
                                    player2.powerIsActive = false;
                                    player2.ui.changeMode("walk");
                                    player2.energy -= 1;
                                    
                                }    
                            }
                        }    
                        clickedHex = null;      
                    }else if(player2.powerIsActive === "fireBreath" || player2.powerIsActive === "healBreath"){
                        highlightDragonRange(player2, null, "red", 1);
                        //console.log(mouseMoveHex);
                        let newHexDistance;
                        let newClickHexDistance;
                        let okDistance;
                        let okClickDistance;
                        if(mouseMoveHex){
                            newHexDistance = hexDistance(player2.row, player2.column, mouseMoveHex.row, mouseMoveHex.column);
                            okDistance = newHexDistance <= 1;
                        }
                        if(clickedHex){
                            newClickHexDistance = hexDistance(player2.row, player2.column, clickedHex.row, clickedHex.column);
                            okClickDistance = newClickHexDistance < 1 || newClickHexDistance === 1 && clickedHex.row === player1.row && clickedHex.column === player1.column;
                        }

                        if(mouseMoveHex && !clickedHex && okDistance){
                            net.info[mouseMoveHex.row][mouseMoveHex.column].draw(null, null, null, null, "orange", "red", 0.5, 0.8);
                        }else if(clickedHex && (clickedHex.row || clickedHex.row === 0) && (clickedHex.column || clickedHex.column === 0) && okDistance && okClickDistance){
                            if(newClickHexDistance === 0 && newHexDistance === 0){
                                player2.powerIsActive = false;
                                player2.ui.changeMode("attack");
                                //brak kosztów energii
                            }else{
                                if(player2.row > player1.row)
                                    player2.rightMode = false;
                                else if(player2.row < player1.row)
                                    player2.rightMode = true;
                                
                                let damage = 30 * player2.strenght / 100;

                                isDragonDie(player1.calculateDamageHealth(damage));
                                setTimeout(
                                    () => {
                                        player1.getDamage(damage);
                                        player2.getNewMainImage("attack");
                                        setTimeout(
                                            () => {
                                                player2.getNewMainImage("main");
                                            }, 
                                            player2.speed
                                        );
                                    }, 
                                    player2.speed
                                );
                                if(player2.powerIsActive === "healBreath"){
                                    setTimeout(
                                        () => {
                                            player2.health = Math.min(player2.health + damage * 0.4, player2.maxHealth);
                                        }, 
                                        player2.speed
                                    );
                                } 

                                player2.powerIsActive = false;
                                player2.ui.changeMode("attack");
                                player2.energy -= 1;
                            }
                            //clickedHex = null;
                        }    
                        clickedHex = null;      
                    }else if(player2.powerIsActive === "teleport"){
                        highlightDragonRange(player2, null, "aqua", net.rows);
                        //console.log(mouseMoveHex);
                        let newHexDistance;
                        let newClickHexDistance;
                        let okDistance;
                        let okClickDistance;
                        if(mouseMoveHex){
                            newHexDistance = hexDistance(player2.row, player2.column, mouseMoveHex.row, mouseMoveHex.column);
                            okDistance = newHexDistance <= net.rows && mouseMoveHex.column <= net.columns;
                        }
                        if(clickedHex){
                            newClickHexDistance = hexDistance(player2.row, player2.column, clickedHex.row, clickedHex.column);
                            okClickDistance = newClickHexDistance <= net.rows && clickedHex.column <= net.columns;
                        }

                        if(mouseMoveHex && !clickedHex && okDistance){
                            net.info[mouseMoveHex.row][mouseMoveHex.column].draw(null, null, null, null, "green", "aqua", 0.5, 0.8);
                        }else if(clickedHex && (clickedHex.row || clickedHex.row === 0) && (clickedHex.column || clickedHex.column === 0) && okDistance && okClickDistance){
                            if(newClickHexDistance === 0 && newHexDistance === 0){
                                player2.powerIsActive = false;
                                player2.ui.changeMode("other");
                                //brak kosztów energii
                            }else{
                                player2.getNewMainImage("attack");
                                player2.go(clickedHex.row, clickedHex.column, 1, true);
                                setTimeout(
                                    () => {
                                        player2.getNewMainImage("main");
                                        player2.rightMode = !player2.rightMode;
                                    }, 
                                    newClickHexDistance
                                );
                                
                                player2.powerIsActive = false;
                                player2.ui.changeMode("other");
                                player2.energy = 0;
                            }    
                            //clickedHex = null;
                        }    
                        clickedHex = null;      
                    }
                }
                player2.draw();
                if(!timeoutIsActive){
                    player2.ui.drawAll(player2);
                }else{
                    player2.ui.drawHealth(player2);
                    player2.ui.drawEnergy(player2);
                }
                player1.draw();
                player1.ui.drawHealth(player1);
            }
        }
        lobby.draw();
    }catch (err){
        console.error("Błąd w pętli setInterval:", err);
    }
}, 10);

//lobby.mode = "game"; 
resizeGame();
document.addEventListener("click", () => {
    goFullscreen();
});
