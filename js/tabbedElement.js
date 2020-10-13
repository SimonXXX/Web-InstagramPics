/* 
 * REQUIRES:
 *   TabbedElement.css
 *   LeakManager.js
 */

/**
 * TabbedElement creates and manages a component that allows the user to switch
 * between several "pages" of content by clicking on labeled tabs.  The 
 * component will occupy the space provided by a specified DIV element; be sure
 * to leave room above the DIV for the tabs.
 *
 * @param containerDiv a DIV node for the component to occupy
 * @param managementData an Object that will be passed to event handlers (optional)
 *
 * @constructor
 * @author Jeff Lau
 */
function TabbedElement(containerDiv, managementData, styleClass) {
  var tabContainer = containerDiv.appendChild(document.createElement("div"));
  
  containerDiv.className = styleClass || "tabbedElement";
  tabContainer.className = "tab-container";
  
  this._containerDiv = containerDiv;
  this._tabContainerDiv = tabContainer;
  this._tabs = new Array();
  this._managementData = managementData;
  this._flashingFunctions = new Object();
  this._selectedIndex = -1;
}

/**
 * Adds a new tab and associated content to the tabbed component.
 *
 * @param tabName a String label for the content.
 * @param pageContent an HTMLNode to be displayed when this tab is selected.
 *
 * @type String
 * @returns an ID that identifies the new tab.
 */
TabbedElement.prototype.addTab = function(tabName, pageContent, iconUrl) {
  return this.insertTab(this._tabs.length, tabName, pageContent, iconUrl);
};

/**
 * Inserts a new tab and associated content to the tabbed component before the
 * tab indicated by tabSelector.
 *
 * @param tabSelector a String tab ID, or an Integer tab index 
 * @param tabName a String label for the content.
 * @param pageContent an HTMLNode to be displayed when this tab is selected.
 * @param iconUrl (optional) a String containing an image URL
 *
 * @type String
 * @returns an ID that identifies the new tab.
 */
TabbedElement.prototype.insertTab = function(tabSelector, tabName, pageContent, iconUrl) {
  var tabIndex = this.getTabIndex(tabSelector);

  // ensure the index is within the valid range
  tabIndex = Math.min(Math.max(tabIndex, 0), this._tabs.length);
  
  // create the tab
  var tabDiv
  
  if (tabIndex == this._tabs.length) {
    tabDiv = this._tabContainerDiv.appendChild(document.createElement("div"));
  } else {
    tabDiv = this._tabContainerDiv.insertBefore(document.createElement("div"), 
                                                this._tabs[tabIndex].tabDiv);
  }
  
  // add an optional icon to the tab
  if (iconUrl) {
    var icon = tabDiv.appendChild(document.createElement("img"));
    icon.src = iconUrl;
    icon.className = "tab-icon";
  }
  
  tabDiv.appendChild(document.createTextNode(tabName));
  tabDiv.id = "TabbedElementTab_" + (TabbedElement._tabCount++);
  
  // make the tab useful
  tabDiv.onclick = TabbedElement._createTabHandler_onclick(this);
                              
  tabDiv.onselectstart = TabbedElement._tabHandler_onselectstart;
  tabDiv.onmouseover = TabbedElement._tabHandler_onmouseover;
  tabDiv.onmouseout = TabbedElement._tabHandler_onmouseout;
  
  // create a containing div for the page content (so each page has its own scrollbars)
  var pageContainer = document.createElement("div");
  pageContainer.className = "page-container";
  pageContainer.style.display = "none";
  
  pageContainer.appendChild(pageContent);
  this._containerDiv.appendChild(pageContainer);

  // save info about this tab
  var tabInfo = new Object();
  tabInfo.id = tabDiv.id;
  tabInfo.tabDiv = tabDiv;
  tabInfo.pageContainer = pageContainer;
  this._tabs.splice(tabIndex, 0, tabInfo);
  
  // adjust the selected index if necessary
  if (this._selectedIndex >= tabIndex) {
    ++this._selectedIndex;
  }
  
  // if this is the first tab to be added, then select it
  if (this.getTabCount() == 1) {
    this.setSelectedTab(0);
  } else {
    this._setTabClasses();
  }
  
  return tabDiv.id;
};

/**
 * Removes the tab indicated by tabSelector.
 *
 * @param tabSelector a String tab ID, or an Integer tab index 
 *
 * @type Boolean
 * @returns true if the tab was successfully removed.
 */
TabbedElement.prototype.removeTab = function(tabSelector) {
  var tabIndex = this.getTabIndex(tabSelector);
  
  // fail if index is out of range
  if (tabIndex < 0 || tabIndex >= this._tabs.length) {
    return false;
  }

  var tabInfo = this._tabs[tabIndex];
  
  // remove the tab and its content
  this._tabs.splice(tabIndex, 1);
  this._tabContainerDiv.removeChild(tabInfo.tabDiv);
  this._containerDiv.removeChild(tabInfo.pageContainer);

  // select the nearest remaining tab
  var newIndex = this._selectedIndex; 
  
  if (newIndex >= this._tabs.length) {
    --newIndex;
  }
  
  this._selectedIndex = -1;
  
  this.setSelectedTab(newIndex);
  
  return true;
};

