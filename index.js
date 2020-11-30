// grab elements out of DOM
//const timeList = document.querySelector("#waketime");
//const makeBtn = document.querySelector("#makesched");
const outputBox = document.querySelector("#output");

// a class to store all times into
class Time {
  constructor(decimal) {
    this.hour = Math.floor(decimal);
    let remainder = (decimal - Math.floor(decimal))*60;
    this.minute = remainder ? remainder : '00'; 
    this.decimal = decimal;
    this.duration = 0;
    this.awakeAfter = 2;
    this.number = 0;
    this.HTMLsleep;
    this.HTMLwake;
    this.HTMLduration;
    this.HTMLbetween;
  }
  // method to properly adjust all time properties in the object by amt 
  adjustMinutes(amt) {
    let newDecimal = this.decimal + amt;
    this.decimal = newDecimal;
    this.hour = Math.floor(newDecimal);
    let remainder = (newDecimal - Math.floor(newDecimal))*60;
    this.minute = remainder ? remainder : '00';
  }

}

// with decimal input returns a readable string in 12hr format
function getTwelveHour(decimal) {
  let hour = Math.floor(decimal);
  let remainder = (decimal - hour)*60;
  let minute = remainder ? remainder : '00';
  let twelveHour;
  let amPM = "am";
  if (hour > 12) {
    twelveHour = hour - 12;
    amPM = "pm";
  } else if (hour === 12) {
    twelveHour = hour;
    amPM = "pm";
  } else {
    twelveHour = hour;
  }
  return `${twelveHour}:${minute} ${amPM}`;
}

// converts and returns a decimal from the HTML selected option
function parseSelection(element, decimal) {
  //let arrayTime = element.selectedOptions[0].label.split(" ").shift().split(":");
  let amPM = element.selectedOptions[0].label.split(" ");
  let arrayTime = amPM.shift().split(":");
  if (decimal && amPM[0] === "pm" && arrayTime[0] !== "12") {
    return (parseInt(arrayTime[0]) + parseFloat(arrayTime[1] / 6 / 10) + 12);
  } else {
    return parseInt(arrayTime[0]) + parseFloat(arrayTime[1] / 6 / 10);
  }
}

// move the schedule around to make sure everything lines up evenly
function modifyNaps(wakeTime, naps, bedTime) {

  // first we have to see if the total duration of time gets us to 19 (7:00pm)
  let initTotal = wakeTime.decimal + wakeTime.awakeAfter;
  for (const nap of naps) {
    initTotal += nap.duration + nap.awakeAfter;
  }
  let remainingTime = bedTime.decimal - initTotal;
  // remainingTime will always be in increments of .25
  // there are 4 wake times to distribute amongst
  // ... which would change if an option was added to provide an extra nap
  // they should be distributed first to the last wake times
  // remainingTime / .25 will tell us how many times we must iterate over the wake windows
  
  spreadCounter = remainingTime / .25;
  
  // begin iterating over spreadCounter
  // loop while able to distribute evenly to all wake times after naps
  while (spreadCounter >= 3) {
    // add time to wake time immediately after morning wake time
    if (spreadCounter >= 4) {
      wakeTime.awakeAfter += .25;
      spreadCounter--;
    }
    for (let i = 2; i >= 0; i--) {
      naps[i].awakeAfter += .25;
      // call method to properly adjust new start times when awake times change
      naps[i].adjustMinutes(.25*(i+1));
      spreadCounter--;
    }
  }
  // loop to run when not enough left to distribute evenly
  // start at the end of the array since longer wake times later in the day are preferred
  let j = naps.length - 1;
  while (spreadCounter > 0) {
    naps[j].awakeAfter += .25;
    naps[j].adjustMinutes(.25*(spreadCounter-1));
    j--;
    spreadCounter--;
  } 
  // end spread adjustments
}

function generateDropOptions(decimal) {
  let decCount;
  let outputCont = ``;
  for (i = -1.5; i <= 1.5; i += .25) {
    decCount = decimal + i;
    if (i) {
      outputCont += `<option value="${getTwelveHour(
        decCount
      )}">${getTwelveHour(decCount)}</option>`;
    } else {
      outputCont += `<option value="${getTwelveHour(
        decCount
      )}" selected>${getTwelveHour(decCount)}</option>`;
    }
  }
  return outputCont;
}

