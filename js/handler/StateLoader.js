var StateLoader = function(stateObj){
  this.stateObj = stateObj;
  this.reason = "";
  this.totalLoadedTextureCount = 0;
  this.totalLoadedTexturePackCount = 0;
}

StateLoader.prototype.load = function(undo){
  try{

    if (undo){
      this.resetProject(true);
    }else{
      this.resetProject(false);
    }

    this.isUndo = undo;

    var obj = this.stateObj;
    // GRID SYSTEMS ************************************************
    var gridSystemsExport = obj.gridSystems;
    for (var gridSystemName in gridSystemsExport){
      var exportObject = gridSystemsExport[gridSystemName];
      var name = exportObject.name;
      var sizeX = exportObject.sizeX;
      var sizeZ = exportObject.sizeZ;
      var centerX = exportObject.centerX;
      var centerY = exportObject.centerY;
      var centerZ = exportObject.centerZ;
      var outlineColor = exportObject.outlineColor;
      var cellSize = exportObject.cellSize;
      var axis = exportObject.axis;
      var isSuperposed = exportObject.isSuperposed;
      var gs = new GridSystem(name, sizeX, sizeZ, centerX, centerY, centerZ,
                                              outlineColor, cellSize, axis);
      var selectedGridsExport = exportObject.selectedGridsExport;
      var slicedGridsExport = exportObject.slicedGridsExport;
      var slicedGridSystemNamesExport = exportObject.slicedGridSystemNamesExport;
      for (var i = 0; i<selectedGridsExport.length; i++){
        var gridNumber = selectedGridsExport[i];
        gs.grids[gridNumber].toggleSelect(false, false, true, false);
      }
      for (var i = 0; i<slicedGridsExport.length; i++){
        var gridNumber = slicedGridsExport[i];
        gs.grids[gridNumber].sliced = true;
        gs.grids[gridNumber].slicedGridSystemName = slicedGridSystemNamesExport[i];
      }
      gs.isSuperposed = isSuperposed;
    }
    for (var gridSystemName in gridSystems){
      var grids = gridSystems[gridSystemName].grids;
      for (var gridNumber in grids){
        var grid = grids[gridNumber];
        if (grid.sliced){
          var slicedGridSystemName = grid.slicedGridSystemName;
          var gridSystem = gridSystems[slicedGridSystemName];
          if (gridSystem){
            gridSystem.slicedGrid = grid;
          }
        }
      }
    }
    // WALL COLLECTIONS ********************************************
    var wallCollectionsExport = obj.wallCollections;
    for (var wallCollectionName in wallCollectionsExport){
      var curWallCollectionExport = wallCollectionsExport[wallCollectionName];
      var name = curWallCollectionExport.name;
      var height = curWallCollectionExport.height;
      var outlineColor = curWallCollectionExport.outlineColor;
      var isSuperposed = curWallCollectionExport.isSuperposed;
      new WallCollection(
        name, height, outlineColor, 0, 0, isSuperposed, true,
        curWallCollectionExport
      );
    }
    // MATERIALS ***************************************************
    var materialsExport = obj.materials;
    for (var materialName in materialsExport){
      var material;
      var curMaterialExport = materialsExport[materialName];
      var color = curMaterialExport.textColor;
      var opacity = curMaterialExport.opacity;
      var aoMapIntensity = curMaterialExport.aoMapIntensity;
      if (curMaterialExport.materialType == "BASIC"){
        material = new BasicMaterial(
          {
            name: curMaterialExport.roygbivMaterialName,
            color: color,
            alpha: opacity,
            aoMapIntensity: aoMapIntensity
          }
        );
      }else if (curMaterialExport.materialType == "PHONG"){
        var shininess = curMaterialExport.shininess;
        var emissiveIntensity = curMaterialExport.emissiveIntensity;
        material = new THREE.MeshPhongMaterial(
          {
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: opacity,
            aoMapIntensity: aoMapIntensity,
            shininess: shininess,
            emissiveIntensity: emissiveIntensity
          }
        );
      }
      material.roygbivMaterialName = curMaterialExport.roygbivMaterialName;
      material.textColor = color;
      materials[materialName] = material;
    }
    // DEFAULT MATERIAL ********************************************
    defaultMaterialType = obj.defaultMaterialType;
    // ADDED OBJECTS ***********************************************
    var addedObjectsExport = obj.addedObjects;
    for (var grouppedObjectName in obj.objectGroups){
      var curObjectGroupExport = obj.objectGroups[grouppedObjectName];
      var curGroup = curObjectGroupExport.group;
      for (var objectName in curGroup){
        addedObjectsExport[objectName] = curGroup[objectName];
        addedObjectsExport[objectName].fromObjectGroup = true;
      }
    }
    for (var addedObjectName in addedObjectsExport){
      var curAddedObjectExport = addedObjectsExport[addedObjectName];
      var type = curAddedObjectExport.type;
      var roygbivMaterialName = curAddedObjectExport.roygbivMaterialName;
      var destroyedGrids = new Object();
      var destroyedGridsExport = curAddedObjectExport.destroyedGrids;
      var metaData = curAddedObjectExport.metaData;
      var mass = 0;
      if (curAddedObjectExport.mass){
        mass = curAddedObjectExport.mass;
      }
      var isDynamicObject = false;
      if (curAddedObjectExport.isDynamicObject){
        isDynamicObject = curAddedObjectExport.isDynamicObject;
      }
      var gridSystemName = metaData["gridSystemName"];
      var gridSystem = gridSystems[gridSystemName];
      if (gridSystem){
        for (var gridName in destroyedGridsExport){
          var gridExport = destroyedGridsExport[gridName];
          var grid = gridSystem.getGridByColRow(
            gridExport.colNumber,
            gridExport.rowNumber
          );
          if (grid){
            destroyedGrids[gridName] = grid;
          }
        }
      }
      var material = materials[roygbivMaterialName];
      if (!material){
        if (roygbivMaterialName == "NULL_BASIC"){
          material = new BasicMaterial({
            name: roygbivMaterialName,
            color: "white",
            alpha: curAddedObjectExport.opacity,
            aoMapIntensity: curAddedObjectExport.aoMapIntensity,
            emissiveIntensity: curAddedObjectExport.emissiveIntensity
          });
        }else if (roygbivMaterialName == "NULL_PHONG"){
          material = new THREE.MeshPhongMaterial({
            color: "white",
            side: THREE.DoubleSide,
            wireframe: false
          });
          material.roygbivMaterialName = roygbivMaterialName;
          material.transparent = true;
          material.opacity = curAddedObjectExport.opacity;
          material.aoMapIntensity = curAddedObjectExport.aoMapIntensity;
          material.shininess = curAddedObjectExport.shininess;
          material.emissiveIntensity = curAddedObjectExport.emissiveIntensity;
          material.needsUpdate = true;
        }
      }

      var widthSegments = metaData["widthSegments"];
      var heightSegments = metaData["heightSegments"];
      var depthSegments = metaData["depthSegments"];
      if (!widthSegments){
        widthSegments = 1;
      }
      if (!heightSegments){
        heightSegments = 1;
      }
      if (!depthSegments){
        depthSegments = 1;
      }
      var addedObjectInstance;
      if (type == "box"){
        var boxSizeX = metaData["boxSizeX"];
        var boxSizeY = metaData["boxSizeY"];
        var boxSizeZ = metaData["boxSizeZ"];
        var centerX = metaData["centerX"];
        var centerY = metaData["centerY"];
        var centerZ = metaData["centerZ"];
        var boxPhysicsShape = new CANNON.Box(new CANNON.Vec3(
          boxSizeX / 2,
          boxSizeY / 2,
          boxSizeZ / 2
        ));
        var physicsMaterial = new CANNON.Material();
        var boxPhysicsBody = new CANNON.Body({
          mass: mass,
          shape: boxPhysicsShape,
          material: physicsMaterial
        });
        var boxMesh;
        var boxClone;
        var axis = metaData["gridSystemAxis"];
        var geomKey = (
          "BoxBufferGeometry" + PIPE +
          boxSizeX + PIPE + boxSizeY + PIPE + boxSizeZ + PIPE +
          widthSegments + PIPE + heightSegments + PIPE + depthSegments
        );
        var geom = geometryCache[geomKey];
        if (!geom){
          geom = new THREE.BoxBufferGeometry(
            boxSizeX, boxSizeY, boxSizeZ,
            widthSegments, heightSegments, depthSegments
          );
          geometryCache[geomKey] = geom;
        }
        boxMesh = new MeshGenerator(geom, material).generateMesh();
        boxMesh.position.x = centerX;
        boxMesh.position.y = centerY;
        boxMesh.position.z = centerZ;
        boxClone = new THREE.Mesh(boxMesh.geometry, boxMesh.material);
        boxClone.position.copy(boxMesh.position);
        boxClone.quaternion.copy(boxMesh.quaternion);
        boxClone.rotation.copy(boxMesh.rotation);
        scene.add(boxMesh);
        previewScene.add(boxClone);
        boxPhysicsBody.position.set(
          boxMesh.position.x,
          boxMesh.position.y,
          boxMesh.position.z
        );
        physicsWorld.add(boxPhysicsBody);
        addedObjectInstance = new AddedObject(
          addedObjectName, "box", metaData, material,
          boxMesh, boxClone, boxPhysicsBody, destroyedGrids
        );
        boxMesh.addedObject = addedObjectInstance;
      }else if (type == "surface"){
        var width = metaData["width"];
        var height = metaData["height"];
        var positionX = metaData["positionX"];
        var positionY = metaData["positionY"];
        var positionZ = metaData["positionZ"];
        var quaternionX = metaData["quaternionX"];
        var quaternionY = metaData["quaternionY"];
        var quaternionZ = metaData["quaternionZ"];
        var quaternionW = metaData["quaternionW"];
        var physicsShapeParameterX = metaData["physicsShapeParameterX"];
        var physicsShapeParameterY = metaData["physicsShapeParameterY"];
        var physicsShapeParameterZ = metaData["physicsShapeParameterZ"];

        var geomKey = (
          "PlaneBufferGeometry" + PIPE +
          width + PIPE + height + PIPE +
          widthSegments + PIPE + heightSegments
        );
        var geom = geometryCache[geomKey];
        if (!geom){
          geom = new THREE.PlaneBufferGeometry(width, height, widthSegments, heightSegments);
          geometryCache[geomKey] = geom;
        }
        var surface = new MeshGenerator(geom, material).generateMesh();

        surface.position.x = positionX;
        surface.position.y = positionY;
        surface.position.z = positionZ;
        surface.quaternion.x = quaternionX;
        surface.quaternion.y = quaternionY;
        surface.quaternion.z = quaternionZ;
        surface.quaternion.w = quaternionW;

        var surfaceClone = new THREE.Mesh(surface.geometry, surface.material);
        surfaceClone.position.copy(surface.position);
        surfaceClone.quaternion.copy(surface.quaternion);
        surfaceClone.rotation.copy(surface.rotation);
        scene.add(surface);
        previewScene.add(surfaceClone);

        var surfacePhysicsShape = new CANNON.Box(new CANNON.Vec3(
            physicsShapeParameterX,
            physicsShapeParameterY,
            physicsShapeParameterZ
        ));

        var physicsMaterial = new CANNON.Material();
        var surfacePhysicsBody = new CANNON.Body({
          mass: mass,
          shape: surfacePhysicsShape,
          material: physicsMaterial
        });
        surfacePhysicsBody.position.set(
          positionX,
          positionY,
          positionZ
        );
        physicsWorld.add(surfacePhysicsBody);
        addedObjectInstance = new AddedObject(addedObjectName, "surface", metaData, material,
                                    surface, surfaceClone, surfacePhysicsBody, destroyedGrids);
        surface.addedObject = addedObjectInstance;
      }else if (type == "ramp"){
        var rampHeight = metaData["rampHeight"];
        var rampWidth = metaData["rampWidth"];
        var quaternionX = metaData["quaternionX"];
        var quaternionY = metaData["quaternionY"];
        var quaternionZ = metaData["quaternionZ"];
        var quaternionW = metaData["quaternionW"];
        var centerX = metaData["centerX"];
        var centerY = metaData["centerY"];
        var centerZ = metaData["centerZ"];
        var fromEulerX = metaData["fromEulerX"];
        var fromEulerY = metaData["fromEulerY"];
        var fromEulerZ = metaData["fromEulerZ"];

        var geomKey = (
          "PlaneBufferGeometry" + PIPE +
          rampWidth + PIPE + rampHeight + PIPE +
          widthSegments + PIPE + heightSegments
        );
        var geom = geometryCache[geomKey];
        if (!geom){
          geom = new THREE.PlaneBufferGeometry(rampWidth, rampHeight, widthSegments, heightSegments);
          geometryCache[geomKey] = geom;
        }
        var ramp = new MeshGenerator(geom, material).generateMesh();
        ramp.position.x = centerX;
        ramp.position.y = centerY;
        ramp.position.z = centerZ;
        ramp.quaternion.x = quaternionX;
        ramp.quaternion.y = quaternionY;
        ramp.quaternion.z = quaternionZ;
        ramp.quaternion.w = quaternionW;

        var rampClone = new THREE.Mesh(ramp.geometry, ramp.material);
        rampClone.position.copy(ramp.position);
        rampClone.quaternion.copy(ramp.quaternion);
        rampClone.rotation.copy(ramp.rotation);
        var rampPhysicsShape = new CANNON.Box(new CANNON.Vec3(
          rampWidth/2,
          surfacePhysicalThickness,
          rampHeight/2
        ));

        var physicsMaterial = new CANNON.Material();
        var rampPhysicsBody = new CANNON.Body({
          mass: mass,
          shape: rampPhysicsShape,
          material: physicsMaterial
        });
        rampPhysicsBody.position.set(
          ramp.position.x,
          ramp.position.y,
          ramp.position.z
        );
        if (!isNaN(fromEulerX) && !isNaN(fromEulerY) && !isNaN(fromEulerZ)){
          rampPhysicsBody.quaternion.setFromEuler(
            fromEulerX,
            fromEulerY,
            fromEulerZ
          );
        }
        scene.add(ramp);
        previewScene.add(rampClone);
        physicsWorld.add(rampPhysicsBody);
        addedObjectInstance = new AddedObject(
          addedObjectName, "ramp", metaData, material, ramp, rampClone,
          rampPhysicsBody, new Object()
        );
        ramp.addedObject = addedObjectInstance;
      }else if (type == "sphere"){
        var radius = metaData["radius"];
        var centerX = metaData["centerX"];
        var centerY = metaData["centerY"];
        var centerZ = metaData["centerZ"];
        var spherePhysicsShape = new CANNON.Sphere(Math.abs(radius));
        var physicsMaterial = new CANNON.Material();
        var spherePhysicsBody = new CANNON.Body({
          mass: mass,
          shape: spherePhysicsShape,
          material: physicsMaterial
        });
        var sphereMesh;
        var sphereClone;
        var axis = metaData["gridSystemAxis"];
        var geomKey = (
          "SphereBufferGeometry" + PIPE +
          Math.abs(radius) + PIPE +
          widthSegments + PIPE + heightSegments
        );
        var geom = geometryCache[geomKey];
        if (!geom){
          geom = new THREE.SphereBufferGeometry(Math.abs(radius), widthSegments, heightSegments);
          geometryCache[geomKey] = geom;
        }
        sphereMesh = new MeshGenerator(geom, material).generateMesh();
        sphereMesh.position.x = centerX;
        sphereMesh.position.y = centerY;
        sphereMesh.position.z = centerZ;
        sphereClone = new THREE.Mesh(sphereMesh.geometry, sphereMesh.material);
        sphereClone.position.copy(sphereMesh.position);
        sphereClone.quaternion.copy(sphereMesh.quaternion);
        sphereClone.rotation.copy(sphereMesh.rotation);
        scene.add(sphereMesh);
        previewScene.add(sphereClone);
        spherePhysicsBody.position.set(
          sphereMesh.position.x,
          sphereMesh.position.y,
          sphereMesh.position.z
        );
        physicsWorld.add(spherePhysicsBody);
        addedObjectInstance = new AddedObject(
          addedObjectName, "sphere", metaData, material,
          sphereMesh, sphereClone, spherePhysicsBody, destroyedGrids
        );
        sphereMesh.addedObject = addedObjectInstance;
      }
      addedObjectInstance.associatedTexturePack = curAddedObjectExport.associatedTexturePack;
      addedObjectInstance.metaData["widthSegments"] = widthSegments;
      addedObjectInstance.metaData["heightSegments"] = heightSegments;
      addedObjectInstance.metaData["depthSegments"] = depthSegments;
      addedObjectInstance.isDynamicObject = isDynamicObject;
      addedObjectInstance.mass = mass;

      addedObjectInstance.metaData["manualDisplacementMap"] = metaData["manualDisplacementMap"];
      addedObjectInstance.metaData["manualDisplacementScale"] = metaData["manualDisplacementScale"];
      addedObjectInstance.metaData["manualDisplacementBias"] = metaData["manualDisplacementBias"];
      if (!(typeof addedObjectInstance.metaData["manualDisplacementMap"] == UNDEFINED)){
        manualDisplacementQueue[addedObjectName] = addedObjectInstance;
      }

      if (!curAddedObjectExport.fromObjectGroup){

        var rotationX = curAddedObjectExport.rotationX;
        var rotationY = curAddedObjectExport.rotationY;
        var rotationZ = curAddedObjectExport.rotationZ;
        addedObjectInstance.rotationX = rotationX;
        addedObjectInstance.rotationY = rotationY;
        addedObjectInstance.rotationZ = rotationZ;
        addedObjectInstance.mesh.quaternion.set(
          curAddedObjectExport.quaternionX,
          curAddedObjectExport.quaternionY,
          curAddedObjectExport.quaternionZ,
          curAddedObjectExport.quaternionW
        );
        addedObjectInstance.previewMesh.quaternion.set(
          curAddedObjectExport.quaternionX,
          curAddedObjectExport.quaternionY,
          curAddedObjectExport.quaternionZ,
          curAddedObjectExport.quaternionW
        );
        addedObjectInstance.physicsBody.quaternion.set(
          curAddedObjectExport.pQuaternionX,
          curAddedObjectExport.pQuaternionY,
          curAddedObjectExport.pQuaternionZ,
          curAddedObjectExport.pQuaternionW
        );
        addedObjectInstance.initQuaternion.copy(addedObjectInstance.mesh.quaternion);
        addedObjectInstance.physicsBody.initQuaternion.copy(addedObjectInstance.physicsBody.quaternion);
      }else{
        addedObjectInstance.mesh.quaternion.set(
          curAddedObjectExport.quaternionX,
          curAddedObjectExport.quaternionY,
          curAddedObjectExport.quaternionZ,
          curAddedObjectExport.quaternionW
        );
        addedObjectInstance.previewMesh.quaternion.set(
          curAddedObjectExport.quaternionX,
          curAddedObjectExport.quaternionY,
          curAddedObjectExport.quaternionZ,
          curAddedObjectExport.quaternionW
        );
        addedObjectInstance.physicsBody.quaternion.set(
          curAddedObjectExport.pQuaternionX,
          curAddedObjectExport.pQuaternionY,
          curAddedObjectExport.pQuaternionZ,
          curAddedObjectExport.pQuaternionW
        );
      }

      if (curAddedObjectExport.blendingMode == "NO_BLENDING"){
        addedObjectInstance.setBlending(NO_BLENDING);
      }else if (curAddedObjectExport.blendingMode == "ADDITIVE_BLENDING"){
        addedObjectInstance.setBlending(ADDITIVE_BLENDING);
      }else if (curAddedObjectExport.blendingMode == "SUBTRACTIVE_BLENDING"){
        addedObjectInstance.setBlending(SUBTRACTIVE_BLENDING);
      }else if (curAddedObjectExport.blendingMode == "MULTIPLY_BLENDING"){
        addedObjectInstance.setBlending(MULTIPLY_BLENDING);
      }else if (curAddedObjectExport.blending == "NORMAL_BLENDING"){
        addedObjectInstance.setBlending(NORMAL_BLENDING);
      }

      if (curAddedObjectExport.isSlippery){
        addedObjectInstance.setSlippery(true);
      }else{
        addedObjectInstance.setSlippery(false);
      }

      addedObjectInstance.mesh.material.uniforms.emissiveIntensity.value = curAddedObjectExport.emissiveIntensity;
      addedObjectInstance.mesh.material.uniforms.aoIntensity.value = curAddedObjectExport.aoMapIntensity;

      addedObjects[addedObjectName] = addedObjectInstance;

      addedObjectInstance.rotationX = curAddedObjectExport.rotationX;
      addedObjectInstance.rotationY = curAddedObjectExport.rotationY;
      addedObjectInstance.rotationZ = curAddedObjectExport.rotationZ;

       if (addedObjectInstance.metaData.slicedType){
         addedObjectInstance.sliceSurfaceInHalf(addedObjectInstance.metaData.slicedType);
       }
       if (addedObjectInstance.metaData.renderSide){
         addedObjectInstance.handleRenderSide(addedObjectInstance.metaData.renderSide);
       }

    }
    // TEXTURE URLS ************************************************
    textureURLs = Object.assign({}, obj.textureURLs);
    // UPLOADED IMAGES *********************************************
    var uploadedImagesExport = obj.uploadedImages;
    for (var imgName in uploadedImagesExport){
      var src = uploadedImagesExport[imgName];
      var imageDom = document.createElement("img");
      imageDom.src = src;
      if (obj.uploadedImageSizes && obj.uploadedImageSizes[imgName]){
        imageDom.width = obj.uploadedImageSizes[imgName].width;
        imageDom.height = obj.uploadedImageSizes[imgName].height;
      }
      uploadedImages[imgName] = imageDom;
    }
    // TEXTURES ****************************************************
    this.loaders = new Object();
    var uploadedTextures = obj.textures;
    for (var textureName in uploadedTextures){
      var curTexture = uploadedTextures[textureName];
      if (curTexture == 1 || curTexture == 2 || curTexture == 3){
        textures[textureName] = curTexture;
        this.totalLoadedTextureCount ++;
        this.createObjectGroupsAfterLoadedTextures();
        continue;
      }
      var offsetX = curTexture.offset[0];
      var offsetY = curTexture.offset[1];
      var repeatU = curTexture.repeat[0];
      var repeatV = curTexture.repeat[1];
      var textureURL = textureURLs[textureName];
      if (obj.modifiedTextures[textureName]){
        var img = new Image();
        img.src = obj.modifiedTextures[textureName];
        var texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        texture.repeat.set(repeatU, repeatV);
        texture.offset.x = offsetX;
        texture.offset.y = offsetY;
        texture.isLoaded = true;
        modifiedTextures[textureName] = obj.modifiedTextures[textureName];
        var that = this;
        texture.image.onload = function(){
          textures[this.textureNameX] = this.textureX;
          that.totalLoadedTextureCount ++;
          this.textureX.needsUpdate = true;
          that.mapLoadedTexture(this.textureX, this.textureNameX);
          that.createObjectGroupsAfterLoadedTextures();
        }.bind({textureX: texture, textureNameX: textureName});
      }else if (uploadedImages[textureURL]){
        var texture = new THREE.Texture(uploadedImages[textureURL]);
        texture.repeat.set(repeatU, repeatV);
        texture.offset.x = offsetX;
        texture.offset.y = offsetY;
        texture.isLoaded = true;
        texture.fromUploadedImage = true;
        var skip = false;
        if (texture.image.width && texture.image.height){
          if (obj.textureSizes && obj.textureSizes[textureName]){
            var imgW = texture.image.width;
            var imgH = texture.image.height;
            var newW = obj.textureSizes[textureName].width;
            var newH = obj.textureSizes[textureName].height;
            if (imgW != newW || imgH != newH){
              var that = this;
              texture.image.onload = function(){
                var imgW = this.textureX.image.width;
                var imgH = this.textureX.image.height;
                var newW = obj.textureSizes[this.textureNameX].width;
                var newH = obj.textureSizes[this.textureNameX].height;
                var tmpCanvas = document.createElement("canvas");
                tmpCanvas.width = newW;
                tmpCanvas.height = newH;
                tmpCanvas.getContext("2d").drawImage(this.textureX.image, 0, 0, imgW, imgH, 0, 0, newW, newH);
                this.textureX.image = tmpCanvas;
                this.textureX.needsUpdate = true;
                textures[this.textureNameX] = this.textureX;
                that.totalLoadedTextureCount ++;
                that.mapLoadedTexture(this.textureX, this.textureNameX);
                that.createObjectGroupsAfterLoadedTextures();
              }.bind({textureX: texture, textureNameX: textureName})
              skip = true;
            }
          }
        }
        if (!skip){
          textures[textureName] = texture;
          that.totalLoadedTextureCount ++;
          texture.needsUpdate = true;
          this.mapLoadedTexture(texture, textureName);
          this.createObjectGroupsAfterLoadedTextures();
        }
      }else{
        if (textureURL.toUpperCase().endsWith("TGA")){
          this.loaders[textureName] = tgaLoader;
        }else{
          this.loaders[textureName] = textureLoader;
        }
        textures[textureName] = 1;
        var that = this;
        this.loaders[textureName].load(textureURL,
          function(textureData){
            var textureNameX = this.textureNameX;
            textures[textureNameX] = textureData;
            that.totalLoadedTextureCount ++;
            var hasPadding = (obj.texturePaddings[textureNameX] !== undefined);
            if (obj.textureSizes && obj.textureSizes[textureNameX]){
              var size = obj.textureSizes[textureNameX];
              if (size.width != textureData.image.width || size.height != textureData.image.height){
                var tmpCanvas = document.createElement("canvas");
                tmpCanvas.width = size.width;
                tmpCanvas.height = size.height;
                tmpCanvas.getContext("2d").drawImage(textureData.image, 0, 0, textureData.image.width, textureData.image.height, 0, 0, size.width, size.height);
                textureData.image = tmpCanvas;
                textureData.needsUpdate = true;
              }
            }
            textures[textureNameX].needsUpdate = true;
            textures[textureNameX].isLoaded = true;
            textures[textureNameX].repeat.set(this.repeatUU, this.repeatVV);
            textures[textureNameX].offset.x = this.offsetXX;
            textures[textureNameX].offset.y = this.offsetYY;
            that.mapLoadedTexture(textures[textureNameX], textureNameX);
            that.createObjectGroupsAfterLoadedTextures();
          }.bind({textureNameX: textureName, offsetXX: offsetX, offsetYY: offsetY, repeatUU: repeatU, repeatVV: repeatV}), function(xhr){
            textures[this.textureNameX] = 2;
          }.bind({textureNameX: textureName}), function(xhr){
            textures[this.textureNameX] = 3;
            that.totalLoadedTextureCount ++;
            that.createObjectGroupsAfterLoadedTextures();
          }.bind({textureNameX: textureName})
        );
      }
      this.hasTextures = true;
    }
    // LIGHTS - LIGHT_PREVIEWSCENE - POINT LIGHT REPRESENTATIONS ***
    var lightsExport = obj.lights;
    for (var lightName in lightsExport){
      var curLightExport = lightsExport[lightName];
      var lightColor = curLightExport["colorTextVal"];
      var lightIntensity = curLightExport.intensity;
      if (curLightExport.type == "AMBIENT"){
        var light = new THREE.AmbientLight(lightColor);
        var previewSceneLight = light.clone();
        light.intensity = lightIntensity;
        previewSceneLight.intensity = lightIntensity;
        scene.add(light);
        previewScene.add(previewSceneLight);
        lights[lightName] = light;
        light_previewScene[lightName] = previewSceneLight;
        light.colorTextVal = lightColor;
        previewSceneLight.colorTextVal = lightColor;
      }else if (curLightExport.type == "POINT"){
        var pointLight = new THREE.PointLight(lightColor);
        var pointLightClone = pointLight.clone();
        pointLight.colorTextVal = lightColor
        pointLightClone.colorTextVal = lightColor;
        pointLight.position.x = curLightExport.positionX;
        pointLight.position.y = curLightExport.positionY;
        pointLight.position.z = curLightExport.positionZ;
        pointLightClone.position.x = curLightExport.positionX;
        pointLightClone.position.y = curLightExport.positionY;
        pointLightClone.position.z = curLightExport.positionZ;
        pointLight.initialPositionX = curLightExport.initialPositionX;
        pointLight.initialPositionY = curLightExport.initialPositionY;
        pointLight.initialPositionZ = curLightExport.initialPositionZ;
        pointLightClone.initialPositionX = curLightExport.initialPositionX;
        pointLightClone.initialPositionY = curLightExport.initialPositionY;
        pointLightClone.initialPositionZ = curLightExport.initialPositionZ;
        pointLight.intensity = lightIntensity;
        pointLightClone.intensity = lightIntensity;
        lights[lightName] = pointLight;
        light_previewScene[lightName] = pointLightClone;
        scene.add(pointLight);
        previewScene.add(pointLightClone);
        var pointLightRepresentation = new THREE.Mesh(
          new THREE.SphereGeometry(5),
          new THREE.MeshBasicMaterial({color: lightColor})
        );
        pointLightRepresentation.position.x = curLightExport.positionX;
        pointLightRepresentation.position.y = curLightExport.positionY;
        pointLightRepresentation.position.z = curLightExport.positionZ;
        scene.add(pointLightRepresentation);
        pointLightRepresentations[lightName] = pointLightRepresentation;
        pointLightRepresentation.lightName = lightName;
        pointLightRepresentation.isPointLightRepresentation = true;
      }
    }
    // TEXTURE PACKS ***********************************************
    var texturePacksExport = obj.texturePacks;
    for (var texturePackName in texturePacksExport){
      var curTexturePackExport = texturePacksExport[texturePackName];
      var scaleFactor = curTexturePackExport.scaleFactor;
      var refTexturePackName = curTexturePackExport.refTexturePackName;
      var texturePack = new TexturePack(
        texturePackName,
        curTexturePackExport.directoryName,
        curTexturePackExport.fileExtension,
        function(){
          this.that.totalLoadedTexturePackCount ++;
          this.that.mapLoadedTexturePack(this.texturePackName, this.objj);
          this.that.createObjectGroupsAfterLoadedTextures();
        }.bind({texturePackName: texturePackName, that: this, objj: obj, scaleFactorX: scaleFactor}),
        true,
        null,
        scaleFactor,
        refTexturePackName
      );
      texturePacks[texturePackName] = texturePack;
      this.hasTexturePacks = true;
    }
    // SKYBOXES ****************************************************
    var skyBoxScale = obj.skyBoxScale;
    var skyboxExports = obj.skyBoxes;
    skyboxVisible = obj.skyboxVisible;
    mappedSkyboxName = obj.mappedSkyboxName;
    for (var skyboxName in skyboxExports){
      var skyboxExport = skyboxExports[skyboxName];
      var skybox;
      if (!mappedSkyboxName){
        skybox = new SkyBox(
          skyboxExport.name,
          skyboxExport.directoryName,
          skyboxExport.fileExtension
        );
      }else{
        skybox = new SkyBox(
          skyboxExport.name,
          skyboxExport.directoryName,
          skyboxExport.fileExtension,
          function(){
            if (this.skyboxName == mappedSkyboxName){
              var skybox = skyBoxes[this.skyboxName];
              var materialArray = [];
              var skyboxTextures = [
                skybox.leftTexture,
                skybox.rightTexture,
                skybox.upTexture,
                skybox.downTexture,
                skybox.frontTexture,
                skybox.backTexture
              ];
              for (var i = 0; i<skyboxTextures.length; i++){
                materialArray.push(new THREE.MeshBasicMaterial(
                  {
                    map: skyboxTextures[i],
                    side: THREE.BackSide
                  }
                ));
              }
              if (skyboxMesh){
                scene.remove(skyboxMesh);
              }
              if (skyboxPreviewMesh){
                previewScene.remove(skyboxPreviewMesh);
              }
              var skyGeometry = new THREE.CubeGeometry(
                skyboxDistance, skyboxDistance, skyboxDistance
              );
              skyboxMesh = new THREE.Mesh( skyGeometry, materialArray );
              skyboxPreviewMesh = skyboxMesh.clone();
              if (skyboxVisible){
                scene.add(skyboxMesh);
                previewScene.add(skyboxPreviewMesh);
              }
              if (this.skyBoxScale){
                skyboxMesh.scale.x = this.skyBoxScale;
                skyboxMesh.scale.y = this.skyBoxScale;
                skyboxMesh.scale.z = this.skyBoxScale;
                skyboxPreviewMesh.scale.x = this.skyBoxScale;
                skyboxPreviewMesh.scale.y = this.skyBoxScale;
                skyboxPreviewMesh.scale.z = this.skyBoxScale;
              }
            }
          }.bind({skyboxName: skyboxName, skyBoxScale: skyBoxScale})
        );
      }
      skyBoxes[skyboxName] = skybox;
    }
    // ANCHOR GRID *************************************************
    anchorGrid = 0;
    var anchorGridExport = obj.anchorGrid;
    if (anchorGridExport){
      var parentName = anchorGridExport.parentName;
      var gridSystem = gridSystems[parentName];
      if (gridSystem){
        for (var gridNumber in gridSystem.grids){
          var grid = gridSystem.grids[gridNumber];
          if (grid.startX == anchorGridExport.startX && grid.startY == anchorGridExport.startY && grid.startZ == anchorGridExport.startZ){
            anchorGrid = grid;
            break;
          }
        }
      }
    }
    // CROPPED GRID SYSTEM BUFFER **********************************
    if (obj.croppedGridSystemBuffer){
      croppedGridSystemBuffer = new CroppedGridSystem(
        obj.croppedGridSystemBuffer.sizeX,
        obj.croppedGridSystemBuffer.sizeZ,
        obj.croppedGridSystemBuffer.centerX,
        obj.croppedGridSystemBuffer.centerY,
        obj.croppedGridSystemBuffer.centerZ,
        obj.croppedGridSystemBuffer.axis
      )
    }
    // SCRIPTS *****************************************************
    for (var scriptName in obj.scripts){
      var curScriptExport = obj.scripts[scriptName];
      scripts[scriptName] = new Script(
        curScriptExport.name, curScriptExport.script
      );
      if (curScriptExport.runAutomatically){
        scripts[scriptName].runAutomatically = true;
      }else{
        scripts[scriptName].runAutomatically = false;
      }
      if (curScriptExport.localFilePath){
        scripts[scriptName].localFilePath = curScriptExport.localFilePath;
      }
    }

    // OBJECT GROUPS ***********************************************
    // NOT HERE -> createObjectGroupsAfterLoadedTextures

    // MARKED PONTS ************************************************
    for (var markedPointName in obj.markedPointsExport){
      var curMarkedPointExport = obj.markedPointsExport[markedPointName];
      var markedPoint = new MarkedPoint(
        markedPointName,
        curMarkedPointExport["x"],
        curMarkedPointExport["y"],
        curMarkedPointExport["z"]
      );
      if (!curMarkedPointExport.isHidden && mode == 0){
        markedPoint.renderToScreen();
      }else{
        markedPoint.isHidden = true;
      }
      markedPoint.showAgainOnTheNextModeSwitch = curMarkedPointExport.showAgainOnTheNextModeSwitch;
      if (mode == 0){
        markedPoint.showAgainOnTheNextModeSwitch = false;
      }
      markedPoints[markedPointName] = markedPoint;
    }
    // PHYSICS WORKER MODE *****************************************
    PHYSICS_WORKER_ENABLED = obj.physicsWorkerMode;
    // PARTICLE COLLISION WORKER MODE ******************************
    COLLISION_WORKER_ENABLED = obj.particleCollisionWorkerMode;
    // PARTICLE SYSTEM COLLISION WORKER MODE ***********************
    PS_COLLISION_WORKER_ENABLED = obj.particleSystemCollisionWorkerMode;
    // OCTREE LIMIT ************************************************
    var octreeLimitInfo = obj.octreeLimit
    var octreeLimitInfoSplitted = octreeLimitInfo.split(",");
    for (var i = 0; i<octreeLimitInfoSplitted.length; i++){
      octreeLimitInfoSplitted[i] = parseInt(octreeLimitInfoSplitted[i]);
    }
    var lowerBound = new THREE.Vector3(
      octreeLimitInfoSplitted[0], octreeLimitInfoSplitted[1], octreeLimitInfoSplitted[2]
    );
    var upperBound = new THREE.Vector3(
      octreeLimitInfoSplitted[3], octreeLimitInfoSplitted[4], octreeLimitInfoSplitted[5]
    );
    LIMIT_BOUNDING_BOX = new THREE.Box3(lowerBound, upperBound);
    // BIN SIZE ****************************************************
    BIN_SIZE = parseInt(obj.binSize);
    // FOG *********************************************************
    var fogObj = obj.fogObj;
    fogActive = fogObj.fogActive;
    fogColor = fogObj.fogColor;
    fogDensity = fogObj.fogDensity;
    fogColorRGB = new THREE.Color(fogColor);
    // ATLAS TEXTURE SIZE ******************************************
    projectAtlasSize = {
      width: obj.projectAtlasSize.width,
      height: obj.projectAtlasSize.height
    };
    // POST PROCESSING *********************************************
    scanlineCount = obj.scanlineCount;
    scanlineSIntensity = obj.scanlineSIntensity;
    scanlineNIntensity = obj.scanlineNIntensity;
    staticAmount = obj.staticAmount;
    staticSize = obj.staticSize;
    rgbAmount = obj.rgbAmount;
    rgbAngle = obj.rgbAngle;
    badtvThick = obj.badtvThick;
    badtvFine = obj.badtvFine;
    badtvDistortSpeed = obj.badtvDistortSpeed ;
    badtvRollSpeed = obj.badtvRollSpeed;
    bloomStrength = obj.bloomStrength;
    bloomRadius = obj.bloomRadius;
    bloomThreshold = obj.bloomThreshold;
    bloomResolutionScale = obj.bloomResolutionScale;
    scanlineOn = obj.scanlineOn;
    rgbOn = obj.rgbOn;
    badTvOn = obj.badTvOn;
    staticOn = obj.staticOn;
    bloomOn = obj.bloomOn;
    postprocessingParameters = {
      "Scanlines_count": scanlineCount,
      "Scanlines_sIntensity": scanlineSIntensity,
      "Scanlines_nIntensity": scanlineNIntensity,
      "Static_amount": staticAmount,
      "Static_size": staticSize,
      "RGBShift_amount": rgbAmount,
      "RGBShift_angle": rgbAngle,
      "BadTV_thickDistort": badtvThick,
      "BadTV_fineDistort": badtvFine,
      "BadTV_distortSpeed": badtvDistortSpeed,
      "BadTV_rollSpeed": badtvRollSpeed,
      "Bloom_strength": bloomStrength,
      "Bloom_radius": bloomRadius,
      "Bloom_threshhold": bloomThreshold,
      "Bloom_resolution_scale": bloomResolutionScale,
      "Scanlines": scanlineOn,
      "RGB": rgbOn,
      "Bad TV": badTvOn,
      "Static": staticOn,
      "Bloom": bloomOn
    };
    datGui = new dat.GUI();
    datGui.add(postprocessingParameters, "Scanlines_count").min(0).max(1000).step(1).onChange(function(val){
      adjustPostProcessing(0, val);
    });
    datGui.add(postprocessingParameters, "Scanlines_sIntensity").min(0.0).max(2.0).step(0.1).onChange(function(val){
      adjustPostProcessing(1, val);
    });
    datGui.add(postprocessingParameters, "Scanlines_nIntensity").min(0.0).max(2.0).step(0.1).onChange(function(val){
      adjustPostProcessing(2, val);
    });
    datGui.add(postprocessingParameters, "Static_amount").min(0.0).max(1.0).step(0.01).onChange(function(val){
      adjustPostProcessing(3, val);
    });
    datGui.add(postprocessingParameters, "Static_size").min(0.0).max(100.0).step(1.0).onChange(function(val){
      adjustPostProcessing(4, val);
    });
    datGui.add(postprocessingParameters, "RGBShift_amount").min(0.0).max(0.1).step(0.01).onChange(function(val){
      adjustPostProcessing(5, val);
    });
    datGui.add(postprocessingParameters, "RGBShift_angle").min(0.0).max(2.0).step(0.1).onChange(function(val){
      adjustPostProcessing(6, val);
    });
    datGui.add(postprocessingParameters, "BadTV_thickDistort").min(0.1).max(20).step(0.1).onChange(function(val){
      adjustPostProcessing(7, val);
    });
    datGui.add(postprocessingParameters, "BadTV_fineDistort").min(0.1).max(20).step(0.1).onChange(function(val){
      adjustPostProcessing(8, val);
    });
    datGui.add(postprocessingParameters, "BadTV_distortSpeed").min(0.0).max(1.0).step(0.01).onChange(function(val){
      adjustPostProcessing(9, val);
    });
    datGui.add(postprocessingParameters, "BadTV_rollSpeed").min(0.0).max(1.0).step(0.01).onChange(function(val){
      adjustPostProcessing(10, val);
    });
    datGui.add(postprocessingParameters, "Bloom_strength").min(0.0).max(3.0).step(0.01).onChange(function(val){
      adjustPostProcessing(11, val);
    });
    datGui.add(postprocessingParameters, "Bloom_radius").min(0.0).max(1.0).step(0.01).onChange(function(val){
      adjustPostProcessing(12, val);
    });
    datGui.add(postprocessingParameters, "Bloom_threshhold").min(0.0).max(1.0).step(0.01).onChange(function(val){
      adjustPostProcessing(13, val);
    });
    datGui.add(postprocessingParameters, "Bloom_resolution_scale").min(0.1).max(1.0).step(0.001).onChange(function(val){
      adjustPostProcessing(19, val);
    });
    datGui.add(postprocessingParameters, "Scanlines").onChange(function(val){
      adjustPostProcessing(14, val);
    });
    datGui.add(postprocessingParameters, "RGB").onChange(function(val){
      adjustPostProcessing(15, val);
    });
    datGui.add(postprocessingParameters, "Bad TV").onChange(function(val){
      adjustPostProcessing(16, val);
    });
    datGui.add(postprocessingParameters, "Bloom").onChange(function(val){
      adjustPostProcessing(17, val);
    });
    datGui.add(postprocessingParameters, "Static").onChange(function(val){
      adjustPostProcessing(18, val);
    });
    $(datGui.domElement).attr("hidden", true);

    if (this.oldPhysicsDebugMode){
      if (this.oldPhysicsDebugMode != "NONE"){
        debugRenderer = new THREE.CannonDebugRenderer(previewScene, physicsWorld);
        physicsDebugMode = this.oldPhysicsDebugMode;
      }
    }

    if (!this.hasTextures && !this.hasTexturePacks){
      this.createObjectGroupsAfterLoadedTextures();
    }

    return true;
  }catch (err){
    throw err;
    this.reason = err;
    return false;
  }
}

