WebInspector.ConsoleViewMessage=function(consoleMessage,linkifier,nestingLevel)
{this._message=consoleMessage;this._linkifier=linkifier;this._repeatCount=1;this._closeGroupDecorationCount=0;this._nestingLevel=nestingLevel;this._dataGrids=[];this._dataGridParents=new Map();this._customFormatters={"object":this._formatParameterAsObject,"array":this._formatParameterAsArray,"node":this._formatParameterAsNode,"map":this._formatParameterAsObject,"set":this._formatParameterAsObject,"iterator":this._formatParameterAsObject,"generator":this._formatParameterAsObject,"string":this._formatParameterAsString,"error":this._formatParameterAsError};}
WebInspector.ConsoleViewMessage.prototype={_target:function()
{return this.consoleMessage().target();},element:function()
{return this.toMessageElement();},wasShown:function()
{for(var i=0;this._dataGrids&&i<this._dataGrids.length;++i){var dataGrid=this._dataGrids[i];var parentElement=this._dataGridParents.get(dataGrid)||null;dataGrid.show(parentElement);dataGrid.updateWidths();}},cacheFastHeight:function()
{this._cachedHeight=this.contentElement().offsetHeight;},willHide:function()
{for(var i=0;this._dataGrids&&i<this._dataGrids.length;++i){var dataGrid=this._dataGrids[i];this._dataGridParents.set(dataGrid,dataGrid.element.parentElement);dataGrid.detach();}},fastHeight:function()
{if(this._cachedHeight)
return this._cachedHeight;const defaultConsoleRowHeight=16;if(this._message.type===WebInspector.ConsoleMessage.MessageType.Table){var table=this._message.parameters[0];if(table&&table.preview)
return defaultConsoleRowHeight*table.preview.properties.length;}
return defaultConsoleRowHeight;},consoleMessage:function()
{return this._message;},_formatMessage:function()
{this._formattedMessage=createElement("span");this._formattedMessage.appendChild(WebInspector.View.createStyleElement("components/objectValue.css"));this._formattedMessage.className="console-message-text source-code";function linkifyRequest(title)
{return WebInspector.Linkifier.linkifyUsingRevealer((this.request),title,this.request.url);}
var consoleMessage=this._message;if(!this._messageElement){if(consoleMessage.source===WebInspector.ConsoleMessage.MessageSource.ConsoleAPI){switch(consoleMessage.type){case WebInspector.ConsoleMessage.MessageType.Trace:this._messageElement=this._format(consoleMessage.parameters||["console.trace()"]);break;case WebInspector.ConsoleMessage.MessageType.Clear:this._messageElement=createTextNode(WebInspector.UIString("Console was cleared"));this._formattedMessage.classList.add("console-info");break;case WebInspector.ConsoleMessage.MessageType.Assert:var args=[WebInspector.UIString("Assertion failed:")];if(consoleMessage.parameters)
args=args.concat(consoleMessage.parameters);this._messageElement=this._format(args);break;case WebInspector.ConsoleMessage.MessageType.Dir:var obj=consoleMessage.parameters?consoleMessage.parameters[0]:undefined;var args=["%O",obj];this._messageElement=this._format(args);break;case WebInspector.ConsoleMessage.MessageType.Profile:case WebInspector.ConsoleMessage.MessageType.ProfileEnd:this._messageElement=this._format([consoleMessage.messageText]);break;default:if(consoleMessage.parameters&&consoleMessage.parameters.length===1&&consoleMessage.parameters[0].type==="string")
this._messageElement=this._tryFormatAsError((consoleMessage.parameters[0].value));var args=consoleMessage.parameters||[consoleMessage.messageText];this._messageElement=this._messageElement||this._format(args);}}else if(consoleMessage.source===WebInspector.ConsoleMessage.MessageSource.Network){if(consoleMessage.request){this._messageElement=createElement("span");if(consoleMessage.level===WebInspector.ConsoleMessage.MessageLevel.Error){this._messageElement.createTextChildren(consoleMessage.request.requestMethod," ");this._messageElement.appendChild(WebInspector.Linkifier.linkifyUsingRevealer(consoleMessage.request,consoleMessage.request.url,consoleMessage.request.url));if(consoleMessage.request.failed)
this._messageElement.createTextChildren(" ",consoleMessage.request.localizedFailDescription);else
this._messageElement.createTextChildren(" ",String(consoleMessage.request.statusCode)," (",consoleMessage.request.statusText,")");}else{var fragment=WebInspector.linkifyStringAsFragmentWithCustomLinkifier(consoleMessage.messageText,linkifyRequest.bind(consoleMessage));this._messageElement.appendChild(fragment);}}else{var url=consoleMessage.url;if(url){var isExternal=!WebInspector.resourceForURL(url)&&!WebInspector.networkMapping.uiSourceCodeForURLForAnyTarget(url);this._anchorElement=WebInspector.linkifyURLAsNode(url,url,"console-message-url",isExternal);}
this._messageElement=this._format([consoleMessage.messageText]);}}else{var args=consoleMessage.parameters||[consoleMessage.messageText];this._messageElement=this._format(args);}}
if(consoleMessage.source!==WebInspector.ConsoleMessage.MessageSource.Network||consoleMessage.request){if(consoleMessage.scriptId){this._anchorElement=this._linkifyScriptId(consoleMessage.scriptId,consoleMessage.url||"",consoleMessage.line,consoleMessage.column);}else{var showBlackboxed=(consoleMessage.source!==WebInspector.ConsoleMessage.MessageSource.ConsoleAPI);var callFrame=WebInspector.DebuggerPresentationUtils.callFrameAnchorFromStackTrace(this._target(),consoleMessage.stackTrace,consoleMessage.asyncStackTrace,showBlackboxed);if(callFrame&&callFrame.scriptId)
this._anchorElement=this._linkifyCallFrame(callFrame);else if(consoleMessage.url&&consoleMessage.url!=="undefined")
this._anchorElement=this._linkifyLocation(consoleMessage.url,consoleMessage.line,consoleMessage.column);}}
this._formattedMessage.appendChild(this._messageElement);if(this._anchorElement){this._anchorElement.appendChild(createTextNode(" "));this._formattedMessage.insertBefore(this._anchorElement,this._formattedMessage.firstChild);}
var dumpStackTrace=!!consoleMessage.stackTrace&&consoleMessage.stackTrace.length&&(consoleMessage.source===WebInspector.ConsoleMessage.MessageSource.Network||consoleMessage.level===WebInspector.ConsoleMessage.MessageLevel.Error||consoleMessage.type===WebInspector.ConsoleMessage.MessageType.Trace);if(dumpStackTrace){var treeOutline=new TreeOutline();treeOutline.element.classList.add("outline-disclosure","outline-disclosure-no-padding");var content=this._formattedMessage;var root=new TreeElement(content);root.toggleOnClick=true;root.selectable=false;content.treeElementForTest=root;treeOutline.appendChild(root);if(consoleMessage.type===WebInspector.ConsoleMessage.MessageType.Trace)
root.expand();this._populateStackTraceTreeElement(root);this._formattedMessage=treeOutline.element;}},_formattedMessageText:function()
{this.formattedMessage();return this._messageElement.deepTextContent();},formattedMessage:function()
{if(!this._formattedMessage)
this._formatMessage();return this._formattedMessage;},_linkifyLocation:function(url,lineNumber,columnNumber)
{var target=this._target();if(!target)
return null;lineNumber=lineNumber?lineNumber-1:0;columnNumber=columnNumber?columnNumber-1:0;if(this._message.source===WebInspector.ConsoleMessage.MessageSource.CSS){var headerIds=target.cssModel.styleSheetIdsForURL(url);var cssLocation=new WebInspector.CSSLocation(target,headerIds[0]||null,url,lineNumber,columnNumber);return this._linkifier.linkifyCSSLocation(cssLocation,"console-message-url");}
return this._linkifier.linkifyScriptLocation(target,null,url,lineNumber,columnNumber,"console-message-url");},_linkifyCallFrame:function(callFrame)
{var target=this._target();return this._linkifier.linkifyConsoleCallFrame(target,callFrame,"console-message-url");},_linkifyScriptId:function(scriptId,url,lineNumber,columnNumber)
{var target=this._target();if(!target)
return null;lineNumber=lineNumber?lineNumber-1:0;columnNumber=columnNumber?columnNumber-1:0;return this._linkifier.linkifyScriptLocation(target,scriptId,url,lineNumber,columnNumber,"console-message-url");},isErrorOrWarning:function()
{return(this._message.level===WebInspector.ConsoleMessage.MessageLevel.Warning||this._message.level===WebInspector.ConsoleMessage.MessageLevel.Error);},_format:function(parameters)
{var formattedResult=createElement("span");if(!parameters.length)
return formattedResult;var target=this._target();for(var i=0;i<parameters.length;++i){if(parameters[i]instanceof WebInspector.RemoteObject)
continue;if(!target){parameters[i]=WebInspector.RemoteObject.fromLocalObject(parameters[i]);continue;}
if(typeof parameters[i]==="object")
parameters[i]=target.runtimeModel.createRemoteObject(parameters[i]);else
parameters[i]=target.runtimeModel.createRemoteObjectFromPrimitiveValue(parameters[i]);}
var shouldFormatMessage=WebInspector.RemoteObject.type(parameters[0])==="string"&&(this._message.type!==WebInspector.ConsoleMessage.MessageType.Result||this._message.level===WebInspector.ConsoleMessage.MessageLevel.Error);if(shouldFormatMessage){var result=this._formatWithSubstitutionString(parameters[0].description,parameters.slice(1),formattedResult);parameters=result.unusedSubstitutions;if(parameters.length)
formattedResult.createTextChild(" ");}
if(this._message.type===WebInspector.ConsoleMessage.MessageType.Table){formattedResult.appendChild(this._formatParameterAsTable(parameters));return formattedResult;}
for(var i=0;i<parameters.length;++i){if(shouldFormatMessage&&parameters[i].type==="string")
formattedResult.appendChild(WebInspector.linkifyStringAsFragment(parameters[i].description));else
formattedResult.appendChild(this._formatParameter(parameters[i],false,true));if(i<parameters.length-1)
formattedResult.createTextChild(" ");}
return formattedResult;},_formatParameter:function(output,forceObjectFormat,includePreview)
{if(output.customPreview()){var customSection=new WebInspector.CustomPreviewSection(output);return customSection.element();}
var type=forceObjectFormat?"object":(output.subtype||output.type);var formatter=this._customFormatters[type]||this._formatParameterAsValue;var span=createElement("span");span.className="object-value-"+type+" source-code";formatter.call(this,output,span,includePreview);return span;},_formatParameterAsValue:function(obj,elem)
{elem.createTextChild(obj.description||"");if(obj.objectId)
elem.addEventListener("contextmenu",this._contextMenuEventFired.bind(this,obj),false);},_formatParameterAsObject:function(obj,elem,includePreview)
{this._formatParameterAsArrayOrObject(obj,elem,includePreview);},_formatParameterAsArrayOrObject:function(obj,elem,includePreview)
{var titleElement=createElement("span");if(includePreview&&obj.preview){titleElement.classList.add("console-object-preview");var lossless=this._appendObjectPreview(titleElement,obj.preview,obj);if(lossless){elem.appendChild(titleElement);titleElement.addEventListener("contextmenu",this._contextMenuEventFired.bind(this,obj),false);return;}}else{titleElement.createTextChild(obj.description||"");}
var section=new WebInspector.ObjectPropertiesSection(obj,titleElement);section.enableContextMenu();elem.appendChild(section.element);var note=section.titleElement.createChild("span","object-info-state-note");note.title=WebInspector.UIString("Object state below is captured upon first expansion");},_contextMenuEventFired:function(obj,event)
{var contextMenu=new WebInspector.ContextMenu(event);contextMenu.appendApplicableItems(obj);contextMenu.show();},_appendObjectPreview:function(parentElement,preview,object)
{var description=preview.description;if(preview.type!=="object"||preview.subtype==="null"){parentElement.appendChild(this._renderPropertyPreview(preview.type,preview.subtype,description));return true;}
if(description&&preview.subtype!=="array")
parentElement.createTextChildren(description," ");if(preview.entries)
return this._appendEntriesPreview(parentElement,preview);return this._appendPropertiesPreview(parentElement,preview,object);},_appendPropertiesPreview:function(parentElement,preview,object)
{var isArray=preview.subtype==="array";var arrayLength=WebInspector.RemoteObject.arrayLength(preview);var properties=preview.properties;if(isArray)
properties=properties.slice().stableSort(compareIndexesFirst);function compareIndexesFirst(a,b)
{var index1=toArrayIndex(a.name);var index2=toArrayIndex(b.name);if(index1<0)
return index2<0?0:1;return index2<0?-1:index1-index2;}
function toArrayIndex(name)
{var index=name>>>0;if(String(index)===name&&index<arrayLength)
return index;return-1;}
parentElement.createTextChild(isArray?"[":"{");for(var i=0;i<properties.length;++i){if(i>0)
parentElement.createTextChild(", ");var property=properties[i];var name=property.name;if(!isArray||name!=i||i>=arrayLength){if(/^\s|\s$|^$|\n/.test(name))
parentElement.createChild("span","name").createTextChildren("\"",name.replace(/\n/g,"\u21B5"),"\"");else
parentElement.createChild("span","name").textContent=name;parentElement.createTextChild(": ");}
parentElement.appendChild(this._renderPropertyPreviewOrAccessor(object,[property]));}
if(preview.overflow)
parentElement.createChild("span").textContent="\u2026";parentElement.createTextChild(isArray?"]":"}");return preview.lossless;},_appendEntriesPreview:function(parentElement,preview)
{var lossless=preview.lossless&&!preview.properties.length;parentElement.createTextChild("{");for(var i=0;i<preview.entries.length;++i){if(i>0)
parentElement.createTextChild(", ");var entry=preview.entries[i];if(entry.key){this._appendObjectPreview(parentElement,entry.key,null);parentElement.createTextChild(" => ");}
this._appendObjectPreview(parentElement,entry.value,null);}
if(preview.overflow)
parentElement.createChild("span").textContent="\u2026";parentElement.createTextChild("}");return lossless;},_renderPropertyPreviewOrAccessor:function(object,propertyPath)
{var property=propertyPath.peekLast();if(property.type==="accessor")
return this._formatAsAccessorProperty(object,propertyPath.select("name"),false);return this._renderPropertyPreview(property.type,(property.subtype),property.value);},_renderPropertyPreview:function(type,subtype,description)
{var span=createElementWithClass("span","object-value-"+(subtype||type));description=description||"";if(type==="function"){span.textContent="function";return span;}
if(type==="object"&&subtype==="node"&&description){span.classList.add("object-value-preview-node");WebInspector.DOMPresentationUtils.createSpansForNodeTitle(span,description);return span;}
if(type==="string"){span.createTextChildren("\"",description.replace(/\n/g,"\u21B5"),"\"");return span;}
span.textContent=description;return span;},_formatParameterAsNode:function(object,elem)
{WebInspector.Renderer.renderPromise(object).then(appendRenderer,failedToRender.bind(this));function appendRenderer(rendererElement)
{elem.appendChild(rendererElement);}
function failedToRender()
{this._formatParameterAsObject(object,elem,false);}},useArrayPreviewInFormatter:function(array)
{return this._message.type!==WebInspector.ConsoleMessage.MessageType.DirXML;},_formatParameterAsArray:function(array,elem)
{var maxFlatArrayLength=100;if(this.useArrayPreviewInFormatter(array)||array.arrayLength()>maxFlatArrayLength)
this._formatParameterAsArrayOrObject(array,elem,this.useArrayPreviewInFormatter(array)||array.arrayLength()<=maxFlatArrayLength);else
array.getAllProperties(false,this._printArray.bind(this,array,elem));},_formatParameterAsTable:function(parameters)
{var element=createElementWithClass("div","console-message-formatted-table");var table=parameters[0];if(!table||!table.preview)
return element;var columnNames=[];var preview=table.preview;var rows=[];for(var i=0;i<preview.properties.length;++i){var rowProperty=preview.properties[i];var rowPreview=rowProperty.valuePreview;if(!rowPreview)
continue;var rowValue={};const maxColumnsToRender=20;for(var j=0;j<rowPreview.properties.length;++j){var cellProperty=rowPreview.properties[j];var columnRendered=columnNames.indexOf(cellProperty.name)!=-1;if(!columnRendered){if(columnNames.length===maxColumnsToRender)
continue;columnRendered=true;columnNames.push(cellProperty.name);}
if(columnRendered){var cellElement=this._renderPropertyPreviewOrAccessor(table,[rowProperty,cellProperty]);cellElement.classList.add("console-message-nowrap-below");rowValue[cellProperty.name]=cellElement;}}
rows.push([rowProperty.name,rowValue]);}
var flatValues=[];for(var i=0;i<rows.length;++i){var rowName=rows[i][0];var rowValue=rows[i][1];flatValues.push(rowName);for(var j=0;j<columnNames.length;++j)
flatValues.push(rowValue[columnNames[j]]);}
var dataGridContainer=element.createChild("span");if(!preview.lossless||!flatValues.length){element.appendChild(this._formatParameter(table,true,false));if(!flatValues.length)
return element;}
columnNames.unshift(WebInspector.UIString("(index)"));var dataGrid=WebInspector.SortableDataGrid.create(columnNames,flatValues);dataGrid.renderInline();this._dataGrids.push(dataGrid);this._dataGridParents.set(dataGrid,dataGridContainer);return element;},_formatParameterAsString:function(output,elem)
{var span=createElement("span");span.className="object-value-string source-code";span.appendChild(WebInspector.linkifyStringAsFragment(output.description||""));elem.classList.remove("object-value-string");elem.createTextChild("\"");elem.appendChild(span);elem.createTextChild("\"");},_formatParameterAsError:function(output,elem)
{var span=elem.createChild("span","object-value-error source-code");span.appendChild(WebInspector.linkifyStringAsFragment(output.description||""));},_printArray:function(array,elem,properties)
{if(!properties){this._formatParameterAsObject(array,elem,false);return;}
var elements=[];for(var i=0;i<properties.length;++i){var property=properties[i];var name=property.name;if(isNaN(name))
continue;if(property.getter)
elements[name]=this._formatAsAccessorProperty(array,[name],true);else if(property.value)
elements[name]=this._formatAsArrayEntry(property.value);}
elem.createTextChild("[");var lastNonEmptyIndex=-1;function appendUndefined(elem,index)
{if(index-lastNonEmptyIndex<=1)
return;var span=elem.createChild("span","object-value-undefined");span.textContent=WebInspector.UIString("undefined × %d",index-lastNonEmptyIndex-1);}
var length=array.arrayLength();for(var i=0;i<length;++i){var element=elements[i];if(!element)
continue;if(i-lastNonEmptyIndex>1){appendUndefined(elem,i);elem.createTextChild(", ");}
elem.appendChild(element);lastNonEmptyIndex=i;if(i<length-1)
elem.createTextChild(", ");}
appendUndefined(elem,length);elem.createTextChild("]");elem.addEventListener("contextmenu",this._contextMenuEventFired.bind(this,array),false);},_formatAsArrayEntry:function(output)
{return this._formatParameter(output,output.subtype==="array",false);},_formatAsAccessorProperty:function(object,propertyPath,isArrayEntry)
{var rootElement=WebInspector.ObjectPropertyTreeElement.createRemoteObjectAccessorPropertySpan(object,propertyPath,onInvokeGetterClick.bind(this));function onInvokeGetterClick(result,wasThrown)
{if(!result)
return;rootElement.removeChildren();if(wasThrown){var element=rootElement.createChild("span","error-message");element.textContent=WebInspector.UIString("<exception>");element.title=(result.description);}else if(isArrayEntry){rootElement.appendChild(this._formatAsArrayEntry(result));}else{const maxLength=100;var type=result.type;var subtype=result.subtype;var description="";if(type!=="function"&&result.description){if(type==="string"||subtype==="regexp")
description=result.description.trimMiddle(maxLength);else
description=result.description.trimEnd(maxLength);}
rootElement.appendChild(this._renderPropertyPreview(type,subtype,description));}}
return rootElement;},_formatWithSubstitutionString:function(format,parameters,formattedResult)
{var formatters={};function parameterFormatter(force,obj)
{return this._formatParameter(obj,force,false);}
function stringFormatter(obj)
{return obj.description;}
function floatFormatter(obj)
{if(typeof obj.value!=="number")
return"NaN";return obj.value;}
function integerFormatter(obj)
{if(typeof obj.value!=="number")
return"NaN";return Math.floor(obj.value);}
function bypassFormatter(obj)
{return(obj instanceof Node)?obj:"";}
var currentStyle=null;function styleFormatter(obj)
{currentStyle={};var buffer=createElement("span");buffer.setAttribute("style",obj.description);for(var i=0;i<buffer.style.length;i++){var property=buffer.style[i];if(isWhitelistedProperty(property))
currentStyle[property]=buffer.style[property];}}
function isWhitelistedProperty(property)
{var prefixes=["background","border","color","font","line","margin","padding","text","-webkit-background","-webkit-border","-webkit-font","-webkit-margin","-webkit-padding","-webkit-text"];for(var i=0;i<prefixes.length;i++){if(property.startsWith(prefixes[i]))
return true;}
return false;}
formatters.o=parameterFormatter.bind(this,false);formatters.s=stringFormatter;formatters.f=floatFormatter;formatters.i=integerFormatter;formatters.d=integerFormatter;formatters.c=styleFormatter;formatters.O=parameterFormatter.bind(this,true);formatters._=bypassFormatter;function append(a,b)
{if(b instanceof Node)
a.appendChild(b);else if(typeof b!=="undefined"){var toAppend=WebInspector.linkifyStringAsFragment(String(b));if(currentStyle){var wrapper=createElement('span');for(var key in currentStyle)
wrapper.style[key]=currentStyle[key];wrapper.appendChild(toAppend);toAppend=wrapper;}
a.appendChild(toAppend);}
return a;}
return String.format(format,parameters,formatters,formattedResult,append);},clearHighlights:function()
{if(!this._formattedMessage)
return;WebInspector.removeSearchResultsHighlight(this._formattedMessage,WebInspector.highlightedSearchResultClassName);},matchesRegex:function(regexObject)
{regexObject.lastIndex=0;var text=this._formattedMessageText();if(this._anchorElement)
text+=" "+this._anchorElement.textContent;return regexObject.test(text);},updateTimestamp:function(show)
{if(!this._element)
return;if(show&&!this.timestampElement){this.timestampElement=this._element.createChild("span","console-timestamp");this.timestampElement.textContent=(new Date(this._message.timestamp)).toConsoleTime()+" ";var afterRepeatCountChild=this._repeatCountElement&&this._repeatCountElement.nextSibling;this._element.insertBefore(this.timestampElement,afterRepeatCountChild||this._element.firstChild);return;}
if(!show&&this.timestampElement){this.timestampElement.remove();delete this.timestampElement;}},nestingLevel:function()
{return this._nestingLevel;},resetCloseGroupDecorationCount:function()
{if(!this._closeGroupDecorationCount)
return;this._closeGroupDecorationCount=0;this._updateCloseGroupDecorations();},incrementCloseGroupDecorationCount:function()
{++this._closeGroupDecorationCount;this._updateCloseGroupDecorations();},_updateCloseGroupDecorations:function()
{if(!this._nestingLevelMarkers)
return;for(var i=0,n=this._nestingLevelMarkers.length;i<n;++i){var marker=this._nestingLevelMarkers[i];marker.classList.toggle("group-closed",n-i<=this._closeGroupDecorationCount);}},contentElement:function()
{if(this._element)
return this._element;var element=createElementWithClass("div","console-message");this._element=element;switch(this._message.level){case WebInspector.ConsoleMessage.MessageLevel.Log:element.classList.add("console-log-level");break;case WebInspector.ConsoleMessage.MessageLevel.Debug:element.classList.add("console-debug-level");break;case WebInspector.ConsoleMessage.MessageLevel.Warning:element.classList.add("console-warning-level");break;case WebInspector.ConsoleMessage.MessageLevel.Error:element.classList.add("console-error-level");break;case WebInspector.ConsoleMessage.MessageLevel.Info:element.classList.add("console-info-level");break;}
if(this._message.type===WebInspector.ConsoleMessage.MessageType.StartGroup||this._message.type===WebInspector.ConsoleMessage.MessageType.StartGroupCollapsed)
element.classList.add("console-group-title");element.appendChild(this.formattedMessage());if(this._repeatCount>1)
this._showRepeatCountElement();this.updateTimestamp(WebInspector.settings.consoleTimestampsEnabled.get());return this._element;},toMessageElement:function()
{if(this._wrapperElement)
return this._wrapperElement;this._wrapperElement=createElementWithClass("div","console-message-wrapper");this._nestingLevelMarkers=[];for(var i=0;i<this._nestingLevel;++i)
this._nestingLevelMarkers.push(this._wrapperElement.createChild("div","nesting-level-marker"));this._updateCloseGroupDecorations();this._wrapperElement.message=this;this._wrapperElement.appendChild(this.contentElement());return this._wrapperElement;},_populateStackTraceTreeElement:function(parentTreeElement)
{var target=this._target();if(!target)
return;var content=WebInspector.DOMPresentationUtils.buildStackTracePreviewContents(target,this._linkifier,this._message.stackTrace,this._message.asyncStackTrace);parentTreeElement.appendChild(new TreeElement(content));},resetIncrementRepeatCount:function()
{this._repeatCount=1;if(!this._repeatCountElement)
return;this._repeatCountElement.remove();delete this._repeatCountElement;},incrementRepeatCount:function()
{this._repeatCount++;this._showRepeatCountElement();},_showRepeatCountElement:function()
{if(!this._element)
return;if(!this._repeatCountElement){this._repeatCountElement=createElement("span");this._repeatCountElement.className="bubble-repeat-count";this._element.insertBefore(this._repeatCountElement,this._element.firstChild);this._element.classList.add("repeated-message");}
this._repeatCountElement.textContent=this._repeatCount;},toString:function()
{var sourceString;switch(this._message.source){case WebInspector.ConsoleMessage.MessageSource.XML:sourceString="XML";break;case WebInspector.ConsoleMessage.MessageSource.JS:sourceString="JavaScript";break;case WebInspector.ConsoleMessage.MessageSource.Network:sourceString="Network";break;case WebInspector.ConsoleMessage.MessageSource.ConsoleAPI:sourceString="ConsoleAPI";break;case WebInspector.ConsoleMessage.MessageSource.Storage:sourceString="Storage";break;case WebInspector.ConsoleMessage.MessageSource.AppCache:sourceString="AppCache";break;case WebInspector.ConsoleMessage.MessageSource.Rendering:sourceString="Rendering";break;case WebInspector.ConsoleMessage.MessageSource.CSS:sourceString="CSS";break;case WebInspector.ConsoleMessage.MessageSource.Security:sourceString="Security";break;case WebInspector.ConsoleMessage.MessageSource.Other:sourceString="Other";break;}
var typeString;switch(this._message.type){case WebInspector.ConsoleMessage.MessageType.Log:typeString="Log";break;case WebInspector.ConsoleMessage.MessageType.Dir:typeString="Dir";break;case WebInspector.ConsoleMessage.MessageType.DirXML:typeString="Dir XML";break;case WebInspector.ConsoleMessage.MessageType.Trace:typeString="Trace";break;case WebInspector.ConsoleMessage.MessageType.StartGroupCollapsed:case WebInspector.ConsoleMessage.MessageType.StartGroup:typeString="Start Group";break;case WebInspector.ConsoleMessage.MessageType.EndGroup:typeString="End Group";break;case WebInspector.ConsoleMessage.MessageType.Assert:typeString="Assert";break;case WebInspector.ConsoleMessage.MessageType.Result:typeString="Result";break;case WebInspector.ConsoleMessage.MessageType.Profile:case WebInspector.ConsoleMessage.MessageType.ProfileEnd:typeString="Profiling";break;}
var levelString;switch(this._message.level){case WebInspector.ConsoleMessage.MessageLevel.Log:levelString="Log";break;case WebInspector.ConsoleMessage.MessageLevel.Warning:levelString="Warning";break;case WebInspector.ConsoleMessage.MessageLevel.Debug:levelString="Debug";break;case WebInspector.ConsoleMessage.MessageLevel.Error:levelString="Error";break;case WebInspector.ConsoleMessage.MessageLevel.Info:levelString="Info";break;}
return sourceString+" "+typeString+" "+levelString+": "+this.formattedMessage().textContent+"\n"+this._message.url+" line "+this._message.line;},get text()
{return this._message.messageText;},renderedText:function()
{if(!this._messageElement)
return"";return this._messageElement.deepTextContent();},highlightMatches:function(ranges)
{var highlightNodes=[];if(this._formattedMessage)
highlightNodes=WebInspector.highlightSearchResults(this._messageElement,ranges);return highlightNodes;},_tryFormatAsError:function(string)
{var errorPrefixes=["EvalError","ReferenceError","SyntaxError","TypeError","RangeError","Error","URIError"];var target=this._target();if(!target||!errorPrefixes.some(String.prototype.startsWith.bind(new String(string))))
return null;var lines=string.split("\n");var links=[];var position=0;for(var i=0;i<lines.length;++i){position+=i>0?lines[i-1].length+1:0;var isCallFrameLine=/^\s*at\s/.test(lines[i]);if(!isCallFrameLine&&links.length)
return null;if(!isCallFrameLine)
continue;var openBracketIndex=lines[i].indexOf("(");var closeBracketIndex=lines[i].indexOf(")");var hasOpenBracket=openBracketIndex!==-1;var hasCloseBracket=closeBracketIndex!==-1;if((openBracketIndex>closeBracketIndex)||(hasOpenBracket^hasCloseBracket))
return null;var left=hasOpenBracket?openBracketIndex+1:lines[i].indexOf("at")+3;var right=hasOpenBracket?closeBracketIndex:lines[i].length;var linkCandidate=lines[i].substring(left,right);var splitResult=WebInspector.ParsedURL.splitLineAndColumn(linkCandidate);if(!splitResult)
return null;var parsed=splitResult.url.asParsedURL();var url;if(parsed)
url=parsed.url;else if(target.debuggerModel.scriptsForSourceURL(splitResult.url).length)
url=splitResult.url;else if(splitResult.url==="<anonymous>")
continue;else
return null;links.push({url:url,positionLeft:position+left,positionRight:position+right,lineNumber:splitResult.lineNumber,columnNumber:splitResult.columnNumber});}
if(!links.length)
return null;var formattedResult=createElement("span");var start=0;for(var i=0;i<links.length;++i){formattedResult.appendChild(WebInspector.linkifyStringAsFragment(string.substring(start,links[i].positionLeft)));formattedResult.appendChild(this._linkifier.linkifyScriptLocation(target,null,links[i].url,links[i].lineNumber,links[i].columnNumber));start=links[i].positionRight;}
if(start!=string.length)
formattedResult.appendChild(WebInspector.linkifyStringAsFragment(string.substring(start)));return formattedResult;}}
WebInspector.ConsoleGroupViewMessage=function(consoleMessage,linkifier,nestingLevel)
{console.assert(consoleMessage.isGroupStartMessage());WebInspector.ConsoleViewMessage.call(this,consoleMessage,linkifier,nestingLevel);this.setCollapsed(consoleMessage.type===WebInspector.ConsoleMessage.MessageType.StartGroupCollapsed);}
WebInspector.ConsoleGroupViewMessage.prototype={setCollapsed:function(collapsed)
{this._collapsed=collapsed;if(this._wrapperElement)
this._wrapperElement.classList.toggle("collapsed",this._collapsed);},collapsed:function()
{return this._collapsed;},toMessageElement:function()
{if(!this._wrapperElement){WebInspector.ConsoleViewMessage.prototype.toMessageElement.call(this);this._wrapperElement.classList.toggle("collapsed",this._collapsed);}
return this._wrapperElement;},__proto__:WebInspector.ConsoleViewMessage.prototype};WebInspector.ConsoleView=function()
{WebInspector.VBox.call(this);this.registerRequiredCSS("ui/filter.css");this.registerRequiredCSS("console/consoleView.css");this._searchableView=new WebInspector.SearchableView(this);this._searchableView.setMinimalSearchQuerySize(0);this._searchableView.show(this.element);this._contentsElement=this._searchableView.element;this._contentsElement.classList.add("console-view");this._visibleViewMessages=[];this._urlToMessageCount={};this._hiddenByFilterCount=0;this._regexMatchRanges=[];this._clearConsoleButton=new WebInspector.StatusBarButton(WebInspector.UIString("Clear console log."),"clear-status-bar-item");this._clearConsoleButton.addEventListener("click",this._requestClearMessages,this);this._executionContextSelector=new WebInspector.StatusBarComboBox(this._executionContextChanged.bind(this),"console-context");this._optionByExecutionContext=new Map();this._filter=new WebInspector.ConsoleViewFilter(this);this._filter.addEventListener(WebInspector.ConsoleViewFilter.Events.FilterChanged,this._updateMessageList.bind(this));this._filterBar=new WebInspector.FilterBar();this._preserveLogCheckbox=new WebInspector.StatusBarCheckbox(WebInspector.UIString("Preserve log"),WebInspector.UIString("Do not clear log on page reload / navigation."),WebInspector.settings.preserveConsoleLog);this._progressStatusBarItem=new WebInspector.StatusBarItem(createElement("div"));var statusBar=new WebInspector.StatusBar(this._contentsElement);statusBar.appendStatusBarItem(this._clearConsoleButton);statusBar.appendStatusBarItem(this._filterBar.filterButton());statusBar.appendStatusBarItem(this._executionContextSelector);statusBar.appendStatusBarItem(this._preserveLogCheckbox);statusBar.appendStatusBarItem(this._progressStatusBarItem);this._filtersContainer=this._contentsElement.createChild("div","console-filters-header hidden");this._filtersContainer.appendChild(this._filterBar.filtersElement());this._filterBar.addEventListener(WebInspector.FilterBar.Events.FiltersToggled,this._onFiltersToggled,this);this._filterBar.setName("consoleView");this._filter.addFilters(this._filterBar);this._viewport=new WebInspector.ViewportControl(this);this._viewport.setStickToBottom(true);this._viewport.contentElement().classList.add("console-group","console-group-messages");this._contentsElement.appendChild(this._viewport.element);this._messagesElement=this._viewport.element;this._messagesElement.id="console-messages";this._messagesElement.classList.add("monospace");this._messagesElement.addEventListener("click",this._messagesClicked.bind(this),true);this._viewportThrottler=new WebInspector.Throttler(50);this._filterStatusMessageElement=createElementWithClass("div","console-message");this._messagesElement.insertBefore(this._filterStatusMessageElement,this._messagesElement.firstChild);this._filterStatusTextElement=this._filterStatusMessageElement.createChild("span","console-info");this._filterStatusMessageElement.createTextChild(" ");var resetFiltersLink=this._filterStatusMessageElement.createChild("span","console-info link");resetFiltersLink.textContent=WebInspector.UIString("Show all messages.");resetFiltersLink.addEventListener("click",this._filter.reset.bind(this._filter),true);this._topGroup=WebInspector.ConsoleGroup.createTopGroup();this._currentGroup=this._topGroup;this._promptElement=this._messagesElement.createChild("div","source-code");this._promptElement.id="console-prompt";this._promptElement.spellcheck=false;this._searchableView.setDefaultFocusedElement(this._promptElement);var selectAllFixer=this._messagesElement.createChild("div","console-view-fix-select-all");selectAllFixer.textContent=".";this._showAllMessagesCheckbox=new WebInspector.StatusBarCheckbox(WebInspector.UIString("Show all messages"));this._showAllMessagesCheckbox.inputElement.checked=true;this._showAllMessagesCheckbox.inputElement.addEventListener("change",this._updateMessageList.bind(this),false);this._showAllMessagesCheckbox.element.classList.add("hidden");statusBar.appendStatusBarItem(this._showAllMessagesCheckbox);this._registerShortcuts();this._messagesElement.addEventListener("contextmenu",this._handleContextMenuEvent.bind(this),false);WebInspector.settings.monitoringXHREnabled.addChangeListener(this._monitoringXHREnabledSettingChanged,this);this._linkifier=new WebInspector.Linkifier();this._consoleMessages=[];this._prompt=new WebInspector.TextPromptWithHistory(WebInspector.ExecutionContextSelector.completionsForTextPromptInCurrentContext);this._prompt.setSuggestBoxEnabled(true);this._prompt.renderAsBlock();var proxyElement=this._prompt.attach(this._promptElement);proxyElement.addEventListener("keydown",this._promptKeyDown.bind(this),false);this._prompt.setHistoryData(WebInspector.settings.consoleHistory.get());var historyData=WebInspector.settings.consoleHistory.get();this._prompt.setHistoryData(historyData);this._updateFilterStatus();WebInspector.settings.consoleTimestampsEnabled.addChangeListener(this._consoleTimestampsSettingChanged,this);this._registerWithMessageSink();WebInspector.targetManager.observeTargets(this);WebInspector.targetManager.addModelListener(WebInspector.RuntimeModel,WebInspector.RuntimeModel.Events.ExecutionContextCreated,this._onExecutionContextCreated,this);WebInspector.targetManager.addModelListener(WebInspector.RuntimeModel,WebInspector.RuntimeModel.Events.ExecutionContextDestroyed,this._onExecutionContextDestroyed,this);WebInspector.targetManager.addEventListener(WebInspector.TargetManager.Events.MainFrameNavigated,this._onMainFrameNavigated,this);this._initConsoleMessages();WebInspector.context.addFlavorChangeListener(WebInspector.ExecutionContext,this._executionContextChangedExternally,this);}
WebInspector.ConsoleView.prototype={searchableView:function()
{return this._searchableView;},_onMainFrameNavigated:function(event)
{var frame=(event.data);WebInspector.console.addMessage(WebInspector.UIString("Navigated to %s",frame.url));},_initConsoleMessages:function()
{var mainTarget=WebInspector.targetManager.mainTarget();if(!mainTarget||!mainTarget.resourceTreeModel.cachedResourcesLoaded()){WebInspector.targetManager.addModelListener(WebInspector.ResourceTreeModel,WebInspector.ResourceTreeModel.EventTypes.CachedResourcesLoaded,this._onResourceTreeModelLoaded,this);return;}
this._fetchMultitargetMessages();},_onResourceTreeModelLoaded:function(event)
{var resourceTreeModel=event.target;if(resourceTreeModel.target()!==WebInspector.targetManager.mainTarget())
return;WebInspector.targetManager.removeModelListener(WebInspector.ResourceTreeModel,WebInspector.ResourceTreeModel.EventTypes.CachedResourcesLoaded,this._onResourceTreeModelLoaded,this);this._fetchMultitargetMessages();},_fetchMultitargetMessages:function()
{WebInspector.multitargetConsoleModel.addEventListener(WebInspector.ConsoleModel.Events.ConsoleCleared,this._consoleCleared,this);WebInspector.multitargetConsoleModel.addEventListener(WebInspector.ConsoleModel.Events.MessageAdded,this._onConsoleMessageAdded,this);WebInspector.multitargetConsoleModel.addEventListener(WebInspector.ConsoleModel.Events.CommandEvaluated,this._commandEvaluated,this);WebInspector.multitargetConsoleModel.messages().forEach(this._addConsoleMessage,this);},itemCount:function()
{return this._visibleViewMessages.length;},itemElement:function(index)
{return this._visibleViewMessages[index];},fastHeight:function(index)
{return this._visibleViewMessages[index].fastHeight();},minimumRowHeight:function()
{return 16;},targetAdded:function(target)
{this._viewport.invalidate();target.runtimeModel.executionContexts().forEach(this._executionContextCreated,this);if(WebInspector.targetManager.targets().length>1&&WebInspector.targetManager.mainTarget().isPage())
this._showAllMessagesCheckbox.element.classList.toggle("hidden",false);},targetRemoved:function(target)
{this._clearExecutionContextsForTarget(target);},_registerWithMessageSink:function()
{WebInspector.console.messages().forEach(this._addSinkMessage,this);WebInspector.console.addEventListener(WebInspector.Console.Events.MessageAdded,messageAdded,this);function messageAdded(event)
{this._addSinkMessage((event.data));}},_addSinkMessage:function(message)
{var level=WebInspector.ConsoleMessage.MessageLevel.Debug;switch(message.level){case WebInspector.Console.MessageLevel.Error:level=WebInspector.ConsoleMessage.MessageLevel.Error;break;case WebInspector.Console.MessageLevel.Warning:level=WebInspector.ConsoleMessage.MessageLevel.Warning;break;}
var consoleMessage=new WebInspector.ConsoleMessage(null,WebInspector.ConsoleMessage.MessageSource.Other,level,message.text,undefined,undefined,undefined,undefined,undefined,undefined,undefined,message.timestamp);this._addConsoleMessage(consoleMessage);},_consoleTimestampsSettingChanged:function(event)
{var enabled=(event.data);this._updateMessageList();this._consoleMessages.forEach(function(viewMessage){viewMessage.updateTimestamp(enabled);});},defaultFocusedElement:function()
{return this._promptElement;},_onFiltersToggled:function(event)
{var toggled=(event.data);this._filtersContainer.classList.toggle("hidden",!toggled);},_titleFor:function(executionContext)
{var result;if(executionContext.isMainWorldContext){if(executionContext.frameId){var frame=executionContext.target().resourceTreeModel.frameForId(executionContext.frameId);result=frame?frame.displayName():(executionContext.origin||executionContext.name);}else{result=WebInspector.displayNameForURL(executionContext.origin)||executionContext.name;}}else
result="\u00a0\u00a0\u00a0\u00a0"+(executionContext.name||executionContext.origin);var maxLength=50;return result.trimMiddle(maxLength);},_onExecutionContextCreated:function(event)
{var executionContext=(event.data);this._executionContextCreated(executionContext);},_executionContextCreated:function(executionContext)
{if(executionContext.target().isServiceWorker())
return;var newOption=createElement("option");newOption.__executionContext=executionContext;newOption.text=this._titleFor(executionContext);this._optionByExecutionContext.set(executionContext,newOption);var sameGroupExists=false;var options=this._executionContextSelector.selectElement().options;var contexts=Array.prototype.map.call(options,mapping);var index=insertionIndexForObjectInListSortedByFunction(executionContext,contexts,WebInspector.ExecutionContext.comparator);this._executionContextSelector.selectElement().insertBefore(newOption,options[index]);if(executionContext===WebInspector.context.flavor(WebInspector.ExecutionContext))
this._executionContextSelector.select(newOption);function mapping(option)
{return option.__executionContext;}},_onExecutionContextDestroyed:function(event)
{var executionContext=(event.data);this._executionContextDestroyed(executionContext);},_executionContextDestroyed:function(executionContext)
{var option=this._optionByExecutionContext.remove(executionContext);option.remove();},_clearExecutionContextsForTarget:function(target)
{var executionContexts=this._optionByExecutionContext.keysArray();for(var i=0;i<executionContexts.length;++i){if(executionContexts[i].target()===target)
this._executionContextDestroyed(executionContexts[i]);}},_executionContextChanged:function()
{var newContext=this._currentExecutionContext();WebInspector.context.setFlavor(WebInspector.ExecutionContext,newContext);this._prompt.clearAutoComplete(true);if(!this._showAllMessagesCheckbox.checked())
this._updateMessageList();},_executionContextChangedExternally:function(event)
{var executionContext=(event.data);if(!executionContext)
return;var options=this._executionContextSelector.selectElement().options;for(var i=0;i<options.length;++i){if(options[i].__executionContext===executionContext)
this._executionContextSelector.select(options[i]);}},_currentExecutionContext:function()
{var option=this._executionContextSelector.selectedOption();return option?option.__executionContext:null;},willHide:function()
{this._hidePromptSuggestBox();},wasShown:function()
{this._viewport.refresh();if(!this._prompt.isCaretInsidePrompt())
this._prompt.moveCaretToEndOfPrompt();},focus:function()
{if(this._promptElement===WebInspector.currentFocusElement())
return;WebInspector.setCurrentFocusElement(this._promptElement);this._prompt.moveCaretToEndOfPrompt();},restoreScrollPositions:function()
{if(this._viewport.scrolledToBottom())
this._immediatelyScrollToBottom();else
WebInspector.View.prototype.restoreScrollPositions.call(this);},onResize:function()
{this._scheduleViewportRefresh();this._hidePromptSuggestBox();if(this._viewport.scrolledToBottom())
this._immediatelyScrollToBottom();},_hidePromptSuggestBox:function()
{this._prompt.hideSuggestBox();this._prompt.clearAutoComplete(true);},_scheduleViewportRefresh:function()
{function invalidateViewport(finishCallback)
{if(this._needsFullUpdate){this._updateMessageList();delete this._needsFullUpdate;}else{this._viewport.invalidate();}
finishCallback();}
this._viewportThrottler.schedule(invalidateViewport.bind(this));},_immediatelyScrollToBottom:function()
{this._promptElement.scrollIntoView(true);},_updateFilterStatus:function()
{this._filterStatusTextElement.textContent=WebInspector.UIString(this._hiddenByFilterCount===1?"%d message is hidden by filters.":"%d messages are hidden by filters.",this._hiddenByFilterCount);this._filterStatusMessageElement.style.display=this._hiddenByFilterCount?"":"none";},_onConsoleMessageAdded:function(event)
{var message=(event.data);this._addConsoleMessage(message);},_addConsoleMessage:function(message)
{function compareTimestamps(viewMessage1,viewMessage2)
{return WebInspector.ConsoleMessage.timestampComparator(viewMessage1.consoleMessage(),viewMessage2.consoleMessage());}
if(message.type===WebInspector.ConsoleMessage.MessageType.Command||message.type===WebInspector.ConsoleMessage.MessageType.Result)
message.timestamp=this._consoleMessages.length?this._consoleMessages.peekLast().consoleMessage().timestamp:0;var viewMessage=this._createViewMessage(message);var insertAt=insertionIndexForObjectInListSortedByFunction(viewMessage,this._consoleMessages,compareTimestamps,true);var insertedInMiddle=insertAt<this._consoleMessages.length;this._consoleMessages.splice(insertAt,0,viewMessage);if(this._urlToMessageCount[message.url])
++this._urlToMessageCount[message.url];else
this._urlToMessageCount[message.url]=1;if(!insertedInMiddle){this._appendMessageToEnd(viewMessage);this._updateFilterStatus();}else{this._needsFullUpdate=true;}
this._scheduleViewportRefresh();this._consoleMessageAddedForTest(viewMessage);},_consoleMessageAddedForTest:function(viewMessage){},_appendMessageToEnd:function(viewMessage)
{if(!this._filter.shouldBeVisible(viewMessage)){this._hiddenByFilterCount++;return;}
if(this._tryToCollapseMessages(viewMessage,this._visibleViewMessages.peekLast()))
return;var lastMessage=this._visibleViewMessages.peekLast();if(viewMessage.consoleMessage().type===WebInspector.ConsoleMessage.MessageType.EndGroup){if(lastMessage&&!this._currentGroup.messagesHidden())
lastMessage.incrementCloseGroupDecorationCount();this._currentGroup=this._currentGroup.parentGroup();return;}
if(!this._currentGroup.messagesHidden()){var originatingMessage=viewMessage.consoleMessage().originatingMessage();if(lastMessage&&originatingMessage&&lastMessage.consoleMessage()===originatingMessage)
lastMessage.toMessageElement().classList.add("console-adjacent-user-command-result");this._visibleViewMessages.push(viewMessage);if(this._searchRegex&&this._searchMessage(this._visibleViewMessages.length-1))
this._searchableView.updateSearchMatchesCount(this._regexMatchRanges.length);}
if(viewMessage.consoleMessage().isGroupStartMessage())
this._currentGroup=new WebInspector.ConsoleGroup(this._currentGroup,viewMessage);},_createViewMessage:function(message)
{var nestingLevel=this._currentGroup.nestingLevel();switch(message.type){case WebInspector.ConsoleMessage.MessageType.Command:return new WebInspector.ConsoleCommand(message,this._linkifier,nestingLevel);case WebInspector.ConsoleMessage.MessageType.Result:return new WebInspector.ConsoleCommandResult(message,this._linkifier,nestingLevel);case WebInspector.ConsoleMessage.MessageType.StartGroupCollapsed:case WebInspector.ConsoleMessage.MessageType.StartGroup:return new WebInspector.ConsoleGroupViewMessage(message,this._linkifier,nestingLevel);default:return new WebInspector.ConsoleViewMessage(message,this._linkifier,nestingLevel);}},_consoleCleared:function()
{this._clearSearchResultHighlights();this._consoleMessages=[];this._updateMessageList();this._hidePromptSuggestBox();if(this._searchRegex)
this._searchableView.updateSearchMatchesCount(0);this._linkifier.reset();},_handleContextMenuEvent:function(event)
{if(event.target.enclosingNodeOrSelfWithNodeName("a"))
return;var contextMenu=new WebInspector.ContextMenu(event);if(event.target.isSelfOrDescendant(this._promptElement)){contextMenu.show()
return;}
function monitoringXHRItemAction()
{WebInspector.settings.monitoringXHREnabled.set(!WebInspector.settings.monitoringXHREnabled.get());}
contextMenu.appendCheckboxItem(WebInspector.UIString("Log XMLHttpRequests"),monitoringXHRItemAction,WebInspector.settings.monitoringXHREnabled.get());var sourceElement=event.target.enclosingNodeOrSelfWithClass("console-message-wrapper");var consoleMessage=sourceElement?sourceElement.message.consoleMessage():null;var filterSubMenu=contextMenu.appendSubMenuItem(WebInspector.UIString("Filter"));if(consoleMessage&&consoleMessage.url){var menuTitle=WebInspector.UIString.capitalize("Hide ^messages from %s",new WebInspector.ParsedURL(consoleMessage.url).displayName);filterSubMenu.appendItem(menuTitle,this._filter.addMessageURLFilter.bind(this._filter,consoleMessage.url));}
filterSubMenu.appendSeparator();var unhideAll=filterSubMenu.appendItem(WebInspector.UIString.capitalize("Unhide ^all"),this._filter.removeMessageURLFilter.bind(this._filter));filterSubMenu.appendSeparator();var hasFilters=false;for(var url in this._filter.messageURLFilters){filterSubMenu.appendCheckboxItem(String.sprintf("%s (%d)",new WebInspector.ParsedURL(url).displayName,this._urlToMessageCount[url]),this._filter.removeMessageURLFilter.bind(this._filter,url),true);hasFilters=true;}
filterSubMenu.setEnabled(hasFilters||(consoleMessage&&consoleMessage.url));unhideAll.setEnabled(hasFilters);contextMenu.appendSeparator();contextMenu.appendItem(WebInspector.UIString.capitalize("Clear ^console"),this._requestClearMessages.bind(this));contextMenu.appendItem(WebInspector.UIString("Save as..."),this._saveConsole.bind(this));var request=consoleMessage?consoleMessage.request:null;if(request&&request.resourceType()===WebInspector.resourceTypes.XHR){contextMenu.appendSeparator();contextMenu.appendItem(WebInspector.UIString("Replay XHR"),request.replayXHR.bind(request));}
contextMenu.show();},_saveConsole:function()
{var filename=String.sprintf("%s-%d.log",WebInspector.targetManager.inspectedPageDomain(),Date.now());var stream=new WebInspector.FileOutputStream();var progressIndicator=new WebInspector.ProgressIndicator();progressIndicator.setTitle(WebInspector.UIString("Writing file…"));progressIndicator.setTotalWork(this.itemCount());var chunkSize=350;var messageIndex=0;stream.open(filename,openCallback.bind(this));function openCallback(accepted)
{if(!accepted)
return;this._progressStatusBarItem.element.appendChild(progressIndicator.element);writeNextChunk.call(this,stream);}
function writeNextChunk(stream,error)
{if(messageIndex>=this.itemCount()||error){stream.close();progressIndicator.done();return;}
var lines=[];for(var i=0;i<chunkSize&&i+messageIndex<this.itemCount();++i){var message=this.itemElement(messageIndex+i);message.element();lines.push(message.renderedText());}
messageIndex+=i;stream.write(lines.join("\n")+"\n",writeNextChunk.bind(this));progressIndicator.setWorked(messageIndex);}},_tryToCollapseMessages:function(lastMessage,viewMessage)
{if(!WebInspector.settings.consoleTimestampsEnabled.get()&&viewMessage&&!lastMessage.consoleMessage().isGroupMessage()&&lastMessage.consoleMessage().isEqual(viewMessage.consoleMessage())){viewMessage.incrementRepeatCount();return true;}
return false;},_updateMessageList:function()
{this._topGroup=WebInspector.ConsoleGroup.createTopGroup();this._currentGroup=this._topGroup;this._regexMatchRanges=[];this._hiddenByFilterCount=0;for(var i=0;i<this._visibleViewMessages.length;++i){this._visibleViewMessages[i].resetCloseGroupDecorationCount();this._visibleViewMessages[i].resetIncrementRepeatCount();}
this._visibleViewMessages=[];for(var i=0;i<this._consoleMessages.length;++i)
this._appendMessageToEnd(this._consoleMessages[i]);this._updateFilterStatus();this._viewport.invalidate();},_monitoringXHREnabledSettingChanged:function(event)
{var enabled=(event.data);WebInspector.targetManager.targets().forEach(function(target){target.networkAgent().setMonitoringXHREnabled(enabled);});},_messagesClicked:function(event)
{if(!this._prompt.isCaretInsidePrompt()&&event.target.isComponentSelectionCollapsed())
this._prompt.moveCaretToEndOfPrompt();var groupMessage=event.target.enclosingNodeOrSelfWithClass("console-group-title");if(!groupMessage)
return;var consoleGroupViewMessage=groupMessage.parentElement.message;consoleGroupViewMessage.setCollapsed(!consoleGroupViewMessage.collapsed());this._updateMessageList();},_registerShortcuts:function()
{this._shortcuts={};var shortcut=WebInspector.KeyboardShortcut;var section=WebInspector.shortcutsScreen.section(WebInspector.UIString("Console"));var shortcutL=shortcut.makeDescriptor("l",WebInspector.KeyboardShortcut.Modifiers.Ctrl);this._shortcuts[shortcutL.key]=this._requestClearMessages.bind(this);var keys=[shortcutL];if(WebInspector.isMac()){var shortcutK=shortcut.makeDescriptor("k",WebInspector.KeyboardShortcut.Modifiers.Meta);this._shortcuts[shortcutK.key]=this._requestClearMessages.bind(this);keys.unshift(shortcutK);}
section.addAlternateKeys(keys,WebInspector.UIString("Clear console"));section.addKey(shortcut.makeDescriptor(shortcut.Keys.Tab),WebInspector.UIString("Autocomplete common prefix"));section.addKey(shortcut.makeDescriptor(shortcut.Keys.Right),WebInspector.UIString("Accept suggestion"));var shortcutU=shortcut.makeDescriptor("u",WebInspector.KeyboardShortcut.Modifiers.Ctrl);this._shortcuts[shortcutU.key]=this._clearPromptBackwards.bind(this);section.addAlternateKeys([shortcutU],WebInspector.UIString("Clear console prompt"));keys=[shortcut.makeDescriptor(shortcut.Keys.Down),shortcut.makeDescriptor(shortcut.Keys.Up)];section.addRelatedKeys(keys,WebInspector.UIString("Next/previous line"));if(WebInspector.isMac()){keys=[shortcut.makeDescriptor("N",shortcut.Modifiers.Alt),shortcut.makeDescriptor("P",shortcut.Modifiers.Alt)];section.addRelatedKeys(keys,WebInspector.UIString("Next/previous command"));}
section.addKey(shortcut.makeDescriptor(shortcut.Keys.Enter),WebInspector.UIString("Execute command"));},_clearPromptBackwards:function()
{this._prompt.setText("");},_requestClearMessages:function()
{var targets=WebInspector.targetManager.targets();for(var i=0;i<targets.length;++i)
targets[i].consoleModel.requestClearMessages();},_promptKeyDown:function(event)
{if(isEnterKey(event)){this._enterKeyPressed(event);return;}
var shortcut=WebInspector.KeyboardShortcut.makeKeyFromEvent(event);var handler=this._shortcuts[shortcut];if(handler){handler();event.preventDefault();}},_enterKeyPressed:function(event)
{if(event.altKey||event.ctrlKey||event.shiftKey)
return;event.consume(true);this._prompt.clearAutoComplete(true);var str=this._prompt.text();if(!str.length)
return;this._appendCommand(str,true);},_printResult:function(result,wasThrown,originatingConsoleMessage,exceptionDetails)
{if(!result)
return;var target=result.target();function addMessage(url,lineNumber,columnNumber)
{var level=wasThrown?WebInspector.ConsoleMessage.MessageLevel.Error:WebInspector.ConsoleMessage.MessageLevel.Log;var message;if(!wasThrown)
message=new WebInspector.ConsoleMessage(target,WebInspector.ConsoleMessage.MessageSource.JS,level,"",WebInspector.ConsoleMessage.MessageType.Result,url,lineNumber,columnNumber,undefined,[result]);else
message=new WebInspector.ConsoleMessage(target,WebInspector.ConsoleMessage.MessageSource.JS,level,exceptionDetails.text,WebInspector.ConsoleMessage.MessageType.Result,exceptionDetails.url,exceptionDetails.line,exceptionDetails.column,undefined,[WebInspector.UIString("Uncaught"),result],exceptionDetails.stackTrace,undefined,undefined,undefined,exceptionDetails.scriptId);message.setOriginatingMessage(originatingConsoleMessage);target.consoleModel.addMessage(message);}
if(result.type!=="function"){addMessage();return;}
result.functionDetails(didGetDetails);function didGetDetails(response)
{if(!response||!response.location){addMessage();return;}
var url;var lineNumber;var columnNumber;var script=target.debuggerModel.scriptForId(response.location.scriptId);if(script&&script.sourceURL){url=script.sourceURL;lineNumber=response.location.lineNumber+1;columnNumber=response.location.columnNumber+1;}
addMessage(url,lineNumber,columnNumber);}},_appendCommand:function(text,useCommandLineAPI)
{this._prompt.setText("");var currentExecutionContext=WebInspector.context.flavor(WebInspector.ExecutionContext);if(currentExecutionContext)
WebInspector.ConsoleModel.evaluateCommandInConsole(currentExecutionContext,text,useCommandLineAPI);},_commandEvaluated:function(event)
{var data=(event.data);this._prompt.pushHistoryItem(data.text);WebInspector.settings.consoleHistory.set(this._prompt.historyData().slice(-30));this._printResult(data.result,data.wasThrown,data.commandMessage,data.exceptionDetails);},elementsToRestoreScrollPositionsFor:function()
{return[this._messagesElement];},searchCanceled:function()
{this._clearSearchResultHighlights();this._regexMatchRanges=[];delete this._searchRegex;this._viewport.refresh();},performSearch:function(searchConfig,shouldJump,jumpBackwards)
{this.searchCanceled();this._searchableView.updateSearchMatchesCount(0);this._searchRegex=searchConfig.toSearchRegex(true);this._regexMatchRanges=[];this._currentMatchRangeIndex=-1;for(var i=0;i<this._visibleViewMessages.length;i++)
this._searchMessage(i);this._searchableView.updateSearchMatchesCount(this._regexMatchRanges.length);if(shouldJump)
this._jumpToMatch(jumpBackwards?-1:0);this._viewport.refresh();},_searchMessage:function(index)
{this._searchRegex.lastIndex=0;var message=this._visibleViewMessages[index];var text=message.renderedText();var match;var matchRanges=[];var sourceRanges=[];while((match=this._searchRegex.exec(text))&&match[0]){matchRanges.push({messageIndex:index,highlightNode:null,});sourceRanges.push(new WebInspector.SourceRange(match.index,match[0].length));}
var matchRange;var highlightNodes=message.highlightMatches(sourceRanges);for(var i=0;i<matchRanges.length;++i){matchRange=matchRanges[i];matchRange.highlightNode=highlightNodes[i];this._regexMatchRanges.push(matchRange);}
return!!matchRange;},jumpToNextSearchResult:function()
{this._jumpToMatch(this._currentMatchRangeIndex+1);},jumpToPreviousSearchResult:function()
{this._jumpToMatch(this._currentMatchRangeIndex-1);},supportsCaseSensitiveSearch:function()
{return true;},supportsRegexSearch:function()
{return true;},_clearSearchResultHighlights:function()
{var handledMessageIndexes=[];for(var i=0;i<this._regexMatchRanges.length;++i){var matchRange=this._regexMatchRanges[i];if(handledMessageIndexes[matchRange.messageIndex])
continue;var message=this._visibleViewMessages[matchRange.messageIndex];if(message)
message.clearHighlights();handledMessageIndexes[matchRange.messageIndex]=true;}
this._currentMatchRangeIndex=-1;},_jumpToMatch:function(index)
{if(!this._regexMatchRanges.length)
return;var currentSearchResultClassName="current-search-result";var matchRange;if(this._currentMatchRangeIndex>=0){matchRange=this._regexMatchRanges[this._currentMatchRangeIndex];matchRange.highlightNode.classList.remove(currentSearchResultClassName);}
index=mod(index,this._regexMatchRanges.length);this._currentMatchRangeIndex=index;this._searchableView.updateCurrentMatchIndex(index);matchRange=this._regexMatchRanges[index];matchRange.highlightNode.classList.add(currentSearchResultClassName);this._viewport.scrollItemIntoView(matchRange.messageIndex);matchRange.highlightNode.scrollIntoViewIfNeeded();},__proto__:WebInspector.VBox.prototype}
WebInspector.ConsoleViewFilter=function(view)
{this._view=view;this._messageURLFilters=WebInspector.settings.messageURLFilters.get();this._filterChanged=this.dispatchEventToListeners.bind(this,WebInspector.ConsoleViewFilter.Events.FilterChanged);};WebInspector.ConsoleViewFilter.Events={FilterChanged:"FilterChanged"};WebInspector.ConsoleViewFilter.prototype={addFilters:function(filterBar)
{this._textFilterUI=new WebInspector.TextFilterUI(true);this._textFilterUI.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._textFilterChanged,this);filterBar.addFilter(this._textFilterUI);var levels=[{name:"error",label:WebInspector.UIString("Errors")},{name:"warning",label:WebInspector.UIString("Warnings")},{name:"info",label:WebInspector.UIString("Info")},{name:"log",label:WebInspector.UIString("Logs")},{name:"debug",label:WebInspector.UIString("Debug")}];this._levelFilterUI=new WebInspector.NamedBitSetFilterUI(levels,WebInspector.settings.messageLevelFilters);this._levelFilterUI.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._filterChanged,this);filterBar.addFilter(this._levelFilterUI);this._hideNetworkMessagesCheckbox=new WebInspector.CheckboxFilterUI("hide-network-messages",WebInspector.UIString("Hide network messages"),true,WebInspector.settings.hideNetworkMessages);this._hideNetworkMessagesCheckbox.addEventListener(WebInspector.FilterUI.Events.FilterChanged,this._filterChanged.bind(this),this);filterBar.addFilter(this._hideNetworkMessagesCheckbox);},_textFilterChanged:function(event)
{this._filterRegex=this._textFilterUI.regex();this._filterChanged();},addMessageURLFilter:function(url)
{this._messageURLFilters[url]=true;WebInspector.settings.messageURLFilters.set(this._messageURLFilters);this._filterChanged();},removeMessageURLFilter:function(url)
{if(!url)
this._messageURLFilters={};else
delete this._messageURLFilters[url];WebInspector.settings.messageURLFilters.set(this._messageURLFilters);this._filterChanged();},get messageURLFilters()
{return this._messageURLFilters;},shouldBeVisible:function(viewMessage)
{var message=viewMessage.consoleMessage();var executionContext=WebInspector.context.flavor(WebInspector.ExecutionContext);if(!message.target())
return true;if(!this._view._showAllMessagesCheckbox.checked()&&executionContext){if(message.target()!==executionContext.target())
return false;if(message.executionContextId&&message.executionContextId!==executionContext.id){return false;}}
if(WebInspector.settings.hideNetworkMessages.get()&&viewMessage.consoleMessage().source===WebInspector.ConsoleMessage.MessageSource.Network)
return false;if(viewMessage.consoleMessage().isGroupMessage())
return true;if(message.type===WebInspector.ConsoleMessage.MessageType.Result||message.type===WebInspector.ConsoleMessage.MessageType.Command)
return true;if(message.url&&this._messageURLFilters[message.url])
return false;if(message.level&&!this._levelFilterUI.accept(message.level))
return false;if(this._filterRegex){this._filterRegex.lastIndex=0;if(!viewMessage.matchesRegex(this._filterRegex))
return false;}
return true;},reset:function()
{this._messageURLFilters={};WebInspector.settings.messageURLFilters.set(this._messageURLFilters);WebInspector.settings.messageLevelFilters.set({});this._view._showAllMessagesCheckbox.inputElement.checked=true;this._hideNetworkMessagesCheckbox.setState(false);this._textFilterUI.setValue("");this._filterChanged();},__proto__:WebInspector.Object.prototype};WebInspector.ConsoleCommand=function(message,linkifier,nestingLevel)
{WebInspector.ConsoleViewMessage.call(this,message,linkifier,nestingLevel);}
WebInspector.ConsoleCommand.prototype={clearHighlights:function()
{WebInspector.removeSearchResultsHighlight(this._formattedCommand,WebInspector.highlightedSearchResultClassName);},matchesRegex:function(regexObject)
{regexObject.lastIndex=0;return regexObject.test(this.text);},contentElement:function()
{if(!this._element){this._element=createElementWithClass("div","console-user-command");this._element.message=this;this._formattedCommand=createElementWithClass("span","console-message-text source-code");this._formattedCommand.textContent=this.text;this._element.appendChild(this._formattedCommand);var javascriptSyntaxHighlighter=new WebInspector.DOMSyntaxHighlighter("text/javascript",true);javascriptSyntaxHighlighter.syntaxHighlightNode(this._formattedCommand);}
return this._element;},renderedText:function()
{return this.text;},highlightMatches:function(ranges)
{var highlightNodes=[];if(this._formattedCommand){highlightNodes=WebInspector.highlightRangesWithStyleClass(this._formattedCommand,ranges,WebInspector.highlightedSearchResultClassName);}
return highlightNodes;},__proto__:WebInspector.ConsoleViewMessage.prototype}
WebInspector.ConsoleCommandResult=function(message,linkifier,nestingLevel)
{WebInspector.ConsoleViewMessage.call(this,message,linkifier,nestingLevel);}
WebInspector.ConsoleCommandResult.prototype={useArrayPreviewInFormatter:function(array)
{return false;},contentElement:function()
{var element=WebInspector.ConsoleViewMessage.prototype.contentElement.call(this);element.classList.add("console-user-command-result");this.updateTimestamp(false);return element;},__proto__:WebInspector.ConsoleViewMessage.prototype}
WebInspector.ConsoleGroup=function(parentGroup,groupMessage)
{this._parentGroup=parentGroup;this._nestingLevel=parentGroup?parentGroup.nestingLevel()+1:0;this._messagesHidden=groupMessage&&groupMessage.collapsed()||this._parentGroup&&this._parentGroup.messagesHidden();}
WebInspector.ConsoleGroup.createTopGroup=function()
{return new WebInspector.ConsoleGroup(null,null);}
WebInspector.ConsoleGroup.prototype={messagesHidden:function()
{return this._messagesHidden;},nestingLevel:function()
{return this._nestingLevel;},parentGroup:function()
{return this._parentGroup||this;},}
WebInspector.ConsoleView.ShowConsoleActionDelegate=function()
{}
WebInspector.ConsoleView.ShowConsoleActionDelegate.prototype={handleAction:function()
{WebInspector.console.show();return true;}}
WebInspector.ConsoleView.RegexMatchRange;;WebInspector.ConsolePanel=function()
{WebInspector.Panel.call(this,"console");this._view=WebInspector.ConsolePanel._view();}
WebInspector.ConsolePanel._view=function()
{if(!WebInspector.ConsolePanel._consoleView)
WebInspector.ConsolePanel._consoleView=new WebInspector.ConsoleView();return WebInspector.ConsolePanel._consoleView;}
WebInspector.ConsolePanel.prototype={defaultFocusedElement:function()
{return this._view.defaultFocusedElement();},wasShown:function()
{WebInspector.Panel.prototype.wasShown.call(this);this._view.show(this.element);},willHide:function()
{WebInspector.Panel.prototype.willHide.call(this);if(WebInspector.ConsolePanel.WrapperView._instance)
WebInspector.ConsolePanel.WrapperView._instance._showViewInWrapper();},searchableView:function()
{return WebInspector.ConsolePanel._view().searchableView();},__proto__:WebInspector.Panel.prototype}
WebInspector.ConsolePanel.WrapperView=function()
{WebInspector.VBox.call(this);this.element.classList.add("console-view-wrapper");WebInspector.ConsolePanel.WrapperView._instance=this;this._view=WebInspector.ConsolePanel._view();}
WebInspector.ConsolePanel.WrapperView.prototype={wasShown:function()
{if(!WebInspector.inspectorView.currentPanel()||WebInspector.inspectorView.currentPanel().name!=="console")
this._showViewInWrapper();},defaultFocusedElement:function()
{return this._view.defaultFocusedElement();},focus:function()
{this._view.focus();},_showViewInWrapper:function()
{this._view.show(this.element);},__proto__:WebInspector.VBox.prototype}
WebInspector.ConsolePanel.ConsoleRevealer=function()
{}
WebInspector.ConsolePanel.ConsoleRevealer.prototype={reveal:function(object)
{var consoleView=WebInspector.ConsolePanel._view();if(consoleView.isShowing()){consoleView.focus();return Promise.resolve();}
WebInspector.inspectorView.showViewInDrawer("console");return Promise.resolve();}}
WebInspector.ConsolePanel.show=function()
{WebInspector.inspectorView.setCurrentPanel(WebInspector.ConsolePanel._instance());}
WebInspector.ConsolePanel._instance=function()
{if(!WebInspector.ConsolePanel._instanceObject)
WebInspector.ConsolePanel._instanceObject=new WebInspector.ConsolePanel();return WebInspector.ConsolePanel._instanceObject;}
WebInspector.ConsolePanelFactory=function()
{}
WebInspector.ConsolePanelFactory.prototype={createPanel:function()
{return WebInspector.ConsolePanel._instance();}};WebInspector.CustomPreviewSection=function(object,prefixML)
{this._sectionElement=createElement("span");this._object=object;this._expanded=false;this._cachedContent=null;var customPreview=object.customPreview();if(customPreview.hasBody){this._sectionElement.classList.add("custom-expandable-section");this._sectionElement.addEventListener("click",this._onClick.bind(this),false);}
if(prefixML)
this._appendJsonMLTags(this._sectionElement,prefixML);try{var headerJSON=JSON.parse(customPreview.header);}catch(e){WebInspector.console.error("Broken formatter: header is invalid json "+e);return;}
var header=this._renderJSONMLTag(headerJSON);this._sectionElement.appendChild(header);}
WebInspector.CustomPreviewSection._tagsWhiteList=new Set(["span","div","ol","li","table","tr","td"]);WebInspector.CustomPreviewSection._attributes=["background-color","color","font-style","list-style-type","margin","margin-top","margin-right","margin-bottom","margin-left","padding","padding-top","padding-right","padding-bottom","padding-left"];WebInspector.CustomPreviewSection._attributesWhiteList=new Set(WebInspector.CustomPreviewSection._attributes);WebInspector.CustomPreviewSection.prototype={element:function()
{return this._sectionElement;},_validateStyleAttributes:function(style)
{var valueRegEx=/^[\w\s()-,.#]*$/;var styleAttributes=style.split(";");for(var i=0;i<styleAttributes.length;++i){var attribute=styleAttributes[i].trim();if(!attribute.length)
continue;var pair=attribute.split(":");if(pair.length!=2){WebInspector.console.error("Broken formatter: "+styleAttributes[i]);return false;}
var key=pair[0].trim();var value=pair[1];if(!WebInspector.CustomPreviewSection._attributesWhiteList.has(key)){WebInspector.console.error("Broken formatter: style attribute "+key+" is not allowed!");return false;}
if(!value.match(valueRegEx)){WebInspector.console.error("Broken formatter: style attribute value"+value+" is not allowed!");return false;}}
return true;},_renderJSONMLTag:function(jsonML)
{if(!Array.isArray(jsonML))
return createTextNode(jsonML+"");var array=(jsonML);if(array[0]==="object")
return this._layoutObjectTag(array);else
return this._renderElement(array);},_renderElement:function(object)
{var tagName=object.shift();if(!WebInspector.CustomPreviewSection._tagsWhiteList.has(tagName)){WebInspector.console.error("Broken formatter: element "+tagName+" is not allowed!");return createElement("span");}
var element=createElement((tagName));if((typeof object[0]=="object")&&!Array.isArray(object[0])){var attributes=object.shift();for(var key in attributes){var value=attributes[key];if((key!=="style")||(typeof value!=="string")||!this._validateStyleAttributes(value))
continue;element.setAttribute(key,value);}}
this._appendJsonMLTags(element,object);return element;},_layoutObjectTag:function(objectTag)
{objectTag.shift();var attributes=objectTag.shift();var remoteObject=this._object.target().runtimeModel.createRemoteObject((attributes));if(!remoteObject.customPreview()){var header=createElement("span");this._appendJsonMLTags(header,objectTag);var objectPropertiesSection=new WebInspector.ObjectPropertiesSection(remoteObject,header);return objectPropertiesSection.element;}
var customSection=new WebInspector.CustomPreviewSection(remoteObject,objectTag);return customSection.element();},_appendJsonMLTags:function(parentElement,jsonMLTags)
{for(var i=0;i<jsonMLTags.length;++i)
parentElement.appendChild(this._renderJSONMLTag(jsonMLTags[i]));},_onClick:function()
{if(this._cachedContent)
this._toggleExpand();else
this._loadBody();},_toggleExpand:function()
{this._expanded=!this._expanded;this._sectionElement.classList.toggle("expanded",this._expanded);var parent=this._sectionElement.parentElement;if(this._expanded)
parent.insertBefore(this._cachedContent,this._sectionElement.nextSibling);else
parent.removeChild(this._cachedContent);},_loadBody:function()
{function load()
{function substituteObjectTagsInCustomPreview(jsonMLObject)
{if(!jsonMLObject||(typeof jsonMLObject!=="object")||(typeof jsonMLObject.splice!=="function"))
return;var obj=jsonMLObject.length;if(!(typeof obj==="number"&&obj>>>0===obj&&(obj>0||1/obj>0)))
return;var startIndex=1;if(jsonMLObject[0]==="object"){var attributes=jsonMLObject[1];var originObject=attributes["object"];if(typeof originObject==="undefined")
throw"Illegal format: obligatory attribute \"object\" isn't specified";jsonMLObject[1]=bindRemoteObject(originObject,false,false,null,false);startIndex=2;}
for(var i=startIndex;i<jsonMLObject.length;++i)
substituteObjectTagsInCustomPreview(jsonMLObject[i]);}
try{var formatter=window["devtoolsFormatter"];if(!formatter)
return null;var body=formatter.body(this);substituteObjectTagsInCustomPreview(body);return body;}catch(e){console.error("Custom Formatter Failed: "+e);return null;}}
this._object.callFunctionJSON(load,[],onBodyLoaded.bind(this));function onBodyLoaded(bodyJsonML)
{if(!bodyJsonML)
return;this._cachedContent=this._renderJSONMLTag(bodyJsonML);this._toggleExpand();}}};Runtime.cachedResources["console/consoleView.css"]="/*\n * Copyright (C) 2006, 2007, 2008 Apple Inc.  All rights reserved.\n * Copyright (C) 2009 Anthony Ricaud <rik@webkit.org>\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions\n * are met:\n *\n * 1.  Redistributions of source code must retain the above copyright\n *     notice, this list of conditions and the following disclaimer.\n * 2.  Redistributions in binary form must reproduce the above copyright\n *     notice, this list of conditions and the following disclaimer in the\n *     documentation and/or other materials provided with the distribution.\n * 3.  Neither the name of Apple Computer, Inc. (\"Apple\") nor the names of\n *     its contributors may be used to endorse or promote products derived\n *     from this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS \"AS IS\" AND ANY\n * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\n * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\n * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY\n * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES\n * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;\n * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND\n * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF\n * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n.console-view {\n    background-color: white;\n    overflow: hidden;\n}\n\n.console-view-wrapper {\n    background-color: #eee;\n}\n\n.console-view-fix-select-all {\n    height: 0;\n    overflow: hidden;\n}\n\n.console-filters-header {\n    flex: 0 0 23px;\n    overflow: hidden;\n}\n\n#console-messages {\n    flex: 1 1;\n    padding: 2px 0;\n    overflow-y: auto;\n    word-wrap: break-word;\n    -webkit-user-select: text;\n    border-top: 1px solid rgb(230, 230, 230);\n    transform: translateZ(0);\n}\n\n#console-prompt {\n    clear: right;\n    position: relative;\n    padding: 1px 22px 1px 0;\n    margin-left: 24px;\n    min-height: 16px;\n    white-space: pre-wrap;\n    -webkit-user-modify: read-write-plaintext-only;\n}\n\n#console-prompt::before {\n    background-position: -192px -96px;\n}\n\n.console-user-command-result.console-log-level::before {\n    background-position: -202px -96px;\n}\n\n.console-message,\n.console-user-command {\n    clear: right;\n    position: relative;\n    border-bottom: 1px solid rgb(240, 240, 240);\n    padding: 1px 22px 1px 0;\n    margin-left: 24px;\n    min-height: 16px;\n    flex: auto;\n}\n\n.console-adjacent-user-command-result .console-user-command {\n    border-bottom: none;\n}\n\n.console-adjacent-user-command-result + .console-user-command-result.console-log-level::before {\n    background-image: none;\n}\n\n.console-timestamp {\n    color: gray;\n    -webkit-user-select: none;\n}\n\n.console-message::before,\n.console-user-command::before,\n#console-prompt::before,\n.console-group-title::before {\n    position: absolute;\n    display: block;\n    content: \"\";\n    left: -17px;\n    top: 0.8em;\n    width: 10px;\n    height: 10px;\n    margin-top: -6px;\n    -webkit-user-select: none;\n    background-image: url(Images/statusbarButtonGlyphs.png);\n    background-size: 320px 144px;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.console-message::before,\n.console-user-command::before,\n#console-prompt::before,\n.console-group-title::before {\n    background-image: url(Images/statusbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n.console-message > .outline-disclosure li.parent::before {\n    top: 0;\n}\n\n.bubble-repeat-count {\n    display: inline-block;\n    height: 14px;\n    background-color: rgb(128, 151, 189);\n    vertical-align: middle;\n    white-space: nowrap;\n    padding: 1px 4px;\n    text-align: left;\n    font-size: 11px;\n    line-height: normal;\n    font-weight: bold;\n    text-shadow: none;\n    color: white;\n    margin-top: -1px;\n    border-radius: 7px;\n}\n\n.console-message .bubble-repeat-count {\n    margin-right: 4px;\n    margin-left: -18px;\n}\n\n.repeated-message.console-error-level::before,\n.repeated-message.console-warning-level:before,\n.repeated-message.console-debug-level:before,\n.repeated-message.console-info-level:before {\n    visibility: hidden;\n}\n\n.repeated-message .outline-disclosure,\n.repeated-message > .console-message-text {\n    flex: 1;\n}\n\n.console-warning-level.repeated-message,\n.console-error-level.repeated-message,\n.console-log-level.repeated-message,\n.console-debug-level.repeated-message,\n.console-info-level.repeated-message {\n    display: flex;\n}\n\n.console-info {\n    color: rgb(128, 128, 128);\n    font-style: italic;\n}\n\n.console-group .console-group > .console-group-messages {\n    margin-left: 16px;\n}\n\n.console-group-title {\n    font-weight: bold;\n}\n\n.console-group-title::before {\n    -webkit-user-select: none;\n    -webkit-mask-image: url(Images/statusbarButtonGlyphs.png);\n    -webkit-mask-size: 320px 144px;\n    float: left;\n    width: 8px;\n    content: \"a\";\n    color: transparent;\n    text-shadow: none;\n    margin-left: 3px;\n    margin-top: -7px;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.console-group-title::before {\n    -webkit-mask-image: url(Images/statusbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n.console-group .console-group-title::before {\n    -webkit-mask-position: -20px -96px;\n    background-color: rgb(110, 110, 110);\n}\n\n.console-message-wrapper.collapsed .console-group-title::before {\n    -webkit-mask-position: -4px -96px;\n}\n\n.console-group {\n    position: relative;\n}\n\n.console-message-wrapper {\n    display: flex;\n}\n\n.console-message-wrapper .nesting-level-marker {\n    width: 14px;\n    flex: 0 0 auto;\n    border-right: 1px solid #A3A3A3;\n    position: relative;\n}\n\n.console-message-wrapper:last-child .nesting-level-marker,\n.console-message-wrapper .nesting-level-marker.group-closed {\n    margin-bottom: 4px;\n}\n\n.console-message-wrapper:last-child .nesting-level-marker::before,\n.console-message-wrapper .nesting-level-marker.group-closed::before\n{\n    content: \"\";\n}\n\n.console-message-wrapper .nesting-level-marker::before {\n    border-bottom: 1px solid #A3A3A3;\n    position: absolute;\n    top: 0;\n    left: 0;\n    margin-left: 100%;\n    width: 3px;\n    height: 100%;\n    box-sizing: border-box;\n}\n\n.console-error-level .console-message-text,\n.console-error-level .section > .header .title {\n    color: red !important;\n}\n\n.console-debug-level .console-message-text {\n    color: blue;\n}\n\n.console-error-level::before,\n.console-warning-level::before,\n.console-debug-level::before,\n.console-info-level::before {\n    background-image: url(Images/statusbarButtonGlyphs.png);\n    background-size: 320px 144px;\n    width: 10px;\n    height: 10px;\n}\n\n@media (-webkit-min-device-pixel-ratio: 1.5) {\n.console-error-level::before,\n.console-warning-level::before,\n.console-debug-level::before,\n.console-info-level::before {\n    background-image: url(Images/statusbarButtonGlyphs_2x.png);\n}\n} /* media */\n\n.console-warning-level::before {\n    background-position: -202px -107px;\n}\n\n.console-error-level::before {\n    background-position: -213px -96px;\n}\n\n.console-info-level::before {\n    background-position: -213px -107px;\n}\n\n.console-user-command .console-message {\n    margin-left: -24px;\n    padding-right: 0;\n    border-bottom: none;\n}\n\n.console-user-command::before {\n    background-position: -192px -107px;\n}\n\n.console-user-command-result {\n    display: block;\n}\n\n#console-messages .link {\n    text-decoration: underline;\n}\n\n#console-messages .link,\n#console-messages a {\n    color: rgb(33%, 33%, 33%);\n    cursor: pointer;\n}\n\n#console-messages .link:hover,\n#console-messages a:hover {\n    color: rgb(15%, 15%, 15%);\n}\n\n.console-group-messages .section {\n    margin: 0 0 0 12px !important;\n}\n\n.console-group-messages .section > .header {\n    padding: 0 8px 0 0;\n    background-image: none;\n    border: none;\n    min-height: 0;\n}\n\n.console-group-messages .section > .header::before {\n    margin-left: -12px;\n}\n\n.console-group-messages .section > .header .title {\n    color: #222;\n    font-weight: normal;\n    line-height: 13px;\n}\n\n.console-group-messages .section .properties li .info {\n    padding-top: 0;\n    padding-bottom: 0;\n    color: rgb(60%, 60%, 60%);\n}\n\n.console-object-preview {\n    font-style: italic;\n}\n\n.console-object-preview .name {\n    /* Follows .section .properties .name, .event-properties .name */\n    color: rgb(136, 19, 145);\n    flex-shrink: 0;\n}\n\n.console-message-text {\n    white-space: pre-wrap;\n}\n\n.console-message-formatted-table {\n    clear: both;\n}\n\n.console-message-url {\n    float: right;\n    text-align: right;\n    max-width: 100%;\n    margin-left: 4px;\n}\n\n.console-message-nowrap-below,\n.console-message-nowrap-below div,\n.console-message-nowrap-below span {\n    white-space: nowrap !important;\n}\n\n.console-view .status-bar::shadow .console-context {\n    max-width: 200px;\n}\n\n.highlighted-search-result.current-search-result {\n    border-radius: 1px;\n    padding: 1px;\n    margin: -1px;\n    background-color: rgba(255, 127, 0, 0.8);\n}\n\n/*# sourceURL=console/consoleView.css */";