function createHTML(wakeTime, naps, bedTime) {
  
  let outputHTML = `<!-- wake time section -->
      <div class="field has-addons has-addons-centered">
        <div class="control">
          <p class="button is-primary is-rounded rowhead">Wake</p>
        </div>
        <div class="control">
          <div class="select is-rounded is-primary">
            <select id="wake-time" name="wake-time" class="clickable">
              ${generateDropOptions(wakeTime.decimal)}
            </select> 
          </div>
        </div>
        <div class="control is-expanded">
          <p class="button is-primary is-rounded is-fullwidth">&nbsp;</p>
        </div>
      </div>
      <!-- awake time between sleep -->    
      <p id="between-wake" class="between">${wakeTime.awakeAfter} hr(s) between</p>`;

  let i = 0;    
  for (const nap of naps) {
    outputHTML += `<!-- nap section -->
      <div class="field has-addons has-addons-centered">
        <div class="control">
          <p class="button is-primary is-rounded is-outlined rowhead">Nap</p>
        </div>
        <div class="control">
          <div class="select is-primary">
            <select id="sleep-${i}" name="sleep-${i}" class="clickable">
              ${generateDropOptions(nap.decimal)}
            </select>
          </div>
        </div>
        <div class="control">
          <p class="button is-primary is-outlined is-rounded reduce">&nbsp;</p>
        </div>
        <div class="control">
          <div class="select is-primary">
            <select id="wake-${i}" name="wake-${i}" class="clickable">
               ${generateDropOptions(nap.decimal + nap.duration)}
            </select>
          </div>
        </div>
        <div class="control is-expanded">
          <p id="duration-${i}" class="button is-primary is-outlined is-rounded is-fullwidth">${nap.duration} hr(s)</p>
        </div>
      </div>
      <!-- awake time between sleep -->
      <p id="between-${i}" class="between">${nap.awakeAfter} hr(s) between</p>`;
    i++;
  }

  outputHTML += `<!-- bed time section -->
      <div class="field has-addons has-addons-centered">
        <div class="control">
          <p class="button is-rounded is-static rowhead">Bed</p>
        </div>
        <div class="control">
          <p class="button reduce">${getTwelveHour(bedTime.decimal)}</p>
        </div>
        <div class="control is-expanded">
          <p class="button is-static is-rounded is-fullwidth">&nbsp;</p>
        </div>
      </div>`;

  return outputHTML;
}

function updateAdjacent(element, newVal) {
  let curVal = 0;

  // figure out which elements to update

  if (element === wakeTime.HTMLwake) {
    // only update wakeTime.HTMLbetween
    curVal = wakeTime.decimal;
    wakeTime.awakeAfter -= newVal - curVal;
    wakeTime.HTMLbetween.innerHTML = `${wakeTime.awakeAfter} hr(s) between`;
    wakeTime.adjustMinutes(newVal - curVal);
  } else {
    // updates exist in one of the naps
    for (let i = 0; i < naps.length; i++) {
      if (element === naps[i].HTMLsleep) {
        // the sleep element of naps was changed
        if (!i) {
          // if the first nap sleep was updated, then we have to update 
          // wakeTime.HTMLbetween
          curVal = naps[i].decimal;
          wakeTime.awakeAfter += newVal - curVal;
          wakeTime.HTMLbetween.innerHTML = `${wakeTime.awakeAfter} hr(s) between`;
        } else {
          // if it's any nap sleep except the first one, we must update
          // the previous nap's .HTMLbetween
          curVal = naps[i].decimal;
          naps[i-1].awakeAfter += newVal - curVal;
          naps[i-1].HTMLbetween.innerHTML = `${naps[i-1].awakeAfter} hr(s) between`;
        }
        // update naps[i].HTMLduration whether or not it was the first nap
        naps[i].duration -= newVal - curVal;
        naps[i].HTMLduration.innerHTML = `${naps[i].duration} hr(s)`;
        naps[i].adjustMinutes(newVal - curVal);

      } else if (element === naps[i].HTMLwake) {
        // the wake element of naps was changed
        // update naps[i].HTMLduration
        // update naps[i].HTMLbetween
        curVal = naps[i].decimal + naps[i].duration;
        naps[i].duration += newVal - curVal;
        naps[i].HTMLduration.innerHTML = `${naps[i].duration} hr(s)`;
        naps[i].awakeAfter -= newVal - curVal;
        naps[i].HTMLbetween.innerHTML = `${naps[i].awakeAfter} hr(s) between`; 
      }
    }
  }
}

function handleClick(element) {
  let newVal = parseSelection(element, true);
  element.innerHTML = generateDropOptions(newVal);
  updateAdjacent(element, newVal);
}


// ------------------ start these processes on load ----------------------
const wakeTime = new Time(6.5);
// hard coded items for now:
// only 3 naps and bed time is 19.0 (7:00pm)
const napDurationTimes = [.5, 2, 1];
const naps = [];
let timeCounter = wakeTime.decimal + wakeTime.awakeAfter;
for (i = 0; i < 3; i++) {
  naps[i] = new Time(timeCounter);
  // duration is set to default 0 in constructor for now
  // so it has to be set to appropriate value here
  naps[i].duration = napDurationTimes[i];
  naps[i].number = i + 1;
  timeCounter += naps[i].duration + naps[i].awakeAfter;
} 
const bedTime = new Time(19);

// adjust schedule times
modifyNaps(wakeTime, naps, bedTime);

let output = createHTML(wakeTime, naps, bedTime);
outputBox.innerHTML = output;



wakeTime.HTMLwake = document.querySelector("#wake-time");
wakeTime.HTMLbetween = document.querySelector("#between-wake");

for (let foo = 0; foo < naps.length; foo++) {
  naps[foo].HTMLsleep = document.querySelector(`#sleep-${foo}`);
  naps[foo].HTMLwake = document.querySelector(`#wake-${foo}`);
  naps[foo].HTMLduration = document.querySelector(`#duration-${foo}`);
  naps[foo].HTMLbetween = document.querySelector(`#between-${foo}`);
}

document.addEventListener("change", function(event) {
  if (event.target.matches(".clickable")) {
    handleClick(event.target);
  }
}, false);