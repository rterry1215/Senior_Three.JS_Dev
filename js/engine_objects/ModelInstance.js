var ModelInstance = function(name, model, mesh, physicsBody, destroyedGrids, gsName){
  this.isModelInstance = true;
  this.name = name;

  if (IS_WORKER_CONTEXT){
    return;
  }

  this.mesh = mesh;
  this.model = model;
  this.physicsBody = physicsBody;
  this.gsName = gsName;
  this.destroyedGrids = destroyedGrids;

  for (var gridName in this.destroyedGrids){
    this.destroyedGrids[gridName].destroyedModelInstance = this.name;
  }

  this.scale = this.mesh.scale.x;

  this.matrixCache = new THREE.Matrix4();

  webglCallbackHandler.registerEngineObject(this);
}

ModelInstance.prototype.onTextureAtlasRefreshed = function(){
  if (this.model.getUsedTextures().length == 0){
    return;
  }

  this.mesh.material.uniforms.texture = textureAtlasHandler.getTextureUniform();
}

ModelInstance.prototype.export = function(){
  var exportObj = {
    modelName: this.model.name,
    gsName: this.gsName,
    position: {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z
    },
    quaternion: {
      x: this.mesh.quaternion.x,
      y: this.mesh.quaternion.y,
      z: this.mesh.quaternion.z,
      w: this.mesh.quaternion.w
    },
    scale: this.mesh.scale.x,
    affectedByLight: !!this.affectedByLight
  };

  var destroyedGridsExport = {};
  for (var gridName in this.destroyedGrids){
    destroyedGridsExport[gridName] = this.destroyedGrids[gridName].export();
  }

  exportObj.destroyedGrids = destroyedGridsExport;
  exportObj.hiddenInDesignMode = !!this.hiddenInDesignMode;
  exportObj.noMass = !!this.noMass;
  exportObj.isIntersectable = !!this.isIntersectable;

  if (this.affectedByLight){
    exportObj.lightingType = this.lightingType;

    if (this.model.info.hasNormalMap && this.lightingType == lightHandler.lightTypes.PHONG){
      exportObj.normalScale = {
        x: this.mesh.material.uniforms.normalScale.value.x,
        y: this.mesh.material.uniforms.normalScale.value.y
      };
    }
  }

  if (this.hasEnvironmentMap()){
    exportObj.environmentMapInfo = this.environmentMapInfo;
  }

  return exportObj;
}

ModelInstance.prototype.exportLightweight = function(){
  this.mesh.updateMatrixWorld();

  if (!this.boundingBoxes){
    this.generateBoundingBoxes();
  }

  var exportObject = new Object();

  exportObject.vertices = [];
  exportObject.transformedVertices = [];
  exportObject.triangles = [];
  exportObject.pseudoFaces = [];

  for (var i = 0; i<this.vertices.length; i++){
    exportObject.vertices.push({x: this.vertices[i].x, y: this.vertices[i].y, z: this.vertices[i].z})
  }
  for (var i = 0; i<this.transformedVertices.length; i++){
    exportObject.transformedVertices.push({x: this.transformedVertices[i].x, y: this.transformedVertices[i].y, z: this.transformedVertices[i].z})
  }
  for (var i = 0; i<this.triangles.length; i++){
    exportObject.triangles.push({a: this.triangles[i].a, b: this.triangles[i].b, c: this.triangles[i].c})
  }
  for (var i = 0; i<this.pseudoFaces.length; i++){
    exportObject.pseudoFaces.push(this.pseudoFaces[i]);
  }

  if (this.hiddenInDesignMode){
    exportObject.hiddenInDesignMode = true;
  }

  var physicsXParam = (this.model.info.originalBoundingBox.max.x - this.model.info.originalBoundingBox.min.x) * this.scale;
  var physicsYParam = (this.model.info.originalBoundingBox.max.y - this.model.info.originalBoundingBox.min.y) * this.scale;
  var physicsZParam = (this.model.info.originalBoundingBox.max.z - this.model.info.originalBoundingBox.min.z) * this.scale;
  exportObject.physicsShapeParameters = {x: physicsXParam/2, y: physicsYParam/2, z: physicsZParam/2};
  exportObject.physicsPosition = {
    x: this.physicsBody.position.x,
    y: this.physicsBody.position.y,
    z: this.physicsBody.position.z
  };
  exportObject.physicsQuaternion = {
    x: this.physicsBody.quaternion.x,
    y: this.physicsBody.quaternion.y,
    z: this.physicsBody.quaternion.z,
    w: this.physicsBody.quaternion.w
  };

  exportObject.noMass = !!this.noMass;
  exportObject.isIntersectable = this.isIntersectable;

  return exportObject;
}

