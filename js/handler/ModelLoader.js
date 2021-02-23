var ModelLoader = function(){
  this.reset();
}

ModelLoader.prototype.reset = function(){
  this.cache = {};
}

ModelLoader.prototype.loadModel = function(directoryName, objFileName, mtlFileName, onLoaded, onError){
  if (this.cache[directoryName]){
    onLoaded(this.cache[directoryName]);
    return;
  }

  var rootPath = "./models/" + directoryName + "/";

  new THREE.MTLLoader().setPath(rootPath).load(mtlFileName, function(materials){
    materials.preload();

    new THREE.OBJLoader().setMaterials(materials).setPath(rootPath).load(objFileName, function(object){
      modelLoader.cache[directoryName] = object;

      var allMaterials = [];
      for (var i = 0; i < object.children.length; i ++){
        var child = object.children[i];
        if (child.material instanceof Array){
          for (var i2 = 0; i2 < child.material.length; i2 ++){
            allMaterials.push(child.material[i2]);
          }
        }else{
          allMaterials.push(child.material);
        }
      }

      for (var i = 0; i < allMaterials.length; i ++){
        var mat = allMaterials[i];
        if ((mat.map && !mat.map.image) || (mat.normalMap && !mat.normalMap.image) || (mat.specularMap && !mat.specularMap.image) || (mat.alphaMap && !mat.alphaMap.image) || (mat.roughnessMap && !mat.roughnessMap.image) || (mat.metalnessMap && !mat.metalnessMap.image)){
          var fn = function(){
            for (var i = 0; i < object.children.length; i ++){
              if ((mat.map && !mat.map.image) || (mat.normalMap && !mat.normalMap.image)){
                setTimeout(fn, 100);
                return;
              }
            }
            onLoaded(object);
          }
          setTimeout(fn, 100);
          return;
        }
      }

      onLoaded(object);
    }, noop, function(err){
      onError(false, err);
    });
  }, noop, function(err){
    onError(true, err);
  });
}
