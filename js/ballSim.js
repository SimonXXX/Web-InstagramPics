//##############################################################################
// File: 
//    ballSim.js
// Dependencies:
//    utils.js
//    metrics.js
//    event.js
// Description:
//    A ball physics simulation engine
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

function BallSim() {
};

BallSim._balls = [];
BallSim._interval = 32;
BallSim._cyclesPerInterval = 2;
BallSim._intervalScalar = BallSim._interval / (1000 * BallSim._cyclesPerInterval);
BallSim._friction = 100 * BallSim._intervalScalar;
BallSim._viscosity = 0 * BallSim._intervalScalar;
BallSim._elasticity = 0.8;
BallSim._gravity = 0 * BallSim._intervalScalar;
BallSim._runId = null;
BallSim._runCount = 0;
BallSim._collideGridSize = 4;
BallSim._collideBins = {};

for (var i = 0; i < BallSim._collideGridSize; ++i) {
  for (var j = 0; j < BallSim._collideGridSize; ++j) {
    BallSim._collideBins[i + "," + j] = [];
  }
}

BallSim.setElasticity = function(value) {
  BallSim._elasticity = Math.min(Math.max(value, 0), 1);
};

BallSim.getElasticity = function() {
  return BallSim._elasticity;
};

BallSim.setFriction = function(value) {
  BallSim._friction = Math.max(value, 0) * BallSim._intervalScalar;
};

BallSim.getFriction = function() {
  return BallSim._friction / BallSim._intervalScalar;
};

BallSim.setViscosity = function(value) {
  BallSim._viscosity = Math.max(value, 0) * BallSim._intervalScalar;
};

BallSim.getViscosity = function() {
  return BallSim._viscosity / BallSim._intervalScalar;
};

BallSim.setGravity = function(value) {
  BallSim._gravity = value * BallSim._intervalScalar;
};

BallSim.getGravity = function() {
  return BallSim._gravity / BallSim._intervalScalar;
};

BallSim.addBall = function(ball) {
  BallSim._balls.push(ball);
};

BallSim.removeBall = function(ball) {
  BallSim.stop();
  BallSim._balls.remove(ball);
  BallSim.start();
};

BallSim.start = function(getBoundsRect) {
  if (BallSim._runCount++ == 0) {
    if (getBoundsRect && getBoundsRect.constructor == Function) {
      BallSim._getBoundsRect = getBoundsRect;
    } else if (getBoundsRect && getBoundsRect.constructor == String) {
      BallSim._getBoundsRect = new Function(getBoundsRect);
    }
    
    BallSim._runId = setInterval(BallSim._run, BallSim._interval);
  }
};

BallSim.stop = function() {
  if (--BallSim._runCount == 0) {
    clearInterval(BallSim._runId);
    BallSim._runId = null;
  }
};

BallSim.isRunning = function() {
  return BallSim._runCount > 0;
};

BallSim._run = function() {
  var boundsRect = BallSim._getBoundsRect();
  var boundsStart = boundsRect.getTopLeft();
  var boundsEnd = boundsRect.getBottomRight();

  var collideCellWidth = boundsRect.dims.x / BallSim._collideGridSize;
  var collideCellHeight = boundsRect.dims.y / BallSim._collideGridSize;
  var collideBins = BallSim._collideBins;
  var balls = BallSim._balls;
  var ballCount = balls.length;
  
  for (var cycles = 0; cycles < BallSim._cyclesPerInterval; ++cycles) {
    for (var i = 0, ball; ball = balls[i]; ++i) {
      ball.move(boundsStart, boundsEnd);
    }
    
    if (BallSim._gravity) {
      for (var i = 0; i < ballCount - 1; ++i) {
		var ball1 = balls[i];
        for (var j = i + 1, ball2; ball2 = balls[j]; ++j) {
          BallSim.Ball._gravitate(ball1, ball2);
        }
      }
    }
    
    if (BallSim._elasticity) {
      for (var i in collideBins) {
        collideBins[i].length = 0;
      }
      
      for (var i = 0, ball; ball = balls[i]; ++i) {
        var pos = Vector.subtract(ball.pos, boundsRect.pos);
        
        var minCollideCol = Math.max(0, Math.floor((pos.x - ball._radius) / collideCellWidth)); 
        var maxCollideCol = Math.min(BallSim._collideGridSize, Math.floor((pos.x + ball._radius) / collideCellWidth)); 
        var minCollideRow = Math.max(0, Math.floor((pos.y - ball._radius) / collideCellHeight)); 
        var maxCollideRow = Math.min(BallSim._collideGridSize, Math.floor((pos.y + ball._radius) / collideCellHeight));
        
        for (var row = minCollideRow; row <= maxCollideRow; ++row) {
          for (var col = minCollideCol; col <= maxCollideCol; ++col) {
            collideBins[col + "," + row].push(ball);
          }
        }
      }
      
      for (var bin in collideBins) {
        var binBalls = collideBins[bin];
		var binBallCount = binBalls.length;
  
        for (var i = 0; i < binBallCount - 1; ++i) {
		  var ball1 = binBalls[i];
          for (var j = i + 1, ball2; ball2 = binBalls[j]; ++j) {
            BallSim.Ball._collide(ball1, ball2);
          }
        }
      }
    }
  }
  
  BallSim.updateDisplay();
};

