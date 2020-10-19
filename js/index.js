//--------------------------------------------------------------------------
// Globals!
//--------------------------------------------------------------------------

var version = 4;
var paused = false;
var balls = new Array();

// Preset scenarios
var presets = [
  {
    name: "Newton's Cradle",
    state: {"version":"4","elasticity":1,"friction":0,"viscosity":0,"gravity":0,"background":"include/images/wood015.jpg","paused":true,"balls":[{"radius":20,"mass":33510.32164,"pos_x":-49.30000000000001,"pos_y":0,"vel_x":0,"vel_y":0,"image":"include/images/baseball.png"},{"radius":20,"mass":33510.32164,"pos_x":-9.200000000000045,"pos_y":0,"vel_x":0,"vel_y":0,"image":"include/images/baseball.png"},{"radius":20,"mass":33510.32164,"pos_x":30.899999999999977,"pos_y":0,"vel_x":0,"vel_y":0,"image":"include/images/baseball.png"},{"radius":20,"mass":33510.32164,"pos_x":124.00000000000068,"pos_y":0,"vel_x":-400,"vel_y":0,"image":"include/images/baseball.png"},{"radius":20,"mass":33510.32164,"pos_x":-92.99999999999986,"pos_y":0,"vel_x":0,"vel_y":0,"image":"include/images/baseball.png"}]},
    description: "Watch the energy transfer right through the middle 3 balls. You may see some slight movement of the middle 3 balls because the continuous forces involved in physics must be simulated in steps on a computer. This one starts off paused, so don't forget to click 'Play'!"
  },
  {
    name: "Earth and Moon",
    state: {"version":"4","elasticity":1,"friction":0,"viscosity":0,"gravity":1.1578947368421044,"background":"include/images/back26.jpg","paused":true,"balls":[{"radius":20,"mass":16755.16082,"pos_x":100,"pos_y":0,"vel_x":0,"vel_y":100,"image":"include/images/moon.png"},{"radius":37,"mass":848699.16097,"pos_x":0,"pos_y":0,"vel_x":0,"vel_y":-1,"image":"include/images/earth.png"}]},
    description: "I successfuly got the moon into a stable orbit around the earth! Notice how the orbiting moon causes the earth to 'wobble'. This one starts off paused, so don't forget to click 'Play'!"
  },
  {
    name: "Anti-Matter",
    state: {"version":"4","elasticity":1,"friction":0,"viscosity":0.42105263157894735,"gravity":10,"background":"include/images/tile27.jpg","paused":false,"balls":[{"radius":11,"mass":5985.068515926094,"pos_x":95.55856358366464,"pos_y":-229.1614897823453,"vel_x":254.34594767141044,"vel_y":-129.66293899381137,"image":"include/images/eyeball.png"},{"radius":11,"mass":5985.068515926094,"pos_x":1.8722111582613365,"pos_y":-157.5637050367837,"vel_x":173.77649409528135,"vel_y":193.11891421910477,"image":"include/images/eyeball.png"},{"radius":11,"mass":5985.068515926094,"pos_x":-10.75306257707416,"pos_y":18.316140242828112,"vel_x":-98.39469280691664,"vel_y":146.8856087683325,"image":"include/images/eyeball.png"},{"radius":11,"mass":-6326.992028125749,"pos_x":-121.37746559488448,"pos_y":-189.01959513765956,"vel_x":78.22974521353702,"vel_y":-55.67750608386298,"image":"include/images/pizza.png"},{"radius":11,"mass":-6326.992028125749,"pos_x":-133.05178583467068,"pos_y":198.6457555949944,"vel_x":193.88368497914985,"vel_y":-116.85660978795664,"image":"include/images/pizza.png"},{"radius":11,"mass":-6326.992028125749,"pos_x":-246.49217999908905,"pos_y":-179.65883963826286,"vel_x":12.761765116880357,"vel_y":126.28561996570474,"image":"include/images/pizza.png"},{"radius":46,"mass":396626.2761841081,"pos_x":235.37715636643236,"pos_y":115.81993909807832,"vel_x":-3.22454956263103,"vel_y":295.1563344220365,"image":"include/images/cookie.png"},{"radius":50,"mass":-523598.7755982988,"pos_x":-176.27398669325856,"pos_y":24.55907255273297,"vel_x":164.7104756080418,"vel_y":-85.58571038910496,"image":"include/images/beachBall.png"}]},
    description: "Observe what happens when gravity acts between objects with positive and negative mass :)"
  }
];

