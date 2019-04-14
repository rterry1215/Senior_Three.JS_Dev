var FPSControls = function(params){
  this.isControl = true;
  this.isFPSControls = true;
  this.keyboardActions = [
    {key: "A", action: this.goLeft},
    {key: "Q", action: this.goLeft},
    {key: "D", action: this.goRight},
    {key: "W", action: this.goForward},
    {key: "Z", action: this.goForward},
    {key: "S", action: this.goBackward},
    {key: "Up", action: this.goForward},
    {key: "Right", action: this.goRight},
    {key: "Left", action: this.goLeft},
    {key: "Down", action: this.goBackward}
  ];
  this.playerBodyObject = params.playerBodyObject;
  this.mouseSpeed = params.mouseSpeed;
  this.touchLookSpeed = params.touchLookSpeed;
  this.speed = params.speed;
}

FPSControls.prototype.onClick = noop;
FPSControls.prototype.onTap = noop;
FPSControls.prototype.onSwipe = noop;
FPSControls.prototype.onPinch = noop;
FPSControls.prototype.onMouseWheel = noop;
FPSControls.prototype.onMouseDown = noop;
FPSControls.prototype.onMouseUp = noop;
FPSControls.prototype.onActivated = noop;

FPSControls.prototype.goBackward = function(){
  if (activeControl.zVelocity == activeControl.speed){
    return;
  }
  activeControl.zVelocity += activeControl.speed;
}

FPSControls.prototype.goForward = function(){
  if (activeControl.zVelocity == -activeControl.speed){
    return;
  }
  activeControl.zVelocity -= activeControl.speed;
}

FPSControls.prototype.goLeft = function(){
  if (activeControl.xVelocity == -activeControl.speed){
    return;
  }
  activeControl.xVelocity -= activeControl.speed;
}

FPSControls.prototype.goRight = function(){
  if (activeControl.xVelocity == activeControl.speed){
    return;
  }
  activeControl.xVelocity += activeControl.speed;
}

FPSControls.prototype.onPointerLockChange = function(isPointerLocked){
  if (!isPointerLocked){
    pointerLockRequested = true;
  }
  this.isPointerLocked = isPointerLocked;
}

FPSControls.prototype.onMouseMove = function(event){
  if (!this.isPointerLocked){
    return;
  }
  var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
  var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
  var dx = (-movementX * this.mouseSpeed);
  camera.rotation.y += dx;
  this.alpha -= dx;
  var dy = -movementY * this.mouseSpeed;
  if (!(dy > 0 && (this.totalXRotation + dy >= 1.10)) && !(dy <0 && (this.totalXRotation + dy <= -1.10))){
    camera.rotation.x += dy;
    this.totalXRotation += dy;
  }
}

FPSControls.prototype.onTouchStart = function(event){
  for (var i = 0; i<event.changedTouches.length; i++){
    var curTouch = event.changedTouches[i];
    activeControl.touchTrack.set(curTouch.identifier, curTouch);
  }
}

FPSControls.prototype.onRightHandFinger = function(touch){
  var oldTouch = activeControl.touchTrack.get(touch.identifier);
  var movementX = (touch.pageX - oldTouch.pageX);
  var movementY = (touch.pageY - oldTouch.pageY);
  var dx = (movementX * activeControl.touchLookSpeed);
  camera.rotation.y += dx;
  activeControl.alpha -= dx;
  var dy = movementY * activeControl.touchLookSpeed;
  if (!(dy > 0 && (activeControl.totalXRotation + dy >= 1.10)) && !(dy <0 && (activeControl.totalXRotation + dy <= -1.10))){
    camera.rotation.x += dy;
    activeControl.totalXRotation += dy;
  }
}

FPSControls.prototype.onTouchMove = function(event){
  var size = activeControl.touchTrack.size;
  if (size != 1 && size != 2){
    return;
  }
  var curViewport = renderer.getCurrentViewport();
  var centerX = (curViewport.x + (curViewport.z / screenResolution)) / 2;
  var centerY = (curViewport.y + (curViewport.w / screenResolution)) / 2;
  for (var i = 0; i<event.changedTouches.length; i++){
    var curTouch = event.changedTouches[i];
    if (!activeControl.touchTrack.has(curTouch.identifier)){
      activeControl.touchTrack.set(curTouch.identifier, curTouch);
      continue;
    }
    var clientX = curTouch.clientX;
    var clientY = curTouch.clientY;
    if (clientX >= centerX){
      activeControl.onRightHandFinger(curTouch);
    }
    activeControl.touchTrack.set(curTouch.identifier, curTouch);
  }
}

FPSControls.prototype.onTouchEnd = function(event){
  for (var i = 0; i<event.changedTouches.length; i++){
    activeControl.touchTrack.delete(event.changedTouches[i].identifier);
  }
}

FPSControls.prototype.update = function(){
  camera.position.copy(this.playerBodyObject.mesh.position);
  var len = this.keyboardActions.length;
  this.playerBodyObject.setVelocityX(0);
  this.playerBodyObject.setVelocityZ(0);
  this.xVelocity = 0;
  this.zVelocity = 0;
  for (var i = 0; i<len; i++){
    var curAction = this.keyboardActions[i];
    if (keyboardBuffer[curAction.key]){
      curAction.action();
    }
  }
  this.playerBodyObject.setVelocityX((this.xVelocity * Math.cos(this.alpha)) - (this.zVelocity * Math.sin(this.alpha)));
  this.playerBodyObject.setVelocityZ((this.xVelocity * Math.sin(this.alpha)) + (this.zVelocity * Math.cos(this.alpha)));
}

FPSControls.prototype.onActivated = function(){
  this.touchTrack = new Map();
  camera.quaternion.set(0, 0, 0, 1);
  this.totalXRotation = 0;
  this.alpha = 0;
  this.playerBodyObject.show();
  this.playerBodyObject.hide(true);
  if (!pointerLockEventHandler.isPointerLocked){
    pointerLockRequested = true;
    this.isPointerLocked = false;
  }else{
    this.isPointerLocked = true;
  }
}
