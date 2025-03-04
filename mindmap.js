import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

const HierarchicalChart = () => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 2500, height: 2200 });
  const [chartData, setChartData] = useState([]);

  const GOOGLE_SHEET_ID = "1Hmm4S0zlaFxMdT8onJQbqCK6KS0Fl9yc5vtr-Msae6U"; // Reemplaza con tu ID
  const GOOGLE_SHEET_TAB = "1"; // Número de pestaña (hoja) en Google Sheets
  const API_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${GOOGLE_SHEET_TAB}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        const jsonData = JSON.parse(response.data.substring(47).slice(0, -2));
        const rows = jsonData.table.rows.map(row => ({
          id: row.c[0]?.v.toString() || "",
          name: row.c[1]?.v || "",
          parent: row.c[2]?.v?.toString() || "",
        }));
        setChartData(rows);
      } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (chartData.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 100, right: 200, bottom: 100, left: 500 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Background pattern with dots every 2cm with 40% opacity
    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "dot-pattern")
      .attr("width", 75)
      .attr("height", 75)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("circle")
      .attr("cx", 37.5)
      .attr("cy", 37.5)
      .attr("r", 3)
      .attr("fill", "#d0d7de")
      .attr("opacity", "0.4");

    svg.style("background", "white");
    svg.append("rect")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("fill", "url(#dot-pattern)");
    
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const stratify = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parent);

    const root = stratify(chartData);
    const treeLayout = d3.tree().size([height, width]).separation((a, b) => a.parent === b.parent ? 5 : 7);
    treeLayout(root);

    const linkGenerator = d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x);

    g.selectAll("path")
      .data(root.links())
      .enter()
      .append("path")
      .attr("d", linkGenerator)
      .attr("fill", "none")
      .attr("stroke", "#bbb")
      .attr("stroke-width", 2);

    const node = g.selectAll("g.node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("rect")
      .attr("width", d => d.data.name.length * 14 + 80)
      .attr("height", d => d.data.name.includes("Phase") ? 20 : 60)
      .attr("x", d => -(d.data.name.length * 7 + 40))
      .attr("y", d => d.data.name.includes("Phase") ? -10 : -30)
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", "#f8f8f8")
      .attr("stroke", "#bbb")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(4px 4px 10px rgba(255,255,255,0.5))")
      .on("click", (event, d) => alert(`Clicked on: ${d.data.name}`));

    node.append("text")
      .attr("x", 0)
      .attr("y", d => d.data.name.includes("Phase") ? 3 : 5)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .style("font-size", d => d.data.name.includes("Phase") ? "8px" : "14px")
      .text(d => d.data.name);
  }, [dimensions, chartData]);

  return (
    <svg ref={svgRef} width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} />
  );
};

export default HierarchicalChart;