//--------------------------------------------------------------------------
// ImageSelector Object
//--------------------------------------------------------------------------

function ImageSelector(images, selectedIndex) {
  if (!selectedIndex) {
    selectedIndex = 0;
  }

  this._selectedIndex = selectedIndex;
  this._images = new Array();
  this._imageSrcs = Array.copy(images);

  var imageSelector = document.createElement("div");
  imageSelector.className = "imageSelector";

  this._window = new Window({title: "Select an Image", content: imageSelector},
                            [{label: "Ok", isDefault: true, modalResult: Window.IDOK},
                             {label: "Cancel", isCancel: true, modalResult: Window.IDCANCEL}]);

  var imageContainer = imageSelector.appendChild(document.createElement("div"));

  for (var i = 0; i < images.length; ++i) {
    var img = imageContainer.appendChild(document.createElement("img"));
    img.src = images[i];

    if (i == selectedIndex) {
      img.className = "selected";
    }

    img.onclick = callback(this, this.setSelectedIndex, i);
    img.ondblclick = callback(this._window, this._window.hideModal, Window.IDOK);

    this._images.push(img);
  }
}

  ImageSelector.prototype.getSelectedIndex = function() {
    return this._selectedIndex;
  };

  ImageSelector.prototype.setSelectedIndex = function(index) {
    if (index < 0 || index >= this._images.length) {
      return;
    }

    this._images[this._selectedIndex].className = "";
    this._selectedIndex = index;
    this._images[this._selectedIndex].className = "selected";
  };

  ImageSelector.prototype.getSelectedSrc = function() {
    return this._imageSrcs[this._selectedIndex];
  };

  ImageSelector.prototype.setSelectedSrc = function(imageSrc) {
    this.setSelectedIndex(this._imageSrcs.find(imageSrc));
  };

  ImageSelector.prototype.showModal = function(selectionHandler) {
    if (selectionHandler) {
      if (selectionHandler.constructor === Function) {
        this._selectionHandler = selectionHandler;
      } else {
        this._selectionHandler = new Function("selectedIndex", selectionHandler.toString());
      }
    } else {
      this._selectionHandler = null;
    }

    this._window.showModal(callback(this, this._windowClosed, new Number(this._selectedIndex)));
  };

  ImageSelector.prototype._windowClosed = function(lastSelectedIndex, modalResult) {
    if (modalResult == Window.IDCANCEL) {
      this.setSelectedIndex(lastSelectedIndex);
    }

    if (this._selectionHandler) {
      this._selectionHandler(modalResult, this._selectedIndex);
    }
  };

//--------------------------------------------------------------------------
// Radio button utilities
//--------------------------------------------------------------------------

function setRadioValue(radio, value) {
  for (var i = 0; i < radio.length; ++i) {
    if (radio[i].value == value) {
      radio[i].click();
    } else {
      radio[i].checked = false;
    }
  }
}

function getRadioValue(radio) {
  for (var i = 0; i < radio.length; ++i) {
    // checking width to defeat Opera bug that causes all invisible checkboxes
    // to report that they are checked
    if (radio[i].checked && Metrics.getWidth(radio[i])) {
      return radio[i].value;
    }
  }

  return "";
}

//--------------------------------------------------------------------------
// Page Load
//--------------------------------------------------------------------------