StateLoader.prototype.createObjectGroupsAfterLoadedTextures = function(){
  var obj = this.stateObj;
  if (parseInt(this.totalLoadedTextureCount) < parseInt(obj.totalTextureCount) ||
           parseInt(this.totalLoadedTexturePackCount) < parseInt(obj.totalTexturePackCount)){
      return;
  }

  for (var objectName in obj.objectGroups){
    var curObjectGroupExport = obj.objectGroups[objectName];
    var group = new Object();
    for (var name in curObjectGroupExport.group){
      group[name] = addedObjects[name];
    }
    var objectGroupInstance = new ObjectGroup(objectName, group);
    objectGroups[objectName] = objectGroupInstance;
    objectGroupInstance.glue();
    if (curObjectGroupExport.mass){
      objectGroupInstance.setMass(curObjectGroupExport.mass);
    }
    objectGroupInstance.initQuaternion = new THREE.Quaternion(
      curObjectGroupExport.quaternionX, curObjectGroupExport.quaternionY,
      curObjectGroupExport.quaternionZ, curObjectGroupExport.quaternionW
    );
    objectGroupInstance.mesh.quaternion.copy(objectGroupInstance.initQuaternion.clone());
    objectGroupInstance.previewMesh.quaternion.copy(objectGroupInstance.initQuaternion.clone());
    objectGroupInstance.graphicsGroup.quaternion.copy(objectGroupInstance.initQuaternion.clone());
    objectGroupInstance.previewGraphicsGroup.quaternion.copy(objectGroupInstance.initQuaternion.clone());
    objectGroupInstance.physicsBody.quaternion.copy(objectGroupInstance.graphicsGroup.quaternion);
    objectGroupInstance.physicsBody.initQuaternion = new CANNON.Quaternion().copy(
      objectGroupInstance.graphicsGroup.quaternion
    );

    var isDynamicObject = false;
    if (curObjectGroupExport.isDynamicObject){
      isDynamicObject = curObjectGroupExport.isDynamicObject;
    }
    if (curObjectGroupExport.isSlippery){
      objectGroupInstance.setSlippery(true);
    }else{
      objectGroupInstance.setSlippery(false);
    }
    objectGroupInstance.isDynamicObject = isDynamicObject;
    objectGroupInstance.isBasicMaterial = curObjectGroupExport.isBasicMaterial;
    objectGroupInstance.isPhongMaterial = curObjectGroupExport.isPhongMaterial;

    if (curObjectGroupExport.blendingMode == "NO_BLENDING"){
      objectGroupInstance.setBlending(NO_BLENDING);
    }else if (curObjectGroupExport.blendingMode == "ADDITIVE_BLENDING"){
      objectGroupInstance.setBlending(ADDITIVE_BLENDING);
    }else if (curObjectGroupExport.blendingMode == "SUBTRACTIVE_BLENDING"){
      objectGroupInstance.setBlending(SUBTRACTIVE_BLENDING);
    }else if (curObjectGroupExport.blendingMode == "MULTIPLY_BLENDING"){
      objectGroupInstance.setBlending(MULTIPLY_BLENDING);
    }else if (curObjectGroupExport.blending == "NORMAL_BLENDING"){
      objectGroupInstance.setBlending(NORMAL_BLENDING);
    }

    if (curObjectGroupExport.renderSide){
      objectGroupInstance.handleRenderSide(curObjectGroupExport.renderSide);
    }

  }

  canvas.style.visibility = "";
  terminal.enable();
  terminal.clear();
  terminal.printInfo(Text.PROJECT_LOADED);

}

