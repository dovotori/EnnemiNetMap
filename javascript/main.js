

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
	var cercle = svg.append("svg:g").attr("id", "cercle");
	var ligne = svg.append("svg:g").attr("id", "ligne");
	
	var arc;
	var institutions;



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
			.attr("id", function(d){ return "land"+d.id; });
		
	}




	function initData(collection)
	{
		infosPictos = collection;


		// LISTER INSTITUTIONS
		institutions = [];	// [ nom, [pays concernes], id ]

		var cpt = 0;

		collection.forEach(function(d){

			var isoPays = d.iso;

			// AFFECTER INSTITUTIONS			
			var elem = d.institutionsFR.split(',');

			for(var i = 0; i < elem.length; i++)
			{

				var found = false;

				// boucle dans les institutions
				for(var j = 0; j < institutions.length; j++)
				{

					// QUAND ON TROUVE UN DOUBLON
					if(elem[i] == institutions[j][0])
					{	
						found = true;
						// AJOUT DES PAYS CONCERNEES PAR L'INSTITUTION
						institutions[j][1].push(isoPays);
					}
				}


				// NEW INSTITUTION
				if(!found){
					var id = elem[i].replace(/[-éè"() ]/g,'');
					id = id.replace(/\'/g, '');
					
					institutions[cpt] = [ elem[i], [], id ];
					institutions[cpt][1].push(isoPays);
					cpt++;
				}
			}


		});

//console.log(institutions);



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
			.text(function(d) { return d.data[0].replace(/"/g,''); })
			.attr("id", function(d){ return d.data[2]; });
	      


		for(var i = 0; i < institutions.length; i++)
		{
			for(var j = 0; j < institutions[i][1].length; j++)
			{
				ligne.append("line")
					.attr("class", "ligne")
					.attr("id", institutions[i][1][j])
					.attr("data-institution", institutions[i][2]);
			}
		}



	}




	function redraw()
	{


		// TEXTES
		d3.selectAll(".texte").each(function(d){

			d3.select(this).attr("transform", function(d) { 

				var id = d.data[2];
				var transform = "";
				var centre = arc.centroid(d);
		      	var angle = d.startAngle + (d.endAngle - d.startAngle);

		      	if(angle < Math.PI)
		      	{
		      		d3.select(this).style("text-anchor", "start");
		      		transform = "translate(" + centre + ")rotate("+map(angle, 0, Math.PI, -90, 90)+")"; 
		      	} else {
		      		d3.select(this).style("text-anchor", "end");
		      		transform = "translate(" + centre + ")rotate("+map(angle, Math.PI, Math.PI*2, -90, 90)+")"; 
		      	}

		      	// LIGNES
		      	d3.selectAll(".ligne").each(function(d){

		      		var ligne = d3.select(this);

		      		if(ligne.attr("data-institution") == id)
		      		{

						var boxPays = document.getElementById("land"+ligne.attr("id")).getBBox();
						var posPays = [ boxPays.x + (boxPays.width / 2), boxPays.y + (boxPays.height / 2) ];

						var posTexte = [ centre[0]+(width/2), centre[1]+(height/2) ];

						ligne
							.attr("x1", posTexte[0])
							.attr("y1", posTexte[1])
							.attr("x2", posPays[0])
							.attr("y2", posPays[1]);
					}
				});


		      	return transform;
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
	        .translate([width / 2, (height / 2) + (height / 20)])
	        .scale(width / 20);
	
		svg
			.attr("width", width)
			.attr("height", height);

	    carte.selectAll("path").attr('d', path);

	    var rayonCercle = Math.min(width, height) / 3;

	    arc.outerRadius(rayonCercle - 10).innerRadius(rayonCercle - 70);
	    cercle.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	    

	    redraw();



	}


}


