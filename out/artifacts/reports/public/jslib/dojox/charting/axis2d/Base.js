//>>built
define("dojox/charting/axis2d/Base",["dojo/_base/declare","../Element"],function(c,d){return c("dojox.charting.axis2d.Base",d,{constructor:function(b,a){this.vertical=a&&a.vertical;this.opt={};this.opt.min=a&&a.min;this.opt.max=a&&a.max},clear:function(){return this},initialized:function(){return!1},calculate:function(b,a,c){return this},getScaler:function(){return null},getTicks:function(){return null},getOffsets:function(){return{l:0,r:0,t:0,b:0}},render:function(b,a){this.dirty=!1;return this},
isNullValue:function(b){return!1},naturalBaseline:0})});
//# sourceMappingURL=Base.js.map