

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
	
	var svg = d3.select("#svg");
	
	// svg.append("defs").append("path")
	// 	.datum({type: "Sphere"})
	// 	.attr("id", "sphere")
	// 	.attr("d", path);
	
	// var dessinGraticule = svg.append("path")
	// 	.datum(graticule)
	// 	.attr("class", "graticule")
	// 	.attr("d", path);
	
	var carte = svg.append("svg:g").attr("id", "carte");
	var cercle = svg.append("svg:g").attr("id", "cercle");;
	var arc;



	function lireCsv(url, callback) {
		d3.csv(url, function(d){ callback(null, d); });
	}
	function lireJson(url, callback) {
		d3.json(url, function(d){ callback(null, d); });
	}


	queue()
		.defer(lireJson, "data/world-countries.json")
		.defer(lireCsv, "data/data.csv")
		.awaitAll(ready);
	



	function ready(error, results) 
	{

		dessinerCarte(results[0]);
		initData(results[1]);
		resize();

	}


	

	function dessinerCarte(collection)
	{

		// CARTE
		carte.selectAll("path")
			.data(collection.features)
			.enter().append("svg:path")
			.attr("d", path)
			.attr("class", "land")
			.attr("id", function(d){ return d.id; });
		
	}




	function initData(collection)
	{
		infosPictos = collection;


		// LISTER INSTITUTIONS
		var institutions = [];  // [ nomInstitutions, [isoPays] ] 
		var cpt = 0;

		collection.forEach(function(d){
			
			var elem = d.institutionsFR.split(',');
			for(var i = 0; i < elem.length; i++)
			{
				var found = false;
				for(var j = 0; j < institutions.length; j++)
				{
					if(elem[i] == institutions[j][0])
					{
						found = true;
					}
				}
				if(!found){
					institutions[cpt] = [ elem[i], "test" ];
					cpt++;
				}
			}

		});






		arc = d3.svg.arc();

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return institutions.length; });

		var elem = cercle.selectAll(".arc")
	      	.data(pie(institutions))
	    	.enter().append("g")
	      	.attr("class", "arc");

		elem.append("text")
			.attr("class", "texte")
			.text(function(d) { return d.data[0].replace(/"/g,''); });
	      

	}




	function redrawTextes()
	{

		d3.selectAll(".texte").each(function(d){

			d3.select(this).attr("transform", function(d) { 
		      	var angle = d.startAngle + (d.endAngle - d.startAngle);
		      	//console.log(d.data.institutionsFR+" "+angle);
		      	if(angle < Math.PI)
		      	{
		      		d3.select(this).style("text-anchor", "start");
		      		return "translate(" + arc.centroid(d) + ")rotate("+map(angle, 0, Math.PI, -90, 90)+")"; 
		      	} else {
		      		d3.select(this).style("text-anchor", "end");
		      		return "translate(" + arc.centroid(d) + ")rotate("+map(angle, Math.PI, Math.PI*2, -90, 90)+")"; 
		      	}
	    	});
		});
	}

	
	







////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UTILES

	function getGeoCoord(latitude, longitude)
	{

	    var traductionCoor = [ 0, 0 ];

	    if(latitude != "#N/A" && longitude != "#N/A")
	    {

	        var lat = parseFloat(latitude.substring(0, latitude.length-1));
	        var sens = latitude.substring(latitude.length-1, latitude.length);
	        if(sens == "S"){ lat *= -1; }

	        var long = parseFloat(longitude.substring(0, longitude.length-1));
	        sens = longitude.substring(longitude.length-1, longitude.length);
	        if(sens == "W"){ long *= -1; }

	        coordonneesCapitale = [ long, lat ];
	        var traductionCoor = projection(coordonneesCapitale);        

	    }

	    return traductionCoor;

	}









////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RESIZE


	d3.select(window).on('resize', resize);	

	function resize() 
	{
	
	    width = window.innerWidth; 
		height = window.innerHeight;

	    // update projection
	    projection
	        .translate([width / 2, height / 2])
	        .scale(width / 20);
	
		svg
			.attr("width", width)
			.attr("height", height);

	    carte.selectAll("path").attr('d', path);

	    var rayonCercle = Math.min(width, height) / 2;
	    arc.outerRadius(rayonCercle - 10).innerRadius(rayonCercle - 70);
	    cercle.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	    redrawTextes();



	}






}