/**
 * @param tabIndex an Integer index of a tab.
 *
 * @type String
 * @returns the ID of the specified tab, or null if it doesn't exist.
 */
TabbedElement.prototype.getTabId = function(tabIndex) {
  if (tabIndex.constructor == String) {
    return tabIndex;
  }
  
  if (tabIndex < 0 || tabIndex >= this._tabs.length) {
    return null;
  }
  
  return this._tabs[tabIndex].id;
};

/**
 * @param tabId a String ID of a tab.
 *
 * @type Integer
 * @returns the index of the specified tab, or -1 if it doesn't exist.
 */
TabbedElement.prototype.getTabIndex = function(tabId) {
  if (tabId.constructor == String) {
    for (var i = 0; i < this._tabs.length; ++i) {
      if (this._tabs[i].id == tabId) {
        return i;
      }
    }
    
    return -1;
  }

  return tabId;
};

/**
 * @type Integer
 * @returns the index of the currently selected tab.
 */
TabbedElement.prototype.getSelectedIndex = function() {
  return this._selectedIndex;
};

/**
 * @type String
 * @returns the ID of the currently selected tab.
 */
TabbedElement.prototype.getSelectedId = function() {
  return this.getTabId(this._selectedIndex);
};

/**
 * @type Integer
 * @returns the number of tabs.
 */
TabbedElement.prototype.getTabCount = function() {
  return this._tabs.length;
};

/**
 * Displays the content associated with the tab indicated by tabSelector.
 *
 * @param tabSelector a String tab ID, or an Integer tab index 
 * @param invokedByUser will be true when the the event is called in response to 
 *        the user selecting a tab. This parameter can be omitted when calling 
 *        this function from other code.
 *
 * @type Boolean
 * @returns true if the selected tab has changed.
 */
TabbedElement.prototype.setSelectedTab = function(tabSelector, invokedByUser) {
  var tabIndex = this.getTabIndex(tabSelector);

  // fail if the tab number is invalid
  if (tabIndex < 0 || tabIndex == this._selectedIndex || tabIndex >= this._tabs.length) {
    return false;
  }
  
  // unselect the current tab
  if (this._selectedIndex != -1) {
    if (!this.onbeforechange(tabIndex, this._managementData, invokedByUser)) {
      return false;
    }
    
    this._tabs[this._selectedIndex].pageContainer.style.display = "none";
  }

  var oldIndex = this._selectedIndex;
  
  // set the new selected tab value
  this._selectedIndex = tabIndex;

  // select the specified tab
  this._tabs[this._selectedIndex].pageContainer.style.display = "block";

  this._setTabClasses();

  this.onchange(oldIndex, this._managementData, invokedByUser);
  
  return true;
};

/**
 * Changes the text color and/or background color of the tab indicated by
 * tabSelector. An empty string ("") color value will cause the default CSS color 
 * to be used. A null color value will cause that color to be unchanged.
 *
 * @param tabSelector a String tab ID, or an Integer tab index
 * @param txtColor a String color value for the text color.
 * @param bgColor a String color value for the background color.
 *
 * @type Boolean
 * @returns true on success.
 */
TabbedElement.prototype.setTabColors = function(tabSelector, txtColor, bgColor) {
  var tabId = this.getTabId(tabSelector);
  
  if (!tabId) {
    return false;
  }
  
  var tabDiv = document.getElementById(tabId);
  
  if (txtColor) {
    if (tabDiv._tab_flashing) {
      tabDiv._tab_color = txtColor;
    } else {
      tabDiv.style.color = txtColor;
    }
  }
  
  if (bgColor) {
    if (tabDiv._tab_flashing) {
      tabDiv._tab_backgroundColor = bgColor;
    } else {
      tabDiv.style.backgroundColor = bgColor;
    }
  }
  
  return true;
};

/**
 * Causes the tab indicated by tabSelector to alternate between its normal colors
 * and the specified colors.
 *
 * @param tabSelector a String tab ID, or an Integer tab index
 * @param interval an Integer time interval (in milliseconds) indicating how often
 *        colors should alternate.
 * @param txtColor a String color value for the text color.
 * @param bgColor a String color value for the background color.
 *
 * @type Boolean
 * @returns true on success.
 */
