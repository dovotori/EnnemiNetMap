

var width, height;
window.addEventListener("load", setup, false);




function setup()
{
	
	var projection = d3.geo
		//.azimuthalEqualArea();
		.mercator();
		//.conicEquidistant();
		//.orthographic();
	
	var path = d3.geo.path().projection(projection);
	
	var graticule = d3.geo.graticule();
	
	var svg = d3.select("#svgCarte");
	
	svg.append("defs").append("path")
		.datum({type: "Sphere"})
		.attr("id", "sphere")
		.attr("d", path);
	
	
	var dessinGraticule = svg.append("path")
		.datum(graticule)
		.attr("class", "graticule")
		.attr("d", path);
	
	var carte = svg.append("svg:g").attr("id", "carte");

	var infosPictos;

	var pictos = [];
	var nbPictos = 22;
	for(var i = 0; i < nbPictos; i++)
	{
		pictos[i] = svg.append("svg:g");
	}
	var focusArticle;



	function lireCsv(url, callback) {
		d3.csv(url, function(d){ callback(null, d); });
	}
	function lireJson(url, callback) {
		d3.json(url, function(d){ callback(null, d); });
	}


	queue()
		.defer(lireJson, "data/world-countries.json")
		.defer(lireCsv, "data/liste.csv")
		.awaitAll(ready);
	



	function ready(error, results) 
	{

		dessinerCarte(results[0]);
		initPictos(results[1]);
		resize();

	}


	

	function dessinerCarte(collection)
	{

		// CARTE
		carte.selectAll("path")
			.data(collection.features)
			.enter().append("svg:path")
			.attr("d", path)
			.attr("id", function(d){ return d.id; });
		
	}




	function initPictos(collection)
	{
		infosPictos = collection;

		var forme = "M24.869 -17.798 L17.798 -24.869 L0 -7.071 L-17.797 -24.869 L-24.869 -17.798 L-7.071 0 L-24.869 17.798 L-17.798 24.869 L0 7.071 L17.798 24.869 L24.869 17.798 L7.071 0Z";

		for(var i = 0; i < nbPictos; i++)
		{
			pictos[i].append("svg:path")
				.attr("d", forme)
				.attr("id", infosPictos[i].name)
				.attr("class", "picto")
				.style("stroke", "#000000")
				.style("stroke-width", "2")
				.style("fill", "#ffffff");

			

		}


	}




	
	
	function clicPicto(event)
	{ 	

		var target = event.target.id;
		//console.log(target);
		d3.selectAll(".picto").style("fill", "#fff");
		d3.select("#"+event.target.id).style("fill", "red");


		focusArticle = "art"+target;
		
		$("#art"+target).fadeTo( "slow", 1, function(){ $(this).css("display", "block"); } );

	}	
	


	
	d3.select(window).on('resize', resize);	




	function resize() 
	{
	
	    width = window.innerWidth; 
		height = window.innerHeight;

	    // update projection
	    projection
	        .translate([width / 2, height / 2])
	        .scale(width / 7);
	
		svg
			.attr("width", width)
			.attr("height", height);
		
	    carte
	        .style('width', width)
	        .style('height', height);
	        	
	    carte.selectAll("path").attr('d', path);

	    afficherPictos();

	}



	function afficherPictos()
	{
		
		for(var i = 0; i < nbPictos; i++)
		{

			//var position = projection([ Math.round(getRandom(0, 20)), Math.round(getRandom(0, 20)) ]);
			var position = projection([ infosPictos[i].long , infosPictos[i].lat ]);
			pictos[i]
				.attr("transform", "translate("+position[0]+", "+position[1]+") scale(0.4)");
		
		}

	}



	document.body.addEventListener("click", function(event){ onClick(event); }, false);



	function onClick(event)
	{
		if(event.target.className.baseVal == "picto")
		{
			clicPicto(event);
		} else {
			reset();
		}
	}



	function reset()
	{

		d3.selectAll(".picto").style("fill", "#fff");
		$("#"+focusArticle).fadeTo( "slow", 0, function(){ $(this).css("display", "none"); } );

	}




}