function load() {
  $("progressMeter").style.display = "none";

  using("BallSim.Ball");

  // create and display loading message
  self.loadingMessage = new Window({content: "Loading...", hasTitleBar: false});
  self.loadingMessage.showModal();

  // load cookie
  self.userInfo = new Cookie("jbs_info", {expires: "never"});
  self.newUser = !self.userInfo.load();

  var defaultPrefs = {
    version: self.version,
  };

  // set default preferences
  self.userInfo.setDefaults(defaultPrefs);

  var content;

  // create "save settings" window
  content = $("loadSettingsContent");
  self.loadSettingsWindow = new Window({title: "Load Settings", content: content},
                                       [{label: "Load", isDefault: true, modalResult: Window.IDOK},
                                        {label: "Cancel", isCancel: true, modalResult: Window.IDCANCEL}]);
  content.style.display = "";

  // create "save settings" window
  content = $("saveSettingsContent");
  self.saveSettingsWindow = new Window({title: "Save Settings", content: content},
                                       [{label: "Save", isDefault: true, modalResult: Window.IDOK},
                                        {label: "Cancel", isCancel: true, modalResult: Window.IDCANCEL}]);
  content.style.display = "";

  // create "add ball" window
  content = $("addBallContent");
  self.addBallWindow = new Window({title: "Add Sven Photo", content: content},
                                  [{label: "Add", isDefault: true, modalResult: Window.IDOK},
                                   {label: "Cancel", isCancel: true, modalResult: Window.IDCANCEL}]);
  content.style.display = "";

  // create "edit ball" window
  content = $("editBallContent");
  self.editBallWindow = new Window({title: "Edit Existing Ball", content: content},
                                   [{label: "Apply", isDefault: true, modalResult: Window.IDOK},
                                    {label: "Remove", modalResult: Window.IDABORT},
                                    {label: "Cancel", isCancel: true, modalResult: Window.IDCANCEL}]);
  content.style.display = "";

  self.ballSelector = new ImageSelector(self.instaImages);
  $("ballImage").src = self.instaImages[self.ballSelector.getSelectedIndex()];

  self.backgroundSelector = new ImageSelector(self.backgroundImages);

  var slider;


  // create "friction" slider
  slider = new SlideControl($("frictionSlider"), {minValue: 0, maxValue: 2000});
  slider.onchange = callback(null, ballSimPropertySlider_onchange,
                             callback(BallSim, BallSim.setFriction),
                             document.physicsInput.friction);
  self.frictionSlider = slider;

  // create "viscosity" slider
  slider = new SlideControl($("viscositySlider"), {minValue: 0, maxValue: 10});
  slider.onchange = callback(null, ballSimPropertySlider_onchange,
                             callback(BallSim, BallSim.setViscosity),
                             document.physicsInput.viscosity);
  self.viscositySlider = slider;

  // create "gravity" slider
  slider = new SlideControl($("gravitySlider"), {minValue: -10, maxValue: 10});
  slider.onchange = callback(null, ballSimPropertySlider_onchange,
                             callback(BallSim, BallSim.setGravity),
                             document.physicsInput.gravity);
  self.gravitySlider = slider;

  // create "ball size" slider
  slider = new SlideControl($("ballSizeSlider"), {minValue: 10, maxValue: 50});
  slider.onchange = ballSizeSlider_onchange;
  self.ballSizeSlider = slider;

  // create "ball density" slider
  slider = new SlideControl($("ballDensitySlider"), {minValue: 0.01, maxValue: 10});
  self.ballDensitySlider = slider;

  // all clickable text will get underlined on mouseover
  var clickables = getElementsBySelector(".clickableText");
  var clickableOver = new Function("this.style.textDecoration = 'underline'");
  var clickableOut = new Function("this.style.textDecoration = ''");

  for (var i = 0; i < clickables.length; ++i) {
    clickables[i].onmouseover = clickableOver;
    clickables[i].onmouseout = clickableOut;
  }

  // the toolbar is ready to display now
  $("ballContainer").style.display = "";
  $("toolbar").style.display = "";

  IFrameRequest.initializeAllForms();

  var presetSelect = document.loadSettingsInput.settingsPreset;

  for (var i = 0; i < self.presets.length; ++i) {
    presetSelect.options[presetSelect.options.length] = new Option(self.presets[i].name, i);
  }

  self.editBallTabs = new TabbedElement($("editBallTabs"));
  self.editBallTabs.addTab("Position", $("editBallPositionTab"));
  self.editBallTabs.addTab("Velocity", $("editBallVelocityTab"));
  self.editBallTabs.addTab("Size", $("editBallSizeTab"));
  self.editBallTabs.addTab("Image", $("editBallImageTab"));

  self.loadingMessage.hide();

  self.userInfo.setValue("version", self.version);

 // if (self.newUser || self.userInfo.getValue("reloadState") == "no") {
 //   initSimulation();
 // } else if(self.userInfo.getValue("reloadState") == "yes") {
  //  initSimulation(self.userInfo.getValue("previousState"));
 // } else {
 //   Window.messageBox("Would you like to load the physics configurations and balls from your last visit?",
 //                     "Reload", Window.MB_YESNO, "initSimulation(modalResult == Window.IDYES ? // self.userInfo.getValue('previousState') : null)");
  //}
  initSimulation(null);
  
}

