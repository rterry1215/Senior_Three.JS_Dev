var Scene = function(name){
  this.name = name;
  this.addedObjects = new Object();
  this.objectGroups = new Object();
  this.gridSystems = new Object();
  this.markedPoints = new Object();
  this.areas = new Object();
  this.areaBinHandler = new WorldBinHandler(true);
  this.areaBinHandler.isAreaBinHandler = true;
}

Scene.prototype.registerAddedObject = function(addedObject){
  this.addedObjects[addedObject.name] = addedObject;
  addedObject.registeredSceneName = this.name;
}

Scene.prototype.unregisterAddedObject = function(addedObject){
  delete this.addedObjects[addedObject.name];
  delete addedObject.registeredSceneName;
}

Scene.prototype.registerArea = function(area){
  this.areas[area.name] = area;
  area.registeredSceneName = this.name;
}

Scene.prototype.unregisterArea = function(area){
  delete this.areas[area.name];
  delete area.registeredSceneName;
}

Scene.prototype.registerGridSystem = function(gridSystem){
  this.gridSystems[gridSystem.name] = gridSystem;
  gridSystem.registeredSceneName = this.name;
}

Scene.prototype.unregisterGridSystem = function(gridSystem){
  delete this.gridSystems[gridSystem.name];
  delete gridSystem.registeredSceneName;
}

Scene.prototype.registerWallCollection = function(wallCollection){
  for (var i = 0; i<wallCollection.gridSystemNames.length; i++){
    this.registerGridSystem(gridSystems[wallCollection.gridSystemNames[i]]);
  }
  wallCollection.registeredSceneName = this.name;
}

Scene.prototype.unregisterWallCollection = function(wallCollection){
  for (var i = 0; i<wallCollection.gridSystemNames.length; i++){
    this.unregisterGridSystem(gridSystems[wallCollection.gridSystemNames[i]]);
  }
  delete wallCollection.registeredSceneName;
}

Scene.prototype.registerMarkedPoint = function(markedPoint){
  this.markedPoints[markedPoint.name] = markedPoint;
  markedPoint.registeredSceneName = this.name;
}

Scene.prototype.unregisterMarkedPoint = function(markedPoint){
  delete this.markedPoints[markedPoint.name];
  delete markedPoint.registeredSceneName;
}
