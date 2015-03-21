WebInspector.PromisePane=function()
{WebInspector.VBox.call(this);this.registerRequiredCSS("ui/filter.css");this.registerRequiredCSS("promises/promisePane.css");this.element.classList.add("promises");var statusBar=new WebInspector.StatusBar(this.element);this._recordButton=new WebInspector.StatusBarButton("","record-status-bar-item");this._recordButton.addEventListener("click",this._recordButtonClicked.bind(this));statusBar.appendStatusBarItem(this._recordButton);var clearButton=new WebInspector.StatusBarButton(WebInspector.UIString("Clear"),"clear-status-bar-item");clearButton.addEventListener("click",this._clearButtonClicked.bind(this));statusBar.appendStatusBarItem(clearButton);this._filter=new WebInspector.PromisePaneFilter(this._refresh.bind(this));statusBar.appendStatusBarItem(this._filter.filterButton());var garbageCollectButton=new WebInspector.StatusBarButton(WebInspector.UIString("Collect garbage"),"garbage-collect-status-bar-item");garbageCollectButton.addEventListener("click",this._garbageCollectButtonClicked,this);statusBar.appendStatusBarItem(garbageCollectButton);var asyncCheckbox=new WebInspector.StatusBarCheckbox(WebInspector.UIString("Async"),WebInspector.UIString("Capture async stack traces"),WebInspector.settings.enableAsyncStackTraces);statusBar.appendStatusBarItem(asyncCheckbox);this.element.appendChild(this._filter.filtersContainer());this._hiddenByFilterCount=0;this._filterStatusMessageElement=this.element.createChild("div","promises-filter-status hidden");this._filterStatusTextElement=this._filterStatusMessageElement.createChild("span");this._filterStatusMessageElement.createTextChild(" ");var resetFiltersLink=this._filterStatusMessageElement.createChild("span","link");resetFiltersLink.textContent=WebInspector.UIString("Show all promises.");resetFiltersLink.addEventListener("click",this._resetFilters.bind(this),true);this._dataGridContainer=new WebInspector.VBox();this._dataGridContainer.show(this.element);var columns=[{id:"status",weight:1},{id:"function",title:WebInspector.UIString("Function"),disclosure:true,weight:10},{id:"created",title:WebInspector.UIString("Created"),weight:10},{id:"settled",title:WebInspector.UIString("Settled"),weight:10},{id:"tts",title:WebInspector.UIString("Time to settle"),weight:10}];this._dataGrid=new WebInspector.DataGrid(columns,undefined,undefined,undefined,this._onContextMenu.bind(this));this._dataGrid.show(this._dataGridContainer.element);this._linkifier=new WebInspector.Linkifier();this._promiseDetailsByTarget=new Map();this._promiseIdToNode=new Map();this._popoverHelper=new WebInspector.PopoverHelper(this.element,this._getPopoverAnchor.bind(this),this._showPopover.bind(this));this._popoverHelper.setTimeout(250,250);this.element.addEventListener("click",this._hidePopover.bind(this),true);WebInspector.targetManager.addModelListener(WebInspector.DebuggerModel,WebInspector.DebuggerModel.Events.PromiseUpdated,this._onPromiseUpdated,this);WebInspector.targetManager.addModelListener(WebInspector.ResourceTreeModel,WebInspector.ResourceTreeModel.EventTypes.MainFrameNavigated,this._mainFrameNavigated,this);WebInspector.context.addFlavorChangeListener(WebInspector.Target,this._targetChanged,this);WebInspector.targetManager.observeTargets(this);}
WebInspector.PromisePane._maxPromiseCount=1000;WebInspector.PromisePane.prototype={elementsToRestoreScrollPositionsFor:function()
{return[this._dataGrid.scrollContainer];},targetAdded:function(target)
{if(this._enabled)
this._enablePromiseTracker(target);},targetRemoved:function(target)
{this._promiseDetailsByTarget.delete(target);if(this._target===target){this._clear();delete this._target;}},_targetChanged:function(event)
{if(!this._enabled)
return;var target=(event.data);if(this._target===target)
return;this._target=target;this._refresh();},_mainFrameNavigated:function(event)
{var frame=(event.data);var target=frame.target();this._promiseDetailsByTarget.delete(target);if(this._target===target)
this._clear();},wasShown:function()
{if(typeof this._enabled==="undefined"){this._target=WebInspector.context.flavor(WebInspector.Target);this._updateRecordingState(true);}
if(this._refreshIsNeeded)
this._refresh();},_enablePromiseTracker:function(target)
{target.debuggerAgent().enablePromiseTracker(true);},_disablePromiseTracker:function(target)
{target.debuggerAgent().disablePromiseTracker();},willHide:function()
{this._hidePopover();},_hidePopover:function()
{this._popoverHelper.hidePopover();},_recordButtonClicked:function()
{this._updateRecordingState(!this._recordButton.toggled());},_updateRecordingState:function(enabled)
{this._enabled=enabled;this._recordButton.setToggled(this._enabled);this._recordButton.setTitle(this._enabled?WebInspector.UIString("Stop Recording Promises Log"):WebInspector.UIString("Record Promises Log"));WebInspector.targetManager.targets().forEach(this._enabled?this._enablePromiseTracker:this._disablePromiseTracker,this);},_clearButtonClicked:function()
{this._clear();if(this._target)
this._promiseDetailsByTarget.delete(this._target);},_resetFilters:function()
{this._filter.reset();},_updateFilterStatus:function()
{this._filterStatusTextElement.textContent=WebInspector.UIString(this._hiddenByFilterCount===1?"%d promise is hidden by filters.":"%d promises are hidden by filters.",this._hiddenByFilterCount);this._filterStatusMessageElement.classList.toggle("hidden",!this._hiddenByFilterCount);},_garbageCollectButtonClicked:function()
{var targets=WebInspector.targetManager.targets();for(var i=0;i<targets.length;++i)
targets[i].heapProfilerAgent().collectGarbage();},_truncateLogIfNeeded:function(target)
{var promiseIdToDetails=this._promiseDetailsByTarget.get(target);if(!promiseIdToDetails||promiseIdToDetails.size<=WebInspector.PromisePane._maxPromiseCount)
return false;var elementsToTruncate=WebInspector.PromisePane._maxPromiseCount/10;var sortedDetails=promiseIdToDetails.valuesArray().sort(compare);for(var i=0;i<elementsToTruncate;++i)
promiseIdToDetails.delete(sortedDetails[i].id);return true;function compare(x,y)
{var t1=x.creationTime||0;var t2=y.creationTime||0;return t1-t2||x.id-y.id;}},_onPromiseUpdated:function(event)
{var target=(event.target.target());var eventType=(event.data.eventType);var details=(event.data.promise);if(eventType==="gc")
details.__isGarbageCollected=true;var promiseIdToDetails=this._promiseDetailsByTarget.get(target);if(!promiseIdToDetails){promiseIdToDetails=new Map();this._promiseDetailsByTarget.set(target,promiseIdToDetails)}
var previousDetails=promiseIdToDetails.get(details.id);if(!previousDetails&&eventType==="gc")
return;var truncated=this._truncateLogIfNeeded(target);promiseIdToDetails.set(details.id,details);if(target===this._target){if(!this.isShowing()){this._refreshIsNeeded=true;return;}
if(truncated||this._refreshIsNeeded){this._refresh();return;}
var node=this._promiseIdToNode.get(details.id);var wasVisible=!previousDetails||this._filter.shouldBeVisible(previousDetails,node);if(eventType==="gc"&&node&&node.parent)
node.element().classList.add("promise-gc");else
this._attachDataGridNode(details);var isVisible=this._filter.shouldBeVisible(details,this._promiseIdToNode.get(details.id));if(wasVisible!==isVisible){this._hiddenByFilterCount+=wasVisible?1:-1;this._updateFilterStatus();}}},_attachDataGridNode:function(details)
{var node=this._createDataGridNode(details);var parentNode=this._findVisibleParentNodeDetails(details);if(parentNode!==node.parent)
parentNode.appendChild(node);if(details.__isGarbageCollected)
node.element().classList.add("promise-gc");if(this._filter.shouldBeVisible(details,node))
parentNode.expanded=true;else
node.remove();},_findVisibleParentNodeDetails:function(details)
{var promiseIdToDetails=this._promiseDetailsByTarget.get(this._target);while(details){var parentId=details.parentId;if(typeof parentId!=="number")
break;details=promiseIdToDetails.get(parentId);if(!details)
break;var node=this._promiseIdToNode.get(details.id);if(node&&this._filter.shouldBeVisible(details,node))
return node;}
return this._dataGrid.rootNode();},_createDataGridNode:function(details)
{var title="";switch(details.status){case"pending":title=WebInspector.UIString("Pending");break;case"resolved":title=WebInspector.UIString("Fulfilled");break;case"rejected":title=WebInspector.UIString("Rejected");break;}
if(details.__isGarbageCollected)
title+=" "+WebInspector.UIString("(garbage collected)");var statusElement=createElementWithClass("div","status "+details.status);statusElement.title=title;var data={status:statusElement,promiseId:details.id,function:WebInspector.beautifyFunctionName(details.callFrame?details.callFrame.functionName:"")};if(details.callFrame)
data.created=this._linkifier.linkifyConsoleCallFrame(this._target,details.callFrame);if(details.settlementStack&&details.settlementStack[0])
data.settled=this._linkifier.linkifyConsoleCallFrame(this._target,details.settlementStack[0]);if(details.creationTime&&details.settlementTime&&details.settlementTime>=details.creationTime)
data.tts=Number.millisToString(details.settlementTime-details.creationTime);var node=this._promiseIdToNode.get(details.id);if(!node){node=new WebInspector.DataGridNode(data,false);this._promiseIdToNode.set(details.id,node);}else{node.data=data;}
return node;},_refresh:function()
{delete this._refreshIsNeeded;this._clear();if(!this._target)
return;if(!this._promiseDetailsByTarget.has(this._target))
return;var rootNode=this._dataGrid.rootNode();var promiseIdToDetails=this._promiseDetailsByTarget.get(this._target);var nodesToInsert={__proto__:null};for(var pair of promiseIdToDetails){var id=(pair[0]);var details=(pair[1]);var node=this._createDataGridNode(details);if(!this._filter.shouldBeVisible(details,node)){++this._hiddenByFilterCount;continue;}
nodesToInsert[id]={details:details,node:node};}
for(var id in nodesToInsert){var node=nodesToInsert[id].node;var details=nodesToInsert[id].details;this._findVisibleParentNodeDetails(details).appendChild(node);}
for(var id in nodesToInsert){var node=nodesToInsert[id].node;var details=nodesToInsert[id].details;node.expanded=true;if(details.__isGarbageCollected)
node.element().classList.add("promise-gc");}
this._updateFilterStatus();},_clear:function()
{this._hiddenByFilterCount=0;this._updateFilterStatus();this._promiseIdToNode.clear();this._hidePopover();this._dataGrid.rootNode().removeChildren();this._linkifier.reset();},_onContextMenu:function(contextMenu,node)
{var target=this._target;if(!target)
return;var promiseId=node.data.promiseId;if(this._promiseDetailsByTarget.has(target)){var details=this._promiseDetailsByTarget.get(target).get(promiseId);if(details.__isGarbageCollected)
return;}
contextMenu.appendItem(WebInspector.UIString.capitalize("Show in ^console"),showPromiseInConsole);contextMenu.show();function showPromiseInConsole()
{target.debuggerAgent().getPromiseById(promiseId,"console",didGetPromiseById);}
function didGetPromiseById(error,promise)
{if(error||!promise)
return;var object=target.runtimeModel.createRemoteObject(promise);object.callFunction(dumpIntoConsole);object.release();function dumpIntoConsole()
{console.log(this);}
WebInspector.console.show();}},_getPopoverAnchor:function(element,event)
{if(!this._target||!this._promiseDetailsByTarget.has(this._target))
return undefined;var node=this._dataGrid.dataGridNodeFromNode(element);if(!node)
return undefined;var details=this._promiseDetailsByTarget.get(this._target).get(node.data.promiseId);if(!details)
return undefined;var anchor=element.enclosingNodeOrSelfWithClass("created-column");if(anchor)
return details.creationStack?anchor:undefined;anchor=element.enclosingNodeOrSelfWithClass("settled-column");return(anchor&&details.settlementStack)?anchor:undefined;},_showPopover:function(anchor,popover)
{var node=this._dataGrid.dataGridNodeFromNode(anchor);var details=this._promiseDetailsByTarget.get(this._target).get(node.data.promiseId);var stackTrace;var asyncStackTrace;if(anchor.classList.contains("created-column")){stackTrace=details.creationStack;asyncStackTrace=details.asyncCreationStack;}else{stackTrace=details.settlementStack;asyncStackTrace=details.asyncSettlementStack;}
var content=WebInspector.DOMPresentationUtils.buildStackTracePreviewContents(this._target,this._linkifier,stackTrace,asyncStackTrace);popover.setCanShrink(true);popover.showForAnchor(content,anchor);},__proto__:WebInspector.VBox.prototype}
WebInspector.PromisePaneFilter=function(filterChanged)
{this._filterChangedCallback=filterChanged;this._filterBar=new WebInspector.FilterBar();this._filtersContainer=createElementWithClass("div","promises-filters-header hidden");this._filtersContainer.appendChild(this._filterBar.filtersElement());this._filterBar.addEventListener(WebInspector.FilterBar.Events.FiltersToggled,this._onFiltersToggled,this);this._filterBar.setName("promisePane");this._textFilterUI=new WebInspector.TextFilterUI(true);this._textFilterUI.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._onFilterChanged,this);this._filterBar.addFilter(this._textFilterUI);var statuses=[{name:"pending",label:WebInspector.UIString("Pending")},{name:"resolved",label:WebInspector.UIString("Fulfilled")},{name:"rejected",label:WebInspector.UIString("Rejected")}];this._promiseStatusFiltersSetting=WebInspector.settings.createSetting("promiseStatusFilters",{});this._statusFilterUI=new WebInspector.NamedBitSetFilterUI(statuses,this._promiseStatusFiltersSetting);this._statusFilterUI.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._onFilterChanged,this);this._filterBar.addFilter(this._statusFilterUI);this._hideCollectedPromisesSetting=WebInspector.settings.createSetting("hideCollectedPromises",false);var hideCollectedCheckbox=new WebInspector.CheckboxFilterUI("hide-collected-promises",WebInspector.UIString("Hide collected promises"),true,this._hideCollectedPromisesSetting);hideCollectedCheckbox.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._onFilterChanged,this);this._filterBar.addFilter(hideCollectedCheckbox);}
WebInspector.PromisePaneFilter.prototype={filterButton:function()
{return this._filterBar.filterButton();},filtersContainer:function()
{return this._filtersContainer;},shouldBeVisible:function(details,node)
{if(!this._statusFilterUI.accept(details.status))
return false;if(this._hideCollectedPromisesSetting.get()&&details.__isGarbageCollected)
return false;var regex=this._textFilterUI.regex();if(!regex)
return true;var text=this._createDataTextForSearch(node);regex.lastIndex=0;return regex.test(text);},_createDataTextForSearch:function(node)
{var texts=[];var data=node.data;for(var key in data){var value=data[key];var text=(value instanceof Node)?value.textContent:String(value);if(text)
texts.push(text);}
return texts.join(" ");},_onFiltersToggled:function(event)
{var toggled=(event.data);this._filtersContainer.classList.toggle("hidden",!toggled);},_onFilterChanged:function()
{if(this._filterChangedTimeout)
clearTimeout(this._filterChangedTimeout);this._filterChangedTimeout=setTimeout(onTimerFired.bind(this),100);function onTimerFired()
{delete this._filterChangedTimeout;this._filterChangedCallback();}},reset:function()
{this._hideCollectedPromisesSetting.set(false);this._promiseStatusFiltersSetting.set({});this._textFilterUI.setValue("");}};Runtime.cachedResources["promises/promisePane.css"]="/*\n * Copyright 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.promises .data-grid {\n    border: none;\n    flex: 1 1;\n}\n\n.promises .promise-gc {\n    opacity: 0.6;\n}\n\n.promises .data-grid th:hover {\n    background-color: inherit !important;\n}\n\n.promises .data-grid .odd {\n    background-color: #eee;\n}\n\n.promises .data-grid .header-container {\n    height: 30px;\n    border-top: 1px solid rgb(205, 205, 205);\n}\n\n.promises .data-grid .data-container {\n    top: 29px;\n}\n\n.promises .data-grid table.data {\n    background: transparent;\n}\n\n.promises .data-grid th {\n    background-color: white;\n}\n\n.promises .data-grid td {\n    line-height: 17px;\n    height: 24px;\n    vertical-align: middle;\n}\n\n.promises .data-grid th,\n.promises .data-grid td {\n    border-bottom: 1px solid rgb(205, 205, 205);\n    border-left: 1px solid rgb(205, 205, 205);\n}\n\n.promises .status {\n    -webkit-mask-image: url(Images/statusbarButtonGlyphs.png);\n    -webkit-mask-size: 320px 144px;\n    -webkit-mask-position: -294px -26px;\n    background-color: #bbb;\n    height: 20px;\n    width: 20px;\n}\n\n.promises .status.rejected {\n    background-color: rgb(216, 0, 0);\n}\n\n.promises .status.resolved {\n    background-color: #696;\n}\n\n.promises-filters-header {\n    flex: 0 0 23px;\n    overflow: hidden;\n}\n\n.promises-filter-status {\n    flex: 0 0 23px;\n    padding-left: 18px;\n    color: rgb(128, 128, 128);\n    font-style: italic;\n}\n.promises-filter-status .link:hover {\n    color: rgb(15%, 15%, 15%);\n}\n.promises-filter-status .link {\n    color: rgb(33%, 33%, 33%);\n}\n\n/*# sourceURL=promises/promisePane.css */";