function $load(params) {
  var images = params.images || [];
  var scripts = params.scripts || [];
  var loadData = { id: $load._nextId++, totalCount: 0, totalLoaded: 0, imageCache: [] };

  loadData.totalCount += images.length;
  loadData.totalCount += scripts.length;

  loadData.onload = params.onload || new Function();
  loadData.oncomplete = params.oncomplete || new Function();
  
  loadData.onload(0, loadData.totalCount);
  
  var resourceLoaded = $load._createMethod_resourceLoaded(loadData);
  $load._resourceLoaded[loadData.id] = resourceLoaded;

  //
  // images
  //
  
  if (!self.ActiveXObject) {
    var container = document.createElement("div");

    container.id = "image_cache";
    container.style.display = "none";
    document.body.appendChild(container);
  }
  
  for (var i = 0; i < images.length; ++i) {
    var image = self.ActiveXObject ? new Image() : document.createElement("img");

    image.onload = resourceLoaded;
    image.onabort = resourceLoaded;
    image.onerror = resourceLoaded;
    image.src = images[i];
    
    if (self.ActiveXObject) {
      loadData.imageCache.push(image);
    } else {
      container.appendChild(image);
    }
  }
  
  //
  // scripts
  //
  var head = document.getElementsByTagName("head")[0];

  for (var i = 0; i < scripts.length; ++i) {
    var script = document.createElement("script");

    if (self.ActiveXObject) {
      script.onreadystatechange = resourceLoaded;
    }

    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", scripts[i]);
    head.appendChild(script);

    if (!self.ActiveXObject) {
      var script = document.createElement("script");

      script.setAttribute("type", "text/javascript");
      script.appendChild(document.createTextNode("$load._resourceLoaded[" + loadData.id + "]({type: \"load\"})"));
      head.appendChild(script);
    }
  }
}

$load._createMethod_resourceLoaded = function(loadData) {
  return function(event) {
    event || (event = self.event);
    var target = event.target || event.srcElement;
    
    if (event.type == "load" || target.readyState == "loaded") {
      var loaded = ++loadData.totalLoaded;

      loadData.onload(loaded, loadData.totalCount);

      if (loaded == loadData.totalCount) {
        //delete $load._resourceLoaded[loadData.id];
        setTimeout(loadData.oncomplete, 0);
      }
    }
  };
};

$load._nextId || ($load._nextId = 0);

$load._resourceLoaded || ($load._resourceLoaded = {});

