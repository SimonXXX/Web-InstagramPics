//##############################################################################
// File: 
//    getElements.js
// Dependencies:
//    [none]
// Description:
//    Utility functions for getting elements by various criteria, including
//    CSS selectors.
//##############################################################################
// (c)2005-2006 Jeff Lau
//##############################################################################

function getAllDescendents(elementArray, tagName) {
  if (!tagName) tagName = "*";
  
  var result = new Array();
  
  for (var i = 0, eaLength = elementArray.length; i < eaLength; ++i) {
    // work around IE bug: getElementsByTagName("*") doesn't work
    if (tagName == "*" && elementArray[i].all) {
      var descendents = elementArray[i].all;
    } else {
      var descendents = elementArray[i].getElementsByTagName(tagName);
    }
    
    for (var j = 0, dLength = descendents.length; j < dLength; ++j) {
      if (descendents[j].nodeType == 1) {
        result.push(descendents[j]);
      }
    }
  }
  
  return result;
};

function getAllChildren(elementArray) {
  var result = new Array();
  
  for (var i = 0, eaLength = elementArray.length; i < eaLength; ++i) {
    var children = elementArray[i].childNodes;
    
    for (var j = 0, cLength = children.length; j < cLength; ++j) {
      if (children[j].nodeType == 1) {
        result.push(children[j]);
      }
    }
  }
  
  return result;
};

function filterFirstChildren(elementArray) {
  var result = new Array();
  
  for (var i = 0, eaLength = elementArray.length; i < eaLength; ++i) {
    var isFirst = true;
    
    for (var node = elementArray[i].previousSibling; node; node = node.previousSibling) {
      if (node.nodeType == 1) {
        isFirst = false;
        break;
      }
    }
    
    if (isFirst) {
      result.push(elementArray[i]);
    }
  }
  
  return result;
};

function filterLastChildren(elementArray) {
  var result = new Array();
  
  for (var i = 0, eaLength = elementArray.length; i < eaLength; ++i) {
    var isLast = true;
    
    for (var node = elementArray[i].nextSibling; node; node = node.nextSibling) {
      if (node.nodeType == 1) {
        isLast = false;
        break;
      }
    }
    
    if (isLast) {
      result.push(elementArray[i]);
    }
  }
  
  return result;
};

function getAllAdjacentSiblings(elementArray) {
  var result = new Array();
  
  for (var i = 0, eaLength = elementArray.length; i < eaLength; ++i) {
    for (var node = elementArray[i].nextSibling; node; node = node.nextSibling) {
      if (node.nodeType == 1) {
        result.push(node);
        break;
      }
    }
  }
  
  return result;
};