TabbedElement.prototype.startFlashingTab = function(tabSelector, interval, txtColor, bgColor) {
  var tabId = this.getTabId(tabSelector);
  
  if (!tabId) {
    return false;
  }
  
  this.stopFlashingTab(tabId);
  
  var tabDiv = document.getElementById(tabId);
  
  tabDiv._tab_color = tabDiv.style.color;
  tabDiv._tab_backgroundColor = tabDiv.style.backgroundColor;
  tabDiv._tab_flashing = false;
  
  this._flashingFunctions[tabId] = setInterval(TabbedElement._createTabFlasher(tabDiv, txtColor, bgColor),
                                               interval);
  
  return true;
};

/**
 * Returns the tab indicated by tabSelector to its normal colors and stops the
 * flashing.
 *
 * @param tabSelector a String tab ID, or an Integer tab index
 *
 * @type Boolean
 * @returns true on success.
 */
TabbedElement.prototype.stopFlashingTab = function(tabSelector) {
  var tabId = this.getTabId(tabSelector);

  if (!tabId || !this._flashingFunctions[tabId]) {
    return false;
  }
  
  clearInterval(this._flashingFunctions[tabId]);
  delete this._flashingFunctions[tabId];
  
  var tabDiv = document.getElementById(tabId);

  if (tabDiv._tab_flashing) {
    tabDiv.style.color = tabDiv._tab_color;
    tabDiv.style.backgroundColor = tabDiv._tab_backgroundColor;
  };
  
  tabDiv._tab_flashing = null;
  tabDiv._tab_color = null;
  tabDiv._tab_backgroundColor = null;
  
  return true;
};

/**
 * @private
 */
TabbedElement._createTabFlasher = function(tabDiv, txtColor, bgColor) {
  return function() {
    if (tabDiv._tab_flashing) {
      if (txtColor) {
        tabDiv.style.color = tabDiv._tab_color;
      }
      
      if (bgColor) {
        tabDiv.style.backgroundColor = tabDiv._tab_backgroundColor;
      }
      
      tabDiv._tab_flashing = false;
    } else {
      if (txtColor) {
        tabDiv.style.color = txtColor;
      }
      
      if (bgColor) {
        tabDiv.style.backgroundColor = bgColor;
      }
      
      tabDiv._tab_flashing = true;
    }
  };
};

/**
 * This is the default event handler that will be called before the selected tab
 * is changed.
 *
 * @param newTabIndex an Integer indicating the index of the new tab that has been requested.
 * @param managementData an Object that was passed into the constructor of the 
 *        TabbedElement. 
 * @param invokedByUser will be true when the the event is called in response to 
 *        the user selecting a tab.
 *
 * @type Boolean
 * @returns false to prevent the selection from occuring.
 */
TabbedElement.prototype.onbeforechange = function(newTabIndex, managementData, invokedByUser) {
  return true;
};

/**
 * This is the default event handler that will be called after the selected tab
 * is changed.
 *
 * @param oldTabIndex an Integer indicating the index of previously selected tab.
 * @param managementData an Object that was passed into the constructor of the 
 *        TabbedElement. 
 * @param invokedByUser will be true when the the event is called in response to 
 *        the user selecting a tab.
 */
TabbedElement.prototype.onchange = function(oldTabIndex, managementData, invokedByUser) {
};

/**
 * @private
 */
TabbedElement.prototype._setTabClasses = function() {
  for (var i = 0; i < this._tabs.length; ++i) {
    if (i == this.getSelectedIndex()) {
      this._tabs[i].tabDiv.className = "tab selected";
    } else if(i > this.getSelectedIndex()) {
      this._tabs[i].tabDiv.className = "tab right-of-selected";
      
      if(i == this.getSelectedIndex() + 1) {
        this._tabs[i].tabDiv.className += " directly-right-of-selected";
      }
    } else {
      this._tabs[i].tabDiv.className = "tab left-of-selected";
      
      if(i == this.getSelectedIndex() - 1) {
        this._tabs[i].tabDiv.className += " directly-left-of-selected";
      }
    }
  }
};

/**
 * @param tabbedElement a TabbedElement.
 * @param tabIndex an Integer.
 *
 * @type Function
 * @returns a function that will set the TabbedElement's selected tab when called.
 *
 * @private
 */
TabbedElement._createTabHandler_onclick = function(tabbedElement) {
  return function() {
    tabbedElement.setSelectedTab(this.id, true);
         };
};

/**
 * @private
 */
TabbedElement._tabHandler_onselectstart = function(event) {
  if (!event) event = window.event;
  
  event.cancelBubble = true;
  
  if (event.stopPropagation) {
    event.stopPropagation();
  }
};

/**
 * @private
 */
TabbedElement._tabHandler_onmouseover = function() {
  if (this.className.indexOf(" hover") == -1) {
    this.className += " hover";
  }
};

/**
 * @private
 */
TabbedElement._tabHandler_onmouseout = function() {
  var index = this.className.indexOf(" hover");
  
  if (index != -1) {
    this.className = this.className.substr(0, index);
  }
};

/**
 * Used internally to generate unique tab IDs.
 *
 * @type Integer
 * @private
 */
TabbedElement._tabCount = 0;

