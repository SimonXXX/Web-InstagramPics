//##############################################################################
// File: 
//    utils.js
// Dependencies:
//    [none]
// Description:
//    General javascript utilities
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

// log message to FireBug (FireFox extension) console
// Tab names include "xml", "css", "box", "capture", or "js"
function printfire(messageOrObject, tabname) {
  if (document.createEvent) {
    printfire.args = arguments;
    var ev = document.createEvent("Events");
    ev.initEvent("printfire", false, true);
    dispatchEvent(ev);
  }
}

//##############################################################################

function using(qualifiedName, alias) {
  var components = qualifiedName.split(".");
  var context = window;
  
  for (var i = 0; i < components.length; ++i) {
    context = context[components[i]];
    
    if (!context) {
      throw "error in using(\"" + qualifiedName + "\"" +
            (alias ? ", \"" + alias + "\"" : "") + ") - " + 
            components.slice(0, i + 1).join(".") + 
            " is undefined.";
    }
  }
  
  var id = alias || components[i - 1];
  
  if (window[id] !== undefined && window[id] !== context) {
    throw "error in using(\"" + qualifiedName + "\"" +
          (alias ? ", \"" + alias + "\"" : "") + ") - " + 
          id + " is already defined.";
  }
  
  window[id] = context;
}

//##############################################################################

function $(id) {
  return (id.constructor == String) ? document.getElementById(id) : id;
}

//##############################################################################

function callback(context, method /*, arg1, arg2, ..., argN*/) {
  var creationArgs = new Array();

  for(var i = 2; i < arguments.length; ++i) {
    creationArgs.push(arguments[i]);
  }

  return function(/*arg(N+1), arg(N+2), ..., arg(N+M)*/) {
    var callArgs = Array.copy(creationArgs);

    for(var i = 0; i < arguments.length; ++i) {
      callArgs.push(arguments[i]);
    }

    return Function.prototype.apply.call(method, context || this, callArgs);
  };
}

//##############################################################################

function Class(ctorFunction) {
  var result = function() {
    if (result.creatingInheritence) {
      return;
    }

    ctorFunction.apply(this, arguments);
  };

  result.inherit = Class._inherit;

  return result;
}

Class._inherit = function(baseCtorFunction) {
  if (this.baseType) {
    throw "Attempted multiple inheritance!";
  }

  baseCtorFunction.creatingInheritence = true;
  this.prototype = new baseCtorFunction();
  delete baseCtorFunction.creatingInheritence;

  this.prototype.constructor = this;

  this.baseType = baseCtorFunction;
  this.baseProto = baseCtorFunction.prototype;
};

//##############################################################################

Object.copy = function(obj) {
  var result = new Object();

  if (obj) {
    for (var i in obj) {
      result[i] = obj[i];
    }
  }
  
  return result;
};

Object.merge = function(obj1, obj2) {
  var result = Object.copy(obj1);
  
  if (obj2) {
    for (var i in obj2) {
      if (!obj1 || obj1[i] === undefined) {
        result[i] = obj2[i];
      }
    }
  }
  
  return result;
};

Object.instanceOf = function(obj, type) {
  if (obj === null || obj === undefined) {
    return false;
  }

  if (typeof obj == "object") {
    return (obj instanceof type);
  }

  return obj.constructor == type;
};

//##############################################################################

if (!Array.prototype.shift) {
  Array.prototype.shift = function() {
    if (this.length) {
      return this.splice(0, 1)[0];
    }
    
    return null;
  };
}

if (!Array.prototype.unshift) {
  Array.prototype.unshift = function(value) {
    this.splice(0, 0, value);
  };
}

Array.copy = function(array) {
  return array.concat([]);
};

Array.prototype.first = function() {
  return this[0];
};

Array.prototype.last = function() {
  return this[this.length - 1];
};

Array.prototype.find = function(value, index) {
  if (index === undefined) {
    index = 0;
  }

  for (var length = this.length; index < length; ++index) {
    if (this[index] == value) {
      return index;
    }
  }

  return -1;
};

Array.prototype.rfind = function(value, index) {
  if (index === undefined) {
    index = this.length - 1;
  }

  for (; index >= 0; --index) {
    if (this[index] == value) {
      return index;
    }
  }

  return -1;
};

