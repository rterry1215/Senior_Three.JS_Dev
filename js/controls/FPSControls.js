var FPSControls = function(params){
  this.isControl = true;
  this.isFPSControls = true;
  this.reusableVec2 = new THREE.Vector2();
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
    {key: "Down", action: this.goBackward},
    {key: "Space", action: this.jump}
  ];
  this.playerBodyObject = params.playerBodyObject;
  this.mouseSpeed = params.mouseSpeed;
  this.touchLookSpeed = params.touchLookSpeed;
  this.speed = params.speed;
  this.jumpSpeed = params.jumpSpeed;
  this.jumpAgainTimeThreshold = params.jumpAgainTimeThreshold;
  this.touchJoystickThreshold = params.touchJoystickThreshold;
  this.touchJoystickDegreeInterval = params.touchJoystickDegreeInterval;
  this.crosshairName = params.crosshairName;
}

FPSControls.prototype.onClick = noop;
FPSControls.prototype.onSwipe = noop;
FPSControls.prototype.onPinch = noop;
FPSControls.prototype.onMouseWheel = noop;
FPSControls.prototype.onMouseDown = noop;
FPSControls.prototype.onMouseUp = noop;
FPSControls.prototype.onActivated = noop;

FPSControls.prototype.jump = function(){
  var skip = false;
  var now = performance.now();
  if (activeControl.lastJumpTime){
    if (now - activeControl.lastJumpTime < activeControl.jumpAgainTimeThreshold){
      skip = true;
    }
  }
  if (!skip){
    activeControl.playerBodyObject.setVelocityY(activeControl.jumpSpeed);
    activeControl.lastJumpTime = now;
  }
}

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

FPSControls.prototype.onLeftHandFinger = function(touch){
  var degreeInterval = activeControl.touchJoystickDegreeInterval;
  var oldTouch = activeControl.touchTrack.get(touch.identifier);
  activeControl.reusableVec2.set((touch.pageX - oldTouch.pageX), (touch.pageY - oldTouch.pageY));
  if(activeControl.reusableVec2.length() <= activeControl.touchJoystickThreshold){
    return;
  }
  var angleInDegrees = THREE.Math.RAD2DEG * activeControl.reusableVec2.angle();
  if (angleInDegrees <= degreeInterval || angleInDegrees >= (360 - degreeInterval)){
    activeControl.joystickStatus.right = true;
    activeControl.joystickStatus.left = false;
    activeControl.joystickStatus.top = false;
    activeControl.joystickStatus.down = false;
  }else if (angleInDegrees >= (180 - degreeInterval) && angleInDegrees <= (180 + degreeInterval)){
    activeControl.joystickStatus.left = true;
    activeControl.joystickStatus.right = false;
    activeControl.joystickStatus.top = false;
    activeControl.joystickStatus.down = false;
  }else if (angleInDegrees >= (270 - degreeInterval) && angleInDegrees <= (270 + degreeInterval)){
    activeControl.joystickStatus.up = true;
    activeControl.joystickStatus.right = false;
    activeControl.joystickStatus.left = false;
    activeControl.joystickStatus.down = false;
  }else if (angleInDegrees >= (90 - degreeInterval) && angleInDegrees <= (90 + degreeInterval)){
    activeControl.joystickStatus.down = true;
    activeControl.joystickStatus.up = false;
    activeControl.joystickStatus.right = false;
    activeControl.joystickStatus.left = false;
  }else if (angleInDegrees >= (270 + degreeInterval) && angleInDegrees <= (360 - degreeInterval)){
    activeControl.joystickStatus.right = true;
    activeControl.joystickStatus.up = true;
    activeControl.joystickStatus.left = false;
    activeControl.joystickStatus.down = false;
  }else if (angleInDegrees >= (90 + degreeInterval) && angleInDegrees <= (180 - degreeInterval)){
    activeControl.joystickStatus.left = true;
    activeControl.joystickStatus.down = true;
    activeControl.joystickStatus.up = false;
    activeControl.joystickStatus.right = false;
  }else if (angleInDegrees >= (180 + degreeInterval) && angleInDegrees <= (270 - degreeInterval)){
    activeControl.joystickStatus.left = true;
    activeControl.joystickStatus.up = true;
    activeControl.joystickStatus.down = false;
    activeControl.joystickStatus.right = false;
  }else if (angleInDegrees >= (degreeInterval) && angleInDegrees <= (90 - degreeInterval)){
    activeControl.joystickStatus.right = true;
    activeControl.joystickStatus.down = true;
    activeControl.joystickStatus.left = false;
    activeControl.joystickStatus.up = false;
  }
}

