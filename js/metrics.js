//##############################################################################
// File: 
//    metrics.js
// Dependencies:
//    utils.js
// Description:
//    Defines a Vector object for position, distance and dimensions in 3D, a
//    Rectangle object for neatly packaging position and dimensions together and
//    several utility functions for working with dimensions and/or positions of
//    DOM objects, the document, the window and the viewport.
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

function Metrics() {
};

//##############################################################################

Metrics.Vector = function(x, y, z) {
  this.x = isNaN(x) ? 0 : x.valueOf();
  this.y = isNaN(y) ? 0 : y.valueOf();
  this.z = isNaN(z) ? 0 : z.valueOf();
};
  
using("Metrics.Vector");

  Metrics.Vector.prototype.clone = function() {
    return new Metrics.Vector(this.x, this.y, this.z);
  };

  Metrics.Vector.prototype.add = function(vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;

    return this;
  };
  
  Metrics.Vector.add = function(vector1, vector2) {
    return new Metrics.Vector(vector1.x + vector2.x, vector1.y + vector2.y, vector1.z + vector2.z);
  };
  
  Metrics.Vector.prototype.subtract = function(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;

    return this;
  };
  
  Metrics.Vector.subtract = function(vector1, vector2) {
    return new Metrics.Vector(vector1.x - vector2.x, vector1.y - vector2.y, vector1.z - vector2.z);
  };
  
  Metrics.Vector.prototype.scale = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;

    return this;
  };
  
  Metrics.Vector.scale = function(vector, scalar) {
    return new Metrics.Vector(vector.x * scalar, vector.y * scalar, vector.z * scalar);
  };
  
  Metrics.Vector.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  };

  Metrics.Vector.prototype.isZero = function() {
    return (this.x || this.y || this.z) ? false : true;
  };

  Metrics.Vector.prototype.normalize = function() {
    var length = this.x * this.x + this.y * this.y + this.z * this.z;
    
    if (length && Math.abs(length - 1) > 0.01) {
      length = Math.sqrt(length);
      this.x /= length;
      this.y /= length;
      this.z /= length;
    }
    
    return this;
  };
  
  Metrics.Vector.normalize = function(vector) {
    return (new Metrics.Vector(vector.x, vector.y, vector.z)).normalize();
  };
  
  Metrics.Vector.dotProduct = function(vector1, vector2) {
    return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
  };

  Metrics.Vector.crossProduct = function(vector1, vector2) {
    return new Metrics.Vector(vector1.y * vector2.z - vector1.z * vector2.y,
                              vector1.z * vector2.x - vector1.x * vector2.z,
                              vector1.x * vector2.y - vector1.y * vector2.x);
  };

  Metrics.Vector.project = function(vector1, vector2) {
    var temp = Metrics.Vector.dotProduct(vector2, vector2);
    
    if (temp) {
      return Metrics.Vector.scale(vector2, Metrics.Vector.dotProduct(vector1, vector2) / temp);
    }
    
    return new Metrics.Vector();
  };
  
  Metrics.Vector.component = function(vector1, vector2) {
    return Metrics.Vector.dotProduct(vector1, Metrics.Vector.normalize(vector2));
  };
  
  Metrics.Vector.perpendicular = function(vector1, vector2) {
    return Metrics.Vector.subtract(vector1, Metrics.Vector.project(vector1, vector2));
  };

  Metrics.Vector.rotate = function(vector, angle, axis) {
    var cosAngle = Math.cos(angle);
    var sinAngle = Math.sin(angle);
    
    switch (axis) {
      case "x":
        return new Metrics.Vector(vector.x,
                                  vector.y * cosAngle + vector.z * sinAngle,
                                  vector.z * cosAngle - vector.y * sinAngle);
      case "y":
        return new Metrics.Vector(vector.x * cosAngle + vector.z * sinAngle,
                                  vector.y,
                                  vector.z * cosAngle - vector.x * sinAngle);
      default:
        return new Metrics.Vector(vector.x * cosAngle + vector.y * sinAngle,
                                  vector.y * cosAngle - vector.x * sinAngle,
                                  vector.z);
    }
  };

  Metrics.Vector.prototype.toString = function() {
    return "(" + this.x + ", " + this.y + ", " + this.z + ")";
  };

//##############################################################################

Metrics.Orientation = function() {
  this.right = new Metrics.Vector(1, 0, 0);
  this.up = new Metrics.Vector(0, 1, 0);
  this.forward = new Metrics.Vector(0, 0, 1);
};

