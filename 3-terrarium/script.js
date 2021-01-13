dragElement(document.getElementById("plant1"));
dragElement(document.getElementById("plant2"));
dragElement(document.getElementById("plant3"));
dragElement(document.getElementById("plant4"));
dragElement(document.getElementById("plant5"));
dragElement(document.getElementById("plant6"));
dragElement(document.getElementById("plant7"));
dragElement(document.getElementById("plant8"));
dragElement(document.getElementById("plant9"));
dragElement(document.getElementById("plant10"));
dragElement(document.getElementById("plant11"));
dragElement(document.getElementById("plant12"));
dragElement(document.getElementById("plant13"));
dragElement(document.getElementById("plant14"));

var maxZindex = 2;

function dragElement(terrariumElement) {
  //set 4 positions for positioning on the screen
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  terrariumElement.onpointerdown = pointerDrag;

  function pointerDrag(e) {
    e.preventDefault(); //prevents default action from dragging an image
    console.log(e);
    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onpointermove = elementDrag;
    document.onpointerup = stopElementDrag;

    document.onkeydown = toggleInvis;

    function toggleInvis(e) {
      if (terrariumElement.style.opacity == "") {
        terrariumElement.style.opacity = 1;
      }
      if (e.key === " ") {
        console.log(terrariumElement.style.opacity);
        terrariumElement.style.opacity =
          terrariumElement.style.opacity < 1 ? 1 : 0;
      }
    }
  }

  function elementDrag(e) {
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    console.log(pos1, pos2, pos3, pos4);
    terrariumElement.style.top = terrariumElement.offsetTop - pos2 + "px";
    terrariumElement.style.left = terrariumElement.offsetLeft - pos1 + "px";
  }

  function stopElementDrag() {
    document.onpointerup = null;
    document.onpointermove = null;
  }

  terrariumElement.ondblclick = bringToFront;

  function bringToFront() {
    //brings plant to front of all other plants
    console.log("maxZindex = " + maxZindex);
    terrariumElement.style.zIndex = maxZindex + 1;
    maxZindex++;
  }
}

document.addEventListener('keydown', revealAll);

function revealAll(e) {
    if (e.ctrlKey) {
      console.log("Revealed all");
      var i;
      for (i = 1; i <= 14; i++) {
        var id = "plant" + i;
        if (document.getElementById(id).style.opacity !== 1) {
          document.getElementById("plant" + i).style.opacity = 1;
        }
      }
    }
  }