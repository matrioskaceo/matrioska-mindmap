import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

const Mindmap = () => {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 2500, height: 2200 });
  const [chartData, setChartData] = useState([]);

  const GOOGLE_SHEET_ID = "1Hmm4S0zlaFxMdT8onJQbqCK6KS0Fl9yc5vtr-Msae6U"; // Reemplaza con tu ID
  const GOOGLE_SHEET_TAB = "1"; // Número de pestaña (hoja) en Google Sheets
  const API_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${GOOGLE_SHEET_TAB}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Intentando obtener datos de Google Sheets...");
        const response = await axios.get(API_URL);
        const jsonData = JSON.parse(response.data.substring(47).slice(0, -2));

        const rows = jsonData.table.rows.map(row => ({
          id: row.c[0]?.v.toString() || "",
          name: row.c[1]?.v || "",
          parent: row.c[2]?.v?.toString() || "",
        }));

        // **Limpieza de datos**
        const cleanedData = rows
          .filter(row => row.id.toLowerCase() !== "id") // Elimina la cabecera si está incluida
          .map(row => ({
            id: row.id,
            name: row.name,
            parent: row.parent === "" ? null : row.parent, // Asegura que root no tenga parent
          }));

        console.log("Datos cargados correctamente:", cleanedData);
        setChartData(cleanedData);
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

    // Fondo con puntos cada 2cm y opacidad del 40%
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
    
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const stratify = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parent);

    try {
      const root = stratify(chartData);
      const treeLayout = d3.tree().size([height, width]).separation((a, b) => {
        if (a.depth === 4 && b.depth === 4) {
          return 4; // Más separación entre phases
        }
        return a.parent === b.parent ? 3 : 5;
      });
      treeLayout(root);

      const linkGenerator = d3.linkHorizontal()
        .x(d => d.y + (d.depth === 4 ? 80 : 0))
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
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("click", function (event, d) {
          d3.selectAll("rect").attr("stroke", "rgb(173, 216, 230)").attr("stroke-width", 1.5);
          d3.select(this).select("rect")
            .attr("stroke", "rgb(30, 144, 255)")
            .attr("stroke-width", 4);
        });
  
      node.append("rect")
        .attr("width", d => d.data.name.length * 14 + 80)
        .attr("height", d => Math.max(60, d.data.name.length * 2))
        .attr("x", -60)
        .attr("y", d => -Math.max(30, d.data.name.length))
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", "#f8f8f8")
        .attr("stroke", "rgb(173, 216, 230)")
        .attr("stroke-width", 1.5)
        .style("filter", "drop-shadow(4px 4px 10px rgba(173, 216, 230, 0.7))");

      node.append("text")
        .attr("x", 0)
        .attr("y", d => d.data.name.includes("Phase") ? 3 : 5)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .style("font-size", d => d.data.name.includes("Phase") ? "8px" : "14px")
        .text(d => d.data.name);

    } catch (error) {
      console.error("Error en la jerarquía:", error);
    }

  }, [dimensions, chartData]);

  return (
    <svg ref={svgRef} width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} />
  );
};

export default Mindmap;


