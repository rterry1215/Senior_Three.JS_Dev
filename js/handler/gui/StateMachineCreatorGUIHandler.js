var StateMachineCreatorGUIHandler = function(){

}

StateMachineCreatorGUIHandler.prototype.show = function(){
  terminal.disable();
  terminal.clear();
  terminal.printInfo(Text.USE_GUI_TO_CREATE_STATE_MACHINE);

  selectionHandler.resetCurrentSelection();
  guiHandler.hideAll();

  this.createMermaidContainer();

  this.paramsByStateMachineName = {};

  guiHandler.datGuiStateMachineCreation = new dat.GUI({hideable: false});

  var knowledgesInScene = decisionHandler.knowledgesBySceneName[sceneHandler.getActiveSceneName()] || {};
  var knowledgeNames = Object.keys(knowledgesInScene);

  var statesInScene = decisionHandler.statesBySceneName[sceneHandler.getActiveSceneName()] || {};
  var stateMachinesInScene = decisionHandler.stateMachinesBySceneName[sceneHandler.getActiveSceneName()] || {};

  var stateNames = Object.keys(statesInScene);
  var stateMachineNames = Object.keys(stateMachinesInScene);
  for (var i = 0; i < stateMachineNames.length; i ++){
    stateNames.push(stateMachineNames[i]);
  }

  var entryStateController;
  var params;

  var onStateMachineDestroyed = function(stateMachineName){
    stateNames.splice(stateNames.indexOf(stateMachineName), 1);
    entryStateController.options(stateNames);
    entryStateController = guiHandler.datGuiStateMachineCreation.__controllers[4];
    params["Entry state"] = stateNames[0] || "";
    entryStateController.listen();
  };

  params = {
    "Name": "",
    "Knowledge": knowledgeNames[0] || "",
    "Entry state": stateNames[0] || "",
    "Create": function(){
      terminal.clear();

      var stateMachineName = this["Name"];
      var knowledgeName = this["Knowledge"];
      var entryStateName = this["Entry state"];

      if (!stateMachineName){
        terminal.printError(Text.STATE_MACHINE_NAME_CANNOT_BE_EMPTY);
        return;
      }

      if (!knowledgeName){
        terminal.printError(Text.KNOWLEDGE_IS_REQUIRED_TO_CREATE_A_STATE_MACHINE);
        return;
      }

      if (!entryStateName){
        terminal.printError(Text.ENTRY_STATE_IS_REQUIRED_TO_CREATE_A_STATE_MACHINE);
        return;
      }

      var result = decisionHandler.createStateMachine(stateMachineName, knowledgeName, entryStateName, null);

      if (result == -1){
        var anotherParentName = decisionHandler.stateParentsBySceneName[sceneHandler.getActiveSceneName()][entryStateName];
        terminal.printError(Text.ENTRY_STATE_HAS_ANOTHER_PARENT.replace(Text.PARAM1, anotherParentName));
        return;
      }

      if (result == -2 || result == -3){
        terminal.printError(Text.NAME_MUST_BE_UNIQUE);
        return;
      }

      stateMachineCreatorGUIHandler.addStateMachineFolder(stateMachineName, onStateMachineDestroyed);

      stateNames.push(stateMachineName);
      entryStateController.options(stateNames);
      entryStateController = guiHandler.datGuiStateMachineCreation.__controllers[4];
      entryStateController.listen();

      terminal.printInfo(Text.STATE_MACHINE_CREATED);
    },
    "Done": function(){
      stateMachineCreatorGUIHandler.hide();
    }
  };

  guiHandler.datGuiStateMachineCreation.add(params, "Name");
  guiHandler.datGuiStateMachineCreation.add(params, "Knowledge", knowledgeNames);
  entryStateController = guiHandler.datGuiStateMachineCreation.add(params, "Entry state", stateNames).listen();
  guiHandler.datGuiStateMachineCreation.add(params, "Create");
  guiHandler.datGuiStateMachineCreation.add(params, "Done");

  for (var smName in stateMachinesInScene){
    this.addStateMachineFolder(smName, onStateMachineDestroyed);
  }
}

