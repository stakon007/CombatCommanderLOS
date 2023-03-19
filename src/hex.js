import { redrawCanvas } from "./index.js";
let hexes = [];
let selectedHex = null;
let lockedHex = null;
const canvasElement = document.getElementById("canvas");
const ctx = canvasElement.getContext("2d");
const a = (2 * Math.PI) / 6;

//Empties the hexes array and sets the selected/locked vars to null
export function clearHexes() {
  selectedHex = null;
  lockedHex = null;
  hexes = [];
}
//adds a new Hex in the hex array
export function addHex(radius, x, y, row = "", column = "") {
  let color = "brown";
  let hex = new Hex(x, y, radius, color, row, column);
  hexes.push(hex);
}

//fills the visibleHexes[] with all adjacent hexes
export function setDefaultVisibility() {
  for (let i = 0; i < hexes.length; i++) {
    let hexA = hexes[i];
    for (let j = i; j < hexes.length; j++) {
      if (i == j)
        continue;
      let hexB = hexes[j];

      //if the distance from their centers is equal to sqrt(3 * R) then they are adjacent
      //we multiply the radious by 1.1 to include just-missed adjacencies
      var distance = getHexesDistance(hexA, hexB);
      if (Math.sqrt(3) * hexA.radius * 1.1 >= distance)
        updateReciprocalVisibility(hexA, hexB);
    }
  }
}
//locks the selected hex or unlocks the locked hex
export function lockHex() {
  if (lockedHex) {
    //unlock if already locked
    lockedHex.isLocked = false;
    lockedHex = null;
    if (selectedHex) {
      selectedHex.isSelected = false;
      selectedHex = null;
    }
  } else if (selectedHex) {
    lockedHex = selectedHex;
    selectedHex.isLocked = true;
    selectedHex.isSelected = false;
    selectedHex = null;
  } else return;

  redrawCanvas();
}
//the Hex definition
function Hex(x, y, radius, color, row = "", column = "") {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.color = color;
  this.isSelected = false;
  this.isLocked = false;
  this.row = row;
  this.column = column;
  this.visibleHexes = [];
  this.name = `${this.column + this.row}`;
}
//draws on the canvas all hexes in the hexes array
export function drawHexes() {

  for (let i = 0; i < hexes.length; i++) {
    let hex = hexes[i];

    ctx.globalAlpha = 0.2;
    if (lockedHex && lockedHex.visibleHexes.find((x) => x == hex))
      ctx.fillStyle = "green";
    else if (!lockedHex && selectedHex && selectedHex.visibleHexes.find((x) => x == hex))
      ctx.fillStyle = "green";
    else
      ctx.fillStyle = hex.color;
    ctx.strokeStyle = "black";

    ctx.beginPath();

    for (let i = 0; i < 6; i++) {
      ctx.lineTo(
        hex.x + hex.radius * Math.cos(a * i),
        hex.y + hex.radius * Math.sin(a * i)
      );
    }

    if (hex.isSelected) ctx.lineWidth = 5;
    else if (hex.isLocked) ctx.lineWidth = 8;
    else ctx.lineWidth = 1;

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  //a hex is locked, draw a line from it to the selected hex
  if (lockedHex && selectedHex) {
    drawLine(lockedHex, selectedHex);
  }
}
//draw a line between two hexes' centers
function drawLine(hexA, hexB) {
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.lineTo(hexA.x + 0.5, hexA.y);
  ctx.lineTo(hexB.x + 0.5, hexB.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
//Set event handlers for right and left click
window.onload = () => {
  canvas.onclick = canvasClick;
  canvasElement.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    canvasRightClick(ev);
    return false;
  });
};
//Hit test to find the clicked hex and mark it as selected
function canvasClick(e) {
  let clickX = e.pageX - canvas.offsetLeft;
  let clickY = e.pageY - canvas.offsetTop;

  for (let i = hexes.length - 1; i >= 0; i--) {
    let hex = hexes[i];

    let distanceFromCenter = Math.sqrt(
      Math.pow(hex.x - clickX, 2) + Math.pow(hex.y - clickY, 2)
    );

    if (distanceFromCenter <= hex.radius) {
      if (hex.isLocked) return;

      if (selectedHex != null) {
        selectedHex.isSelected = false;
      }

      selectedHex = hex;
      hex.isSelected = true;

      redrawCanvas();

      return;
    }
  }
}
//Hit test to find the clicked hex and add it to the visibility array of the  selected hex
function canvasRightClick(e) {
  //only works wwhen a hex is locked
  if (!lockedHex)
    return;

  let clickX = e.pageX - canvas.offsetLeft;
  let clickY = e.pageY - canvas.offsetTop;

  for (let i = hexes.length - 1; i >= 0; i--) {
    let hex = hexes[i];

    let distanceFromCenter = Math.sqrt(
      Math.pow(hex.x - clickX, 2) + Math.pow(hex.y - clickY, 2));

    if (distanceFromCenter <= hex.radius) {
      updateReciprocalVisibility(lockedHex, hex);
      listVisibleHexes(lockedHex);

      redrawCanvas();

      return;
    }
  }
}

/**
 * @param mainHex {Hex}
 * @param hex {Hex}
 */
function updateVisibility(mainHex, hex) {
  //if the hex is already there, remove it
  var index = mainHex.visibleHexes.indexOf(hex);
  if (index > -1) {
    // only splice array when item is found
    mainHex.visibleHexes.splice(index, 1); // 2nd parameter means remove one item only
  } 
  else mainHex.visibleHexes.push(hex);
}

/**
 * Adds each hex to the other hex's visibility list
 * @param hexA {Hex}
 * @param hexB{Hex}
 */
function updateReciprocalVisibility(hexA, hexB) {
  updateVisibility(hexA, hexB);
  updateVisibility(hexB, hexA);
}

/**
 * @param mainHex {Hex}
 */
function listVisibleHexes(mainHex) {
  var allHexes = "";
  mainHex.visibleHexes.forEach((hex) => {
    allHexes += `${hex.column + hex.row} `
  });
  console.log(allHexes);
}

/**
 * @param hexA {Hex}
 * @param hexB{Hex}
 */
function getHexesDistance(hexA, hexB) {
  var a = hexA.x - hexB.x;
  var b = hexA.y - hexB.y;

  return Math.sqrt(a * a + b * b);
}

//Returns the visibility data of all hexes 
export function getVisibilityJson() {

  var hexVisibilityData = [];

  hexes.forEach((hex) => {
    var visibleHexes = [];
    hex.visibleHexes.forEach((v) => {
      visibleHexes.push(`${v.column + v.row}`);
    })
    var item = { "name": `${hex.column + hex.row}`, "visibility": visibleHexes };
    hexVisibilityData.push(item);
  });

  return hexVisibilityData;
  /*
{ "hexes":[
    {
     "name": "A1",
     "visibility": ["A2","A3","A4"] 
    },
    {
     "name": "A2",
     "visibility": ["A1","A3","B2"] 
    },    
...
  ]
}
  */
}

//sets the visibility data of every hex included in the incoming json
export function setVisibilityFromJson(jsonData) {

  if (!hexes || hexes.length == 0)
    return;
  const obj = JSON.parse(jsonData);

  obj.forEach(item => {
    var hex = hexes.find(x => x.name == item.name);
    if (hex) {
      hex.visibleHexes = [];
      item.visibility.forEach(v => {
        var h = hexes.find(x => x.name == v);
        hex.visibleHexes.push(h);
      }
      )
    }
  });
}