FPSControls.prototype.onRightHandFinger = function(touch){
  var oldTouch = activeControl.touchTrack.get(touch.identifier);
  var movementX = (touch.pageX - oldTouch.pageX);
  var movementY = (touch.pageY - oldTouch.pageY);
  var dx = -(movementX * activeControl.touchLookSpeed);
  camera.rotation.y += dx;
  activeControl.alpha -= dx;
  var dy = -movementY * activeControl.touchLookSpeed;
  if (!(dy > 0 && (activeControl.totalXRotation + dy >= 1.10)) && !(dy <0 && (activeControl.totalXRotation + dy <= -1.10))){
    camera.rotation.x += dy;
    activeControl.totalXRotation += dy;
  }
}

FPSControls.prototype.isTouchOnTheRightSide = function(touch){
  var curViewport = renderer.getCurrentViewport();
  var centerX = (curViewport.x + (curViewport.z / screenResolution)) / 2;
  var centerY = (curViewport.y + (curViewport.w / screenResolution)) / 2;
  var clientX = touch.clientX;
  var clientY = touch.clientY;
  return clientX >= centerX;
}

FPSControls.prototype.onTouchMove = function(event){
  var size = activeControl.touchTrack.size;
  if (size != 1 && size != 2){
    return;
  }
  for (var i = 0; i<event.changedTouches.length; i++){
    var curTouch = event.changedTouches[i];
    if (!activeControl.touchTrack.has(curTouch.identifier)){
      activeControl.touchTrack.set(curTouch.identifier, curTouch);
      continue;
    }
    if (activeControl.isTouchOnTheRightSide(curTouch)){
      activeControl.onRightHandFinger(curTouch);
    }else{
      activeControl.onLeftHandFinger(curTouch);
    }
    activeControl.touchTrack.set(curTouch.identifier, curTouch);
  }
}

FPSControls.prototype.onTouchEnd = function(event){
  for (var i = 0; i<event.changedTouches.length; i++){
    var curTouch = event.changedTouches[i];
    activeControl.touchTrack.delete(curTouch.identifier);
    if (!activeControl.isTouchOnTheRightSide(curTouch)){
      activeControl.resetJoystickStatus();
    }
  }
}

FPSControls.prototype.update = function(){
  camera.position.copy(this.playerBodyObject.mesh.position);
  this.playerBodyObject.setVelocityX(0);
  this.playerBodyObject.setVelocityZ(0);
  this.xVelocity = 0;
  this.zVelocity = 0;
  if (!isMobile){
    var len = this.keyboardActions.length;
    for (var i = 0; i<len; i++){
      var curAction = this.keyboardActions[i];
      if (keyboardBuffer[curAction.key]){
        curAction.action();
      }
    }
  }else{
    if (this.joystickStatus.up){
      this.goForward();
    }
    if (this.joystickStatus.down){
      this.goBackward();
    }
    if (this.joystickStatus.right){
      this.goRight();
    }
    if (this.joystickStatus.left){
      this.goLeft();
    }
  }
  this.playerBodyObject.setVelocityX((this.xVelocity * Math.cos(this.alpha)) - (this.zVelocity * Math.sin(this.alpha)));
  this.playerBodyObject.setVelocityZ((this.xVelocity * Math.sin(this.alpha)) + (this.zVelocity * Math.cos(this.alpha)));
}

FPSControls.prototype.resetJoystickStatus = function(){
  activeControl.joystickStatus.left = false;
  activeControl.joystickStatus.right = false;
  activeControl.joystickStatus.up = false;
  activeControl.joystickStatus.down = false;
}

FPSControls.prototype.onTap = function(touch){
  if (activeControl.isTouchOnTheRightSide(touch)){
    activeControl.jump();
  }
}

FPSControls.prototype.onActivated = function(){
  this.joystickStatus = {
    right: false, left: false, up: false, down: false
  };
  this.lastJumpTime = 0;
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
