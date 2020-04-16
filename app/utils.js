
define([], function () {

  // Seeded number generator
  const random = new Math.seedrandom("mammoth");

  // Sample TIN coordinate
  function deviateCoord(min, max, count, index) {
    const step = (max - min) / count;
    const coord = min + index * step;

    // Unless it's a border vertex, deviate its position
    if (0 < index && index < count) {
      return coord + (random() - 0.5) * 0.9 * step;
    } else {
      return coord;
    }
  }

  function getRandomPointsAsFlatVertexArray(xmin, xmax, ymin, ymax, step) {
    const countX = Math.floor((xmax - xmin) / step);
    const countY = Math.floor((ymax - ymin) / step);

    const devX = deviateCoord.bind(this, xmin, xmax, countX);
    const devY = deviateCoord.bind(this, ymin, ymax, countY);

    const vertices = [];
    for (let x = 0; x <= countX; x++) {
      for (let y = 0; y <= countY; y++) {
        vertices.push(devX(x), devY(y));
      }
    }

    return vertices;
  }

  function setZValues(layer, sampler, index) {
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
            const zGeometry = sampler.queryElevation(feature.geometry);
            feature.geometry = zGeometry;
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

  return {
    getRandomPointsAsFlatVertexArray: getRandomPointsAsFlatVertexArray,
    setZValues: setZValues
  };
});
