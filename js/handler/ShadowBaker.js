var ShadowBaker = function(){
  this.qualities = {
    "HIGH": "HIGH",
    "MEDIUM": "MEDIUM",
    "LOW": "LOW"
  };
}

ShadowBaker.prototype.reset = function(){

}

ShadowBaker.prototype.getCanvasFromQuality = function(quality){
  var shadowCanvas = document.createElement("canvas");

  if (quality == this.qualities.HIGH){
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
  }else if (quality == this.qualities.MEDIUM){
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
  }else{
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
  }

  return shadowCanvas;
}

ShadowBaker.prototype.bakeShadow = function(obj, lightInfo, shadowIntensity, quality){
  if (!this.isSupported(obj)){
    return false;
  }

  var oldBinSize = BIN_SIZE;
  var oldRaycasterStep = RAYCASTER_STEP_AMOUNT;

  BIN_SIZE = 20;
  RAYCASTER_STEP_AMOUNT = 10;

  this.rayCaster = new RayCaster();
  this.rayCaster.refresh();

  if (obj.isAddedObject && obj.type == "surface"){
    this.bakeSurfaceShadow(obj, lightInfo, shadowIntensity, quality);
  }

  BIN_SIZE = oldBinSize;
  RAYCASTER_STEP_AMOUNT = oldRaycasterStep;
}

ShadowBaker.prototype.isSupported = function(obj){
  if (obj.isAddedObject && obj.type == "surface"){
    return true;
  }

  return false;
}

ShadowBaker.prototype.bakeSurfaceShadow = function(obj, lightInfo, shadowIntensity, quality){
  var uvs = obj.mesh.geometry.attributes.uv.array;
  var positions = obj.mesh.geometry.attributes.position.array;
  var uvsConstructed = [];
  var positionsConstructed = [];
  var firstIndex = 0;
  var lastIndex = 0;

  for (var i = 0; i < uvs.length; i += 2){
    var uv = new THREE.Vector2(uvs[i], uvs[i + 1]);
    uvsConstructed.push(uv);

    if (uv.x == 0 && uv.y == 0){
      firstIndex = uvsConstructed.length - 1;
    }
    if (uv.x == 1 && uv.y == 1){
      lastIndex = uvsConstructed.length - 1;
    }
  }

  for (var i = 0; i < positions.length; i += 3){
    var position = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
    positionsConstructed.push(position);
  }

  obj.mesh.updateMatrixWorld(true);

  var firstLocal = positionsConstructed[firstIndex].clone();
  var lastLocal = positionsConstructed[lastIndex].clone();
  var firstWorld = firstLocal.applyMatrix4(obj.mesh.matrixWorld);
  var lastWorld = lastLocal.applyMatrix4(obj.mesh.matrixWorld);

  var shadowCanvas = this.getCanvasFromQuality(quality);
  var ctx = shadowCanvas.getContext('2d');
  ctx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);

  var imageData = ctx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height);
  var pixels = imageData.data;

  var pixelIndex = 0;
  var iterCount = 0;

  var lightPos;
  var objPos = obj.mesh.position;
  if (lightInfo.type == "point"){
    var light = lightHandler.staticPointLightsBySlotId[lightInfo.slotID];
    lightPos = new THREE.Vector3(light.positionX, light.positionY, light.positionZ);
  }

  for (var i1 = 0; i1 < 1; i1 += 1 / shadowCanvas.width){
    for (var i2 = 0; i2 < 1; i2 += 1 / shadowCanvas.height){
      var curX = firstWorld.clone().lerp(lastWorld, i1).x;
      var curZ = firstWorld.clone().lerp(lastWorld, i2).z;

      if (lightInfo.type == "point"){
        var fromVector = lightPos;
        var directionVector = new THREE.Vector3(curX - lightPos.x, obj.mesh.position.y - lightPos.y, curZ - lightPos.z).normalize();
        this.rayCaster.findIntersections(fromVector, directionVector, false, function(x, y, z, objName){
          if (objName == obj.name || !objName){
            pixels[pixelIndex ++] = 255;
            pixels[pixelIndex ++] = 255;
            pixels[pixelIndex ++] = 255;
          }else{
            pixels[pixelIndex ++] = 0;
            pixels[pixelIndex ++] = 0;
            pixels[pixelIndex ++] = 0;
          }

          pixels[pixelIndex ++] = 255;
        }, null, null, true);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  var tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = shadowCanvas.width;
  tmpCanvas.height = shadowCanvas.height;
  var tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.filter = 'blur(5px)';
  tmpCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height);
  tmpCtx.translate(shadowCanvas.width / 2, shadowCanvas.height / 2);
  tmpCtx.rotate(-Math.PI/2);
  tmpCtx.drawImage(shadowCanvas, -shadowCanvas.width / 2, -shadowCanvas.width / 2);
}
