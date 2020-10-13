//##############################################################################
// File: 
//    slideControl.js
// Dependencies:
//    utils.js
//    metrics.js
//    event.js
//    dragManager.js
//    slideControl.css
// Description:
//    Slider control widget
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

function SlideControl(containerNode, options) {
  var defaults = {
    orientation: "horizontal",
    minValue: 0,
    maxValue: 100,
    interval: 0,
    styleClass: "slideControl"
  };
  
  options = Object.merge(options, defaults);
  
  this._vertical = (options.orientation == "vertical");
  this._minValue = options.minValue;
  this._maxValue = options.maxValue;
  this._interval = options.interval;
  this._value = this._minValue;
  
  this._containerNode = containerNode;
  this._containerNode.className += " " + options.styleClass + "_" + (this._vertical ? "vertical" : "horizontal");
  this._containerNode.onclick = SlideControl._createContainerHandler_onclick(this);
  
  this._lineNode = document.createElement("div");
  this._lineNode.className = "slideControlLine";
  this._containerNode.appendChild(this._lineNode);
  
  this._sliderNode = document.createElement("div");
  this._sliderNode.className = "slideControlSlide";
  this._sliderNode.onmousedown = SlideControl._createSliderHandler_onmousedown(this);
  this._sliderNode.onDrag = SlideControl._createSliderHandler_onDrag(this);
  this._sliderNode.onDragCancel = this._sliderNode.onDrag;
  this._sliderNode.onclick = SlideControl._sliderHandler_onclick;
  this._containerNode.appendChild(this._sliderNode);
};

  SlideControl.prototype.getValue = function() {
    return this._value;
  };
  
  SlideControl.prototype.getMinValue = function() {
    return this._minValue;
  };
  
  SlideControl.prototype.getMaxValue = function() {
    return this._maxValue;
  };
  
  SlideControl.prototype.getInterval = function() {
    return this._interval;
  };
  
  SlideControl.prototype.setValue = function(value) {
    value = Math.min(this._maxValue, Math.max(this._minValue, value));
    
    if (this._interval) {
      this._value = Math.round((value - this._minValue) / this._interval) * this._interval + this._minValue; 
    } else {
      this._value = value;
    }
    
    var valueScalar = (this._value - this._minValue) / (this._maxValue - this._minValue);
    var sliderPos = Metrics.getOffsetPos(this._sliderNode);
    
    if (this._vertical) {
      sliderPos.y = (1 - valueScalar) * (Metrics.getHeight(this._containerNode) - Metrics.getHeight(this._sliderNode)); 
    } else {
      sliderPos.x = valueScalar * (Metrics.getWidth(this._containerNode) - Metrics.getWidth(this._sliderNode)); 
    }
    
    Metrics.setOffsetPos(this._sliderNode, sliderPos);
  };
  
  SlideControl._createContainerHandler_onclick = function(slide) {
    return function(event) {
      event = event || self.event;
      
      // ignore the right button
      if (event.button == 2) {
        return;
      }

      var newSlidePos = Event.getMousePos(event).subtract(Metrics.getPos(slide._containerNode));
      
      if (slide._vertical) {
        newSlidePos.y -= Metrics.getHeight(slide._sliderNode) / 2;
        var clickMax = (Metrics.getHeight(slide._containerNode) - Metrics.getHeight(slide._sliderNode));
        var valueScalar = 1 - Math.max(0, Math.min(1, newSlidePos.y / clickMax));
      } else {
        newSlidePos.x -= Metrics.getWidth(slide._sliderNode) / 2;
        var clickMax = (Metrics.getWidth(slide._containerNode) - Metrics.getWidth(slide._sliderNode));
        var valueScalar = Math.max(0, Math.min(1, newSlidePos.x / clickMax));
      }
      
      var oldValue = slide.getValue();
      slide.setValue(valueScalar * (slide._maxValue - slide._minValue) + slide._minValue);
      
      if (slide.onchange) {
        slide.onchange.call(slide, oldValue);
      }
    };
  };
  
  SlideControl._createSliderHandler_onmousedown = function(slide) {
    return function(event) {
      var bounds = Metrics.getRect(slide._containerNode);
      
      if (slide._vertical) {
        bounds.pos.x += Metrics.getOffsetLeft(slide._sliderNode);
        bounds.dims.x = 1;
        SlideControl._dragMax = bounds.dims.y - Metrics.getHeight(slide._sliderNode);
      } else {
        bounds.pos.y + Metrics.getOffsetTop(slide._sliderNode);
        bounds.dims.y = 1;
        SlideControl._dragMax = bounds.dims.x - Metrics.getWidth(slide._sliderNode);
      }
      
      DragManager.startDrag(event, slide._sliderNode, bounds);
    };
  };
  
  SlideControl._sliderHandler_onclick = function(event) {
    event = event || self.event;

    // ignore the right button
    if (event.button == 2) {
      return;
    }
    
    Event.stopPropagation(event);
  };

  SlideControl._createSliderHandler_onDrag = function(slide) {
    return function(pos) {
      pos = Vector.subtract(pos, Metrics.getPos(slide._containerNode));
    
      if (slide._vertical) {
        var valueScalar = 1 - pos.y / SlideControl._dragMax;
      } else {
        var valueScalar = pos.x / SlideControl._dragMax;
      }
      
      var oldValue = slide.getValue();
      slide.setValue(valueScalar * (slide._maxValue - slide._minValue) + slide._minValue);
      
      if (slide.onchange && slide.getValue() != oldValue) {
        slide.onchange(oldValue);
      }
      
      return false;
    };
  };



