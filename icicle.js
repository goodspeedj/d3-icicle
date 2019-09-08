function makeIcicle() {

  const height = 800
  const width  = 1000
  const mapDepth = 4
  let rootNode

  format = d3.format(",d")

  d3.json("health.json").then(function(data) {

    partition = data => {
      const root = d3.hierarchy(data)
          .sum(d => d.value)
          .sort((a, b) => b.height - a.height || b.value - a.value);
      return d3.partition()
          .size([height, (root.height + 1) * width / 3])
        (root);
    }

    rootNode = partition(data)
    let focus = rootNode

    /* sum and sort the root node values
    rootNode
      .sum(function(d) {
        return d.value;
      })
      .sort(function(a, b) {
        return b.height - a.height || b.value - a.value;
      });
*/

    console.log(rootNode.descendants())

    // bind the data to the nodes
    let cell = d3.select('svg')
      .attr('width', width)
      .attr('height', height)
      .selectAll('g')
      .data(rootNode.descendants(), function(d) {
        return d.data.name;
      })
      .join("g")
        .attr("transform", d => `translate(${d.y0},${d.x0})`);
    /*
    cell
      .exit()
      .remove()

    let newNodes = nodes
      .enter()
      .filter(function(d) {
        return d.depth < mapDepth;
      })
      .append('g')
      .attr('transform', function(d) {
        return 'translate(' + [d.x0, d.y0] + ')'
      })
    */

    const rect = cell
      .append('rect')
      .attr("width", d => d.y1 - d.y0 - 1)
      .attr("height", d => rectHeight(d))
      .attr("fill-opacity", 0.6)
      .attr("fill", d => {
        if (!d.depth) return "#ccc";
        while (d.depth > 1) d = d.parent;
        return d3.interpolateRdYlGn(d.data.health);
      })
      .style("cursor", "pointer")
      .on("click", clicked);

    // lable the rectangles
    const text = cell
      .style("user-select", "none")
      .append('text')
      .attr('dx', 4)
      .attr('dy', 14)
      .attr('fill-opacity',0)
      .text(function(d) {
        return +labelVisible(d);
      })

    text.append("tspan")
      .text(d => d.data.name)
      .attr("fill-opacity", d => labelVisible(d) * 0.7)

    const tspan = text.append("tspan")
      .attr("fill-opacity", d => labelVisible(d) * 0.7)
      .text(d => ` ${format(d.value)}`);


    cell.append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);


    function clicked(p) {
      focus = focus === p ? p = p.parent : p;

      rootNode.each(d => d.target = {
        x0: (d.x0 - p.x0) / (p.x1 - p.x0) * height,
        x1: (d.x1 - p.x0) / (p.x1 - p.x0) * height,
        y0: d.y0 - p.y0,
        y1: d.y1 - p.y0
      });

      const t = cell.transition().duration(750)
          .attr("transform", d => `translate(${d.target.y0},${d.target.x0})`);

      rect.transition(t).attr("height", d => rectHeight(d.target));
      text
        .transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .text(d => d.data.name)
      tspan.transition(t).attr("fill-opacity", d => labelVisible(d.target) * 0.7);
    }

  });

  function rectHeight(d) {
    return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
  }

  function labelVisible(d) {
    return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
  }


}
