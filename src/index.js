import { addHex, clearHexes, drawHexes, lockHex, setDefaultVisibility, getVisibilityJson, setVisibilityFromJson, massLosToggle } from "./hex.js";
import { fileToDataUri, fileToText, JavascriptDataDownloader } from "./helpers.js";

const canvasElement = document.getElementById("canvas");
const context = canvasElement.getContext("2d");
var currentMapId = "";
let loadedImage = null;

initializeEvents();
resetCanvas();

//Adds listeners and initialiazes events for all elements
function initializeEvents() {

  initializeMapMenu();

  //Set onclick event handlers for all menu elements
  function initializeMapMenu() {
    const onClick = function () {
      console.log(this.id, this.innerHTML);
      currentMapId = this.id;
      if (this.id[0] == "E") {
        var imagePath = `img/europe/${this.id.substring(1)}.png`
        resetCanvas(imagePath);
      }
      else if (this.id[0] == "M") {
        var imagePath = `img/mediterranean/${this.id.substring(1)}.png`
        resetCanvas(imagePath);
      }
    }

    setMapMenuClickHandlers("E", onClick);
    setMapMenuClickHandlers("M", onClick);
  }

  //Sets the click handlers for all elements with the given prefix
  function setMapMenuClickHandlers(prefix, onClick) {
    for (let i = 1; i < 13; i++) {
      var id = `${prefix}0${i}`;
      if (i >= 10)
        id = `${prefix}${i}`;

      document.getElementById(id).onclick = onClick;
    }
  }
  

  //On click --> load and draw new image file
  const fileInput = document.querySelector("#upload");
  fileInput.addEventListener("change", async (e) => {
    const [file] = fileInput.files;

    // displaying the uploaded image
    const image = document.createElement("img");
    image.src = await fileToDataUri(file);
    loadedImage = image;

    image.addEventListener("load", () => {
      drawImageOnCanvas(image);
    });

    return false;
  });

  //On click --> import json with visibility data
  const importFile = document.querySelector("#import");
  importFile.addEventListener("change", async (e) => {
    const [file] = importFile.files;

    // load the json visibility data
    var jsonFile = await fileToText(file);
    setVisibilityFromJson(jsonFile);
    return false;
  });

  //On click -->  clear canvas, hexes and loaded image.
  const clearElement = document.getElementById("clear");
  clearElement.onclick = () => {
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    clearHexes();
    loadedImage = null;
  };

  //On click --> reset grid.
  const drawGridElement = document.getElementById("draw");
  drawGridElement.onclick = () => {
    resetGrid(canvas.width, canvas.height);
  };

  //On click --> locks selected hex, if any.
  const calcVisibility = document.getElementById("visibility");
  calcVisibility.onclick = () => {
    lockHex();
    //next selections draw/undraw lines between locked and selected hex 
    //right click on a hex, adds/remove it from the visibility list
  };

  //On click --> saves current visibility data of all hexes into a json file.
  const exportVisibility = document.getElementById("exportVisibility");
  exportVisibility.onclick = () => {
    new JavascriptDataDownloader(getVisibilityJson(), `${currentMapId}.json`).download();
  };

  //On click --> Enables/disables mass LOS editing
  const massLossToggle = document.getElementById("massLos");
  massLossToggle.onclick = () => {
    massLosToggle();
  };

}
//A new image and a new grid are drawn on the canvas
function resetCanvas(imagePath) {
  var img = new Image();
  img.onload = function () {
    loadedImage = img;

    drawImageOnCanvas(img);
    resetGrid(canvas.width, canvas.height);
  };

  if (!imagePath) {
    imagePath = 'img/europe/01.png'
    currentMapId = "E01";
    loadLosFromFile('data/E01.json');
  }
  img.src = imagePath;

  var checkBox = document.getElementById("showLOS");
  checkBox.checked = false;
}

function loadLosFromFile(fileToLoad) {
  fetch(fileToLoad)
    .then((res) => res.text())
    .then((data) => {
      setVisibilityFromJson(data);

    });
}


//draws the given image on the canvas
function drawImageOnCanvas(image = null) {
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
//clears the canvas and then redraws the loaded image if any and all hexes if any
export function redrawCanvas() {
  context.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (loadedImage)
    drawImageOnCanvas(loadedImage);
  drawHexes();
}
//clears all hex objects and recreates all of them
function resetGrid(width, height) {
  clearHexes();
  var r = 54.55;
  const a = (2 * Math.PI) / 6;
  var row = 0;
  var column = "A";

  for (let y = r; y + r * Math.sin(a) < height; y += r * Math.sin(a)) {
    row++;
    column = "A";
    for (
      let x = r, j = 0; x < width;
      x += r * (1 + Math.cos(a)), y += (-1) ** j++ * r * Math.sin(a)) {
      addHex(r, x, y, row, column);
      column = String.fromCharCode(column.charCodeAt() + 1);
    }
  }

  setDefaultVisibility();
  redrawCanvas();
}

