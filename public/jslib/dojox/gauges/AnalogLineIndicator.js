//>>built
define("dojox/gauges/AnalogLineIndicator",["dojo/_base/declare","./AnalogIndicatorBase"],function(a,c){return a("dojox.gauges.AnalogLineIndicator",[c],{_getShapes:function(a){var b=this.length;"inside"==this.direction&&(b=-b);return[a.createLine({x1:0,y1:-this.offset,x2:0,y2:-b-this.offset}).setStroke({color:this.color,width:this.width})]}})});
//# sourceMappingURL=AnalogLineIndicator.js.map