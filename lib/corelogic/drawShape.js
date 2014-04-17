define(["dojo/_base/declare", "esri/map", "esri/geometry/geodesicUtils", "esri/units", "dojo/json", "esri/graphic", "esri/geometry/Geometry", "esri/geometry/Point", "esri/geometry/Polyline", "esri/geometry/Polygon", "esri/geometry/Extent", "esri/SpatialReference", "esri/tasks/GeometryService", "esri/tasks/LengthsParameters", "esri/tasks/AreasAndLengthsParameters", "esri/symbols/TextSymbol", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol"], function(declare, map, geodesicUtils, Units, json, Graphic, Geometry, Point, Polyline, Polygon, Extent, SpatialReference, GeometryService, LengthsParameters, AreasAndLengthsParameters, TextSymbol, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol){
    return declare(null, {
    
        kate: null,
        myGeometry: null,
        myGeometryService: null,
        myMap: null,
        
        getAreaAndLength: function(geometry){
            //setup the parameters for the areas and lengths operation
            var areasAndLengthParams = new AreasAndLengthsParameters();
            areasAndLengthParams.lengthUnit = GeometryService.UNIT_METER;
            areasAndLengthParams.areaUnit = GeometryService.UNIT_SQUARE_METERS;
            areasAndLengthParams.calculationType = "geodesic";
            myGeometryService.simplify([geometry], function(simplifiedGeometries){
                areasAndLengthParams.polygons = simplifiedGeometries;
                myGeometryService.areasAndLengths(areasAndLengthParams);
            });
        },
        
        outputAreaAndLength: function(evtObj){
            var result = evtObj.result;
            console.log(json.stringify(evtObj));
            var myLabelpoint = myGeometry.getCentroid();
            var myTextSymbol = new TextSymbol(result.areas[0])
            var textGraphic = new Graphic(myLabelpoint, myTextSymbol);
            myMap.graphics.add(textGraphic);
        },
        
        getLength: function(geometry){
            //setup the parameters for the areas and lengths operation
            var lengthParams = new LengthsParameters();
            lengthParams.lengthUnit = GeometryService.UNIT_METER;
            lengthParams.calculationType = "geodesic";
            myGeometryService.simplify([geometry], function(simplifiedGeometries){
                lengthParams.polylines = simplifiedGeometries;
                myGeometryService.lengths(lengthParams);
            });
        },
        
        outputLength: function(evtObj){
            var result = evtObj.result;
            console.log(json.stringify(evtObj));
            var myLabelpoint = myGeometry.paths[0][0];
            var myTextSymbol = new TextSymbol(result.lengths[0])
            var textGraphic = new Graphic(myLabelpoint, myTextSymbol);
            myMap.graphics.add(textGraphic);
        },
        
        addLengths: function(){
            switch (myGeometry.type) {
                case "point":
                    symbol = new SimpleMarkerSymbol();
                    var myTextSymbol = new TextSymbol(myGeometry.x + " , " + myGeometry.y);
                    var myTextGraphic = new Graphic(myGeometry, myTextSymbol);
                    myMap.graphics.add(myTextGraphic);
                    break;
                case "multipoint":                               
                    symbol = new SimpleMarkerSymbol();
                    break;
                case "polyline":
                    this.displayLengths(myGeometry.paths);
                    break;
                default:
                    this.displayLengths(myGeometry.rings);
                    break;
            }
        },
        
        displayLengths: function(paths){        
            for (var pathIndex = 0; pathIndex < paths.length; pathIndex++) {
                var firstPoint = null;
                var lastPoint = null;
                for (var vertexIndex = 0; vertexIndex < paths[pathIndex].length; vertexIndex++) {
                    lastPoint = firstPoint;
                    firstPoint = paths[pathIndex][vertexIndex];
                    if ((lastPoint != null) && (lastPoint != firstPoint)) {
                        var simpleLine = new Polyline([firstPoint, lastPoint]);
                        length = geodesicUtils.geodesicLengths([simpleLine], Units.KILOMETERS);
                        var midPoint = new Point(firstPoint[0] + ((lastPoint[0] - firstPoint[0]) / 2), firstPoint[1] + ((lastPoint[1] - firstPoint[1]) / 2));
                        midPoint.spatialReference = myGeometry.spatialReference;
                        var myTextSymbol = new TextSymbol(length.toString());
                        var myTextGraphic = new Graphic(midPoint, myTextSymbol);
                        myMap.graphics.add(myTextGraphic);
                    }
                }
            }            
        },        
        
        addShape: function(theMap, myGraphic){
            myMap = theMap;
            myMap.graphics.add(myGraphic);
            myGeometry = myGraphic.geometry;
            if (myGeometry.type === "polygon") {
                myGeometryService = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
                myGeometryService.on("areas-and-lengths-complete", this.outputAreaAndLength);
                this.getAreaAndLength(myGeometry);
            }
            this.addLengths();
        },
    
    });
});
