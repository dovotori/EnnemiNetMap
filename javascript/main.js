



var width, height;
window.addEventListener("load", setup, false);




function setup()
{
	
	var projection = d3.geo
		.azimuthalEqualArea();
		//.azimuthalEquidistant();
		//.mercator();
		//.conicEquidistant();
		//.orthographic();
	
	var path = d3.geo.path().projection(projection);
	
	var graticule = d3.geo.graticule();
	
	var svg = d3.select("#svg");
	svg.style("display", "none");
	
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
	var langue = "FR";
	var angleMin = 15 * Math.PI / 8;
	var angleMax = 15*Math.PI/16;



	function lireCsv(url, callback) {
		d3.csv(url, function(d){ callback(null, d); });
	}
	function lireJson(url, callback) {
		d3.json(url, function(d){ callback(null, d); });
	}


	queue()
		.defer(lireJson, "data/world-countries.json")
		.defer(lireCsv, "data/data.csv")
		.defer(lireCsv, "data/links.csv")
		.awaitAll(ready);
	



	function ready(error, results) 
	{

		dessinerCarte(results[0]);
		initData(results[1], results[2]);
		resize();
		svg.style("display", "block");
		document.getElementById("imageCarte").style.display = "none";

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




	function initData(collection, links)
	{


		// LISTER INSTITUTIONS
		institutions = [];	// [ nom, [pays concernes, [coorCapitale], nomPays ], id, [exactions], lien ]

		var cpt = 0;

		collection.forEach(function(d){


			var isoPays = d.iso;


			// AFFECTER INSTITUTIONS
			if(langue == "FR")			
				var elem = d.institutionsFR.split(',');
			else 
				var elem = d.institutionsEN.split(',');


			for(var i = 0; i < elem.length; i++)
			{
				elem[i] = elem[i].replace(/"/g, '');

				var found = false;

				// boucle dans les institutions
				for(var j = 0; j < institutions.length; j++)
				{

					// QUAND ON TROUVE UN DOUBLON
					if(elem[i] == institutions[j][0])
					{	
						found = true;
						var nomPays = d.nom;
						if(langue != "FR"){ nomPays = d.name; }
						// AJOUT DES PAYS CONCERNEES PAR L'INSTITUTION
						institutions[j][1].push([isoPays, d.latitudeCapitale, d.longitudeCapitale, nomPays ]);

						// COLORER PAYS
						elem[i] = elem[i].replace(/"/g, '');
						if(elem[i] != "TAC" && elem[i] != "Milipol" && elem[i] != "ISS World")
						{
							d3.select("#land"+isoPays).attr("class", "land focusLand");	
						}

					}
				}


				// NEW INSTITUTION
				if(!found){

					var id = elem[i].replace(/[-éè"() ]/g,'');
					id = id.replace(/\'/g, '');
					id = id.replace(/[\n]/gi, "" );
					elem[i] = elem[i].replace(/"/g, '');
					

					// EXACTIONS
					var exaction = d.exactions.split(',');
					for(var j = 0; j < exaction.length; j++)
					{
						exaction[j] = exaction[j].replace(/"/g, '');
					}


					// LIEN
					var link = "#";
					links.forEach(function(d){

						if(elem[i] != "TAC" && elem[i] != "Milipol" && elem[i] != "ISS World")
						{
							if(d.iso == isoPays)
							{ 
								if(langue == "FR"){
									link = d.lien;
								} else {
									link = d.link;
								}
							}
						} else {
							// SALONS
							if(d.iso == "salon"){
								if(langue == "FR"){
									link = d.lien;
								} else {
									link = d.link;
								}
							}
						}
					});

					// AJOUT DU PREMIER PAYS CONCERNEE
					institutions[cpt] = [ elem[i], [], id, exaction, link ];
					var nomPays = d.nom;
					if(langue != "FR"){ nomPays = d.name; }
					institutions[cpt][1].push([ isoPays, d.latitudeCapitale, d.longitudeCapitale, nomPays ]);

					// COLORER PAYS
					
					if(elem[i] != "TAC" && elem[i] != "Milipol" && elem[i] != "ISS World")
					{
						d3.select("#land"+isoPays).attr("class", "land focusLand");	
					}
					
					cpt++;
				}
			}

			


		});






		// TEXTE
		arc = d3.svg.arc();

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return institutions.length; });

		var elem = cercle.selectAll(".arc")
	      	.data(pie(institutions))
	    	.enter().append("g")
	      	.attr("class", "arc")
	      	.attr("id", function(d){ return d.data[2]; })
	      	.each(function(d){

	      		var angle = d.startAngle + (d.endAngle - d.startAngle);

	      		var elem = d3.select(this);
	      		var nomInstitution = d.data[0].replace(/"/g,'');
		    	var lignes = nomInstitution.split("_");
		    	var nbPictos = d.data[3].length;
		    	
    			var nomPays = d.data[1][0][3];


	      		// FOND
	      		elem.append("rect")
					.attr("class", "fond")
					.attr("x", function(){
						if( angle < angleMax || angle > angleMin )
	      				{
							return 0;
						} else {
							return -200;
						}
					})
					.attr("y", -40)
					.attr("width", 200)
					.attr("height", 80)
					.style("fill", "transparent");
					//.style("fill", "#f00"); 


				
				// LIGNES
				var i = 0;
	      		for(i; i < lignes.length; i++)
	    		{
	    			if (lignes.length == 3 && i == lignes.length-1 && nomInstitution != "ISS World" && nomInstitution != "TAC" && nomInstitution != "Milipol"){
	    				lignes[i] = lignes[i] +" • "+nomPays; 
	    			}

	      			elem.append("text")
						.attr("class", "texte")
						.text(lignes[i])
						.attr("y", i*10)
						.attr("x", function(){ 
							if( angle < angleMax || angle > angleMin )
	      					{
								return 20;
							} else {
								return -20;
							}
						});

					if (lignes.length == (i+1) && lignes.length != 3 && nomInstitution != "ISS World" && nomInstitution != "TAC" && nomInstitution != "Milipol" ){
						elem.append("text")
							.attr("class", "texte")
							.text("• "+nomPays)
							.attr("y", (i+1)*10).attr("x", function(){
								if( angle < angleMax || angle > angleMin )
	      						{
									return 20;
								} else {
									return -20;
								}
							});	
					}

				}

				// PICTOS
		    	for(var i = 0; i < nbPictos; i++)
		    	{
		    		var idPicto = d.data[3][i].replace(/ /g, "");

					elem.append("use")
						.attr("class", "picto")
						.attr("xlink:href","#picto"+idPicto)
						.attr("transform", function(){ 
							if( angle < angleMax || angle > angleMin )
	      					{
								return "translate("+(20+25*(i))+", -25) scale(0.15)";
							} else {
								return "translate("+(-40+25*(-i))+", -25) scale(0.15)";
							}
						});
					
		    	}
				
	      	})
	      	.on("mouseover",function(d){ hoverTexte(d); })
			.on("mouseout", function(d)	{ outTexte(d); })
	      	.on("click", 	function(d){ clicTexte(d); });

	    

		
	      


		for(var i = 0; i < institutions.length; i++)
		{
			for(var j = 0; j < institutions[i][1].length; j++)
			{
						
				ligne.append("path")
					.attr("class", function(d){
						var nomInstitution = institutions[i][0].replace(/"/g,'');
						if(nomInstitution != "TAC" && nomInstitution != "Milipol" && nomInstitution != "ISS World")
						{
							return "ligne ennemi";
						} else {
							return "ligne salon";
						}
					})
					.attr("id", institutions[i][1][j][0])
					.attr("data-institution", institutions[i][2])
					.attr("data-coorCapitaleLat", institutions[i][1][j][1])
					.attr("data-coorCapitaleLong", institutions[i][1][j][2])
					
			}
		}

		

	}




	function redraw()
	{

		var rayonCercle = Math.min(width, height) / 5.5;
	    arc.outerRadius(rayonCercle).innerRadius(rayonCercle);
	    cercle.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


	    // TEXTE
	    d3.selectAll(".texte").style("font-size", +(Math.min(width, height) / 120)+"px");

	    // PICTO
	    // d3.selectAll(".picto").attr("transform", "scale("+(Math.min(width, height) / 120)+")");


		// ARCS
		d3.selectAll(".arc").each(function(d){

			d3.select(this).attr("transform", function(d) { 

				var id = d.data[2];
				var transform = "";
				var centre = arc.centroid(d);
		      	var angle = d.startAngle + (d.endAngle - d.startAngle);

				// coté droit du cercle
		      	if( angle < angleMax || angle > angleMin )
		      	{	
		      		d3.select(this).style("text-anchor", "start");
		      		transform = "translate(" + centre + ")rotate("+ ((angle * 180 / Math.PI)-90) +")"; 
		      	// coté gauche du cercle
		      	} else {
		      		d3.select(this).style("text-anchor", "end");
					transform = "translate(" + centre + ")rotate("+ ((angle * 180 / Math.PI)+90) +")";
		      	}


		      	
		      	
		      	



		      	// LIGNES
		      	d3.selectAll(".ligne").each(function(d){

		      		var ligne = d3.select(this);

		      		if(ligne.attr("data-institution") == id)
		      		{

						// var boxPays = document.getElementById("land"+ligne.attr("id")).getBBox();
						// var posPays = [ boxPays.x + (boxPays.width / 2), boxPays.y + (boxPays.height / 2) ];
						

						var posPays = getGeoCoord(ligne.attr("data-coorCapitaleLat"), ligne.attr("data-coorCapitaleLong"));
						var posTexte = [ centre[0]+width/2, centre[1]+height/2 ];


						// CALCUL TANGENTE DU PAYS
						var longueurTangente = Math.min((distanceEntrePoints(posPays, posTexte) / 4), 200);
						var tangentePaysX = longueurTangente;
						var tangentePaysY = longueurTangente;
						if(posPays[0] > posTexte[0]){ tangentePaysX = -longueurTangente; }
						if(posPays[1] > posTexte[1]){ tangentePaysY = -longueurTangente; }
						tangentePaysX = 0;

						// CALCUL TANGENTE DU TEXTE
		      			var tangenteX = Math.cos(angle-Math.PI/2)*50;
		      			var tangenteY = Math.sin(angle-Math.PI/2)*50;
		      			tangenteX = posTexte[0]-tangenteX;
						tangenteY = posTexte[1]-tangenteY;

						var formeLigne = "M "+(posTexte[0])+" "+(posTexte[1])
							+" C "+(tangenteX)+" "+(tangenteY)+" "
							+(posPays[0]+tangentePaysX)+" "+(posPays[1]+tangentePaysY)+" "+posPays[0]+" "+posPays[1];


// debug line
// svg.append("line")
// 	.attr("x1", posTexte[0])
//     		.attr("y1", posTexte[1])
//     		.attr("x2", tangenteX)
//     		.attr("y2", tangenteY)
//     		.style("stroke", "blue")

				  

						ligne
							.attr("d", formeLigne);
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



	function distanceEntrePoints( point1, point2 )
    {
	    var xs = 0;
	    var ys = 0;
	     
	    xs = point2[0] - point1[0];
	    xs = xs * xs;
	     
	    ys = point2[1] - point1[1];
	    ys = ys * ys;
	     
	    return Math.sqrt( xs + ys );
    }




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INTERACTION


function hoverTexte(d)
{
	var nomInstitution = d.data[2];

	cercle.selectAll(".arc").attr("class", "arc nonhoverTexte");	
	ligne.selectAll(".ligne").style("stroke", "#aaa");
	carte.selectAll(".land").style("fill", "#A2AFAE");

	var target = cercle.select("#"+nomInstitution);
	target.attr("class", "arc hoverTexte");

	ligne.selectAll(".ligne").each(function(d){

		 var ligne = d3.select(this);
		 if(ligne.attr("data-institution") == nomInstitution)
		 {
		 	// CIBLER LE PAYS
		 	var paysCarte = carte.select("#land"+ligne.attr("id"));

		 	if(nomInstitution != "TAC" && nomInstitution != "Milipol" && nomInstitution != "ISSWorld")
			{
		 		ligne.style("stroke", "#580823")
		 			.style("stroke-width", "0.1em");
		 	} else {
		 		ligne.style("stroke", "#398274") 
		 			.style("stroke-width", "0.1em");
		 	}
		 	
		 	paysCarte.style("fill", null);
		 }
	});
}



function outTexte(d)
{
	carte.selectAll(".land").style("fill", null);
	cercle.selectAll(".arc").attr("class", "arc");	
	ligne.selectAll(".ligne").style("stroke", null)
		.style("stroke-width", "0.03em");
}



function clicTexte(d)
{
	location.href = d.data[4];
}





////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RESIZE


	d3.select(window).on('resize', resize);	

	function resize() 
	{
	
	    width = window.innerWidth; 
		height = window.innerHeight*1.5;


	    // update projection
	    projection
	        .translate([width / 2, (height / 2) /*+ (height / 20)*/])
	        //.scale(width / 16);
	        .scale(Math.min(width, height) / 12);
	
		svg
			.attr("width", width)
			.attr("height", height);

	    carte.selectAll("path").attr('d', path);
	    

	    redraw();



	}


}


