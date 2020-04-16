define([
  "esri/geometry/SpatialReference"
], function (SpatialReference) {

  const exaggerationFactor = 2;

  return {
    appId: "iLylggsE3toQeCGV",
    portalUrl: "https://jsapi.maps.arcgis.com/",
    terrain: {
      minHeight: 0,
      maxHeight: 4000,
      offset: 4847.31787109375 - 2423.658935546875 * exaggerationFactor,
      exaggerationFactor: 2,
    },
    extent: {
      xmin: -13253776.1039,
      xmax: -13245135.78,
      ymin: 4524162.1421,
      ymax: 4530795.2634,
      spatialReference: SpatialReference.WebMercator
    }
  }
});
