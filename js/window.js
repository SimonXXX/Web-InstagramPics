//##############################################################################
// File: 
//    window.js
// Dependencies:
//    utils.js
//    metrics.js
//    event.js
//    dragManager.js
//    window.css
// Description:
//    Window widget
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

function Window(options, buttons) {
  var defaults = {
    parent: document.body,
    hasTitleBar: true, // boolean
    title: "", // String
    content: null, // [null, HTMLNode, String]
    allowHtmlTags: false,
    isResizable: false
  };
  
  options = Object.merge(options, defaults);
  
  var wrapperDiv = document.createElement("div");
  wrapperDiv.className = "windowWrapper";
  wrapperDiv.style.zIndex = "100";
  wrapperDiv.style.display = "none";
  
  var windowDiv = document.createElement("div");
  windowDiv.className = "window";
  
  if (options.isResizable) {
    wrapperDiv.onmousemove = Window._windowHandler_onmousemove;
    wrapperDiv.onmousedown = Window._windowHandler_onmousedown;
    wrapperDiv.onDrag = Window._windowHandler_onDrag;
    wrapperDiv.onDragEnd = Window._windowHandler_onDragEnd;
    wrapperDiv.onDragCancel = Window._windowHandler_onDragCancel;
  }

  if (options.hasTitleBar) {
    var titleBar = document.createElement("div");
    titleBar.className = "windowTitle";
    
    if (options.title.length == 0) {
      var span = document.createElement("span");
      span.innerHTML = "&nbsp;";
      titleBar.appendChild(span);
    } else {
      titleBar.appendChild(document.createTextNode(options.title));
    }
    
    titleBar.onmousedown = DragManager.mouseDownHandler(wrapperDiv);
    windowDiv.appendChild(titleBar);
  } 
  
  var messageBody = document.createElement("div"); 
  messageBody.className = "windowBody";
  windowDiv.appendChild(messageBody);

  if (options.content && options.content.constructor == String) {
    var content = document.createElement("div");
    content.className = "windowText";
    
    if (options.allowHtmlTags) {
      content.innerHTML = options.content;
    } else {
      content.appendChild(document.createTextNode(options.content));
    }

    messageBody.appendChild(content);
  } else if (options.content) {
    messageBody.appendChild(options.content);
  }
  
  if (buttons && buttons.length) {
    var buttonBar = document.createElement("div");
    buttonBar.className = "windowButtonBar";
    
    for (var i = 0; i < buttons.length; ++i) {
      var buttonOpts = {
        label: "", // String
        modalResult: null, // Object
        isDefault: false, // boolean
        isCancel: false // boolean
      };
      
      buttonOpts = Object.merge(buttons[i], buttonOpts);
      
      var newButton = document.createElement("input");
      newButton.type = "button";
      newButton.className = "windowButton";
      newButton.value = buttonOpts.label;
      newButton.onclick = Window._createButtonHandler_onclick(this, buttonOpts.modalResult);
      
      buttonBar.appendChild(newButton);
      
      if (buttonOpts.isDefault) {
        this._defaultButton = newButton;
      }
      
      if (buttonOpts.isCancel) {
        this._cancelButton = newButton;
      }
    }
  
    windowDiv.appendChild(buttonBar);
    
    windowDiv.onkeydown = Window._createWindowHandler_onkeydown(this);
    windowDiv.onkeyup = Window._createWindowHandler_onkeyup(this);
  }
  
  wrapperDiv.appendChild(windowDiv);

  this._windowDiv = wrapperDiv;
  this._parent = options.parent;
  this._parent.appendChild(this._windowDiv);
};

  Window._modalWindowStack = new Array();

  Window._windowHandler_onmousemove = function(event) {
    event = event || self.event;
    
    var dims = Metrics.getDims(this);
    var pos = Event.getMousePos(event).subtract(Metrics.getPos(this));
    var borderSize = 4;
    
    if (pos.x <= borderSize) {
      if (pos.y <= 16) {
        this.style.cursor = "nw-resize";
      } else if (dims.y - pos.y < 16) {
        this.style.cursor = "sw-resize";
      } else {
        this.style.cursor = "w-resize";
      }
    } else if (pos.y <= borderSize) {
      if (pos.x <= 16) {
        this.style.cursor = "nw-resize";
      } else if (dims.x - pos.x < 16) {
        this.style.cursor = "ne-resize";
      } else {
        this.style.cursor = "n-resize";
      }
    } else if (dims.x - pos.x < borderSize) {
      if (pos.y <= 16) {
        this.style.cursor = "ne-resize";
      } else if (dims.y - pos.y < 16) {
        this.style.cursor = "se-resize";
      } else {
        this.style.cursor = "e-resize";
      }
    } else if (dims.y - pos.y < borderSize) {
      if (pos.x <= 16) {
        this.style.cursor = "sw-resize";
      } else if (dims.x - pos.x < 16) {
        this.style.cursor = "se-resize";
      } else {
        this.style.cursor = "s-resize";
      }
    } else {
      this.style.cursor = "";
    }
  };
  
  Window._windowHandler_onmousedown = function(event) {
    if (this.style.cursor == "") {
      return;
    }
    
    Window._resizeRectStart = Metrics.getRect(this.firstChild);
    Window._resizeDir = (new String(this.style.cursor)).split("-")[0];
    Window._resizing = true;
    
    DragManager.startDrag(event, this);
  };
  
  Window._windowHandler_onDrag = function(pos) {
    if (!Window._resizing) {
      return true;
    }
    
    var mouseMove = Vector.subtract(pos, Window._resizeRectStart.pos);
    var newRect = Window._resizeRectStart.clone();
    
    if (Window._resizeDir.indexOf("n") != -1) {
      mouseMove.y = Math.min(mouseMove.y, newRect.dims.y - 20);
      newRect.pos.y += mouseMove.y;
      newRect.dims.y -= mouseMove.y;
    }
    
    if (Window._resizeDir.indexOf("e") != -1) {
      newRect.dims.x = Math.max(newRect.dims.x + mouseMove.x, 20);
    }
    
    if (Window._resizeDir.indexOf("s") != -1) {
      newRect.dims.y = Math.max(newRect.dims.y + mouseMove.y, 20);
    }
    
    if (Window._resizeDir.indexOf("w") != -1) {
      mouseMove.x = Math.min(mouseMove.x, newRect.dims.x - 20);
      newRect.pos.x += mouseMove.x;
      newRect.dims.x -= mouseMove.x;
    }
    
    Metrics.setDims(this.firstChild, newRect.dims);
    Metrics.setPos(this, newRect.pos);
    
    return false;
  };

  Window._windowHandler_onDragEnd = function() {
    Window._resizing = false;
    return true;
  }
  
  Window._windowHandler_onDragCancel = function() {
    if (Window._resizing) {
      Metrics.setDims(this.firstChild, Window._resizeRectStart.dims);
      Metrics.setPos(this, Window._resizeRectStart.pos);
      Window._resizing = false;
      return false;
    } else {
      return true;
    }
  }
  
  Window._createButtonHandler_onclick = function(win, modalResult) {
    return function() {
      win.hideModal(modalResult);
    };
  };

  Window._createWindowHandler_onkeydown = function(win) {
    return function(event) {
      event = event || self.event;
      
      switch (Event.getKeyCode(event)) {
        case 27:
          if (win._cancelButton) {
            win._cancelButton.focus();
            Event.stopPropagation(event);
            return false;
          }
          break;
        
        case 13:
        case 3:
          if (win._defaultButton) {
            win._defaultButton.focus();
            Event.stopPropagation(event);
            return false;
          }
          break;
      }
    };
  };
  
  Window._createWindowHandler_onkeyup = function(win) {
    return function(event) {
      event = event || self.event;
      
      switch (Event.getKeyCode(event)) {
        case 27:
          if (win._cancelButton) {
            setTimeout(callback(win._cancelButton, win._cancelButton.click), 1);
            Event.stopPropagation(event);
            return false;
          }
          break;
        
        case 13:
        case 3:
          if (win._defaultButton) {
            setTimeout(callback(win._defaultButton, win._defaultButton.click), 1);
            Event.stopPropagation(event);
            return false;
          }
          break;
      }
    };
  };
  
  Window.prototype.getNode = function() {
    return this._windowDiv;
  };
  
  Window.prototype.show = function() {
    this._parent.appendChild(this._windowDiv);
    this._windowDiv.style.display = "";
    
    if (this._parent === document.body) {
      var pos = Metrics.getViewportDims().scale(0.5).subtract(Metrics.getDims(this._windowDiv).scale(0.5)).add(Metrics.getViewportPos());
    } else {
      var pos = Metrics.getDims(this._parent).scale(0.5).subtract(Metrics.getDims(this._windowDiv).scale(0.5)).add(Metrics.getPos(this._parent));
    }
    
    Metrics.setPos(this._windowDiv, pos);
    
    if (this._defaultButton) {
      this._defaultButton.focus();
    }
  };
  
  Window.prototype.showModal = function(modalHandler) {
    this._modal = true;

    var nodeToBlock = this._parent;
    
    if (Window._modalWindowStack.length) {
      nodeToBlock = Window._modalWindowStack.last().getNode();
    }
    
    Window._modalWindowStack.push(this);
    
    this._windowDiv.style.zIndex = blockInput(nodeToBlock, {zIndex: 99}) + 1;
    
    if (modalHandler) {
      if (modalHandler.constructor === Function) {
        this._modalHandler = modalHandler;
      } else {
        this._modalHandler = new Function("modalResult", modalHandler.toString());
      }
    }
    
    this.show();
  };

  Window.prototype.hide = function() {
    this._windowDiv.style.display = "none";
    
    if (this._modal) {
      Window._modalWindowStack.pop();
      
      var nodeToBlock = this._parent;
      
      if (Window._modalWindowStack.length) {
        nodeToBlock = Window._modalWindowStack.last().getNode();
      }
      
      unblockInput(nodeToBlock);
    }
    
    this._modal = false;
  };
  
  Window.prototype.hideModal = function(modalResult) {
      if (this._modal && this._modalHandler) {
        var result = this._modalHandler(modalResult);
        
        if (result === undefined || result != false) {
          this.hide();
        }
      } else {
        this.hide();
      }
  };

  Window.prototype.messageBox = function(text, caption, type, modalHandler) {
    Window.messageBox(text, caption, type, modalHandler, this.getNode());
  };
  
  Window.IDOK     = 0;
  Window.IDYES    = 1;
  Window.IDNO     = 2;
  Window.IDABORT  = 3;
  Window.IDRETRY  = 4;
  Window.IDIGNORE = 5;
  Window.IDCANCEL = 6;

  Window.MB_DEFBUTTON1 = 0x0100;
  Window.MB_DEFBUTTON2 = 0x0200;
  Window.MB_DEFBUTTON3 = 0x0300;
  Window.MB_DEFBUTTON4 = 0x0400;
  
  Window.MB_ALLOW_HTML = 0x1000;
  
  Window.MB_ABORTRETRYIGNORE = (1 << Window.IDABORT) | (1 << Window.IDRETRY) | (1 << Window.IDIGNORE) | Window.MB_DEFBUTTON1;
  Window.MB_OK               = (1 << Window.IDOK) | Window.MB_DEFBUTTON1;
  Window.MB_OKCANCEL         = (1 << Window.IDOK) | (1 << Window.IDCANCEL) | Window.MB_DEFBUTTON1;
  Window.MB_RETRYCANCEL      = (1 << Window.IDRETRY) | (1 << Window.IDCANCEL) | Window.MB_DEFBUTTON1;
  Window.MB_YESNO            = (1 << Window.IDYES) | (1 << Window.IDNO) | Window.MB_DEFBUTTON1;
  Window.MB_YESNOCANCEL      = (1 << Window.IDYES) | (1 << Window.IDNO) | (1 << Window.IDCANCEL) | Window.MB_DEFBUTTON1;
  
  Window._BTN_OPTIONS = [
    {label: "Ok", modalResult: Window.IDOK},
    {label: "Yes", modalResult: Window.IDYES},
    {label: "No", modalResult: Window.IDNO},
    {label: "Abort", modalResult: Window.IDABORT},
    {label: "Retry", modalResult: Window.IDRETRY},
    {label: "Ignore", modalResult: Window.IDIGNORE},
    {label: "Cancel", modalResult: Window.IDCANCEL, isCancel: true}
  ];
  
  Window.messageBox = function(text, caption, type, modalHandler, parent) {
    parent = parent || document.body;
    type = type || Window.MB_OK;
    
    var buttons = new Array();
    
    for (var i = Window.IDOK; i <= Window.IDCANCEL; ++i) {
      if (type & (1 << i)) {
        var button = Object.copy(Window._BTN_OPTIONS[i]);
        
        if (type & (Window.MB_DEFBUTTON1 << buttons.length)) {
          button.isDefault = true;
        }
        
        buttons.push(button);
      }
    }
    
    (new Window({
                 title: caption, 
                 content: text, 
                 allowHtmlTags: (type & Window.MB_ALLOW_HTML), 
                 parent: parent
                }, buttons)).showModal(modalHandler);
  };


