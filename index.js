// grab elements out of DOM
const timeList = document.querySelector("#waketime");
const makeBtn = document.querySelector("#makesched");
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
function parseSelection() {
  let arrayTime = timeList.selectedOptions[0].label.split(" ").shift().split(":");
  return parseInt(arrayTime[0]) + parseFloat(arrayTime[1] / 6 / 10);
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

function createHTML(wakeTime, naps, bedTime) {
  let outputHTML = `<div class="schedule">
      <table>
        <tr>
          <td class="rowhead">Wake</td>
          <td colspan="2" class="cover">${getTwelveHour(wakeTime.decimal)}</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td colspan="4" class="between">${wakeTime.awakeAfter} hr(s)</td>
        </tr>`;
  for (const nap of naps) {
    outputHTML += `<tr>
          <td class="rowhead">Nap ${nap.number}</td>
          <td class="valstart">${getTwelveHour(nap.decimal)}</td>
          <td class="valend">${getTwelveHour(nap.decimal + nap.duration)}</td>
          <td class="dur">${nap.duration} hr(s)</td>
        </tr>
        <tr>
          <td colspan="4" class="between">${nap.awakeAfter} hr(s)</td>
        </tr>`;
  }
        
  outputHTML += `<tr>
          <td class="rowhead">Bed</td>
          <td colspan="2" class="cover">${getTwelveHour(bedTime.decimal)}</td>
          <td>&nbsp;</td>
        </tr>
      </table>
    </div>`;
  return outputHTML;
}

// this is the main function
function generateSchedule() {

  // create a Time object based on the wake time input from HTML
  const wakeTime = new Time(parseSelection());

  // hard coded items for now:
  //
  // **** should be able to modify this in future ****
  // |                                               |
  // |      nap durations [1 hr, 2 hrs, 0.5 hr]      |
  // |                                               |
  // *************************************************
  // there being 3 naps total
  // and bed time being 19.0 (7:00pm)
  const napDurationTimes = [.5, 2, 1];
  // create naps array and loop over to fill with Time objects
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
  
  // create Time object for bed time for 7:00pm
  const bedTime = new Time(19);

  // adjust schedule times
  modifyNaps(wakeTime, naps, bedTime);
  
  // now we need to output them to the page
  let output = createHTML(wakeTime, naps, bedTime);
  outputBox.innerHTML = output;

  // console.log(wakeTime, naps, bedTime);
}




// when user clicks form button
makeBtn.addEventListener("click", () => generateSchedule(), false);