function initSimulation(stateString) {
  self.loadingMessage.showModal();

  if (stateString) {
    loadBallSimState(stateString, true);
  } else {
    setSlider(self.frictionSlider, BallSim.getFriction());
    setSlider(self.viscositySlider, BallSim.getViscosity());
    setSlider(self.gravitySlider, BallSim.getGravity());

    var viewportDims = Metrics.getDims($("ballContainer"));
    var ballCount = 13;

    for (var i = 0; i < ballCount; ++i) {
      var radius = 50;
      var mass = (4.0 * Math.PI / 3.0) * radius * radius * radius;
      var ball = new Ball(radius, mass, self.instaImages[i]);
      var angle = Math.random() * 2 * Math.PI;
      var speed = Math.random() * 200 + 100;
      ball.pos = new Vector(viewportDims.x * i / ballCount, viewportDims.y * i / ballCount);
      ball.vel = new Vector(speed * Math.cos(angle), speed * Math.sin(angle));

      addBall(ball);
    }
  }

  // leave the "loading" window up for a another second just because it looks
  // silly when the page loads quickly and the "loading" window disappears
  // before the user can even process what that flicker on the screen was
  setTimeout(finishedLoading, 1000);
}

function finishedLoading() {
  self.resetSettingsState = createBallSimStateString(true);
  BallSim.start("return Metrics.getRect($('ballContainer'))");

  self.loadingMessage.hide();

}


//--------------------------------------------------------------------------
// Page unload
//--------------------------------------------------------------------------

function unload() {
  BallSim.stop();

  self.userInfo.setValue("previousState", createBallSimStateString(true));
  self.userInfo.save();
}

//--------------------------------------------------------------------------
// Slider control handlers
//--------------------------------------------------------------------------

function ballSimPropertySlider_onchange(ballSimPropertySetter, radioNode) {
  ballSimPropertySetter(this.getValue());

  var radioValue = "";

  switch (this.getValue()) {
    case 0:
      radioValue = "Off";
      break;
    case this.getMinValue():
      radioValue = "Min";
      break;
    case this.getMaxValue():
      radioValue = "Max";
      break;
  }

  setRadioValue(radioNode, radioValue);
}

function ballSizeSlider_onchange() {
  var size = self.ballSizeSlider.getValue() * 2;

  $("ballImage").style.width = size + "px";
  $("ballImage").style.height = size + "px";
}

function setSlider(slider, value) {
  slider.setValue(value);

  if (slider.onchange) {
    slider.onchange();
  }
}

//--------------------------------------------------------------------------
// Add/remove ball functions
//--------------------------------------------------------------------------