StateMachineCreatorGUIHandler.prototype.createMermaidContainer = function(){
  canvas.style.visibility = "hidden";

  var mermaidContainer = document.createElement("div");
  mermaidContainer.style.display = "block";
  mermaidContainer.style.position = "absolute";
  mermaidContainer.style.top = "0";
  mermaidContainer.style.left = "0";
  mermaidContainer.style.width = "100%";
  mermaidContainer.style.height = "100%";
  mermaidContainer.style.backgroundColor = "#d3d3d3";
  mermaidContainer.style.overflowX = "scroll";
  mermaidContainer.style.overflowY = "scroll";
  mermaidContainer.className = "mermaid";

  document.body.prepend(mermaidContainer);

  this.mermaidContainer = mermaidContainer;
}

StateMachineCreatorGUIHandler.prototype.hide = function(){
  document.body.removeChild(this.mermaidContainer);
  delete this.mermaidContainer;
  delete this.paramsByStateMachineName;
  delete this.visualisingStateMachineName;

  canvas.style.visibility = "";

  terminal.clear();
  terminal.enable();
  guiHandler.hide(guiHandler.guiTypes.STATE_MACHINE_CREATION);
  terminal.printInfo(Text.GUI_CLOSED);
}

StateMachineCreatorGUIHandler.prototype.getStateDeclarationText = function(stateName){
  return stateName + "\n";
}

StateMachineCreatorGUIHandler.prototype.getStateMachineDeclaration = function(preconfiguredStateMachine){
  var text = "state " + preconfiguredStateMachine.name + " {\n";
  text += this.visualiseStateMachine(preconfiguredStateMachine, true);
  text += "}\n";
  return text;
}

StateMachineCreatorGUIHandler.prototype.visualiseStateMachine = function(preconfiguredStateMachine, skipHeader){
  var statesInScene = decisionHandler.statesBySceneName[sceneHandler.getActiveSceneName()] || {};
  var stateMachinesInScene = decisionHandler.stateMachinesBySceneName[sceneHandler.getActiveSceneName()] || {};

  var mermaidText = !skipHeader? "stateDiagram-v2\n": "";

  var entryStateName = preconfiguredStateMachine.entryStateName;

  var declaredMap = {};
  if (statesInScene[entryStateName]){
    mermaidText += this.getStateDeclarationText(entryStateName);
  }else{
    mermaidText += this.getStateMachineDeclaration(stateMachinesInScene[entryStateName]);
  }
  declaredMap[entryStateName] = true;

  var transitions = [];
  for (var i = 0; i < preconfiguredStateMachine.transitions.length; i ++){
    var transition = decisionHandler.transitionsBySceneName[sceneHandler.getActiveSceneName()][preconfiguredStateMachine.transitions[i]];
    transitions.push(transition);
    var sourceStateName = transition.sourceStateName;
    var targetStateName = transition.targetStateName;

    if (!declaredMap[sourceStateName]){
      if (statesInScene[sourceStateName]){
        mermaidText += this.getStateDeclarationText(sourceStateName);
      }else{
        mermaidText += this.getStateMachineDeclaration(stateMachinesInScene[sourceStateName]);
      }
      declaredMap[sourceStateName] = true;
    }
    if (!declaredMap[targetStateName]){
      if (statesInScene[targetStateName]){
        mermaidText += this.getStateDeclarationText(targetStateName);
      }else{
        mermaidText += this.getStateMachineDeclaration(stateMachinesInScene[targetStateName]);
      }
      declaredMap[targetStateName] = true;
    }
  }

  for (var i = 0; i < transitions.length; i ++){
    var transition = transitions[i];
    var sourceStateName = transition.sourceStateName;
    var targetStateName = transition.targetStateName;
    var transitionName = transition.name;
    mermaidText += sourceStateName + " --> " + targetStateName + ": " + transitionName + "\n";
  }

  if (!skipHeader){
    this.mermaidContainer.innerHTML = mermaidText;
    this.mermaidContainer.removeAttribute("data-processed");

    mermaid.init();
  }

  return mermaidText;
}

StateMachineCreatorGUIHandler.prototype.unVisualise = function(){
  this.mermaidContainer.innerHTML = "";
}

