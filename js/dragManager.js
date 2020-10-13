//##############################################################################
// File: 
//    dragManager.js
// Dependencies:
//    utils.js
//    metrics.js
//    event.js
// Description:
//    Manages movement of objects by dragging with the mouse
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

function DragManager() {
};
  
  DragManager._zIndex = 0;
  
  DragManager.mouseDownHandler = function(obj, dragBounds) {
    return function(event) {
      var bounds = dragBounds || Metrics.getViewportRect;
      
      if (bounds.constructor == Function) {
        bounds = bounds();
      } else {
        bounds = bounds.clone();
      }
      
      bounds.dims.subtract(Metrics.getDims(obj)).add(new Vector(1, 1));
      
      if (bounds.dims.x < 1) {
        bounds.dims.x = 1;
      }
      
      if (bounds.dims.y < 1) {
        bounds.dims.y = 1;
      }
      
      DragManager.startDrag(event, obj, bounds); 
    };
  };
  
  DragManager.startDrag = function(event, obj, bounds) {
    event = event || self.event;
  
    // ignore the right button
    if (event.button == 2) {
      return;
    }
  
    if (DragManager._obj) {
      DragManager._cancelDrag();
    }
    
    Event.stopPropagation(event);                           
  
    DragManager._obj = obj;
    DragManager._bounds = bounds;
    
    DragManager._cursorStart = Event.getMousePos(event)
  
    // save starting position of object
    DragManager._objStart = Metrics.getPos(obj);
  
    // give the object a chance to decide if it can be dragged
    if (obj.onDragStart && !obj.onDragStart(Vector.subtract(DragManager._cursorStart, Metrics.getPos(obj)))) {
      DragManager._obj = null;
      return false;
    }
    
    // update the z-index (so the most recently dragged object is in front of all 
    // other draggable objects)
    DragManager._zIndex = Math.max(DragManager._zIndex, obj.style.zIndex) + 1;
    obj.style.zIndex = DragManager._zIndex;
  
    DragManager._setupDocumentEvents();
    
    return false;
  };
  
  DragManager._doDrag = function(event) {
    event = event || self.event;
    Event.stopPropagation(event);                           
  
    var pos = Event.getMousePos(event).subtract(DragManager._cursorStart).add(DragManager._objStart);
    
    if (DragManager._bounds) {
      pos = DragManager._bounds.clipPoint(pos)
    }
    
    if (!DragManager._obj.onDrag || DragManager._obj.onDrag(pos)) {
      Metrics.setPos(DragManager._obj, pos);
    }
  
    return false;
  };
  
  DragManager._stopDrag = function(event) {
    event = event || self.event;
  
    // ignore the right button
    if (event.button == 2) {
      return;
    }
  
    Event.stopPropagation(event);                           
  
    DragManager._restoreDocumentEvents();
  
    var pos = Event.getMousePos(event).subtract(DragManager._cursorStart).add(DragManager._objStart);
    var obj = DragManager._obj;
    DragManager._obj = null;
  
    if (obj.onDragEnd && !obj.onDragEnd(pos) &&
        (!obj.onDragCancel || obj.onDragCancel(DragManager._objStart))) {
      Metrics.setPos(obj, DragManager._objStart); 
    }
    
    return false;
  };
  
  DragManager._checkCancel = function(event) {
    event = event || self.event;
    
    if (Event.getKeyCode(event) == 27) {
      Event.stopPropagation(event);                           
      DragManager._cancelDrag();
  
      return false;
    }
  };
  
  DragManager._cancelDrag = function() {
    DragManager._restoreDocumentEvents();
  
    var obj = DragManager._obj;
    DragManager._obj = null;
    
    if (!obj.onDragCancel || obj.onDragCancel(DragManager._objStart)) {
      Metrics.setPos(obj, DragManager._objStart); 
    }
  };
  
  DragManager._setupDocumentEvents = function() {
    // save the current mouse event handlers on the document
    if (document.onmousemove != DragManager._doDrag) {
      DragManager._documentOnMouseMove = document.onmousemove;
      DragManager._documentOnMouseUp = document.onmouseup;
      DragManager._documentOnKeyDown = document.onkeydown;
    }
      
    // install event handlers for the rest of the dragging process
    document.onmousemove = DragManager._doDrag;
    document.onmouseup = DragManager._stopDrag;
    document.onkeydown = DragManager._checkCancel;
  };
  
  DragManager._restoreDocumentEvents = function() {
    document.onmousemove = DragManager._documentOnMouseMove;
    document.onmouseup = DragManager._documentOnMouseUp;
    document.onkeydown = DragManager._documentOnKeyDown;
  };