function addBall(ball) {
  if (!ball) {
    var viewportDims = Metrics.getDims($("ballContainer"));

    var radius = self.ballSizeSlider.getValue();
    var mass = (4.0 * Math.PI / 3.0) * radius * radius * radius * self.ballDensitySlider.getValue();

    if (document.addBallInput.negativeMass.checked) {
      mass = -mass;
    }

    var ball = new Ball(radius, mass, self.instaImages[self.ballSelector.getSelectedIndex()]);
    var angle = Math.random() * 2 * Math.PI;
    var speed = Math.random() * 200 + 100;
    ball.pos = new Vector(viewportDims.x / 2, viewportDims.y / 2);
    ball.vel = new Vector(speed * Math.cos(angle), speed * Math.sin(angle));
  }

  ball.ondblclick = callback(self, self.editBall, ball);

  BallSim.addBall(ball);
  self.balls.push(ball);
}

function removeBall(ball) {
  if (ball) {
    self.balls.remove(ball);
    BallSim.removeBall(ball);
    ball.destroy();
  } else if (self.balls.length) {
    var ball = self.balls.pop();
    BallSim.removeBall(ball);
    ball.destroy();
  }
}

//--------------------------------------------------------------------------
// Help!
//--------------------------------------------------------------------------

var helpText = {
  "Elasticity": "Elasticity determines how 'bouncy' the balls are. " +
                "When elasticity is turned off, the balls will pass through " +
                "each other.",

  "Rolling Friction": "Rolling friction slows the balls down as if they " +
                      "were rolling on a surface.",

  "Viscosity": "Viscosity slows the balls down as if they were moving " +
               "through a fluid.",

  "Gravity": "This adjusts the amount of gravitational force between the " +
             "balls. The center of the slider is zero (off). Negative " +
             "values for gravity are not possible in the real world, but " +
             "it causes objects to push away from each other when simulated.",

  "Size": "This determines the radius of the ball that will be added to " +
          "the simulation next time you click 'Add'. The size of a ball " +
          "affects its reaction to viscosity.",

  "Ball Count": "This allows you to add multiple balls with the same properties " +
                "at the same time.",

  "Lock ball density": "When checked, the Size and Mass sliders will " +
                       "move together to maintain the current ratio " +
                       "of mass to volume (density).",

  "Mass": "This determines the mass of the ball that will be added to " +
          "the simulation next time you click 'Add'. Mass affects the " +
          "outcome of collisions between balls as well as the ball's " +
          "reaction to viscosity and gravity.",

  "Density": "This, combined with size, determines the mass of the ball that will be added to " +
             "the simulation next time you click 'Add'. Mass affects the " +
             "outcome of collisions between balls as well as the ball's " +
             "reaction to viscosity and gravity.",

  "Negative Mass": "When this is checked, clicking the 'Add' button will " +
                   "create a ball with negative mass. Like negative " +
                   "gravity, it doesn't make any sense, but it sure is fun! " +
                   "When balls with negative and positive mass are mixed, " +
                   "gravity does some strange things."
};

function showHelp(topic) {
  BallSim.stop();
  Window.messageBox(self.helpText[topic], topic, Window.MB_OK, "BallSim.start()");
}

//--------------------------------------------------------------------------
// State string creation/parsing
//--------------------------------------------------------------------------

function createBallSimStateString(includeBalls) {
  var simState = new Object();
  var bounds = Metrics.getRect($("ballContainer"));
  var posAdjust = Vector.add(bounds.pos, Vector.scale(bounds.dims, 0.5));

  simState.version = self.version.toString();

  simState.elasticity = BallSim.getElasticity();
  simState.friction = BallSim.getFriction();
  simState.viscosity = BallSim.getViscosity();
  simState.gravity = BallSim.getGravity();
  simState.background = self.backgroundSelector.getSelectedSrc();
  simState.paused = self.paused;

  simState.balls = new Array();

  if (includeBalls) {
    for (var i = 0; i < self.balls.length; ++i) {
      var ball = new Object();
      var pos = Vector.subtract(self.balls[i].pos, posAdjust);

      ball.radius = self.balls[i].getRadius();
      ball.mass = self.balls[i].getMass();
      ball.pos_x = pos.x;
      ball.pos_y = -pos.y;
      ball.vel_x = self.balls[i].vel.x;
      ball.vel_y = -self.balls[i].vel.y;
      ball.image = self.balls[i].getImageSrc();

      simState.balls.push(ball);
    }
  }

  return JSON.stringify(simState);
}