StateMachineCreatorGUIHandler.prototype.onVisualisedStateMachineChanged = function(newSMName, isVisualising){
  if (!isVisualising){
    if (this.visualisingStateMachineName){
      var params = this.paramsByStateMachineName[this.visualisingStateMachineName];
      params["Visualise"] = false;
    }
    this.visualisingStateMachineName = null;
    this.unVisualise();
    return;
  }

  for (var smName in this.paramsByStateMachineName){
    var params = this.paramsByStateMachineName[smName];
    params["Visualise"] = (smName == newSMName);
  }

  this.visualiseStateMachine(decisionHandler.stateMachinesBySceneName[sceneHandler.getActiveSceneName()][newSMName]);
  this.visualisingStateMachineName = newSMName;
}

StateMachineCreatorGUIHandler.prototype.addTransitionFolder = function(transitionName, parentFolder, stateMachineName){
  var folder = parentFolder.addFolder(transitionName);

  var params = {
    "Destroy": function(){
      terminal.clear();
      decisionHandler.removeTransitionFromStateMachine(stateMachineName, transitionName);
      parentFolder.removeFolder(folder);
      terminal.printInfo(Text.TRANSITION_REMOVED_FROM_SM);
    }
  };

  folder.add(params, "Destroy");
}

StateMachineCreatorGUIHandler.prototype.addStateMachineFolder = function(stateMachineName, onStateMachineDestroyed){
  var preconfiguredStateMachine = decisionHandler.stateMachinesBySceneName[sceneHandler.getActiveSceneName()][stateMachineName];

  var folderText = stateMachineName + " [Entry: " + preconfiguredStateMachine.entryStateName + "]";

  var stateMachineFolder = guiHandler.datGuiStateMachineCreation.addFolder(folderText);

  var transitionsInScene = decisionHandler.transitionsBySceneName[sceneHandler.getActiveSceneName()] || {};
  var transitionNames = Object.keys(transitionsInScene);

  var transitionsFolder;

  var params = {
    "Transition": transitionNames[0] || "",
    "Add transition": function(){
      terminal.clear();
      var transitionName = this["Transition"];

      if (!transitionName){
        terminal.printError(Text.TRANSITION_NAME_CANNOT_BE_EMPTY);
        return;
      }

      var transition = decisionHandler.transitionsBySceneName[sceneHandler.getActiveSceneName()][transitionName];
      var result = decisionHandler.addTransitionToStateMachine(stateMachineName, transitionName);
      if (result == -1){
        terminal.printError(Text.THE_SOURCE_STATE_OF_TRANSITION_DIFFERENT_PARENT);
        return;
      }
      if (result == 0){
        terminal.printError(Text.TRANSITION_WITH_SAME_SOURCE_TARGET_EXISTS);
        return;
      }

      stateMachineCreatorGUIHandler.addTransitionFolder(transitionName, transitionsFolder, stateMachineName);
      terminal.printInfo(Text.TRANSITION_ADDED);
    },
    "Destroy": function(){
      terminal.clear();
      decisionHandler.destroyStateMachine(stateMachineName);
      guiHandler.datGuiStateMachineCreation.removeFolder(stateMachineFolder);
      if (stateMachineCreatorGUIHandler.visualisingStateMachineName == stateMachineName){
        stateMachineCreatorGUIHandler.onVisualisedStateMachineChanged(stateMachineName, false);
      }
      delete stateMachineCreatorGUIHandler.paramsByStateMachineName[stateMachineName];
      onStateMachineDestroyed(stateMachineName);
      terminal.printInfo(Text.STATE_MACHINE_DESTROYED);
    },
    "Visualise": false
  };

  stateMachineFolder.add(params, "Transition", transitionNames);
  stateMachineFolder.add(params, "Add transition");
  stateMachineFolder.add(params, "Destroy");
  stateMachineFolder.add(params, "Visualise").onChange(function(val){
    terminal.clear();
    stateMachineCreatorGUIHandler.onVisualisedStateMachineChanged(stateMachineName, val);
    if (val){
      terminal.printInfo(Text.VISUALISING.replace(Text.PARAM1, stateMachineName));
    }else{
      terminal.printInfo(Text.NOT_VISUALISING.replace(Text.PARAM1, stateMachineName));
    }
  }).listen();

  transitionsFolder = stateMachineFolder.addFolder("Transitions");

  for (var i = 0; i < preconfiguredStateMachine.transitions.length; i ++){
    this.addTransitionFolder(preconfiguredStateMachine.transitions[i], transitionsFolder, stateMachineName);
  }

  this.paramsByStateMachineName[stateMachineName] = params;
}