ModelInstance.prototype.generateBoundingBoxes = function(){
  this.boundingBoxes = [];
  this.transformedVertices = [];
  this.triangles = [];
  this.trianglePlanes = [];
  this.pseudoFaces = [];
  this.vertices = [];

  var bbs = this.getBBs();

  for (var x = 0; x < bbs.length; x ++){
    var center = bbs[x].center;
    var size = bbs[x].size;

    this.boundingBoxes.push(new THREE.Box3().setFromCenterAndSize(center, size));

    var pseudoGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    var pseudoObj = new THREE.Object3D();
    pseudoObj.position.copy(center);
    pseudoObj.updateMatrixWorld(true);
    var transformedVertices =[];
    for (var i = 0; i < pseudoGeometry.vertices.length; i ++){
      this.vertices.push(pseudoGeometry.vertices[i]);
      var vertex = pseudoGeometry.vertices[i].clone();
      vertex.applyMatrix4(pseudoObj.matrixWorld);
      this.transformedVertices.push(vertex);
      transformedVertices.push(vertex);
    }

    for (var i = 0; i < pseudoGeometry.faces.length; i ++){
      var face = pseudoGeometry.faces[i];
      var a = face.a;
      var b = face.b;
      var c = face.c;
      var triangle = new THREE.Triangle(
        transformedVertices[a], transformedVertices[b], transformedVertices[c]
      );
      this.triangles.push(triangle);
      var plane = new THREE.Plane();
      triangle.getPlane(plane);
      this.trianglePlanes.push(plane);
      this.pseudoFaces.push(face);
    }
  }
}

ModelInstance.prototype.visualiseBoundingBoxes = function(){
  if (!this.boundingBoxes){
    this.generateBoundingBoxes();
  }
  if (this.bbHelpers){
    for (var i = 0; i<this.bbHelpers.length; i++){
      scene.remove(this.bbHelpers[i]);
    }
  }
  this.bbHelpers = [];
  for (var i = 0; i<this.boundingBoxes.length; i++){
    var bbHelper = new THREE.Box3Helper(this.boundingBoxes[i], LIME_COLOR);
    scene.add(bbHelper);
    this.bbHelpers.push(bbHelper);
  }
}

ModelInstance.prototype.removeBoundingBoxesFromScene = function(){
  if (this.bbHelpers){
    for (var i = 0; i<this.bbHelpers.length; i++){
      scene.remove(this.bbHelpers[i]);
    }
  }
  this.bbHelpers = [];
}

ModelInstance.prototype.intersectsLine = function(line){
  for (var i = 0; i< this.trianglePlanes.length; i+=2){
    var plane = this.trianglePlanes[i];
    if (plane.intersectLine(line, REUSABLE_VECTOR)){
      var triangle1 = this.triangles[i];
      var triangle2 = this.triangles[i+1];
      if (triangle1 && triangle1.containsPoint(REUSABLE_VECTOR)){
        INTERSECTION_NORMAL.set(plane.normal.x, plane.normal.y, plane.normal.z);
        return REUSABLE_VECTOR;
      }else if (triangle2 && triangle2.containsPoint(REUSABLE_VECTOR)){
        INTERSECTION_NORMAL.set(plane.normal.x, plane.normal.y, plane.normal.z);
        return REUSABLE_VECTOR;
      }
    }
  }
  return false;
}

ModelInstance.prototype.hideVisually = function(){
  this.mesh.visible = false;
}

ModelInstance.prototype.showVisually = function(){
  this.mesh.visible = true;
}