function loadBallSimState(stateString, includeBalls) {
  BallSim.stop();

  var simState = typeof stateString == "string" ? JSON.parse(stateString) : stateString;

  if (!simState) {
    alert("The saved data could not be loaded");
    BallSim.start();

    return false;
  }

  if (simState.version != self.userInfo.getValue("version")) {
    alert("The saved data is from an older version and is no longer compatible");
    BallSim.start();

    return false;
  }

  setSlider(self.frictionSlider, simState.friction);
  setSlider(self.viscositySlider, simState.viscosity);
  setSlider(self.gravitySlider, simState.gravity);

  if (simState.paused != self.paused) {
    pause();
  }

  self.backgroundSelector.setSelectedSrc(simState.background);
  $("ballContainer").style.backgroundImage = "url('" + self.backgroundSelector.getSelectedSrc() + "')";

  if (includeBalls) {
    var bounds = Metrics.getRect($("ballContainer"));
    var posAdjust = Vector.add(bounds.pos, Vector.scale(bounds.dims, 0.5));

    for (var i = 0; i < simState.balls.length; ++i) {
      var ball = new Ball(simState.balls[i].radius, simState.balls[i].mass, simState.balls[i].image);
      ball.pos = new Vector(simState.balls[i].pos_x, -simState.balls[i].pos_y);
      ball.pos.add(posAdjust);
      ball.vel = new Vector(simState.balls[i].vel_x, -simState.balls[i].vel_y);

      addBall(ball);
    }
  }

  BallSim.updateDisplay();
  BallSim.start();
  return true;
}

//--------------------------------------------------------------------------
// "Pause"
//--------------------------------------------------------------------------

function blinkPauseButton() {
  if ($("pauseButton").style.backgroundColor == "") {
    $("pauseButton").style.backgroundColor = "#f00";
  } else {
    $("pauseButton").style.backgroundColor = "";
  }
};

function pause() {
  if (self.paused) {
    clearInterval(self.blinkPauseButtonId);
    $("pauseButton").value = "Pause";
    $("pauseButton").style.backgroundColor = "";
    $("pauseButton").style.fontWeight = "";
    self.paused = false;
    BallSim.start();
  } else {
    $("pauseButton").value = "Play";
    $("pauseButton").style.fontWeight = "bold";
    self.blinkPauseButtonId = setInterval(blinkPauseButton, 500);
    self.paused = true;
    BallSim.stop();
  }
}

//--------------------------------------------------------------------------
// "Reset"
//--------------------------------------------------------------------------

function askResetSettings() {
  BallSim.stop();

  Window.messageBox("Are you sure you want to reset the the simulation to the most recent load/save point?",
                    "Reset Simulation", Window.MB_YESNO,
                    "BallSim.start(); if (modalResult == Window.IDYES) resetSettings()");
}

function resetSettings() {
  loadBallSimState(self.resetSettingsState, true);
}

//--------------------------------------------------------------------------
// "Save"
//--------------------------------------------------------------------------

function saveSettings() {
  var defaultSlot = null;

  for (var i = 0; i < 3; ++i) {
    if (self.userInfo.getValue("saveData" + (i + 1))) {
      var descNode = $("saveSlotDesc" + (i + 1));

      descNode.removeChild(descNode.firstChild);
      descNode.appendChild(document.createTextNode(self.userInfo.getValue("saveDesc" + (i + 1))));
    } else if (!defaultSlot) {
      defaultSlot = (i + 1).toString();
    }
  }

  BallSim.stop();
  self.saveSettingsWindow.showModal(saveSettingsHandler);
}