BallSim.updateDisplay = function() {
  for (var i = 0; i < BallSim._balls.length; ++i) {
    BallSim._balls[i].updateDisplay();
  }
};

BallSim.Ball = function(radius, mass, imgSrc) {
  radius = Math.round(radius).valueOf();
  mass = mass.valueOf();

  //this._radius = radius;
  this._mass = mass;
  this._imageSrc = imgSrc;
  this.pos = new Vector(0, 0);
  this.vel = new Vector(0, 0);
  this._img = document.createElement("img");
  this._img.src = imgSrc;
  //this._img.height =  radius * 2;
  //this._img.width = radius * 2.6666;
  
   if (this._img.height > this._img.width) {
  		this._radius = this._img.width / 2;
   } else {
  		this._radius = this._img.height / 2;
   }
  this._img.style.position = "absolute";
  this._img.onmousedown = BallSim.Ball._createImgHandler_onmousedown(this);
  this._img.ondblclick = callback(this, this.dblclick);
  this._img.ondragstart = new Function("event", "Event.stopPropagation(event); return false;");
  this._img.onselectstart = new Function("event", "Event.stopPropagation(event); return false;");
  this._img.setAttribute("unselectable", "on");
  document.body.appendChild(this._img);
  
  this._imgOffset = new Vector(-radius - 0.0, -radius - 0.0);
  
  this.updateDisplay();
};

  BallSim.Ball.prototype.getRadius = function() {
    return this._radius;
  };

  BallSim.Ball.prototype.getMass = function() {
    return this._mass;
  };

  BallSim.Ball.prototype.getImageSrc = function() {
    return this._imageSrc;
  };

  BallSim.Ball.prototype.dblclick = function() {
    if (this.ondblclick) {
      this.ondblclick();
    };
  };

  BallSim.Ball.prototype.destroy = function() {
    this._img.onmousedown = null;
    this._img.ondragstart = null;
    this._img.onselectstart = null;
    document.body.removeChild(this._img);
  };

  BallSim.Ball.prototype.updateDisplay = function() {
    Metrics.setPos(this._img, Vector.add(this.pos, this._imgOffset));
  };
  
  BallSim.Ball.prototype.move = function(boundsStart, boundsEnd) {
    if (!this._dragging) {
      if (!this.vel.isZero()) {
        var mass = Math.abs(this._mass);
        
        this.pos.add(Vector.scale(this.vel, BallSim._intervalScalar));

        var velLen = this.vel.length();
        var force = 0;
        
        if (BallSim._friction) {
          force += (9.8 * mass * BallSim._friction / this._radius);
        }
        
        if (BallSim._viscosity) {
          force += velLen * velLen * 2 * this._radius * BallSim._viscosity;
        }
          
        if (force) {
          var newVelLen = Math.max(0, velLen - force / mass);  
          this.vel.scale(newVelLen / velLen);
        }
      }
    }
    
    if (this.pos.x < boundsStart.x + this._radius) {
      this.pos.x += (boundsStart.x + this._radius - this.pos.x);
      
      if (this.vel.x < 0 ) {
        this.vel.x = -this.vel.x * BallSim._elasticity;
      }
    }

    if (this.pos.x > boundsEnd.x - this._radius) {
      this.pos.x -= (this.pos.x - boundsEnd.x + this._radius);
      
      if (this.vel.x > 0 ) {
        this.vel.x = -this.vel.x * BallSim._elasticity;
      }
    }
    
    if (this.pos.y < boundsStart.y + this._radius) {
      this.pos.y += (boundsStart.y + this._radius - this.pos.y);
      
      if (this.vel.y < 0 ) {
        this.vel.y = -this.vel.y * BallSim._elasticity;
      }
    }
    
    if (this.pos.y > boundsEnd.y - this._radius) {
      this.pos.y -= (this.pos.y - boundsEnd.y + this._radius);
      
      if (this.vel.y > 0 ) {
        this.vel.y = -this.vel.y * BallSim._elasticity;
      }
    }
  };

  BallSim.Ball._gravitate = function(ball1, ball2) {
    var n = Vector.subtract(ball2.pos, ball1.pos);
    
    if (n.isZero()) {
      return;
    }
    
    var sqrDist = Vector.dotProduct(n, n);
    
    if (sqrDist > (ball1._radius + ball2._radius) * (ball1._radius + ball2._radius)) {
      var force = BallSim._gravity * ball1._mass * ball2._mass / sqrDist;
      n.scale(force / Math.sqrt(sqrDist));
      
      if (ball1._dragging) {
        ball2.vel.subtract(Vector.scale(n, 1 / ball2._mass));
      } else if (ball2._dragging) {
        ball1.vel.add(Vector.scale(n, 1 / ball1._mass));
      } else {
        ball1.vel.add(Vector.scale(n, 1 / ball1._mass));
        ball2.vel.subtract(Vector.scale(n, 1 / ball2._mass));
      }
    }
  };

  BallSim.Ball._collide = function(ball1, ball2) {
    var n = Vector.subtract(ball2.pos, ball1.pos);
    
    if (n.isZero()) {
      return;
    }
    
    if (Vector.dotProduct(n, n) < (ball1._radius + ball2._radius) * (ball1._radius + ball2._radius)) {
      var distance = n.length();
      n.scale(1 / distance);
      
      if (ball1._dragging) {
        var j = -(1 + BallSim._elasticity) * Vector.dotProduct(Vector.subtract(ball2.vel, ball1.vel), n);
      
        if (j > 0) {
          ball2.vel.add(Vector.scale(n, j));
        }

        ball2.pos = Vector.add(ball1.pos, n.scale(ball1._radius + ball2._radius + 0.1));
      } else if (ball2._dragging) {
        var j = -(1 + BallSim._elasticity) * Vector.dotProduct(Vector.subtract(ball2.vel, ball1.vel), n);
      
        if (j > 0) {
          ball1.vel.subtract(Vector.scale(n, j));
        }

        ball1.pos = Vector.subtract(ball2.pos, n.scale(ball1._radius + ball2._radius + 0.1));
      } else {
        var mass1 = Math.abs(ball1._mass);
        var mass2 = Math.abs(ball2._mass);
        
        var j = -(1 + BallSim._elasticity) * Vector.dotProduct(Vector.subtract(ball2.vel, ball1.vel).scale(1 / ((1 / mass1) + (1 / mass2))), n);
      
        if (j > 0) {
          ball1.vel.subtract(Vector.scale(n, j / mass1));
          ball2.vel.add(Vector.scale(n, j / mass2));
        }
      }
    }
  };

  BallSim.Ball._createImgHandler_onmousedown = function(ball) {
    return function(event) {
      event = event || self.event;

      // ignore the right button
      if (event.button == 2) {
        return;
      }
      
      if (BallSim.Ball._dragBall) {
        if (event.button == undefined) {
          event.button = 0;
        }
        
        BallSim.Ball._bodyHandler_onmouseup(event);
      }

      var mousePos = Event.getMousePos(event);
      var imgPos = Metrics.getPos(ball._img).subtract(ball._imgOffset);
      
      if (Vector.subtract(mousePos, imgPos).length() > ball._radius) {
        return;
      }
      
      BallSim.Ball._dragMouseOrigin = mousePos;
      BallSim.Ball._dragMouseOrigin;
      BallSim.Ball._dragBallOrigin = ball.pos.clone();
      BallSim.Ball._dragBall = ball;
      ball._dragging = true;
      
      BallSim.Ball._dragHistory = new Array();
      BallSim.Ball._dragHistory.push({pos: mousePos.clone(), timeStamp: (new Date()).getTime() });
      
      BallSim.Ball._oldBodyHandler_onmousemove = document.body.onmousemove;
      BallSim.Ball._oldBodyHandler_onmouseup = document.body.onmouseup;
      
      document.body.onmousemove = BallSim.Ball._bodyHandler_onmousemove;
      document.body.onmouseup = BallSim.Ball._bodyHandler_onmouseup;
      
      BallSim.Ball._timerId_mousenotmove = setTimeout(BallSim.Ball._bodyHandler_onmousenotmove, BallSim._interval * 2);
      
      Event.stopPropagation(event);
      return false;
    };
  };
  
  BallSim.Ball._bodyHandler_onmousemove = function(event) {
    event = event || self.event;

    if (BallSim.Ball._timerId_mousenotmove) {
      clearTimeout(BallSim.Ball._timerId_mousenotmove);
      BallSim.Ball._timerId_mousenotmove = null;
    }

    var mousePos = Event.getMousePos(event);
    
    BallSim.Ball._dragHistory.push({pos: mousePos.clone(), timeStamp: (new Date()).getTime() });
    
    if (BallSim.Ball._dragHistory.length > 6) {
      BallSim.Ball._dragHistory.shift();
    }
    
    var startDrag = BallSim.Ball._dragHistory.first();
    var endDrag = BallSim.Ball._dragHistory.last();
    var newVel = Metrics.Vector.subtract(endDrag.pos, startDrag.pos);
    newVel.scale(1000 / (endDrag.timeStamp - startDrag.timeStamp));

    BallSim.Ball._dragBall.pos = mousePos.subtract(BallSim.Ball._dragMouseOrigin).add(BallSim.Ball._dragBallOrigin);

    if (BallSim.isRunning()) {
      BallSim.Ball._dragBall.vel = newVel;
    } else {
      BallSim.updateDisplay();
    }

    BallSim.Ball._timerId_mousenotmove = setTimeout(BallSim.Ball._bodyHandler_onmousenotmove, BallSim._interval * 2);
    
    if (BallSim.Ball._oldBodyHandler_onmousemove) {
      BallSim.Ball._oldBodyHandler_onmousemove(event);
    }
  };
  
  BallSim.Ball._bodyHandler_onmouseup = function(event) {
    event = event || self.event;
    
    // ignore the right button
    if (event.button != 2) {
      if (BallSim.Ball._timerId_mousenotmove) {
        clearTimeout(BallSim.Ball._timerId_mousenotmove);
        BallSim.Ball._timerId_mousenotmove = null;
      }
  
      document.body.onmousemove = BallSim.Ball._oldBodyHandler_onmousemove;
      document.body.onmouseup = BallSim.Ball._oldBodyHandler_onmouseup;
      
      BallSim.Ball._dragBall._dragging = false;
      BallSim.Ball._dragBall = null;
    }
    
    if (BallSim.Ball._oldBodyHandler_onmouseup) {
      BallSim.Ball._oldBodyHandler_onmouseup(event);
    }
  };
  
  BallSim.Ball._bodyHandler_onmousenotmove = function() {
    BallSim.Ball._timerId_mousenotmove = null;
    
    if (BallSim.isRunning()) {
      BallSim.Ball._dragBall.vel = new Metrics.Vector(0, 0);
    }
    
    if (BallSim.Ball._dragHistory.length > 1) {
      BallSim.Ball._dragHistory = BallSim.Ball._dragHistory.splice(BallSim.Ball._dragHistory.length - 1, 1);
    }
  };