ModelInstance.prototype.hideInDesignMode = function(skipRaycasterRefresh){
  if (isDeployment){
    return;
  }
  this.hideVisually();
  this.hiddenInDesignMode = true;

  if (!skipRaycasterRefresh){
    refreshRaycaster(Text.OBJECT_HIDDEN);
  }
}

ModelInstance.prototype.showInDesignMode = function(){
  if (isDeployment){
    return;
  }
  this.showVisually();
  this.hiddenInDesignMode = false;
  refreshRaycaster(Text.OBJECT_SHOWN);
}

ModelInstance.prototype.setNoMass = function(val){
  if (!val){
    physicsWorld.addBody(this.physicsBody);
  }else{
    physicsWorld.remove(this.physicsBody);
  }
  this.noMass = val;
}

ModelInstance.prototype.setIntersectableStatus = function(val){
  this.isIntersectable = val;
}

ModelInstance.prototype.destroy = function(){
  scene.remove(this.mesh);
  physicsWorld.remove(this.physicsBody);
  this.mesh.material.dispose();
  for (var gridName in this.destroyedGrids){
    this.destroyedGrids[gridName].destroyedModelInstance = 0;
  }
}

ModelInstance.prototype.updateWorldInverseTranspose = function(overrideMatrix){
  if (!projectLoaded){
    return;
  }
  var val = overrideMatrix? overrideMatrix: this.mesh.material.uniforms.worldInverseTranspose.value;
  val.getInverse(this.mesh.matrixWorld).transpose();
  this.matrixCache.copy(this.mesh.matrixWorld);
}

ModelInstance.prototype.setAffectedByLight = function(isAffectedByLight){

  macroHandler.removeMacro("AFFECTED_BY_LIGHT", this.mesh.material, true, false);

  delete this.mesh.material.uniforms.worldInverseTranspose;
  delete this.mesh.material.uniforms.dynamicLightsMatrix;

  if (!this.hasEnvironmentMap()){
    delete this.mesh.material.uniforms.worldMatrix;
  }

  if (isAffectedByLight){
    macroHandler.injectMacro("AFFECTED_BY_LIGHT", this.mesh.material, true, false);

    this.mesh.material.uniforms.worldInverseTranspose = new THREE.Uniform(new THREE.Matrix4());
    this.mesh.material.uniforms.worldMatrix = new THREE.Uniform(this.mesh.matrixWorld);
    this.mesh.material.uniforms.dynamicLightsMatrix = lightHandler.getUniform();
    this.mesh.material.uniforms.cameraPosition = GLOBAL_CAMERA_POSITION_UNIFORM;
    this.updateWorldInverseTranspose();

    lightHandler.addLightToObject(this);
  }else{
    lightHandler.removeLightFromObject(this);
    if (this.lightingType == lightHandler.lightTypes.PHONG){
      macroHandler.removeMacro("HAS_PHONG_LIGHTING", this.mesh.material, true, true);
      if (this.model.info.hasNormalMap){
        macroHandler.removeMacro("HAS_NORMAL_MAP", this.mesh.material, true, true);
        delete this.mesh.material.uniforms.normalScale;
      }
    }
    delete this.lightingType;

    if (!this.hasEnvironmentMap()){
      delete this.mesh.material.uniforms.cameraPosition;
    }
  }

  this.mesh.material.needsUpdate = true;

  this.affectedByLight = isAffectedByLight;
  this.lightingType = lightHandler.lightTypes.GOURAUD;
}

ModelInstance.prototype.setPhongLight = function(){
  macroHandler.injectMacro("HAS_PHONG_LIGHTING", this.mesh.material, true, true);
  this.lightingType = lightHandler.lightTypes.PHONG;

  if (this.model.info.hasNormalMap){
    macroHandler.injectMacro("HAS_NORMAL_MAP", this.mesh.material, true, true);
    this.mesh.material.uniforms.normalScale = new THREE.Uniform(new THREE.Vector2(1, 1));
  }
}

