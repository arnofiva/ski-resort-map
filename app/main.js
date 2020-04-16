define([
  "app/config",
  "app/renderers",
  "esri/Map",
  "esri/geometry/SpatialReference",
  "app/tin",
  "esri/views/SceneView",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/geometry/Extent",
  "esri/layers/GraphicsLayer",
  "esri/layers/FeatureLayer",
  "esri/core/watchUtils",
  "esri/geometry/support/meshUtils",
  "app/utils",
  "esri/layers/ElevationLayer",
  "esri/layers/BaseElevationLayer",
], function (
  config,
  renderers,
  Map,
  SpatialReference,
  tin,
  SceneView,
  Graphic,
  Point,
  Extent,
  GraphicsLayer,
  FeatureLayer,
  watchUtils,
  meshUtils,
  utils,
  ElevationLayer,
  BaseElevationLayer
  ) {
  return {
    init: function () {

      const exaggeration = config.terrain.exaggerationFactor;
      const offset = config.terrain.offset;

      const ExaggeratedElevationLayer = BaseElevationLayer.createSubclass({

        load: function() {
          this._elevation = new ElevationLayer({
            url:
              "//elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
          });

          this.addResolvingPromise(this._elevation.load());
        },

        fetchTile: function(level, row, col) {
          // calls fetchTile() on the elevationlayer for the tiles
          // visible in the view
          return this._elevation.fetchTile(level, row, col).then(
            function(data) {
              for (var i = 0; i < data.values.length; i++) {
                data.values[i] = data.values[i] * exaggeration + offset;
              }

              return data;
            }.bind(this)
          );
        }
      });


      const map = new Map({
        // basemap: "satellite",
        // ground: "world-elevation",
        // ground: {
        //   layers: [new ExaggeratedElevationLayer()]
        // }
        ground: {
          opacity: 0
        }
      });

      const view = new SceneView({
        container: "viewDiv",
        map: map,
        alphaCompositingEnabled: true,
        environment: {
          lighting: {
            directShadowsEnabled: false
          },
          background: {
            type: "color",
            color: [0, 0, 0, 0]
          },
          starsEnabled: false,
          atmosphereEnabled: false
        },
        camera: {
          position: {
            spatialReference: SpatialReference.WebMercator,
            x: -13239947.23509459,
            y: 4537716.550325148,
            z: 9144.733118887329
          },
          heading: 222,
          tilt: 72
        },

        // 2D Camera
        // camera: {
        //   position: {
        //     spatialReference: {"latestWkid":3857,"wkid":102100},
        //     "x":-13249455.94195,"y":4527612.643648105,"z":15348.106710969625
        //   },
        //   "heading":180,
        //   "tilt":0
        // },
        spatialReference: SpatialReference.WebMercator,
        viewingMode: "local",
        qualityProfile: "high",
        clippingArea: config.extent
      });

      tin.createGeometry()
        .then(function (mesh) {

          const position = mesh.vertexAttributes.position;
          const rings = [];

          mesh.components.forEach(component => {
            const faces = component.faces;

            for (let i = 0; i < faces.length; i += 3) {
              rings.push([[
                position[faces[i] * 3],
                position[faces[i] * 3 + 1],
                position[faces[i] * 3 + 2] + 5,
              ], [
                position[faces[i + 1] * 3],
                position[faces[i + 1] * 3 + 1],
                position[faces[i + 1] * 3 + 2] + 5,
              ], [
                position[faces[i + 2] * 3],
                position[faces[i + 2] * 3 + 1],
                position[faces[i + 2] * 3 + 2] + 5,
              ]].reverse());
            }
          });

          const layer = new GraphicsLayer({
            elevationInfo: {
              mode: "on-the-ground"
            }
          });

          map.add(layer);

          // layer.graphics.add(new Graphic({
          //   geometry: {
          //     type: "extent",
          //     spatialReference: mesh.spatialReference,
          //     ...config.extent},
          //   symbol: {
          //     type: "polygon-3d",
          //     symbolLayers: [{
          //       type: "fill",
          //       material: { color: [0, 0, 0, 0] },
          //       outline: {size: 1.2, color: "#00FFFF"}
          //     }]
          //   }
          // }));

          // layer.add(new Graphic({
          //   geometry: {
          //     type: "polygon",
          //     spatialReference: mesh.spatialReference,
          //     rings
          //   },
          //   symbol: {
          //     type: "polygon-3d",
          //     symbolLayers: [{
          //       type: "fill",
          //       material: { color: [150, 150, 150, 0] },
          //       outline: {size: 1.2, color: "#00FFFF"}
          //     }]
          //   }
          // }));

          // for (let i = 0; i < position.length; i += 3) {

          //   layer.graphics.add(new Graphic({
          //     geometry: {
          //       type: "point",
          //       spatialReference: mesh.spatialReference,
          //       x: position[i],
          //       y: position[i+1]
          //     },
          //     symbol: {
          //       type: "point-3d",
          //       symbolLayers: [{
          //         type: "icon",
          //         size: 3,
          //         resource: { primitive: "circle" },
          //         material: { color: "#00FFFF" }
          //       }]
          //     }
          //   }));
          // }



          layer.add(new Graphic({
            geometry: mesh,
            symbol: {
              type: "mesh-3d",
              symbolLayers: [{ type: "fill", material: {
                color: "gray",
                colorMixMode: "replace"
              } }]
            }
          }));

          // Create elevation sampler to add z values to
          // to features in layer
          // meshUtils.createElevationSampler(mesh)
          //   .then(function(sampler) {
          //     utils.setZValues(layer, sampler, 0);
          //   });

          view.when(function() {
            watchUtils.whenFalseOnce(view, "updating", function() {
                document.getElementsByTagName("canvas")[0].style.filter = "opacity(1)";
                document.getElementById("loader").style.display = "none";
            });
          });
        });

      // Start Symbology Layers


      const pointsOfInterestLayer = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/interest_points_mammoth/FeatureServer",
        screenSizePerspectiveEnabled: false,
        renderer: renderers.getPOIRenderer(),
        labelingInfo: renderers.getPOILabeling()
      });

      map.add(pointsOfInterestLayer);

      const waterLayer = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/mammoth_lakes/FeatureServer",
        renderer: renderers.getWaterRenderer(),
        labelingInfo: renderers.getWaterLabeling()
      });
      map.add(waterLayer);

      const skiLiftsLayer = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/ski_lifts_Mammoth/FeatureServer/0",
        outFields: ["OBJECTID"],
        elevationInfo: {
          mode: "absolute-height",
          offset: 25
        },
        renderer: renderers.getSkiLiftRenderer(),
        labelingInfo: renderers.getSkiLiftLabeling()
      });
      map.add(skiLiftsLayer);

      skiLiftsLayer
        .queryFeatures({
          where: "1=1",
          returnZ: true,
          returnGeometry: true
        })
        .then(function (results) {
          const graphics = [];
          results.features.forEach(function (feature) {
            feature.geometry.paths.forEach(function (path) {
              path.forEach(function (point, index) {
                const pillarGeometry = new Point({
                  x: point[0],
                  y: point[1],
                  z: point[2],
                  spatialReference: feature.geometry.spatialReference
                });
                const graphic = new Graphic({
                  geometry: pillarGeometry,
                  attributes: {
                    ObjectId: index
                  }
                });
                graphics.push(graphic);
              });
            });
          });

        const skiLiftPillarLayer = new FeatureLayer({
          elevationInfo: {
            mode: "absolute-height",
            offset: 26
          },
          title: "Ski lift pillars",
          fields: [{
            name: "ObjectID",
            alias: "ObjectID",
            type: "oid"
          }],
          renderer: renderers.getPillarRenderer(),
          source: graphics
        });
        map.add(skiLiftPillarLayer);
      });

      const treesLayer = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/trees_mammoth/FeatureServer",
        elevationInfo: {
          mode: "absolute-height"
        },
        renderer: renderers.getTreesRenderer()
      });

      map.add(treesLayer);

      const skiTrailsLayer = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/ski_trails_mammoth/FeatureServer",
        elevationInfo: {
          mode: "absolute-height",
          offset: 5
        },
        renderer: renderers.getSkiTrailsRenderer()
      });
      map.add(skiTrailsLayer);

      const modelsLayer = new FeatureLayer({
        url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/3d_models_mammoth/FeatureServer",
        renderer: renderers.getModelsRenderer()
      });
      map.add(modelsLayer);

      let itSnows = false;
      const snowContainer = document.getElementsByClassName("snow")[0];
      const snowButton = document.getElementById("startSnow");
      snowButton.addEventListener("click", function () {
        snowContainer.style.display = itSnows ? "none" : "inherit";
        snowButton.innerHTML = itSnows ? "make it snow" : "stop the snow";
        itSnows = !itSnows;
      });

      const mapExtent = new Extent(config.extent);
      const center = mapExtent.center;

      const planeGraphicsLayer = new GraphicsLayer({
        elevationInfo: {
          mode: "absolute-height"
        }
      });
      map.add(planeGraphicsLayer);
      const radius = 3000;
      const duration = 20000;
      const planeGraphic = new Graphic({
        symbol: {
          type: "point-3d",
          symbolLayers: [
            {
              type: "object",
              resource: { href: "./assets/heli/small-airplane-v3.gltf" },
              height: 250,
              heading: 90,
              roll: 15,
              tilt: 0
            }
          ]
        },
        geometry: new Point({
          x: center.x,
          y: center.y,
          z: 7000,
          spatialReference: SpatialReference.WebMercator
        })
      });

      planeGraphicsLayer.add(planeGraphic);

      const planeGeometry = planeGraphic.geometry;
      const planeSymbolLayer = planeGraphic.symbol.symbolLayers.getItemAt(0);
      const positionAnimation = anime({
        targets: planeGeometry,
        x: {
          value: "+=" + radius,
          easing: function (el, i, total) {
            return function (t) {
              return Math.sin(t * 2 * Math.PI);
            }
          }
        },
        y: {
          value: "+=" + radius,
          easing: function (el, i, total) {
            return function (t) {
              return Math.cos(t * 2 * Math.PI);
            }
          }
        },
        duration,
        autoplay: false,
        loop: true,
        update: function () {
          planeGraphic.geometry = planeGeometry.clone();
        }
      });

      const headingAnimation = anime({
        targets: planeSymbolLayer,
        heading: "+=360",
        duration,
        easing: "linear",
        autoplay: false,
        loop: true,
        update: function () {
          planeGraphic.symbol = planeGraphic.symbol.clone();
          planeGraphic.symbol.symbolLayers = [planeSymbolLayer];
        }
      });

      let planeFlying = false;
      const flyButton = document.getElementById("flyPlane");

      flyButton.addEventListener("click", function () {

        if (planeFlying) {
          positionAnimation.pause();
          headingAnimation.pause();
          flyButton.innerHTML = "fly the plane";
        } else {
          planeGraphic.visible = true;
          positionAnimation.play();
          headingAnimation.play();
          flyButton.innerHTML = "stop the plane";
        }
        planeFlying = !planeFlying;
      });


      // End Symbology Layers

    }
  }
})
