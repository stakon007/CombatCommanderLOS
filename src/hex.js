import { redrawCanvas } from "./index.js";
const helpText = document.getElementById("helpText");
const selHex = document.getElementById("selHex");
const lHex = document.getElementById("lockedHex");
const lockButton = document.getElementById("visibility");
const details = document.getElementById("details");
const checkBox = document.getElementById("showLOS");

let hexes = [];

const state = {
  get selectedHex() {
    return this._selectedHex;
  },
  set selectedHex(hex) {
    this._selectedHex = hex;
    updateDOM();
  },
  _selectedHex: null,

  get lockedHex() {
    return this._lockedHex;
  },
  set lockedHex(hex) {
    this._lockedHex = hex;
    updateDOM();
  },
  _lockedHex: null,
  get showLOS() {
    return this._showLOS;
  },
  set showLOS(show) {
    this._showLOS = show;
    updateDOM();
  },
  _showLOS: false,
  _massLosMode: false
}

const canvasElement = document.getElementById("canvas");
const ctx = canvasElement.getContext("2d");
const a = (2 * Math.PI) / 6;

//Empties the hexes array and sets the selected/locked vars to null
export function clearHexes() {
  state.lockedHex = null;
  state.selectedHex = null;
  hexes = [];
  state.showLOS = false;
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
  if (state.lockedHex) {
    //unlock if already locked and just selects it
    if (state.selectedHex)
      state.selectedHex.isSelected = false;
    state.lockedHex.isLocked = false;
    state.selectedHex = state.lockedHex;
    state.selectedHex.isSelected = true;
    state.lockedHex = null;
  } else if (state.selectedHex) {
    state.lockedHex = state.selectedHex;
    state.selectedHex.isLocked = true;
    state.selectedHex.isSelected = false;
    state.selectedHex = null;
  } else return;

  redrawCanvas();
}
export function massLosToggle() {

  state._massLosMode = !state._massLosMode;

  if (state._massLosMode) {
    //mass Los edit enabled --> allow selection of multiple hexes
    //reset selections and locks
    if (state.lockedHex) {
      if (state.selectedHex)
        state.selectedHex.isSelected = false;
      state.lockedHex.isLocked = false;
      state.selectedHex = null;
      state.lockedHex = null;
    } else if (state.selectedHex) {
      state.selectedHex.isSelected = false;
      state.selectedHex = null;
    }
  }
  else {
    //mass Los edit finished
    processMassLosForSelection();
    //save all selected hexes into each other's list
    //deselect everything
  }
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
    if (state.lockedHex && state.lockedHex.visibleHexes.find((x) => x == hex))
      ctx.fillStyle = "green";
    else if (!state.lockedHex && state.selectedHex && state.selectedHex.visibleHexes.find((x) => x == hex))
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

    if (hex.isSelected) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "blue";
      ctx.globalAlpha = 0.8;
      ctx.closePath();
      ctx.stroke();
      if (state.showLOS && lockedHex) {
        ctx.globalAlpha = 0.2;
        ctx.fill();
      }
      continue;
    }
    else if (hex.isLocked) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "red";
      ctx.globalAlpha = 0.8;
      ctx.closePath();
      ctx.stroke();
      continue;
    }
    else ctx.lineWidth = 1;

    ctx.closePath();
    if (state.showLOS)
      ctx.fill();
    ctx.stroke();
  }

  //a hex is locked, draw a line from it to the selected hex
  if (state.lockedHex && state.selectedHex) {
    drawLine(state.lockedHex, state.selectedHex);
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

      if (state._massLosMode) {//in mass lock mode select/deselect multiple cells
        hex.isSelected = !hex.isSelected;
      }
      else {
        if (state.selectedHex != null) {
          state.selectedHex.isSelected = false;
        }

        state.selectedHex = hex;
        hex.isSelected = true;
      }

      redrawCanvas();

      return;
    }
  }
}
//Hit test to find the clicked hex and add it to the visibility array of the  selected hex
function canvasRightClick(e) {
  //only works wwhen a hex is locked and show LOS is enabled
  if (!state.lockedHex || !state.showLOS)
    return;

  let clickX = e.pageX - canvas.offsetLeft;
  let clickY = e.pageY - canvas.offsetTop;

  for (let i = hexes.length - 1; i >= 0; i--) {
    let hex = hexes[i];

    let distanceFromCenter = Math.sqrt(
      Math.pow(hex.x - clickX, 2) + Math.pow(hex.y - clickY, 2));

    if (distanceFromCenter <= hex.radius) {
      updateReciprocalVisibility(state.lockedHex, hex);
      listVisibleHexes(state.lockedHex);

      redrawCanvas();

      return;
    }
  }
}


checkBox.onclick = () => { toggleLOS(); }
export function toggleLOS() {
  state.showLOS = checkBox.checked;
  redrawCanvas();
}
/**
 * Adds a hex to the other hex's visibility list
 * If addOnly is true it will not remove from each other's LOS table if already present
 * @param mainHex {Hex}
 * @param hex {Hex}
  * @param addOnly{boolean}
 */
function updateVisibility(mainHex, hex, addOnly = false) {
  //if the hex is already there, remove it
  var index = mainHex.visibleHexes.indexOf(hex);
  if (index > -1) {

    if (addOnly)
      return;
    // only splice array when item is found
    mainHex.visibleHexes.splice(index, 1); // 2nd parameter means remove one item only
  }
  else mainHex.visibleHexes.push(hex);
}

/**
 * Adds each hex to the other hex's visibility list
 * If addOnly is true it will not remove from each other's LOS table if already present
 * @param hexA {Hex}
 * @param hexB{Hex}
 * @param addOnly{boolean}
 */
function updateReciprocalVisibility(hexA, hexB, addOnly = false) {
  updateVisibility(hexA, hexB, addOnly);
  updateVisibility(hexB, hexA, addOnly);
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


//updates the DOM based on the current state
function updateDOM() {

  if (state._massLosMode) {
    helpText.innerHTML = `Select any number of hexes that have mutual LOS and click MassSelectLos to apply`;
    return;
  }

  //Update help text
  var txt = state.selectedHex?.name ? `Lock the selected hex to calculate LOS` : "Select a hex to display visibillity.";
  var extraTxt = state.showLOS ? "Right click on other hexes to toggle visibility" : "";

  if (state.lockedHex)
    txt = state.lockedHex?.name ? `Left click on other hexes to draw LOS.<br> ${extraTxt}` : "";

  helpText.innerHTML = `${txt}`;
  selHex.innerHTML = state.selectedHex?.name ? `${state.selectedHex.name}` : "None";

  //set elements visibility
  if (state.selectedHex == null && state.lockedHex == null) {
    lockButton.style.display = 'none';
    details.style.display = 'none';
  }
  else {
    lockButton.style.display = 'block';
    details.style.display = 'block';
  }

  //update locked text
  txt = state.lockedHex ? `Unlock Hex` : "Lock Selected Hex";
  lockButton.innerHTML = `${txt}`;
  lHex.innerHTML = state.lockedHex?.name ? `${state.lockedHex.name}` : "None";

}

//go through all selected hexes and add mutual LOS to all of them,
//Then, unselect them.
function processMassLosForSelection() {
  var allSelectedHexes = hexes.filter(x => x.isSelected);
  allSelectedHexes.forEach(mainHex => {

    allSelectedHexes.forEach(h => {
      if (h == mainHex)
        return;

      updateReciprocalVisibility(mainHex, h, true);
    })
    mainHex.isSelected = false;
  });

}