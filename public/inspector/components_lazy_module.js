WebInspector.CookiesTable=function(expandable,refreshCallback,selectedCallback)
{WebInspector.VBox.call(this);var readOnly=expandable;this._refreshCallback=refreshCallback;var columns=[{id:"name",title:WebInspector.UIString("Name"),sortable:true,disclosure:expandable,sort:WebInspector.DataGrid.Order.Ascending,longText:true,weight:24},{id:"value",title:WebInspector.UIString("Value"),sortable:true,longText:true,weight:34},{id:"domain",title:WebInspector.UIString("Domain"),sortable:true,weight:7},{id:"path",title:WebInspector.UIString("Path"),sortable:true,weight:7},{id:"expires",title:WebInspector.UIString("Expires / Max-Age"),sortable:true,weight:7},{id:"size",title:WebInspector.UIString("Size"),sortable:true,align:WebInspector.DataGrid.Align.Right,weight:7},{id:"httpOnly",title:WebInspector.UIString("HTTP"),sortable:true,align:WebInspector.DataGrid.Align.Center,weight:7},{id:"secure",title:WebInspector.UIString("Secure"),sortable:true,align:WebInspector.DataGrid.Align.Center,weight:7}];if(readOnly)
this._dataGrid=new WebInspector.DataGrid(columns);else
this._dataGrid=new WebInspector.DataGrid(columns,undefined,this._onDeleteCookie.bind(this),refreshCallback,this._onContextMenu.bind(this));this._dataGrid.setName("cookiesTable");this._dataGrid.addEventListener(WebInspector.DataGrid.Events.SortingChanged,this._rebuildTable,this);if(selectedCallback)
this._dataGrid.addEventListener(WebInspector.DataGrid.Events.SelectedNode,selectedCallback,this);this._nextSelectedCookie=(null);this._dataGrid.show(this.element);this._data=[];}
WebInspector.CookiesTable.prototype={_clearAndRefresh:function(domain)
{this.clear(domain);this._refresh();},_onContextMenu:function(contextMenu,node)
{if(node===this._dataGrid.creationNode)
return;var cookie=node.cookie;var domain=cookie.domain();if(domain)
contextMenu.appendItem(WebInspector.UIString.capitalize("Clear ^all from \"%s\"",domain),this._clearAndRefresh.bind(this,domain));contextMenu.appendItem(WebInspector.UIString.capitalize("Clear ^all"),this._clearAndRefresh.bind(this,null));},setCookies:function(cookies)
{this.setCookieFolders([{cookies:cookies}]);},setCookieFolders:function(cookieFolders)
{this._data=cookieFolders;this._rebuildTable();},selectedCookie:function()
{var node=this._dataGrid.selectedNode;return node?node.cookie:null;},clear:function(domain)
{for(var i=0,length=this._data.length;i<length;++i){var cookies=this._data[i].cookies;for(var j=0,cookieCount=cookies.length;j<cookieCount;++j){if(!domain||cookies[j].domain()===domain)
cookies[j].remove();}}},_rebuildTable:function()
{var selectedCookie=this._nextSelectedCookie||this.selectedCookie();this._nextSelectedCookie=null;this._dataGrid.rootNode().removeChildren();for(var i=0;i<this._data.length;++i){var item=this._data[i];if(item.folderName){var groupData={name:item.folderName,value:"",domain:"",path:"",expires:"",size:this._totalSize(item.cookies),httpOnly:"",secure:""};var groupNode=new WebInspector.DataGridNode(groupData);groupNode.selectable=true;this._dataGrid.rootNode().appendChild(groupNode);groupNode.element().classList.add("row-group");this._populateNode(groupNode,item.cookies,selectedCookie);groupNode.expand();}else
this._populateNode(this._dataGrid.rootNode(),item.cookies,selectedCookie);}},_populateNode:function(parentNode,cookies,selectedCookie)
{parentNode.removeChildren();if(!cookies)
return;this._sortCookies(cookies);for(var i=0;i<cookies.length;++i){var cookie=cookies[i];var cookieNode=this._createGridNode(cookie);parentNode.appendChild(cookieNode);if(selectedCookie&&selectedCookie.name()===cookie.name()&&selectedCookie.domain()===cookie.domain()&&selectedCookie.path()===cookie.path())
cookieNode.select();}},_totalSize:function(cookies)
{var totalSize=0;for(var i=0;cookies&&i<cookies.length;++i)
totalSize+=cookies[i].size();return totalSize;},_sortCookies:function(cookies)
{var sortDirection=this._dataGrid.isSortOrderAscending()?1:-1;function compareTo(getter,cookie1,cookie2)
{return sortDirection*(getter.apply(cookie1)+"").compareTo(getter.apply(cookie2)+"");}
function numberCompare(getter,cookie1,cookie2)
{return sortDirection*(getter.apply(cookie1)-getter.apply(cookie2));}
function expiresCompare(cookie1,cookie2)
{if(cookie1.session()!==cookie2.session())
return sortDirection*(cookie1.session()?1:-1);if(cookie1.session())
return 0;if(cookie1.maxAge()&&cookie2.maxAge())
return sortDirection*(cookie1.maxAge()-cookie2.maxAge());if(cookie1.expires()&&cookie2.expires())
return sortDirection*(cookie1.expires()-cookie2.expires());return sortDirection*(cookie1.expires()?1:-1);}
var comparator;switch(this._dataGrid.sortColumnIdentifier()){case"name":comparator=compareTo.bind(null,WebInspector.Cookie.prototype.name);break;case"value":comparator=compareTo.bind(null,WebInspector.Cookie.prototype.value);break;case"domain":comparator=compareTo.bind(null,WebInspector.Cookie.prototype.domain);break;case"path":comparator=compareTo.bind(null,WebInspector.Cookie.prototype.path);break;case"expires":comparator=expiresCompare;break;case"size":comparator=numberCompare.bind(null,WebInspector.Cookie.prototype.size);break;case"httpOnly":comparator=compareTo.bind(null,WebInspector.Cookie.prototype.httpOnly);break;case"secure":comparator=compareTo.bind(null,WebInspector.Cookie.prototype.secure);break;default:compareTo.bind(null,WebInspector.Cookie.prototype.name);}
cookies.sort(comparator);},_createGridNode:function(cookie)
{var data={};data.name=cookie.name();data.value=cookie.value();if(cookie.type()===WebInspector.Cookie.Type.Request){data.domain=WebInspector.UIString("N/A");data.path=WebInspector.UIString("N/A");data.expires=WebInspector.UIString("N/A");}else{data.domain=cookie.domain()||"";data.path=cookie.path()||"";if(cookie.maxAge())
data.expires=Number.secondsToString(parseInt(cookie.maxAge(),10));else if(cookie.expires())
data.expires=new Date(cookie.expires()).toISOString();else
data.expires=WebInspector.UIString("Session");}
data.size=cookie.size();const checkmark="\u2713";data.httpOnly=(cookie.httpOnly()?checkmark:"");data.secure=(cookie.secure()?checkmark:"");var node=new WebInspector.DataGridNode(data);node.cookie=cookie;node.selectable=true;return node;},_onDeleteCookie:function(node)
{var cookie=node.cookie;var neighbour=node.traverseNextNode()||node.traversePreviousNode();if(neighbour)
this._nextSelectedCookie=neighbour.cookie;cookie.remove();this._refresh();},_refresh:function()
{if(this._refreshCallback)
this._refreshCallback();},__proto__:WebInspector.VBox.prototype};