ModelInstance.prototype.unsetPhongLight = function(){
  macroHandler.removeMacro("HAS_PHONG_LIGHTING", this.mesh.material, true, true);
  this.lightingType = lightHandler.lightTypes.GOURAUD;

  if (this.model.info.hasNormalMap){
    macroHandler.removeMacro("HAS_NORMAL_MAP", this.mesh.material, true, true);
    delete this.mesh.material.uniforms.normalScale;
  }
}

ModelInstance.prototype.onBeforeRender = function(){
  if (!this.affectedByLight){
    return;
  }
  if (!this.matrixCache.equals(this.mesh.matrixWorld)){
    this.updateWorldInverseTranspose();
  }
}

ModelInstance.prototype.visualiseNormals = function(){
  this.vertexNormalsHelper = new THREE.VertexNormalsHelper(this.mesh, 10, "lime", 1);
  scene.add(this.vertexNormalsHelper);
}

ModelInstance.prototype.unvisialiseNormals = function(){
  scene.remove(this.vertexNormalsHelper);
  delete this.vertexNormalsHelper;
}

ModelInstance.prototype.mapCustomTextures = function(texturesObj){
  var material = this.mesh.material;
  var uniforms = material.uniforms;
  if (!this.customTextureMapped){
    macroHandler.injectMacro("HAS_CUSTOM_TEXTURE", material, true, true);
    delete uniforms.texture;
  }

  var model = this.model;
  var usedTextures = model.getUsedTextures();
  var diffuseTextureIndexByTextureID = model.diffuseTextureIndexByTextureID;
  var normalTextureIndexByTextureID = model.normalTextureIndexByTextureID;
  for (var i = 0; i < usedTextures.length; i ++){
    var textureID = usedTextures[i].id;
    var diffuseTextureIndex = diffuseTextureIndexByTextureID[textureID];
    if (!(typeof diffuseTextureIndex == UNDEFINED)){
      var texture = texturesObj[textureID].diffuseTexture;
      var key = "customDiffuseTexture" + diffuseTextureIndex;
      if (!uniforms[key]){
        uniforms[key] = new THREE.Uniform(texture);
        macroHandler.injectMacro("CUSTOM_TEXTURE_" + diffuseTextureIndex, material, false, true);
      }else{
        uniforms[key].value = texture;
      }
    }else{
      var normalTextureIndex = normalTextureIndexByTextureID[textureID];
      var texture = texturesObj[textureID].diffuseTexture;
      var key = "customNormalTexture" + normalTextureIndex;
      if (!uniforms[key]){
        uniforms[key] = new THREE.Uniform(texture);
        macroHandler.injectMacro("CUSTOM_NORMAL_TEXTURE_" + normalTextureIndex, material, false, true);
      }else{
        uniforms[key].value = texture;
      }
    }
  }

  this.customTextureMapped = true;
}

ModelInstance.prototype.unmapCustomTextures = function(){
  var material = this.mesh.material;
  var uniforms = material.uniforms;

  macroHandler.removeMacro("HAS_CUSTOM_TEXTURE", material, true, true);

  var model = this.model;
  var usedTextures = model.getUsedTextures();
  var diffuseTextureIndexByTextureID = model.diffuseTextureIndexByTextureID;
  var normalTextureIndexByTextureID = model.normalTextureIndexByTextureID;
  for (var i = 0; i < usedTextures.length; i ++){
    var textureID = usedTextures[i].id;
    var diffuseTextureIndex = diffuseTextureIndexByTextureID[textureID];
    if ((typeof diffuseTextureIndex == UNDEFINED)){
      var key = "customDiffuseTexture" + diffuseTextureIndex;
      macroHandler.removeMacro("CUSTOM_TEXTURE_" + diffuseTextureIndex, material, false, true);
      delete uniforms[key];
    }else{
      var normalTextureIndex = normalTextureIndexByTextureID[textureID];
      var key = "customNormalTexture" + normalTextureIndex;
      macroHandler.removeMacro("CUSTOM_NORMAL_TEXTURE_" + normalTextureIndex, material, false, true);
      delete uniforms[key];
    }
  }

  uniforms.texture = textureAtlasHandler.getTextureUniform();

  this.customTextureMapped = false;
}