StateLoader.prototype.mapTextureToSingleObject = function(diff, exported){
  for (var textureName in textures){
    var addedObjectName;
    if (!exported){
      addedObjectName = diff.path[1];
    }else{
      addedObjectName = diff.name;
    }
    var texture = textures[textureName];
    var curAddedObjectExport;
    if (!exported){
      curAddedObjectExport = diff.rhs;
    }else{
      curAddedObjectExport = diff.export();
    }
    if (!curAddedObjectExport){
      break;
    }
    var objInstance = addedObjects[addedObjectName];
    var material = addedObjects[addedObjectName].material;
    var metaData = addedObjects[addedObjectName].metaData;

    var diffuseRoygbivTextureName;
    var alphaRoygbivTextureName;
    var aoRoygbivTextureName;
    var emissiveRoygbivTextureName;
    var normalRoygbivTextureName;
    var specularRoygbivTextureName;
    var displacementRoygbivTextureName;
    var displacementScale;
    var displacementBias;

    if (!exported){
      diffuseRoygbivTextureName = curAddedObjectExport.diffuseRoygbivTextureName;
      alphaRoygbivTextureName = curAddedObjectExport.alphaRoygbivTextureName;
      aoRoygbivTextureName = curAddedObjectExport.aoRoygbivTextureName;
      emissiveRoygbivTextureName = curAddedObjectExport.emissiveRoygbivTextureName;
      normalRoygbivTextureName = curAddedObjectExport.normalRoygbivTextureName;
      specularRoygbivTextureName = curAddedObjectExport.specularRoygbivTextureName;
      displacementRoygbivTextureName = curAddedObjectExport.displacementRoygbivTextureName;
      displacementScale = curAddedObjectExport.displacementScale;
      displacementBias = curAddedObjectExport.displacementBias;
    }else{
      diffuseRoygbivTextureName = diff.diffuseRoygbivTextureName;
      alphaRoygbivTextureName = diff.alphaRoygbivTextureName;
      aoRoygbivTextureName = diff.aoRoygbivTextureName;
      emissiveRoygbivTextureName = diff.emissiveRoygbivTextureName;
      normalRoygbivTextureName = diff.normalRoygbivTextureName;
      specularRoygbivTextureName = diff.specularRoygbivTextureName;
      displacementRoygbivTextureName = diff.displacementRoygbivTextureName;
      displacementScale = diff.displacementScale;
      displacementBias = diff.displacementBias;
    }


    if (diffuseRoygbivTextureName){
      if (textureName == diffuseRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];
        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;

        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        var textureOffsetX = curAddedObjectExport["textureOffsetX"];
        var textureOffsetY = curAddedObjectExport["textureOffsetY"];
        if (!(typeof textureOffsetX == UNDEFINED)){
          cloneTexture.offset.x = textureOffsetX;
        }
        if (!(typeof textureOffsetY == UNDEFINED)){
          cloneTexture.offset.y = textureOffsetY;
        }

        objInstance.mapDiffuse(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
    if (alphaRoygbivTextureName){
      if (textureName == alphaRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        objInstance.mapAlpha(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
    if (aoRoygbivTextureName){
      if (textureName == aoRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        objInstance.mapAO(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
    if (emissiveRoygbivTextureName){
      if (textureName == emissiveRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;


        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        objInstance.mapEmissive(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
    if (normalRoygbivTextureName){
      if (textureName == normalRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];
        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;
        material.normalMap = cloneTexture;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        cloneTexture.needsUpdate = true;
        material.needsUpdate = true;
      }
    }
    if (specularRoygbivTextureName){
      if (textureName == specularRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;
        material.specularMap = cloneTexture;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        cloneTexture.needsUpdate = true;
        material.needsUpdate = true;
      }
    }
    if (displacementRoygbivTextureName){
      if (textureName == displacementRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        if (!(typeof displacementScale == UNDEFINED)){
          material.displacementScale = displacementScale;
        }
        if (!(typeof displacementBias == UNDEFINED)){
          material.displacementBias = displacementBias;
        }

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        objInstance.mapDisplacement(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
  }
}

StateLoader.prototype.mapTexturePackToSingleObject = function(diff){
  for (var texturePackName in texturePacks){
    var texturePack = texturePacks[texturePackName];
    var addedObject = addedObjects[diff.path[1]];
    var material = addedObject.mesh.material;

    var addedObjectExport = diff.rhs;
    if (!addedObjectExport){
      return;
    }
    var diffuseRoygbivTexturePackName;
    var alphaRoygbivTexturePackName;
    var aoRoygbivTexturePackName;
    var emissiveRoygbivTexturePackName;
    var normalRoygbivTexturePackName;
    var specularRoygbivTexturePackName;
    var displacementRoygbivTexturePackName;

    diffuseRoygbivTexturePackName = addedObjectExport["diffuseRoygbivTexturePackName"];
    alphaRoygbivTexturePackName = addedObjectExport["alphaRoygbivTexturePackName"];
    aoRoygbivTexturePackName = addedObjectExport["aoRoygbivTexturePackName"];
    emissiveRoygbivTexturePackName = addedObjectExport["emissiveRoygbivTexturePackName"];
    normalRoygbivTexturePackName = addedObjectExport["normalRoygbivTexturePackName"];
    specularRoygbivTexturePackName = addedObjectExport["specularRoygbivTexturePackName"];
    displacementRoygbivTexturePackName = addedObjectExport["displacementRoygbivTexturePackName"];

    var textureRepeatU, textureRepeatV;
    if (!(typeof addedObjectExport["textureRepeatU"] == UNDEFINED)){
      textureRepeatU = addedObjectExport["textureRepeatU"];
      addedObject.metaData["textureRepeatU"] = textureRepeatU;
    }
    if (!(typeof addedObjectExport["textureRepeatV"] == UNDEFINED)){
      textureRepeatV = addedObjectExport["textureRepeatV"];
      addedObject.metaData["textureRepeatV"] = textureRepeatV;
    }

    var textureOffsetX, textureOffsetY;
    if (!(typeof addedObjectExport.textureOffsetX == UNDEFINED)){
      textureOffsetX = addedObjectExport.textureOffsetX;
    }
    if (!(typeof addedObjectExport.textureOffsetY == UNDEFINED)){
      textureOffsetY = addedObjectExport.textureOffsetY;
    }

    var displacementScale, displacementBias;
    if (!(typeof addedObjectExport.displacementScale == UNDEFINED)){
      displacementScale = addedObjectExport.displacementScale;
    }
    if (!(typeof addedObjectExport.displacementBias == UNDEFINED)){
      displacementBias = addedObjectExport.displacementBias;
    }
    if (diffuseRoygbivTexturePackName){
      if (diffuseRoygbivTexturePackName == texturePackName){
        if (texturePack.hasDiffuse){
          addedObject.mapDiffuse(texturePack.diffuseTexture);
          material.uniforms.diffuseMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.diffuseMap.value.roygbivTextureName = 0;
          if (!(typeof textureOffsetX == UNDEFINED)){
            material.uniforms.diffuseMap.value.offset.x = textureOffsetX;
          }
          if (!(typeof textureOffsetY == UNDEFINED)){
            material.uniforms.diffuseMap.value.offset.y = textureOffsetY;
          }
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.diffuseMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.diffuseMap.value.repeat.y = textureRepeatV;
          }
          material.uniforms.diffuseMap.value.needsUpdate = true;
        }
      }
    }
    if (alphaRoygbivTexturePackName){
      if (alphaRoygbivTexturePackName == texturePackName){
        if (texturePack.hasAlpha){
          addedObject.mapAlpha(texturePack.alphaTexture);
          material.uniforms.alphaMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.alphaMap.value.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.alphaMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.alphaMap.value.repeat.y = textureRepeatV;
          }
          material.uniforms.alphaMap.value.needsUpdate = true;
        }
      }
    }
    if (aoRoygbivTexturePackName){
      if (aoRoygbivTexturePackName == texturePackName){
        if (texturePack.hasAO){
          addedObject.mapAO(texturePack.aoTexture);
          material.uniforms.aoMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.aoMap.value.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.aoMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.aoMap.value.repeat.y = textureRepeatV;
          }
          material.uniforms.aoMap.value.needsUpdate = true;
        }
      }
    }
    if (emissiveRoygbivTexturePackName){
      if (emissiveRoygbivTexturePackName == texturePackName){
        if (texturePack.hasEmissive){
          addedObject.mapEmissive(texturePack.emissiveTexture);
          material.uniforms.emissiveMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.emissiveMap.value.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.emissiveMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.emissiveMap.value.repeat.y = textureRepeatV;
          }
          material.uniforms.emissiveMap.value.needsUpdate = true;
        }
      }
    }
    if (normalRoygbivTexturePackName){
      if (normalRoygbivTexturePackName == texturePackName){
        if (texturePack.hasNormal){
          material.normalMap = texturePack.normalTexture;
          material.normalMap.roygbivTexturePackName = texturePackName;
          material.normalMap.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.normalMap.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.normalMap.repeat.y = textureRepeatV;
          }
          material.needsUpdate = true;
          material.normalMap.needsUpdate = true;
        }
      }
    }
    if (specularRoygbivTexturePackName){
      if (specularRoygbivTexturePackName == texturePackName){
        if (texturePack.hasSpecular){
          material.specularMap = texturePack.specularTexture;
          material.specularMap.roygbivTexturePackName = texturePackName;
          material.specularMap.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.specularMap.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.specularMap.repeat.y = textureRepeatV;
          }
          material.needsUpdate = true;
          material.specularMap.needsUpdate = true;
        }
      }
    }
    if (displacementRoygbivTexturePackName){
      if (displacementRoygbivTexturePackName == texturePackName){
        if (texturePack.hasHeight){
          addedObject.mapDisplacement(texturePack.heightTexture);
          material.uniforms.displacementMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.displacementMap.value.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.displacementMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.displacementMap.value.repeat.y = textureRepeatV;
          }
          if (!(typeof displacementScale == UNDEFINED)){
            material.uniforms.displacementInfo.value.x = displacementScale;
          }
          if (!(typeof displacementBias == UNDEFINED)){
            material.uniforms.displacementInfo.value.y = displacementBias;
          }
          material.uniforms.displacementMap.value.needsUpdate = true;
        }
      }
    }
  }
}

StateLoader.prototype.mapLoadedTexturePack = function(texturePackName, exportObj){
  var texturePack = texturePacks[texturePackName];
  for (var objectGroupName in objectGroups){
    var group = objectGroups[objectGroupName].group;
    for (var objectName in group){
      addedObjects[objectName] = group[objectName];
    }
  }
  for (var addedObjectName in addedObjects){
    var addedObject = addedObjects[addedObjectName];
    var material = addedObject.mesh.material;

    var addedObjectExport = exportObj.addedObjects[addedObjectName];
    if (!addedObjectExport){
      return;
    }
    var diffuseRoygbivTexturePackName;
    var alphaRoygbivTexturePackName;
    var aoRoygbivTexturePackName;
    var emissiveRoygbivTexturePackName;
    var normalRoygbivTexturePackName;
    var specularRoygbivTexturePackName;
    var displacementRoygbivTexturePackName;

    diffuseRoygbivTexturePackName = addedObjectExport["diffuseRoygbivTexturePackName"];
    alphaRoygbivTexturePackName = addedObjectExport["alphaRoygbivTexturePackName"];
    aoRoygbivTexturePackName = addedObjectExport["aoRoygbivTexturePackName"];
    emissiveRoygbivTexturePackName = addedObjectExport["emissiveRoygbivTexturePackName"];
    normalRoygbivTexturePackName = addedObjectExport["normalRoygbivTexturePackName"];
    specularRoygbivTexturePackName = addedObjectExport["specularRoygbivTexturePackName"];
    displacementRoygbivTexturePackName = addedObjectExport["displacementRoygbivTexturePackName"];

    var textureRepeatU, textureRepeatV;
    if (!(typeof addedObjectExport["textureRepeatU"] == UNDEFINED)){
      textureRepeatU = addedObjectExport["textureRepeatU"];
      addedObject.metaData["textureRepeatU"] = textureRepeatU;
    }
    if (!(typeof addedObjectExport["textureRepeatV"] == UNDEFINED)){
      textureRepeatV = addedObjectExport["textureRepeatV"];
      addedObject.metaData["textureRepeatV"] = textureRepeatV;
    }

    var mirrorS = false;
    var mirrorT = false;
    if (!(typeof addedObjectExport.metaData.mirrorS == UNDEFINED)){
      if (addedObjectExport.metaData.mirrorS == "ON"){
        mirrorS = true;
      }
    }
    if (!(typeof addedObjectExport.metaData.mirrorT == UNDEFINED)){
      if (addedObjectExport.metaData.mirrorT == "ON"){
        mirrorT = true;
      }
    }

    var textureOffsetX, textureOffsetY;
    if (!(typeof addedObjectExport.textureOffsetX == UNDEFINED)){
      textureOffsetX = addedObjectExport.textureOffsetX;
    }else{
      textureOffsetX = 0;
    }
    if (!(typeof addedObjectExport.textureOffsetY == UNDEFINED)){
      textureOffsetY = addedObjectExport.textureOffsetY;
    }else{
      textureOffsetY = 0;
    }

    var displacementScale, displacementBias;
    if (!(typeof addedObjectExport.displacementScale == UNDEFINED)){
      displacementScale = addedObjectExport.displacementScale;
    }
    if (!(typeof addedObjectExport.displacementBias == UNDEFINED)){
      displacementBias = addedObjectExport.displacementBias;
    }
    if (diffuseRoygbivTexturePackName){
      if (diffuseRoygbivTexturePackName == texturePackName){
        if (texturePack.hasDiffuse){
          addedObject.mapDiffuse(texturePack.diffuseTexture);
          material.uniforms.diffuseMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.diffuseMap.value.roygbivTextureName = 0;
          if (!(typeof textureOffsetX == UNDEFINED)){
            material.uniforms.diffuseMap.value.offset.x = textureOffsetX;
          }
          if (!(typeof textureOffsetY == UNDEFINED)){
            material.uniforms.diffuseMap.value.offset.y = textureOffsetY;
          }
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.diffuseMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.diffuseMap.value.repeat.y = textureRepeatV;
          }
          material.uniforms.diffuseMap.value.needsUpdate = true;
          material.uniforms.diffuseMap.value.updateMatrix();
        }
      }
    }
    if (alphaRoygbivTexturePackName){
      if (alphaRoygbivTexturePackName == texturePackName){
        if (texturePack.hasAlpha){
          addedObject.mapAlpha(texturePack.alphaTexture);
          material.uniforms.alphaMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.alphaMap.value.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.alphaMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.alphaMap.value.repeat.y = textureRepeatV;
          }
          material.uniforms.alphaMap.value.needsUpdate = true;
          material.uniforms.alphaMap.value.updateMatrix();
        }
      }
    }
    if (aoRoygbivTexturePackName){
      if (aoRoygbivTexturePackName == texturePackName){
        if (texturePack.hasAO){
          addedObject.mapAO(texturePack.aoTexture);
          material.uniforms.aoMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.aoMap.value.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.aoMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.aoMap.value.repeat.y = textureRepeatV;
          }
          material.uniforms.aoMap.value.needsUpdate = true;
          material.uniforms.aoMap.value.updateMatrix();
        }
      }
    }
    if (emissiveRoygbivTexturePackName){
      if (emissiveRoygbivTexturePackName == texturePackName){
        if (texturePack.hasEmissive){
          addedObject.mapEmissive(texturePack.emissiveTexture);
          material.uniforms.emissiveMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.emissiveMap.value.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.emissiveMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.emissiveMap.value.repeat.y = textureRepeatV;
          }
          material.uniforms.emissiveMap.value.needsUpdate = true;
          material.uniforms.emissiveMap.value.updateMatrix();
        }
      }
    }
    if (normalRoygbivTexturePackName){
      if (normalRoygbivTexturePackName == texturePackName){
        if (texturePack.hasNormal){
          material.normalMap = texturePack.normalTexture;
          material.normalMap.roygbivTexturePackName = texturePackName;
          material.normalMap.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.normalMap.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.normalMap.repeat.y = textureRepeatV;
          }
          material.needsUpdate = true;
          material.normalMap.needsUpdate = true;
        }
      }
    }
    if (specularRoygbivTexturePackName){
      if (specularRoygbivTexturePackName == texturePackName){
        if (texturePack.hasSpecular){
          material.specularMap = texturePack.specularTexture;
          material.specularMap.roygbivTexturePackName = texturePackName;
          material.specularMap.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.specularMap.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.specularMap.repeat.y = textureRepeatV;
          }
          material.needsUpdate = true;
          material.specularMap.needsUpdate = true;
        }
      }
    }
    if (displacementRoygbivTexturePackName){
      if (displacementRoygbivTexturePackName == texturePackName){
        if (texturePack.hasHeight){
          addedObject.mapDisplacement(texturePack.heightTexture);
          material.uniforms.displacementMap.value.roygbivTexturePackName = texturePackName;
          material.uniforms.displacementMap.value.roygbivTextureName = 0;
          if (!(typeof textureRepeatU == UNDEFINED)){
            material.uniforms.displacementMap.value.repeat.x = textureRepeatU;
          }
          if (!(typeof textureRepeatV == UNDEFINED)){
            material.uniforms.displacementMap.value.repeat.y = textureRepeatV;
          }
          if (!(typeof displacementScale == UNDEFINED)){
            material.uniforms.displacementInfo.value.x = displacementScale;
          }
          if (!(typeof displacementBias == UNDEFINED)){
            material.uniforms.displacementInfo.value.y = displacementBias;
          }
          material.uniforms.displacementMap.value.needsUpdate = true;
          material.uniforms.displacementMap.value.updateMatrix();
        }
      }
    }
    if (mirrorS || mirrorT){
      if (mirrorS && ! mirrorT){
        addedObject.handleMirror("S", "ON");
      }else if (mirrorT && !mirrorS){
        addedObject.handleMirror("T", "ON");
      }else{
        addedObject.handleMirror("ST", "ON");
      }
    }
  }
  for (var objectGroupName in objectGroups){
    var group = objectGroups[objectGroupName].group;
    for (var objectName in group){
      delete addedObjects[objectName];
    }
  }
}