function getElementsBySelector(pattern, root) {
  if (!root) root = document;
  
  var currentScope = [root];
  var gotTagSelector = false;
  var filterCurrentScope = false;
  var results = new Array();
  var parsePos = 0;
  var validIdRE = /[0-9A-Za-z_\-]/;
  var invalidIdRE = /[^0-9A-Za-z_\-]/;
  
  // strip off leading/trailing spaces
  pattern = new String(/^\s*(.*)\s*$/.exec(pattern)[1]);

  while (parsePos < pattern.length) {
    switch (pattern.charAt(parsePos)) {
      case ' ':
        // skip whitespace
        while (parsePos < pattern.length && pattern.charAt(parsePos) == ' ') {
          ++parsePos; 
        }

        switch (pattern.charAt(parsePos)) {
          case '+':
          case '>':
          case ',':
            // this is just optional space around another 'combinator'
            break;
            
          default:
            // this is a space between two simple selectors, acting as a 'combinator'
            filterCurrentScope = false;
            gotTagSelector = false;
            break;
        }

        break;
        
      case '>':
        ++parsePos;
        
        // skip whitespace
        while (parsePos < pattern.length && pattern.charAt(parsePos) == ' ') {
          ++parsePos; 
        }

        if (!gotTagSelector) {
          return new Array();
        }
        
        currentScope = getAllChildren(currentScope);
        gotTagSelector = false;
        filterCurrentScope = true;
        break;
        
      case '+':
        ++parsePos;
        
        // skip whitespace
        while (parsePos < pattern.length && pattern.charAt(parsePos) == ' ') {
          ++parsePos; 
        }

        if (!gotTagSelector) {
          return new Array();
        }
        
        currentScope = getAllAdjacentSiblings(currentScope);
        gotTagSelector = false;
        filterCurrentScope = true;
        break;
        
      case ',':
        ++parsePos;

        // skip whitespace
        while (parsePos < pattern.length && pattern.charAt(parsePos) == ' ') {
          ++parsePos; 
        }
        
        if (!gotTagSelector) {
          return new Array();
        }
        
        results = results.concat(currentScope);
        currentScope = [root];
        gotTagSelector = false;
        filterCurrentScope = true;
        break;
        
      case '*':
        ++parsePos;
        
        if (gotTagSelector) {
          return new Array();
        }

        if (!filterCurrentScope) {
          currentScope = getAllDescendents(currentScope);
          filterCurrentScope = true;
        }
        
        gotTagSelector = true;
        break;
        
      case '.':
        ++parsePos;
        
        var len = pattern.substr(parsePos).search(invalidIdRE, parsePos);

        if (len == 0) {
          return new Array();
        }

        var className = len == -1 ? pattern.substr(parsePos) : pattern.substr(parsePos, len);
        parsePos += className.length;
        
        if (!gotTagSelector && !filterCurrentScope) {
          currentScope = getAllDescendents(currentScope);
        }

        var tempScope = new Array();
        var search = RegExp("(\\s|^)" + className + "(\\s|$)");
        
        for (var i = 0, csLength = currentScope.length; i < csLength; ++i) {
          if (search.test(currentScope[i].className)) {
            tempScope.push(currentScope[i]);
          }
        }
        
        currentScope = tempScope;
        gotTagSelector = true;
        filterCurrentScope = true;
        break;
        
      case '#':
        ++parsePos;
        
        var len = pattern.substr(parsePos).search(invalidIdRE, parsePos);

        if (len == 0) {
          return new Array();
        }

        var id = len == -1 ? pattern.substr(parsePos) : pattern.substr(parsePos, len);
        parsePos += id.length;
        
        var node = document.getElementById(id);
        var tempScope = new Array();
        
        if (node) {
          if (!gotTagSelector && !filterCurrentScope) {
            currentScope = getAllDescendents(currentScope);
            gotTagSelector = true;
          }

          for (var i = 0, csLength = currentScope.length; i < csLength; ++i) {
            if (currentScope[i] == node) {
              tempScope.push(node);
              break;
            }
          }
        }
        
        currentScope = tempScope;
        gotTagSelector = true;
        filterCurrentScope = true;
        break;
        
      case ':':
        ++parsePos;
        
        var len = pattern.substr(parsePos).search(invalidIdRE, parsePos);

        if (len == 0) {
          return new Array();
        }

        var pseudoElement = len == -1 ? pattern.substr(parsePos) : pattern.substr(parsePos, len);
        parsePos += pseudoElement.length;
        
        var filterFunc = null;
        
        if (/^first-child$/i.test(pseudoElement)) {
          filterFunc = filterFirstChildren;
        } else if (/^last-child$/i.test(pseudoElement)) {
          filterFunc = filterLastChildren;
        } else {
          return new Array();
        }
        
        if (!gotTagSelector && !filterCurrentScope) {
          currentScope = getAllDescendents(currentScope);
          gotTagSelector = true;
        }

        currentScope = filterFunc(currentScope);

        gotTagSelector = true;
        filterCurrentScope = true;
        break;
        
      default:
        if (gotTagSelector) {
          return new Array();
        }

        var len = pattern.substr(parsePos).search(invalidIdRE, parsePos);

        if (len == 0) {
          return new Array();
        }

        var tagName = len == -1 ? pattern.substr(parsePos) : pattern.substr(parsePos, len);
        parsePos += tagName.length;
        
        if (tagName.length == 0) {
          return new Array();
        }
        
        if (/^root$/i.test(tagName)) {
          if (currentScope[0] != root) {
            return new Array();
          }
        } else {
          if (!filterCurrentScope) {
            currentScope = getAllDescendents(currentScope, tagName);
          } else {
            var tempScope = new Array();
            var search = RegExp("^" + tagName + "$", "i");
            
            for (var i = 0, csLength = currentScope.length; i < csLength; ++i) {
              if (search.test(currentScope[i].tagName)) {
                tempScope.push(currentScope[i]);
              }
            }
            
            currentScope = tempScope;
          }
        }

        gotTagSelector = true;
        filterCurrentScope = true;
        break;
    }
  }
  
  return results.concat(currentScope);
};