ModelInstance.prototype.getBBs = function(){
  var totalBB = new THREE.Box3();
  this.model.group.position.copy(this.mesh.position);
  this.model.group.quaternion.copy(this.mesh.quaternion);
  this.model.group.scale.set(this.scale, this.scale, this.scale);
  this.model.group.updateMatrixWorld(true);
  this.model.group.updateMatrix(true);
  var bbs = [];
  for (var i = 0; i < this.model.group.children.length; i ++){
    this.model.group.children[i].updateMatrixWorld(true);
    this.model.group.children[i].updateMatrix(true);
    var curMatrixWorld = this.model.group.children[i].matrixWorld;
    var curBB = this.model.info.childInfos[i].bb;
    var bb = new THREE.Box3(new THREE.Vector3(curBB.minX, curBB.minY, curBB.minZ), new THREE.Vector3(curBB.maxX, curBB.maxY, curBB.maxZ));
    bb.applyMatrix4(curMatrixWorld);
    totalBB.expandByPoint(bb.min);
    totalBB.expandByPoint(bb.max);
    bbs.push(bb);
  }

  var origBB = new THREE.Box3().setFromObject(this.mesh);

  var diff = totalBB.getCenter(new THREE.Vector3()).sub(origBB.getCenter(new THREE.Vector3()));
  for (var i = 0; i < bbs.length; i ++){
    var bb = bbs[i];
    var size = bb.getSize(new THREE.Vector3());
    var center = bb.getCenter(new THREE.Vector3());
    center.sub(diff);
    bbs[i] = {center: center, size: size}
  }

  return bbs;
}

ModelInstance.prototype.hasEnvironmentMap = function(){
  return !!this.mesh.material.uniforms.environmentMap;
}

ModelInstance.prototype.updateEnvironmentMap = function(skybox){
  if (!this.hasEnvironmentMap()){
    return;
  }

  this.mesh.material.uniforms.environmentMap = skybox.getUniform();
  this.environmentMapInfo.skyboxName = skybox.name;

  var macroVal = macroHandler.getMacroValue("ENVIRONMENT_MAP_SIZE", this.mesh.material, false);

  macroHandler.removeMacro("ENVIRONMENT_MAP_SIZE " + macroVal, this.mesh.material, false, true);
  macroHandler.injectMacro("ENVIRONMENT_MAP_SIZE " + skybox.imageSize, this.mesh.material, false, true);
}

ModelInstance.prototype.mapEnvironment = function(skybox){
  if (this.hasEnvironmentMap()){
    this.unmapEnvironment();
  }

  this.mesh.material.uniforms.environmentMap = skybox.getUniform();
  this.mesh.material.uniforms.cameraPosition = GLOBAL_CAMERA_POSITION_UNIFORM;
  this.mesh.material.uniforms.worldMatrix = new THREE.Uniform(this.mesh.matrixWorld);

  var environmentInfoArray = new Float32Array(this.mesh.geometry.attributes.position.array.length);
  var i2 = 0;
  for (var i = 0; i < environmentInfoArray.length; i += 3){
    environmentInfoArray[i] = 100;
    environmentInfoArray[i + 1] = 1;
  }

  macroHandler.injectMacro("HAS_ENVIRONMENT_MAP", this.mesh.material, true, true);
  macroHandler.injectMacro("ENVIRONMENT_MAP_SIZE " + skybox.imageSize, this.mesh.material, false, true);

  this.environmentMapInfo = {
    skyboxName: skybox.name
  };
}

ModelInstance.prototype.unmapEnvironment = function(){
  if (!this.hasEnvironmentMap()){
    return;
  }

  delete this.mesh.material.uniforms.environmentMap;
  if (!this.affectedByLight){
    delete this.mesh.material.uniforms.cameraPosition;
  }
  if (!this.affectedByLight){
    delete this.mesh.material.uniforms.worldMatrix;
  }

  macroHandler.removeMacro("HAS_ENVIRONMENT_MAP", this.mesh.material, true, true);

  var macroVal = macroHandler.getMacroValue("ENVIRONMENT_MAP_SIZE", this.mesh.material, false);
  macroHandler.removeMacro("ENVIRONMENT_MAP_SIZE " + macroVal, this.mesh.material, false, true);
}