function saveSettingsHandler(modalResult) {
  BallSim.start();
}

//--------------------------------------------------------------------------
// "Load"
//--------------------------------------------------------------------------

function loadSettings() {
  var defaultSlot = null;

  for (var i = 0; i < 3; ++i) {
    if (self.userInfo.getValue("saveData" + (i + 1))) {
      var descNode = $("loadSlotDesc" + (i + 1));
      var optNode = $("loadSlotOpt" + (i + 1));

      descNode.removeChild(descNode.firstChild);
      descNode.appendChild(document.createTextNode(self.userInfo.getValue("saveDesc" + (i + 1))));
      optNode.style.display = "";

      if (!defaultSlot) {
        defaultSlot = (i + 1).toString();
      }
    }
  }

  BallSim.stop();
  self.loadSettingsWindow.showModal(loadSettingsHandler);
  setRadioValue(document.loadSettingsInput.slot, defaultSlot || "preset");
  document.loadSettingsInput.settingsPreset.selectedIndex = 0;
  document.loadSettingsInput.excludeBalls.checked = false;
}

function loadSettingsHandler(modalResult) {
  BallSim.start();
}

function settingsFileLoaded(request) {
  loadBallSimState(request.getResponseObject(), !document.loadSettingsInput.excludeBalls.checked);
  self.resetSettingsState = createBallSimStateString(true);
}

//--------------------------------------------------------------------------
// "preferences"
//--------------------------------------------------------------------------

function editPreferences() {
  BallSim.stop();
  self.preferencesWindow.showModal(editPreferencesHandler);
}

function editPreferencesHandler(modalResult) {
  if (modalResult == Window.IDOK) {
    self.userInfo.save();
  }

  BallSim.start();
}

//--------------------------------------------------------------------------
// "Add New Ball"
//--------------------------------------------------------------------------

function addNewBall() {
  BallSim.stop();
  self.addBallWindow.showModal(addNewBallHandler);

  setSlider(self.ballSizeSlider, 20);
  setSlider(self.ballDensitySlider, 1);
  document.addBallInput.count.value = "1";

  self.ballSelector.setSelectedIndex(0);
  $("ballImage").src = self.ballSelector.getSelectedSrc();
}

function addNewBallHandler(modalResult) {
  if (modalResult == Window.IDOK) {
    var count = parseInt(document.addBallInput.count.value);

    if (isNaN(count) || count < 1) {
      this.messageBox("Please enter a number greater than zero for 'Count'",
                      "Invalid Value", Window.MB_OK);

      return false;
    }

    for (var i = 0; i < count; ++i) {
      addBall();
    }
  }

  BallSim.updateDisplay();
  BallSim.start();
}

function changeBallImage() {
  self.ballSelector.showModal(changeBallImageHandler);
};

function changeBallImageHandler(modalResult) {
  $("ballImage").src = self.ballSelector.getSelectedSrc();
}

//--------------------------------------------------------------------------
// "Edit Existing Ball"
//--------------------------------------------------------------------------

function editBall(ball) {
}

