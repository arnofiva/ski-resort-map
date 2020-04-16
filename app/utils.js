
define([], function () {

  // Seeded number generator
  const random = new Math.seedrandom("mammoth");

  // Sample TIN coordinate
  function sample(min, max, count, index) {
    const step = (max - min) / count;
    const coord = min + index * step;

    // Unless it's a border vertex, deviate its position
    if (0 < index && index < count) {
      return coord + (random() - 0.5) * 0.9 * step;
    } else {
      return coord;
    }
  }

  return {

    getRandomPointsAsFlatVertexArray(xmin, xmax, ymin, ymax, gridSize) {

      // const xmin = -13253776.1039;
      // const xmax = -13245135.78;
      // const ymin = 4524162.1421;
      // const ymax = 4530795.2634;

      // const gridSize = 200;

      // Generate coordinates between (xmin, ymin) and (xmax, ymax)
      const countX = Math.floor((xmax - xmin) / gridSize);
      const countY = Math.floor((ymax - ymin) / gridSize);
      const vertices = [];
      for (let x = 0; x <= countX; x++) {
        for (let y = 0; y <= countY; y++) {
          vertices.push(
            sample(xmin, xmax, countX, x),
            sample(ymin, ymax, countY, y),
          );
        }
      }
      return vertices;
    },
    setZValues(layer, sampler, index) {
      if (index < 14000) {
        layer
          .queryFeatures({
            where: "1=1",
            outFields: ["OBJECTID"],
            returnGeometry: true,
            returnZ: true,
            num: 2000,
            start: index
          })
          .then(function (result) {

            const features = result.features;

            features.forEach(function (feature) {
              // const densifiedGeometry = geometryEngine.densify(feature.geometry, 0.001);
              // console.log(densifiedGeometry.paths[0], "\n ------");
              const zGeometry = sampler.queryElevation(feature.geometry);
              console.log(zGeometry.z);
              feature.geometry = zGeometry;
              // feature.geometry = densifiedGeometry;
              // console.log(densifiedGeometry);
            });
            layer
              .applyEdits({ updateFeatures: features })
              .then(function (results) {
                console.log(results);
                setZValues(layer, sampler, index + 2000);
              })
              .catch(console.error);
          });
      }
    }
  };
});
