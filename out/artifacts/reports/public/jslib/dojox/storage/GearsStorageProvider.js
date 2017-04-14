//>>built
define("dojox/storage/GearsStorageProvider",["dojo","dijit","dojox","dojo/require!dojo/gears,dojox/storage/Provider,dojox/storage/manager,dojox/sql"],function(f,m,c){f.provide("dojox.storage.GearsStorageProvider");f.require("dojo.gears");f.require("dojox.storage.Provider");f.require("dojox.storage.manager");f.require("dojox.sql");f.gears.available&&function(){f.declare("dojox.storage.GearsStorageProvider",c.storage.Provider,{constructor:function(){},TABLE_NAME:"__DOJO_STORAGE",initialized:!1,_available:null,
_storageReady:!1,initialize:function(){1!=f.config.disableGearsStorage&&(this.TABLE_NAME="__DOJO_STORAGE",this.initialized=!0,c.storage.manager.loaded())},isAvailable:function(){return this._available=f.gears.available},put:function(a,b,d,e){this._initStorage();if(!this.isValidKey(a))throw Error("Invalid key given: "+a);e=e||this.DEFAULT_NAMESPACE;if(!this.isValidKey(e))throw Error("Invalid namespace given: "+a);b=f.isString(b)?"string:"+b:f.toJson(b);try{c.sql("DELETE FROM "+this.TABLE_NAME+" WHERE namespace \x3d ? AND key \x3d ?",
e,a),c.sql("INSERT INTO "+this.TABLE_NAME+" VALUES (?, ?, ?)",e,a,b)}catch(h){d(this.FAILED,a,h.toString(),e);return}d&&d(c.storage.SUCCESS,a,null,e)},get:function(a,b){this._initStorage();if(!this.isValidKey(a))throw Error("Invalid key given: "+a);b=b||this.DEFAULT_NAMESPACE;if(!this.isValidKey(b))throw Error("Invalid namespace given: "+a);var d=c.sql("SELECT * FROM "+this.TABLE_NAME+" WHERE namespace \x3d ? AND  key \x3d ?",b,a);if(d.length)d=d[0].value;else return null;return d=f.isString(d)&&
/^string:/.test(d)?d.substring(7):f.fromJson(d)},getNamespaces:function(){this._initStorage();for(var a=[c.storage.DEFAULT_NAMESPACE],b=c.sql("SELECT namespace FROM "+this.TABLE_NAME+" DESC GROUP BY namespace"),d=0;d<b.length;d++)b[d].namespace!=c.storage.DEFAULT_NAMESPACE&&a.push(b[d].namespace);return a},getKeys:function(a){this._initStorage();a=a||this.DEFAULT_NAMESPACE;if(!this.isValidKey(a))throw Error("Invalid namespace given: "+a);a=c.sql("SELECT key FROM "+this.TABLE_NAME+" WHERE namespace \x3d ?",
a);for(var b=[],d=0;d<a.length;d++)b.push(a[d].key);return b},clear:function(a){this._initStorage();a=a||this.DEFAULT_NAMESPACE;if(!this.isValidKey(a))throw Error("Invalid namespace given: "+a);c.sql("DELETE FROM "+this.TABLE_NAME+" WHERE namespace \x3d ?",a)},remove:function(a,b){this._initStorage();if(!this.isValidKey(a))throw Error("Invalid key given: "+a);b=b||this.DEFAULT_NAMESPACE;if(!this.isValidKey(b))throw Error("Invalid namespace given: "+a);c.sql("DELETE FROM "+this.TABLE_NAME+" WHERE namespace \x3d ? AND key \x3d ?",
b,a)},putMultiple:function(a,b,d,e){this._initStorage();if(!this.isValidKeyArray(a)||!b instanceof Array||a.length!=b.length)throw Error("Invalid arguments: keys \x3d ["+a+"], values \x3d ["+b+"]");if(null==e||"undefined"==typeof e)e=c.storage.DEFAULT_NAMESPACE;if(!this.isValidKey(e))throw Error("Invalid namespace given: "+e);this._statusHandler=d;try{c.sql.open();c.sql.db.execute("BEGIN TRANSACTION");for(var h="REPLACE INTO "+this.TABLE_NAME+" VALUES (?, ?, ?)",g=0;g<a.length;g++){var k=b[g],k=f.isString(k)?
"string:"+k:f.toJson(k);c.sql.db.execute(h,[e,a[g],k])}c.sql.db.execute("COMMIT TRANSACTION");c.sql.close()}catch(l){d&&d(this.FAILED,a,l.toString(),e);return}d&&d(c.storage.SUCCESS,a,null,e)},getMultiple:function(a,b){this._initStorage();if(!this.isValidKeyArray(a))throw new ("Invalid key array given: "+a);if(null==b||"undefined"==typeof b)b=c.storage.DEFAULT_NAMESPACE;if(!this.isValidKey(b))throw Error("Invalid namespace given: "+b);for(var d="SELECT * FROM "+this.TABLE_NAME+" WHERE namespace \x3d ? AND  key \x3d ?",
e=[],h=0;h<a.length;h++){var g=c.sql(d,b,a[h]);g.length?(g=g[0].value,f.isString(g)&&/^string:/.test(g)?e[h]=g.substring(7):e[h]=f.fromJson(g)):e[h]=null}return e},removeMultiple:function(a,b){this._initStorage();if(!this.isValidKeyArray(a))throw Error("Invalid arguments: keys \x3d ["+a+"]");if(null==b||"undefined"==typeof b)b=c.storage.DEFAULT_NAMESPACE;if(!this.isValidKey(b))throw Error("Invalid namespace given: "+b);c.sql.open();c.sql.db.execute("BEGIN TRANSACTION");for(var d="DELETE FROM "+this.TABLE_NAME+
" WHERE namespace \x3d ? AND key \x3d ?",e=0;e<a.length;e++)c.sql.db.execute(d,[b,a[e]]);c.sql.db.execute("COMMIT TRANSACTION");c.sql.close()},isPermanent:function(){return!0},getMaximumSize:function(){return this.SIZE_NO_LIMIT},hasSettingsUI:function(){return!1},showSettingsUI:function(){throw Error(this.declaredClass+" does not support a storage settings user-interface");},hideSettingsUI:function(){throw Error(this.declaredClass+" does not support a storage settings user-interface");},_initStorage:function(){if(!this._storageReady){if(!google.gears.factory.hasPermission&&
!google.gears.factory.getPermission(null,null,"This site would like to use Google Gears to enable enhanced functionality."))throw Error("You must give permission to use Gears in order to store data");try{c.sql("CREATE TABLE IF NOT EXISTS "+this.TABLE_NAME+"(  namespace TEXT,  key TEXT,  value TEXT )"),c.sql("CREATE UNIQUE INDEX IF NOT EXISTS namespace_key_index ON "+this.TABLE_NAME+" (namespace, key)")}catch(a){throw Error("Unable to create storage tables for Gears in Dojo Storage");}this._storageReady=
!0}}});c.storage.manager.register("dojox.storage.GearsStorageProvider",new c.storage.GearsStorageProvider)}()});
//# sourceMappingURL=GearsStorageProvider.js.map