Array.prototype.remove = function(value) {
  for (var i = this.find(value); i != -1; i = this.find(value, i)) {
    this.splice(i, 1);
  }
};

//##############################################################################

String.prototype.trim = function() {
	return this.replace(/^\s*(.*)/, "$1").replace(/(.*)\s*$/, "$1");
};

String._charToHtmlEntity = {
  "&": "&amp;",
  "\"": "&quot;",
  "<": "&lt;",
  ">": "&gt;"
};

String._htmlEntityToChar = {
  "&quot;": "\"",
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&"
};

String.prototype.escapeHtml = function() {
  var result = this;

  for (var i in String._charToHtmlEntity) {
    result = result.replace(new RegExp(i, "g"), String._charToHtmlEntity[i]);
  }

  return result;
};

String.prototype.unescapeHtml = function() {
  var result = this;

  for (var i in String._htmlEntityToChar) {
    result = result.replace(new RegExp(i, "g"), String._htmlEntityToChar[i]);
  }

  return result;
};

//##############################################################################

Math.randomInt = function(num) {
  return Math.floor(Math.random() * 0.9999 * num);
};

Math.roundDecimalPlaces = function(num, places) {
  var multiplier = Math.pow(10, places);
  return Math.round(num * multiplier) / multiplier;
};

//##############################################################################

function blockInput(node, options) {
  var defaults = {
    color: "#000",
    opacity: 0.33,
    zIndex: 100
  };
  
  options = Object.merge(options, defaults);
  
  node = node || document.body;

  if (!isNaN(Number(node.style.zIndex))) {
    options.zIndex += Number(node.style.zIndex);
  }

  if (!node._blockDiv) {
    node._blockCount = 0;
    node._blockDiv = document.createElement("div");
    
    node._blockDiv.style.position = "absolute";
    node._blockDiv.style.left = "0px";
    node._blockDiv.style.top = "0px";
    node._blockDiv.style.width = "100%";
    node._blockDiv.style.height = "100%";
    node._blockDiv.style.display = "none";
    node.appendChild(node._blockDiv);
  }
  
  if (node._blockCount++ == 0) {
    node._blockDiv.style.backgroundColor = options.color;
    node._blockDiv.style.zIndex = options.zIndex;
    node._blockDiv.style.opacity = options.opacity;
    node._blockDiv.style.MozOpacity = options.opacity;
    node._blockDiv.style.filter = "alpha(opacity=" + Math.round(options.opacity * 100) + ")";
    node._blockDiv.style.display = "block";
    node._blockDiv.style.cursor = "wait";
    
    node._oldHandler_onfocus = node.onfocus;
    node._oldHandler_onkeydown = node.keydown;
    node._oldHandler_onkeyup = node.keyup;
    node._oldHandler_onkeypress = node.keypress;

    var blockInputHandler = _createBlockInputHandler(options.zIndex);
    
    node.onfocus = blockInputHandler;
    node.keydown = blockInputHandler;
    node.keyup = blockInputHandler;
    node.keypress = blockInputHandler;
  }
  
  return options.zIndex;
}

function unblockInput(node) {
  node = node || document.body;
  
  if (node._blockCount !== undefined && --node._blockCount == 0) {
    node._blockDiv.style.display = "none";

    node.onfocus = node._oldHandler_onfocus;
    node.keydown = node._oldHandler_onkeydown;
    node.keyup = node._oldHandler_onkeyup;
    node.keypress = node._oldHandler_onkeypress;
  }
}

function _createBlockInputHandler(zIndexBlock) {
  return function(event) {
    event = event || window.event;
    var target = event.srcElement || event.target;
    
    var zIndex = 0;
    
    for (node = target; node && node != document.body; node = node.parentNode) {
      if (document.defaultView) {
        var value = document.defaultView.getComputedStyle(node, "").getPropertyValue("z-index");
      } else if (node.currentStyle) {
        var value = node.currentStyle.getAttribute("z-index");
      }
      
      if (!isNaN(Number(value))) {
        zIndex = Number(value);
        break;
      }
    }
    
    if (zIndex <= zIndexBlock) {
      if (target && target.blur) {
        target.blur();
      }
      
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      
      event.cancelBubble = true;
      event.returnValue = false;
      return false;
    }
  };
}

//##############################################################################