StateLoader.prototype.mapLoadedTexture = function(texture, textureName){
  var manualDisplacementQueueRemoveNames = [];
  for (var objName in manualDisplacementQueue){
    var obj = manualDisplacementQueue[objName];
    if (obj.metaData.manualDisplacementMap == textureName){
      obj.applyDisplacementMap(texture, textureName);
      manualDisplacementQueueRemoveNames.push(objName);
    }
  }
  for (var i = 0; i<manualDisplacementQueueRemoveNames.length; i++){
    delete manualDisplacementQueue[manualDisplacementQueueRemoveNames[i]];
  }
  var addedObjectsExport = this.stateObj.addedObjects;
  for (var objectGroupName in objectGroups){
    var group = objectGroups[objectGroupName].group;
    for (var objectName in group){
      addedObjects[objectName] = group[objectName];
    }
  }
  for (var addedObjectName in addedObjectsExport){

    var curAddedObjectExport = addedObjectsExport[addedObjectName];
    if (!curAddedObjectExport){
      break;
    }
    var objInstance = addedObjects[addedObjectName];
    var material = addedObjects[addedObjectName].material;
    var metaData = addedObjects[addedObjectName].metaData;

    var diffuseRoygbivTextureName = curAddedObjectExport.diffuseRoygbivTextureName;
    var alphaRoygbivTextureName = curAddedObjectExport.alphaRoygbivTextureName;
    var aoRoygbivTextureName = curAddedObjectExport.aoRoygbivTextureName;
    var emissiveRoygbivTextureName = curAddedObjectExport.emissiveRoygbivTextureName;
    var normalRoygbivTextureName = curAddedObjectExport.normalRoygbivTextureName;
    var specularRoygbivTextureName = curAddedObjectExport.specularRoygbivTextureName;
    var displacementRoygbivTextureName = curAddedObjectExport.displacementRoygbivTextureName;
    var displacementScale = curAddedObjectExport.displacementScale;
    var displacementBias = curAddedObjectExport.displacementBias;


    if (diffuseRoygbivTextureName){
      if (textureName == diffuseRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];
        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;

        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        var textureOffsetX = curAddedObjectExport["textureOffsetX"];
        var textureOffsetY = curAddedObjectExport["textureOffsetY"];
        if (!(typeof textureOffsetX == UNDEFINED)){
          cloneTexture.offset.x = textureOffsetX;
        }
        if (!(typeof textureOffsetY == UNDEFINED)){
          cloneTexture.offset.y = textureOffsetY;
        }

        objInstance.mapDiffuse(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
    if (alphaRoygbivTextureName){
      if (textureName == alphaRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        objInstance.mapAlpha(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
    if (aoRoygbivTextureName){
      if (textureName == aoRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        objInstance.mapAO(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
    if (emissiveRoygbivTextureName){
      if (textureName == emissiveRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        objInstance.mapEmissive(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
    if (normalRoygbivTextureName){
      if (textureName == normalRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];
        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;
        material.normalMap = cloneTexture;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        cloneTexture.needsUpdate = true;
        material.needsUpdate = true;
      }
    }
    if (specularRoygbivTextureName){
      if (textureName == specularRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;
        material.specularMap = cloneTexture;

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        cloneTexture.needsUpdate = true;
        material.needsUpdate = true;
      }
    }
    if (displacementRoygbivTextureName){
      if (textureName == displacementRoygbivTextureName){
        var repeatU = curAddedObjectExport["textureRepeatU"];
        var repeatV = curAddedObjectExport["textureRepeatV"];

        var cloneTexture = texture;
        cloneTexture.fromUploadedImage = texture.fromUploadedImage;
        cloneTexture.roygbivTextureName = textureName;
        cloneTexture.roygbivTexturePackName = 0;

        if (!(typeof displacementScale == UNDEFINED)){
          objInstance.mesh.material.uniforms.displacementInfo.value.x = displacementScale;
        }
        if (!(typeof displacementBias == UNDEFINED)){
          objInstance.mesh.material.uniforms.displacementInfo.value.y = displacementBias;
        }

        cloneTexture.wrapS = THREE.RepeatWrapping;
        cloneTexture.wrapT = THREE.RepeatWrapping;
        if (!(typeof repeatU == UNDEFINED)){
          cloneTexture.repeat.x = repeatU;
        }
        if (!(typeof repeatV == UNDEFINED)){
          cloneTexture.repeat.y = repeatV;
        }

        var mirrorT = metaData["mirrorT"];
        var mirrorS = metaData["mirrorS"];
        if (!(typeof mirrorT == UNDEFINED)){
          if (mirrorT == "ON"){
            cloneTexture.wrapT = THREE.MirroredRepeatWrapping;
          }
        }
        if (!(typeof mirrorS == UNDEFINED)){
          if (mirrorS == "ON"){
            cloneTexture.wrapS = THREE.MirroredRepeatWrapping;
          }
        }

        objInstance.mapDisplacement(cloneTexture);
        cloneTexture.needsUpdate = true;
      }
    }
  }
  for (var objectGroupName in objectGroups){
    var group = objectGroups[objectGroupName].group;
    for (var objectName in group){
      delete addedObjects[objectName];
    }
  }
}

StateLoader.prototype.resetProject = function(undo){

  for (var gridSystemName in gridSystems){
    gridSystems[gridSystemName].destroy();
  }
  for (var addedObjectName in addedObjects){
    addedObjects[addedObjectName].destroy();
  }

  for (var grouppedObjectName in objectGroups){
    objectGroups[grouppedObjectName].destroy();
  }

  for (var lightName in lights){
    scene.remove(lights[lightName]);
  }

  for (var lightName in light_previewScene){
    previewScene.remove(light_previewScene[lightName]);
  }

  for (var lightName in pointLightRepresentations){
    scene.remove(pointLightRepresentations[lightName]);
  }

  if (skyboxMesh){
    scene.remove(skyboxMesh);
  }
  if (skyboxPreviewMesh){
    previewScene.remove(skyboxPreviewMesh);
  }

  if (!undo){
    collisionCallbackRequests = new Object();
    particleCollisionCallbackRequests = new Object();
    for (var particleSystemName in particleSystems){
      particleSystems[particleSystemName].destroy();
    }
    particleSystems = new Object();
    particleSystemPool = new Object();
    particleSystemPools = new Object();
  }

  for (var markedPointName in markedPoints){
    markedPoints[markedPointName].destroy();
  }

  keyboardBuffer = new Object();
  gridSystems = new Object();
  gridSelections = new Object();
  materials = new Object();
  addedObjects = new Object();
  textures = new Object();
  textureURLs = new Object();
  physicsTests = new Object();
  wallCollections = new Object();
  uploadedImages = new Object();
  modifiedTextures = new Object();
  lights = new Object();
  light_previewScene = new Object();
  pointLightRepresentations = new Object();
  texturePacks = new Object();
  skyBoxes = new Object();
  scripts = new Object();
  objectGroups = new Object();
  disabledObjectNames = new Object();
  markedPoints = new Object();
  manualDisplacementQueue = new Object();
  anchorGrid = 0;

  // FOG
  fogActive = false;
  fogColor = "black";
  fogDensity = 0;
  fogColorRGB = new THREE.Color(fogColor);

  if (!undo){
    mode = 0; // 0 -> DESIGN, 1-> PREVIEW
    this.oldPhysicsDebugMode = "NONE";
  }else{
    this.oldPhysicsDebugMode = physicsDebugMode;
  }
  physicsDebugMode = false;
  selectedAddedObject = 0;
  selectedObjectGroup = 0;
  selectedLightName = 0;
  skyboxVisible = false;
  croppedGridSystemBuffer = 0;

  scriptEditorShowing = false;
  objectSelectedByCommand = false;

  physicsWorld = new CANNON.World();
  physicsSolver = new CANNON.GSSolver();
  initPhysics();

  // PHYSICS DEBUG MODE
  var objectsToRemove = [];
  var children = previewScene.children;
  for (var i = 0; i<children.length; i++){
    var child = children[i];
    if (child.forDebugPurposes){
      objectsToRemove.push(child);
    }
  }
  for (var i = 0; i<objectsToRemove.length; i++){
    previewScene.remove(objectsToRemove[i]);
  }

  if (!undo){
    diffuseTextureCache = new Object();
    heightTextureCache = new Object();
    ambientOcculsionTextureCache = new Object();
    normalTextureCache = new Object();
    specularTextureCache = new Object();
    alphaTextureCache = new Object();
    emissiveTextureCache = new Object();
    skyboxCache = new Object();
  }

  initBadTV();
  $(datGui.domElement).attr("hidden", true);
  $(datGuiObjectManipulation.domElement).attr("hidden", true);
  $("#cliDivheader").text("ROYGBIV Scene Creator - CLI (Design mode)");

  LIMIT_BOUNDING_BOX = new THREE.Box3(new THREE.Vector3(-4000, -4000, -4000), new THREE.Vector3(4000, 4000, 4000));
  BIN_SIZE = 50;

  geometryCache = new Object();

  previewSceneRendered = false;

}
