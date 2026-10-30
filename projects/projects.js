import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Lab 4 step 1.6: project count in the title
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

// Both filters live here so they can work together
let query = '';
let selectedIndex = -1;
let selectedYear = null;

let colors = d3.scaleOrdinal(d3.schemeTableau10);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

function filterByQuery(list) {
  return list.filter((project) => {
    // search every field except the image link
    let { image, ...rest } = project;
    let values = Object.values(rest).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  rolledData.sort((a, b) => a[0].localeCompare(b[0]));

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // keep the selected year highlighted if it is still in the chart
  selectedIndex = data.findIndex((d) => d.label === selectedYear);
  if (selectedIndex === -1) {
    selectedYear = null;
  }

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => selectWedge(i, data));
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => selectWedge(i, data));
  });
}

function selectWedge(i, data) {
  selectedIndex = selectedIndex === i ? -1 : i;
  selectedYear = selectedIndex === -1 ? null : data[i].label;
  update();
}

// Apply the search first, then the year, every time either one changes.
// This is the fix for the lab 5 bug where the two filters cancelled each other out.
function update() {
  let searchedProjects = filterByQuery(projects);
  renderPieChart(searchedProjects);

  let visibleProjects = searchedProjects;
  if (selectedYear !== null) {
    visibleProjects = searchedProjects.filter((p) => p.year === selectedYear);
  }

  renderProjects(visibleProjects, projectsContainer, 'h2');
}

update();

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  update();
});
