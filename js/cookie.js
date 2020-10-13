//##############################################################################
// File: 
//    cookie.js
// Dependencies:
//    utils.js
// Description:
//    Cookie utility
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

function Cookie(name, options) {
  var defaults = {
    document: self.document,
    expires: null,
    path: null,
    domain: null,
    secure: false,
    data: null
  };
  
  options = Object.merge(options, defaults);
  
  this._name = name;
  this._document = options.document;
  this._expires = options.expires === "never" ? new Date(3001, 00, 01, 00, 00, 00) : options.expires;
  this._path = options.path;
  this._domain = options.domain;
  this._secure = options.secure;
  this._data = options.data || new Object();
};

  Cookie.prototype.load = function() {
    var data = this._document.cookie;
    var begin = data.indexOf(this._name + "=");
    
    if (begin != -1) {
      begin += this._name.length + 1;
      var end = data.indexOf(";", begin);
      
      if (end != -1) {
        data = data.substring(begin, end);
      } else {
        data = data.substr(begin);
      }
      
      var data = data.split("&");

      this._data = new Object();
      
      for (var i = 0; i < data.length; ++i) {
        var keyAndValue = data[i].split(":");
        var key = Cookie._unescapeValue(keyAndValue[0]);
        var value = Cookie._unescapeValue(keyAndValue[1]);
        
        this._data[key] = value;
      }
            
      return true;
    }
    
    return false;
  };
  
  Cookie.prototype.save = function() {
    var value = "";
    
    for (var i in this._data) {
      if (this[i] !== null) {
        value += (value.length ? "&" : "") + Cookie._escapeValue(i) + ":" + Cookie._escapeValue(this._data[i].toString());
      }
    }

    var cookie = this._name + "=" + value;
    
    if (this._expires) {
      cookie += ";expires=" + this._expires;
    }

    if (this._path) {
      cookie += ";path=" + this._path;
    }
    
    if (this._domain) {
      cookie += ";domain=" + this._domain;
    }
    
    if (this._secure) {
      cookie += ";secure";
    }
    
    this._document.cookie = cookie + ";";
  };
  
  Cookie.prototype.remove = function() {
    this._document.cookie = this._name + "=;expires=" + (new Date(1970, 00, 01, 00, 00, 00));
  };
  
  Cookie.prototype.getValue = function(key) {
    return this._data[key];
  };
  
  Cookie.prototype.setValue = function(key, value) {
    this._data[key] = value;
  };
  
  Cookie.prototype.removeValue = function(key) {
    delete this._data[key];
  };
  
  Cookie.prototype.getKeys = function() {
    var result = new Array();
    
    for (var i in this._data) {
      result.push(i);
    }
    
    return result;
  };
  
  Cookie.prototype.getData = function() {
    return Object.copy(this._data);
  };
  
  Cookie.prototype.setData = function(data) {
    this._data =  Object.copy(data);
  };
  
  Cookie.prototype.setDefaults = function(defaults) {
    this._data = Object.merge(this._data, defaults);
  };
  
  Cookie._escapeValue = function(value) {
    var replace = {
      "\\[": "[b]",
      "\\&": "[a]",
      "\\=": "[e]",
      "\\;": "[s]",
      "\\:": "[c]"
    };
    
    for (var i in replace) {
      value = value.replace(new RegExp(i, "g"), replace[i]);
    }
    
    return value;
  };
  
  Cookie._unescapeValue = function(value) {
    var replace = {
      "\\[a\\]": "&",
      "\\[e\\]": "=",
      "\\[s\\]": ";",
      "\\[c\\]": ":",
      "\\[b\\]": "["
    };
    
    for (var i in replace) {
      value = value.replace(new RegExp(i, "g"), replace[i]);
    }
    
    return value;
  };