function editBallHandler(ball, modalResult) {
  if (modalResult == Window.IDOK) {
    var posX = new Number(document.editBallInput.posX.value);
    var posY = new Number(document.editBallInput.posY.value);
    var velX = new Number(document.editBallInput.velX.value);
    var velY = new Number(document.editBallInput.velY.value);
    var radius = new Number(document.editBallInput.radius.value);
    var mass = new Number(document.editBallInput.mass.value);
    var imageSrc = self.ballSelector.getSelectedSrc();

    if (isNaN(posX)) {
      this.messageBox("Please enter a number for the position's 'X-Component'",
                      "Invalid Value", Window.MB_OK);

      return false;
    }

    if (isNaN(posY)) {
      this.messageBox("Please enter a number for the position's 'Y-Component'",
                      "Invalid Value", Window.MB_OK);

      return false;
    }

    if (isNaN(velX)) {
      this.messageBox("Please enter a number for the velocity's 'X-Component'",
                      "Invalid Value", Window.MB_OK);

      return false;
    }

    if (isNaN(velY)) {
      this.messageBox("Please enter a number for the velocity's 'Y-Component'",
                      "Invalid Value", Window.MB_OK);

      return false;
    }

    if (isNaN(radius) || radius < 1) {
      this.messageBox("Please enter a number greater than zero for 'Radius'",
                      "Invalid Value", Window.MB_OK);

      return false;
    }

    if (isNaN(mass) || mass == 0) {
      this.messageBox("Please enter a non-zero number for 'Mass'",
                      "Invalid Value", Window.MB_OK);

      return false;
    }

    var bounds = Metrics.getRect($("ballContainer"));
    var pos = new Vector(posX, -posY);
    pos.add(Vector.add(bounds.pos, Vector.scale(bounds.dims, 0.5)));

    var newBall = new Ball(radius, mass, imageSrc);
    newBall.pos = pos;
    newBall.vel = new Vector(velX, -velY);

    removeBall(ball);
    addBall(newBall);
  } else if (modalResult == Window.IDABORT) {
    removeBall(ball);
  }

  BallSim.updateDisplay();
  BallSim.start();
}

function changeEditBallImage() {
  self.ballSelector.showModal(changeEditBallImageHandler);
}

function changeEditBallImageHandler(modalResult) {
  $("editBallImage").src = self.ballSelector.getSelectedSrc();
}

function evaluateMathInput(input) {
  var result = null;
  var expression = input.value;

  if (!(new RegExp("[^1234567890()+*/.\\- ]", "g")).test(expression)) {
    result = eval(expression);
  }

  if (result != null) {
    input.value = result;
  }
}

function recalcVelocity() {
  var angle = new Number(document.editBallInput.angle.value) * Math.PI / 180.0;
  var speed = new Number(document.editBallInput.speed.value);

  var velX = Math.cos(angle) * speed;
  var velY = Math.sin(angle) * speed;

  document.editBallInput.velX.value = Math.roundDecimalPlaces(velX, 5);
  document.editBallInput.velY.value = Math.roundDecimalPlaces(velY, 5);
}

function recalcAngleSpeed() {
  var velX = new Number(document.editBallInput.velX.value);
  var velY = new Number(document.editBallInput.velY.value);

  var vec = new Vector(velX, velY);

  var speed = vec.length();
  vec.normalize();

  var angle = Math.acos(Vector.dotProduct(vec, new Vector(1, 0)));

  if (velY < 0) {
    angle = -angle;
  }

  document.editBallInput.angle.value = Math.roundDecimalPlaces(angle * 180.0 / Math.PI, 5);
  document.editBallInput.speed.value = Math.roundDecimalPlaces(speed, 5);
}

function recalcMass() {
  var radius = new Number(document.editBallInput.radius.value);
  var density = new Number(document.editBallInput.density.value);

  var mass = (4.0 * Math.PI / 3.0) * radius * radius * radius * density;

  document.editBallInput.mass.value = Math.roundDecimalPlaces(mass, 5);
}

function recalcDensity() {
  var radius = new Number(document.editBallInput.radius.value);
  var mass = new Number(document.editBallInput.mass.value);

  var density = mass / ((4.0 * Math.PI / 3.0) * radius * radius * radius);

  document.editBallInput.density.value = Math.roundDecimalPlaces(density, 5);
}

//--------------------------------------------------------------------------
// Background image selection
//--------------------------------------------------------------------------

function changeBackgroundImage() {
  BallSim.stop();
  self.backgroundSelector.showModal(changeBackgroundImageHandler);
};

function changeBackgroundImageHandler(modalResult) {
  $("ballContainer").style.backgroundImage = "url('" + self.backgroundSelector.getSelectedSrc() + "')";
  BallSim.start();
}
