//##############################################################################
// File: 
//    event.js
// Dependencies:
//    metrics.js
// Description:
//    Extends the Event object with methods for retrieving information with
//    cross-browser compatibility.
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

if (!self.Event) {
  self.Event = function() {
  };
}

Event.getTarget = function(event) {
  return event.srcElement || event.target;
};

Event.stopPropagation = function(event) {
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }
};

Event.getKeyCode = function(event) {
  return event.keyCode || event.which;
};

Event.getKeyChar = function(event) {
  return String.fromCharCode(Event.getKeyCode(event));
};

Event.getMousePos = function(event) {
  return (new Metrics.Vector(event.clientX, event.clientY)).add(Metrics.getViewportPos());
};