using("Metrics.Orientation");

  Metrics.Orientation.prototype.translateVector = function(v) {
    return new Metrics.Vector(
      //this.right.x   * v.x + this.right.y   * v.y + this.right.z   * v.z,
      //this.up.x      * v.x + this.up.y      * v.y + this.up.z      * v.z,
      //this.forward.x * v.x + this.forward.y * v.y + this.forward.z * v.z

      this.right.x * v.x + this.up.x * v.y + this.forward.x * v.z,
      this.right.y * v.x + this.up.y * v.y + this.forward.y * v.z,
      this.right.z * v.x + this.up.z * v.y + this.forward.z * v.z
    );
  };

  Metrics.Orientation.prototype.rotate = function(angle, axis) {
    this.right = Metrics.Vector.rotate(this.right, angle, axis).normalize();
    this.up = Metrics.Vector.rotate(this.up, angle, axis).normalize();
    this.forward = Metrics.Vector.rotate(this.forward, angle, axis).normalize();
  };
//##############################################################################

Metrics.Quat = function(w, x, y, z) {
  if (arguments.length == 4) {
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
  } else {
    this.w = 1;
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
};

using("Metrics.Quat");

  Metrics.Quat.prototype.clone = function() {
    return new Metrics.Quat(this.w, this.x, this.y, this.z);
  };

  Metrics.Quat.prototype.normalize = function() {
    var length = this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
    
    if (Math.abs(length - 1) > 0.001) {
      length = Math.sqrt(length);
      
      this.w /= length;
      this.x /= length;
      this.y /= length;
      this.z /= length;
    }
  };

  Metrics.Quat.prototype.translateVector = function(v) {
    var xx = 2 * this.x * this.x;
    var yy = 2 * this.y * this.y;
    var zz = 2 * this.z * this.z;

    var xw = 2 * this.x * this.w;
    var xy = 2 * this.x * this.y;
    var xz = 2 * this.x * this.z;

    var yw = 2 * this.y * this.w;
    var yz = 2 * this.y * this.z;
    
    var zw = 2 * this.z * this.w;

    return new Metrics.Vector(
      v.x * (1 - yy - zz) + v.y * (xy + zw)     + v.z * (xz - yw),
      v.x * (xy - zw)     + v.y * (1 - xx - zz) + v.z * (yz + xw),
      v.x * (xz + yw)     + v.y * (yz - xw)     + v.z * (1 - xx - yy)
    );
  };

  Metrics.Quat.multiply = function(q1, q2) {
    var result = new Quat(
      q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
      q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
      q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
      q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w
    );
    
    result.normalize();
    
    return result;
  };

  Metrics.Quat.fromAxisRotation = function(axisVector, angle) {
    var sinAngle = Math.sin(angle / 2);

    return new Metrics.Quat(
      Math.cos(angle / 2),
      axisVector.x * sinAngle,
      axisVector.y * sinAngle,
      axisVector.z * sinAngle
    );
  };

  Metrics.Quat.rotate = function(quat, axisVector, angle) {
    return Metrics.Quat.multiply(Metrics.Quat.fromAxisRotation(axisVector, angle), quat);
  };

//##############################################################################

Metrics.Rectangle = function(pos, dims) {
  this.pos = pos.clone();
  this.dims = dims.clone();
};

using("Metrics.Rectangle");

  Metrics.Rectangle.prototype.clone = function() {
    return new Metrics.Rectangle(this.pos, this.dims);
  };

  Metrics.Rectangle.prototype.getPos = function() {
    return this.pos.clone();
  };

  Metrics.Rectangle.prototype.getDims = function() {
    return this.dims.clone();
  };

  Metrics.Rectangle.prototype.getTopLeft = function() {
    return this.pos.clone();
  };

  Metrics.Rectangle.prototype.getTopRight = function() {
    return new Metrics.Vector(this.pos.x + this.dims.x - 1, this.pos.y);
  };

  Metrics.Rectangle.prototype.getBottomLeft = function() {
    return new Metrics.Vector(this.pos.x, this.pos.y + this.dims.y - 1);
  };

  Metrics.Rectangle.prototype.getBottomRight = function() {
    return new Metrics.Vector(this.pos.x + this.dims.x - 1, this.pos.y + this.dims.y - 1);
  };

  Metrics.Rectangle.prototype.overlaps = function(rect) {
    return (this.pos.x + this.dims.x > rect.pos.x) &&
           (this.pos.y + this.dims.y > rect.pos.y) &&
           (rect.pos.x + rect.dims.x > this.pos.x) &&
           (rect.pos.y + rect.dims.y > this.pos.y);
  };

  Metrics.Rectangle.prototype.containsPoint = function(point) {
    return point.x >= this.pos.x && point.x + this.pos.x < this.dims.x &&
           point.y >= this.pos.y && point.y + this.pos.y < this.dims.y;
  };
  
  Metrics.Rectangle.prototype.containsRect = function(rect) {
    return rect.pos.x >= this.pos.x && rect.pos.x + rect.dims.x <= this.pos.x + this.dims.x &&
           rect.pos.y >= this.pos.y && rect.pos.y + rect.dims.y <= this.pos.y + this.dims.y;
  };
  
  Metrics.Rectangle.prototype.clipPoint = function(point) {
    var result = point.clone();
    
    if (result.x < this.pos.x) {
      result.x = this.pos.x;
    } else if (result.x >= this.pos.x + this.dims.x) {
      result.x = this.pos.x + this.dims.x - 1;
    }
  
    if (result.y < this.pos.y) {
      result.y = this.pos.y;
    } else if (result.y >= this.pos.y + this.dims.y) {
      result.y = this.pos.y + this.dims.y - 1;
    }
    
    return result;
  };
  
  Metrics.Rectangle.prototype.clipRect = function(rect) {
    var x = Math.max(this.pos.x, rect.pos.x);
    var y = Math.max(this.pos.y, rect.pos.y);
    
    var w = Math.min(this.pos.x + this.dims.x, rect.pos.x + rect.dims.x) - x;
    var h = Math.min(this.pos.y + this.dims.y, rect.pos.y + rect.dims.y) - y;
    
    if (w > 0 && h > 0) {
      return new Rectangle(new Vector(x, y), new Vector(w, h));
    } else {
      return null;
    }
  };

  Metrics.Rectangle.prototype.toString = function() {
    return this.pos + ", " + this.dims;
  };

//##############################################################################

Metrics.getViewportWidth = function(win) {
  win = win || self;

  if (win.innerWidth) {
    // all except IE
    return win.innerWidth;
  }

  if (win.document.documentElement && win.document.documentElement.clientWidth) {
    // IE6 strict
    return Math.min(win.document.documentElement.clientWidth, win.document.body.clientWidth);
  }
  
  // other IE
  return win.document.body.clientWidth;
};

Metrics.getViewportHeight = function(win) {
  win = win || self;

  if (win.innerHeight) {
    // all except IE
    return win.innerHeight;
  }

  if (win.document.documentElement && win.document.documentElement.clientHeight) {
    // IE6 strict
    return Math.min(win.document.documentElement.clientHeight, win.document.body.clientHeight);
  }
  
  // other IE
  return win.document.body.clientHeight;
};

Metrics.getViewportDims = function(win) {
  win = win || self;
  var width, height;

  if (win.innerWidth) {
    width = win.innerWidth;
    height = win.innerHeight;
  } else if (win.document.documentElement && win.document.documentElement.clientWidth) {
    // IE6 strict
    if (win.document.documentElement.clientWidth < win.document.body.clientWidth) {
      width = win.document.documentElement.clientWidth;
      height = win.document.documentElement.clientHeight;
    } else {
      width = win.document.body.clientWidth;
      height = win.document.body.clientHeight;
    }
  } else {
    // other IE
    width = win.document.body.clientWidth;
    height = win.document.body.clientHeight;
  }
  
  return new Metrics.Vector(width, height);
};

Metrics.getViewportTop = function(win) {
  win = win || self;

  if (win.pageYOffset !== undefined) {
    return win.pageYOffset;
  }
  
  if (win.document.documentElement && win.document.documentElement.scrollTop) {
    return win.document.documentElement.scrollTop;
  }
  
  return win.document.body.scrollTop;
};

Metrics.getViewportLeft = function(win) {
  win = win || self;

  if (win.pageXOffset !== undefined) {
    return win.pageXOffset;
  }
  
  if (win.document.documentElement && win.document.documentElement.scrollLeft) {
    return win.document.documentElement.scrollLeft;
  }
  
  return win.document.body.scrollLeft;
};

Metrics.getViewportPos = function(win) {
  win = win || self;
  var x, y;

  if (win.pageYOffset !== undefined) {
    x = win.pageXOffset;
    y = win.pageYOffset;
  } else if (win.document.documentElement && win.document.documentElement.scrollTop) {
    x = win.document.documentElement.scrollLeft;
    y = win.document.documentElement.scrollTop;
  } else {
    x = win.document.body.scrollLeft;
    y = win.document.body.scrollTop;
  }
  
  return new Metrics.Vector(x, y);
};

Metrics.getViewportRect = function(win) {
  return new Metrics.Rectangle(Metrics.getViewportPos(win), Metrics.getViewportDims(win));
};

Metrics.getDocumentWidth = function(win) {
  win = win || self;
  
  return Math.max(win.document.body.scrollWidth, win.document.offsetWidth);
};

Metrics.getDocumentHeight = function(win) {
  win = win || self;
  
  return Math.max(win.document.body.scrollHeight, win.document.offsetHeight);
};

Metrics.getDocumentDims = function(win) {
  win = win || self;
  var width, height;
  
  if (win.document.body.scrollHeight > win.document.body.offsetHeight) {
    width = win.document.body.scrollWidth;
    height = win.document.body.scrollHeight;
  } else {
    width = win.document.body.offsetWidth;
    height = win.document.body.offsetHeight;
  }
  
  return new Metrics.Vector(width, height);
};

Metrics.getWidth = function(node) {
  if (node.offsetWidth !== undefined) {
    return node.offsetWidth;
  } else if (node.clientWidth !== undefined) {
    return node.clientWidth;
  } else if (node.width !== undefined) {
    return node.width;
  } else {
	  throw "Metrics.getWidth doesn't work in this browser";
  }
};

Metrics.getHeight = function(node) {
  if (node.offsetHeight !== undefined) {
    return node.offsetHeight;
  } else if (node.clientHeight !== undefined) {
    return node.clientHeight;
  } else if (node.height !== undefined) {
    return node.height;
  } else {
	  throw "Metrics.getHeight doesn't work in this browser";
  }
};

Metrics.getDims = function(node) {
  var width, height;
  
  if (node.offsetWidth !== undefined) {
    width = node.offsetWidth;
    height = node.offsetHeight;
  } else if (node.clientWidth !== undefined) {
    width = node.clientWidth;
    height = node.clientHeight;
  } else if (node.width !== undefined) {
    width = node.width;
    height = node.height;
  } else {
	  throw "Metrics.getDims doesn't work in this browser";
  }
  
  return new Metrics.Vector(width, height);
};

Metrics.setDims = function(node, dims) {
  node.style.width = dims.x + "px";
  node.style.height = dims.y + "px";
  
  var adjustment = Vector.subtract(dims, Metrics.getDims(node));
  
  if (!adjustment.isZero()) {
    dims = Vector.add(dims, adjustment);

    node.style.width = dims.x + "px";
    node.style.height = dims.y + "px";
  }
};

Metrics.getInnerWidth = function(node) {
  if (node.clientWidth !== undefined) {
    return node.clientWidth;
  } else if (node.width !== undefined) {
    return node.width;
  } else {
	  throw "Metrics.getInnerWidth doesn't work in this browser";
  }
};

Metrics.getInnerHeight = function(node) {
  if (node.clientHeight !== undefined) {
    return node.clientHeight;
  } else if (node.height !== undefined) {
    return node.height;
  } else {
	  throw "Metrics.getInnerHeight doesn't work in this browser";
  }
};

Metrics.getInnerDims = function(node) {
  var width, height;
  
  if (node.clientWidth !== undefined) {
    width = node.clientWidth;
    height = node.clientHeight;
  } else if (node.width !== undefined) {
    width = node.width;
    height = node.height;
  } else {
	  throw "Metrics.getInnerDims doesn't work in this browser";
  }
  
  return new Metrics.Vector(width, height);
};

Metrics.getOffsetLeft = function(node) {
  return node.offsetLeft;
};

Metrics.getOffsetTop = function(node) {
  return node.offsetTop;
};

Metrics.getOffsetPos = function(node) {
  return new Metrics.Vector(node.offsetLeft, node.offsetTop);
};

Metrics.getOffsetRect = function(node) {
  return new Metrics.Rectangle(Metrics.getOffsetPos(node), Metrics.getDims(node));
};

Metrics.setOffsetPos = function(node, pos) {
  node.style.left = pos.x + "px";
  node.style.top = pos.y + "px";
};

Metrics.setOffsetRect = function(node, rect) {
  Metrics.setOffsetPos(node, rect.pos);
  Metrics.setDims(node, rect.dims);
};

Metrics.getLeft = function(node) {
  var x = 0;
  
  do {
    x += node.offsetLeft;
    node = node.offsetParent;
  } while (node);
  
  return x;
};

Metrics.getTop = function(node) {
  var y = 0;
  
  do {
    y += node.offsetTop;
    node = node.offsetParent;
  } while (node);
  
  return y;
};

Metrics.getPos = function(node) {
  var x = 0;
  var y = 0;
  
  do {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  } while (node);
  
  return new Metrics.Vector(x, y);
};

Metrics.getRect = function(node) {
  return new Metrics.Rectangle(Metrics.getPos(node), Metrics.getDims(node));
};

Metrics.setPos = function(node, pos) {
  if (node.offsetParent) {
    var offsetPos = Vector.subtract(pos, Metrics.getPos(node.offsetParent));
    Metrics.setOffsetPos(node, offsetPos);
  } else {
    Metrics.setOffsetPos(node, pos);
  }
};

Metrics.setRect = function(node, rect) {
  Metrics.setPos(node, rect.pos);
  Metrics.setDims(node, rect.dims);
};


