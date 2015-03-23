
var scope;
var svg, features;
var data_byregion, data_allregion;
var raw_data;
var data_initialized = false;
var colors = "#51574a #447c69 #74c493 #8e8c6d #e4bf80 #e9d78e #e2975d #f19670 #e16552 #c94a53 #be5168 #a34974 #993767 #65387d #4e2472 #9163b6 #e279a3 #e0598b #7c9fb0 #5698c4 #9abf88".split(" ");

var app = angular.module('gdpvisualisation', ['ngMaterial']);

app.controller('mainCtrl', function($scope,$http){
	$scope.currentyear = 1960;
	$scope.currentregion = "All";

	$scope.regions = ["All", "North America","South Asia","Sub-Saharan Africa","Europe & Central Asia","Middle East & North Africa","Latin America & Caribbean","East Asia & Pacific"];
	
	$scope.playpause = "Play";

	$scope.play = function() {
		
		if ($scope.playpause == "Play"){
			$scope.playpause = "Pause"
			start_animation();
		}
		else if ($scope.playpause == "Pause"){
			$scope.playpause = "Play"
			stop_animation();
		}

	};

	$scope.$watch("currentyear", function(nv, ov){
		if (!data_initialized)
			return;
		country_highest_gdp(nv);
	});

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
		countries.push(d.properties.name);
		if(d.properties.name=="Belgium")
			return "red"; 

		return "lightBlue";
	}

	palette_selection =	d3
		.select("#palette-list")
		.selectAll("li")
		.data(colors)
	
	palette_selection.enter()
		.append("li")
		.attr("class", "palette")
		.attr("style", function(d) { return "background-color: " + d ;  })
		.text(function(d) { return colors.indexOf(d); });
	
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
var countries = [];
function data_init(){

	var dsv = d3.dsv(";", "text/plain");

	dsv("data/gdp_data.csv", function(csv){
		raw_data = csv;

		data_groupby("year");	

		data_initialized = true;

	});

};

function data_groupby(attr){
		data_byregion = d3.nest()
				.key(function(d) { return d[attr]; })
				.key(function(d) { return d['region']; })
				.sortValues(function(a,b){ return Number.parseFloat(b.gdp) - Number.parseFloat(a.gdp); })
				.entries(raw_data);
		data_allregion = d3.nest()
				.key(function(d) { return d[attr]; })
				.sortValues(function(a,b){ return Number.parseFloat(b.gdp) - Number.parseFloat(a.gdp); })
				.entries(raw_data);
}

var play_interval;
function start_animation(){

	year = scope.currentyear;
	play_interval = setInterval(function() {
		if (year >= 2013)
			stop_animation();
		country_highest_gdp(year++);
		scope.$apply()
	}, 1000);
};

function stop_animation(){
	clearInterval(play_interval);
	scope.playpause = "Play";
}

function country_highest_gdp(year){

	var countriesTop20 = [],
		countriesTop1020 = [], 
		countriesTop2030 = [];

	currentregion = scope.currentregion;

//	console.log("current region : " + currentregion);

	if (currentregion == "All") {
		for (i in data_allregion){
			if (data_allregion[i]['key'] == year.toString()) {
				
				if (data_allregion[i]['values'].length > 20)
					countriesTop20 = data_allregion[i]['values'].slice(0,20);
				else
					countriesTop20 = data_allregion[i]['values'];

			}
		}	
	}
	else {
		for (i in data_byregion){
			if (data_byregion[i]['key'] == year.toString()) {
				
				regions = data_byregion[i]['values'];

				for (r in regions){
					if (regions[r]['key'] == currentregion){
						console.log(regions[r]); 
						
						if (regions[r]['key'].length > 20) 
							countriesTop20 = regions[r]['values'].slice(0,20);
						else
							countriesTop20 = regions[r]['values'];
					}
				}
			}
		}	

	}


	//console.log("Country : " + countriesTop10)

	features.selectAll('path').style("fill", function(d) {

		for (country in countriesTop20){
			if (countriesTop20[country].country == d.properties.name){
				return colors[country];
			}
		}
		/*
		for (country in countriesTop1020){
			if (countriesTop1020[country].country == d.properties.name)
				return "blue";
		}
		for (country in countriesTop2030){
			if (countriesTop2030[country].country == d.properties.name)
				return "green";
		}
		*/

		return "white";
		});
	d3.select("#year").text(year);

	scope.currentyear = year;
}

function zoomed(){
	features.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

$(document).ready(function(){

	scope = angular.element('[ng-controller=mainCtrl]').scope();

	svg_init();
	
	data_init();

});
