
var app = angular.module('gdpvisualisation', []);

app.controller('mainCtrl', function($scope,$http){

});

app.filter('range', function() {
  return function(input, total) {
	total = parseInt(total);
	  for (var i=0; i<total; i++)
		input.push(i);
		return input;
	};
});

var marginSide = 150,
	marginBottom = 70,
	width = window.innerWidth,
	height = window.innerHeight;

var projection = d3.geo.mercator()
					   .scale(140)
					   .translate( [width / 2.5, height / 1.8]);
var path = d3.geo.path().projection(projection);

var zoom = d3.behavior.zoom()
			.translate([0, 0])
			.scale(1)
			.scaleExtent([1, 8])
			.on("zoom", zoomed);

var svg, features;

function svg_init(){

	svg = d3.select("#svg-container")
		.append("svg")
		.attr("width", width - 2*marginSide)
		.attr("height", height - 2*marginBottom)

	features = svg.append("g");

	svg.append("rect")
		.attr("class", "overlay")
		.attr("width", width)
		.attr("height", height)
		.call(zoom);

	function markCountry(d) {
		if(d.properties.name=="Belgium")
			return "red"; 

		return "lightBlue";
	}
	
	d3.json("data/world_countries.json", function(geo_data) {

		features.selectAll('path')
			 .data(geo_data.features)
			 .enter()
			 .append('path')
			 .attr('d', path)
			 .style('fill', markCountry)
			 .style('stroke', 'black')
			 .style('stroke-width', 0.5);

	});
};

var data;
function data_init(){

	var dsv = d3.dsv(";", "text/plain");

	dsv("data/normalized_with_regions_gdp.csv", function(csv){
		data = d3.nest()
				.key(function(d) { return d.Year; })
				.rollup(function(d) {  
					
					var max = 0, country;
					d.forEach(function(d){
						 if ( d['GDP'] > max){
							max = d['GDP'];
							country = d['Country'];
						 };
					});
					return {"country": country, "GDP": max};
				})
				.entries(csv);
	});

};

function zoomed(){
	features.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

$(document).ready(function(){
	svg_init();
	
	data_init();

});
