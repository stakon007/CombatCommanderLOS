import { addHex, clearHexes, drawHexes, lockHex, setDefaultVisibility, getVisibilityJson } from "./hex.js";
import { JavascriptDataDownloader } from "./helpers.js";

const canvasElement = document.getElementById("canvas");
const context = canvasElement.getContext("2d");

const fileInput = document.querySelector("#upload");
let loadedImage = null;

const countElement = document.getElementById("clickedCounter");
let count = Number(countElement.innerText);

///Hexagon related vars
var r = 54.6;
r = 54.55;
const a = (2 * Math.PI) / 6;

initialize();

function initializeMapMenu() {
  const onClick = function () {
    console.log(this.id, this.innerHTML);

    if (this.id[0] == "E") {
      var imagePath = `../img/europe/${this.id.substring(1)}.png`
      loadInitialFile(imagePath);
    }
  }

  for (let i = 1; i < 13; i++) {
    var id = `E0${i}`;
    if (i >= 10)
      id = `E${i}`;

    document.getElementById(id).onclick = onClick;
  }
}


function initialize() {

  initializeMapMenu();

  fileInput.addEventListener("change", async (e) => {
    const [file] = fileInput.files;

    // displaying the uploaded image
    const image = document.createElement("img");
    image.src = await fileToDataUri(file);
    loadedImage = image;

    image.addEventListener("load", () => {
      drawOnImage(image);
    });

    return false;
  });

  const clearElement = document.getElementById("clear");
  clearElement.onclick = () => {
    countElement.innerText = ++count;
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    clearHexes();
    loadedImage = null;
  };

  const drawGridElement = document.getElementById("draw");
  drawGridElement.onclick = () => {
    drawGrid(canvas.width, canvas.height);
  };

  const calcVisibility = document.getElementById("visibility");
  calcVisibility.onclick = () => {
    //if no hex selected, return
    //lock selected hex
    lockHex();
    //next selections draw/undraw lines between locked and selected hex 
    //right click on a hex, adds/remove it from the visibility list
  };

  const exportVisibility = document.getElementById("exportVisibility");
  exportVisibility.onclick = () => {
    new JavascriptDataDownloader(getVisibilityJson(), "exportData.json").download();
  };

  loadInitialFile();

}

function loadInitialFile(imagePath) {
  var img = new Image();
  img.onload = function () {
    //drawOnImage(img);
    loadedImage = img;
    context.drawImage(img, 0, 0);
    drawGrid(canvas.width, canvas.height);
  };
  if (!imagePath)
    imagePath = '../img/europe/01.png'
  img.src = imagePath;
}

function fileToDataUri(field) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(reader.result);
    });

    reader.readAsDataURL(field);
  });
}

function drawOnImage(image = null) {
  // if an image is present it is drawn in the canvas
  if (image) {
    const imageWidth = image.width;
    const imageHeight = image.height;

    // rescaling the canvas element
    canvasElement.width = imageWidth;
    canvasElement.height = imageHeight;
    context.drawImage(image, 0, 0, imageWidth, imageHeight);
  }
}

//clear the canvas and then redraws the loaded image if any and all hexes if any
export function redrawCanvas() {
  context.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (loadedImage)
    drawOnImage(loadedImage);
  drawHexes();
}

function drawGrid(width, height) {
  clearHexes();

  var row = 0;
  var column = "A";

  if (loadedImage)
    drawOnImage(loadedImage);

  for (let y = r; y + r * Math.sin(a) < height; y += r * Math.sin(a)) {
    row++;
    column = "A";
    for (
      let x = r, j = 0;
      //x + r * (1 + Math.cos(a)) < width;
      x < width;
      x += r * (1 + Math.cos(a)), y += (-1) ** j++ * r * Math.sin(a)
    ) {
      {
        addHex(r, x, y, row, column);
        //console.log(`Added Hex: ${row}${column}`);
        column = String.fromCharCode(column.charCodeAt() + 1);
        //console.log(`x: ${x} y:${y} width: ${width}`)
        //countElement.innerText = ++count;
      }
    }
  }
  setDefaultVisibility();
  redrawCanvas();
}

