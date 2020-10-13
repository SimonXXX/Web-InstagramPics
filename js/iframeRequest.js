//##############################################################################
// File:
//    iframeRequest.js
// Dependencies:
//    utils.js
//    json2.js
// Description:
//    Asynchronous requests via IFrame
//##############################################################################
// (c)2005-2009 Jeff Lau
//##############################################################################

function IFrameRequest(form) {
  this._id = "IFrameRequest_" + IFrameRequest._instanceCount++;

  var iframe = document.createElement("iframe");
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";
  iframe.src = "";
  iframe.setAttribute("name", this._id);

  this._iframe = iframe;
  this._form = form;

  this._openArgs = null;
  this._isOpen = false;
  
  // indicates if the response should be cached
  this._cacheResponse = false;

  // indicates if open() has been called on a cached URL, but send() hasn't been called yet
  this._isCachedUrlOpen = false;

  this._parameters = new Object();

  // request timout data
  this._timeoutDelay = 0;
  this._timeoutId = null;

  // event handlers
  this.onsend = null;
  this.onabort = null;
  this.onsuccess = null;
  this.onerror = null;
  this.ontimeout = null;
  this.oncomplete = null;

  this._responseText = "";

  // indicates that a request has been sent and has not yet completed
  this._isPending = false;
  this._isComplete = false;

  if (this._form) {
    this._openArgs = {
      method: form.method,
      url: form.action,
      options: {}
    };
    
    form.target = this._id;
    form._IFrameRequest_originalMethod_submit = form.submit;
    form.submit = callback(this, this._formMethod_submit)

    var eventHandler = form.getAttribute("onsubmit");
    
    if (eventHandler) {
      if (eventHandler.constructor == Function) {
        form._IFrameRequest_originalHandler_onsubmit = eventHandler;
      } else if (eventHandler.constructor == String) {
        eventHandler = new Function("event", eventHandler);
        form._IFrameRequest_originalHandler_onsubmit = eventHandler;
      }
    }

    form.onsubmit = callback(this, this._formHandler_onsubmit);

    var eventNames = ["onsend", "onabort", "onsuccess", "onerror", "ontimeout", "oncomplete"];
    
    for (var i = 0; i < eventNames.length; ++i) {
      var eventHandler = form.getAttribute(eventNames[i]);
      
      if (eventHandler) {
        if (eventHandler.constructor == Function) {
          this[eventNames[i]] = eventHandler;
        } else if (eventHandler.constructor == String) {
          eventHandler = new Function("request", eventHandler);
          this[eventNames[i]] = eventHandler;
        }
      }
    }
    
    var timeout = Number(form.getAttribute("timeout"));
    
    if (!isNaN(timeout)) {
      this._timeoutDelay = timeout;
      this._openArgs.options.timeout = timeout;
    }
  } else {
    form = document.createElement("form");
    form.style.display = "none";
    form.target = this._id;
    form.name = this._id + "_form";
    form.encoding = "application/x-www-form-urlencoded";
    form.acceptCharset = "UTF-8";
    this._form = form;
  }
}

  // allowed values for the 'method' argument
  IFrameRequest.Method = {
    GET:  "get",
    POST: "post"
  };

  // constants used to specify the desired caching behavior
  IFrameRequest.Cache = {
    NONE:     0, // Force browser to reload each request
    BROWSER:  1, // Let browser deal with caching
    INTERNAL: 2, // Use an internal cache (based purely on the URL of the request)
    REFRESH:  3  // Force browser to reload the URL, but save the response in the internal cache
  };

  // all cached responses
  IFrameRequest._cachedResponses = new Object();

  // all currently pending requests
  IFrameRequest._pendingRequests = new Object();

  // used to create unique IDs for each request object
  IFrameRequest._instanceCount = 0;
  
  IFrameRequest.initializeForm = function(form) {
    return new IFrameRequest(form);
  };
  
  IFrameRequest.initializeAllForms = function(form) {
    var forms = document.body.getElementsByTagName("form");
    
    for (var i = 0, length = forms.length; i < length; ++i) {
      if (forms[i].getAttribute("target") == "IFrameRequest") {
        IFrameRequest.initializeForm(forms[i]);
      }
    }
  };

  IFrameRequest.open = function(method, url, options) {
    var defaults = {
      cache: IFrameRequest.Cache.BROWSER,
      timeout: 0,

      parameters: {},
      content: null,

      onsend: null,
      ontimeout: null,
      onabort: null,
      onerror: null,
      onsuccess: null,
      oncomplete: null
    };

    options = Object.merge(options, defaults);

    var request = new IFrameRequest();

    request.onsend = options.onsend;
    request.ontimeout = options.ontimeout;
    request.onabort = options.onabort;
    request.onerror = options.onerror;
    request.onsuccess = options.onsuccess;
    request.oncomplete = options.oncomplete;

    request.open(method, url, options);

    for (var id in options.parameters) {
      request.setParameter(id, options.parameters[id]);
    }

    return request;
  };

  IFrameRequest.send = function(method, url, options) {
    var request = IFrameRequest.open(method, url, options);

    request.send(options.content);

    return request;
  };

  IFrameRequest.abortPendingRequests = function() {
    var requests = Object.copy(IFrameRequest._pendingRequests);

    for (var requestId in requests) {
      requests[requestId].abort();
    }
  };

  IFrameRequest.clearResponseCache = function(url) {
    if (url) {
      delete IFrameRequest._cachedResponses[url];
    } else {
      IFrameRequest._cachedResponses = new Object();
    }
  };

  IFrameRequest.prototype.toString = function() {
    return this._id;
  };

  IFrameRequest.prototype.valueOf = function() {
    return this._id.valueOf();
  };

  IFrameRequest.prototype.getId = function() {
    return this._id;
  };

  IFrameRequest.prototype.isPending = function() {
    return this._isPending;
  };

  IFrameRequest.prototype.isComplete = function() {
    return this._isComplete;
  };

  IFrameRequest.prototype.getResponseText = function() {
    return this._responseText;
  };

  IFrameRequest.prototype.getResponseObject = function() {
    return JSON.parse(this._responseText);
  };
  
  IFrameRequest.prototype.setParameter = function(name, value) {
    if (!this._parameters[name]) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      this._parameters[name] = this._form.appendChild(input);
    } else {
      this._parameters[name].value = value;
    }
  };
  
  IFrameRequest.prototype.open = function(method, url, options) {
    var defaults = {
      cache: IFrameRequest.Cache.NONE,
      timeout: 0
    };

    this.abort();

    this._isComplete = false;
    this._openArgs = null;
    
    if (!IFrameRequest.Method[method.toUpperCase()]) {
      throw "IFrameRequest.prototype.open: '" + method + "' is an invalid method";
    }

    if (!url) {
      throw "IFrameRequest.prototype.open: a URL must be specified";
    }

    // save the arguments for easy "re-opening"
    this._openArgs = {
      method: method.toLowerCase(),
      url: url,
      options: Object.copy(options)
    };

    options = Object.merge(options, defaults);

    var cachedResponse = null;
    this._cacheResponse = false;

    switch (options.cache) {
      case IFrameRequest.Cache.REFRESH:
        IFrameRequest.clearResponseCache(url);
        // look out below!

      case IFrameRequest.Cache.INTERNAL:
        cachedResponse = IFrameRequest._cachedResponses[url];
        this._cacheResponse = !cachedResponse;
        // look out below!

      case IFrameRequest.Cache.NONE:
        if (url.indexOf("?") == -1) {
          url += "?timestamp=" + (new Date()).getTime();
        } else {
          url += "&timestamp=" + (new Date()).getTime();
        }
        break;
    }

    this._isCachedUrlOpen = Boolean(cachedResponse);
    
    if (cachedResponse) {
      this._responseText = cachedResponse;
    } else {
      if (String(this._form.name).indexOf(this.getId()) == 0) {
        document.body.appendChild(this._form);
      }

      document.body.appendChild(this._iframe);

      if (document.frames) {
        document.frames[document.frames.length - 1].name = this._iframe.name;
      }

      this._timeoutDelay = options.timeout;
      this._form.method = method;
      this._form.action = url;
    }
    
    this._isOpen = true;
  };

  IFrameRequest.prototype.send = function(content) {
    if (!this._openArgs) {
      throw "IFrameRequest.prototype.send: 'open' must be called first!";
    }

    if (!this._isOpen) {
      this.open(this._openArgs.method, this._openArgs.url, this._openArgs.options);
    }
    
    this._isOpen = false;
  
    if (this.onsend) {
      this.onsend();
    }
    
    if (this._isCachedUrlOpen) {
      setTimeout(callback(this, this._handleResponse), 1);
    } else {
      this.setParameter("Request-Object-Type", "IFrameRequest");
      
      if (content !== null && content !== undefined) {
        this.setParameter("Request-Content", content);
      }

      var onreadystatechange = callback(this, this._onreadystatechange);
      this._iframe.onreadystatechange = onreadystatechange;
      this._iframe.onload = onreadystatechange;

      if (this._timeoutDelay) {
        this._timeoutId = setTimeout(callback(this, this._timeout), this._timeoutDelay);
      }

      IFrameRequest._pendingRequests[this.getId()] = this;
      this._isPending = true;

      if (this._form._IFrameRequest_originalMethod_submit) {
        this._form._IFrameRequest_originalMethod_submit();
      } else {
        this._form.submit();
      }
    }
  };

  IFrameRequest.prototype._complete = function() {
    this._isPending = false;
    delete IFrameRequest._pendingRequests[this.getId()];

    // prevent memory leaks in IE
    this._iframe.onreadystatechange = null;
    this._iframe.onload = null;

    if (!this._isCachedUrlOpen) {
      if (String(this._form.name).indexOf(this.getId()) == 0) {
        document.body.removeChild(this._form);
      }

      document.body.removeChild(this._iframe);
    }
    
    // clear out parameters
    for (var paramName in this._parameters) {
      this._form.removeChild(this._parameters[paramName]);
    }
    
    this._parameters = new Object();

    this._isComplete = true;
    this._isCachedUrlOpen = false;

    if (this.oncomplete) {
      this.oncomplete(this);
    }
  };

  IFrameRequest.prototype.abort = function() {
    this._cancelTimeout();
  
    if (this._isPending) {
      this._abort();

      if (this.onabort) {
        this.onabort(this);
      }

      this._complete();
    }
  };

  IFrameRequest.prototype._abort = function() {
    this._iframe.onreadystatechange = null;
    this._iframe.src = "";
  };

  IFrameRequest.prototype._timeout = function() {
    this._timeoutId = null;
    this._abort();

    if (this.ontimeout) {
      this.ontimeout();
    }

    this._complete();
  };

  IFrameRequest.prototype._cancelTimeout = function() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  };

  IFrameRequest.prototype._handleResponse = function() {
    if (!this._isCachedUrlOpen) {
      this._cancelTimeout();

      var document = null;
      var textarea = null;

      try {
        if (this._iframe.contentDocument) {
          document = this._iframe.contentDocument;
        } else if (this._iframe.contentWindow) {
          document = this._iframe.contentWindow.document;
        } else if (this._iframe.document) {
          document = this._iframe.document;
        }

        if (document && document.document) {
          document = document.document;
        }

        if (document) {
          textarea = document.getElementsByTagName("textarea")[0];
        }

        if (textarea) {
          this._responseText = textarea.value;
        }
      } catch(error) {
        // do nothing;
      }
    }
    
    if (this._cacheResponse) {
      IFrameRequest._cachedResponses[this._openArgs.url] = this._responseText;
    }

    if (this._responseText === null && this.onerror) {
      this.onerror(this);
    } else if (this._responseText !== null && this.onsuccess) {
      this.onsuccess(this);
    }

    this._complete();
  };

  IFrameRequest.prototype._onreadystatechange = function(event) {
    event = event || self.event;
    var target = Event.getTarget(event);

    if (event.type == "load" || target.readyState == "complete") {
      // handle the response in a new thread to prevent some problems such as
      // trying to reuse the request from within the 'onreadystatechange' handler
      setTimeout(callback(this, this._handleResponse), 1);
    }
  };

  IFrameRequest.prototype._formMethod_submit = function() {
    this.send();
  };

  IFrameRequest.prototype._formHandler_onsubmit = function(event) {
    event = event || self.event;
    
    var result = true;
    
    if (this._form._IFrameRequest_originalHandler_onsubmit) {
      result = this._form._IFrameRequest_originalHandler_onsubmit(event);
      
      if (result === undefined) {
        result = true;
      }
    }
    
    if (result) {
      this.send();
    }
  };


