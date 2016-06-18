var width = 900,
    height = 825;

var projection = d3.geo.conicConformal()
    .center([0, 40.5])
    .rotate([110.5, 0, -3])
    .scale(2700)
    .translate([width / 2, height / 2]);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

var geoPath = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g');

var g = svg.append('g');

svg.append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height);

var ordinal = d3.scale.ordinal()
    .domain(["State/Private Owned Lands", "BLM", "DOD", "DOE", "FS", "FWS", "NPS", "Other"])
    .range(["#d9d9d9", "#428DBD", "#0B3660", "#C6A6E8", "#00502F", "#F69E23", "#C56C39", "#FC4D38"]);

var center = projection([112.5, 40.5]);

var formatAcre = d3.format(",");

svg
    .call(zoom)
    .call(zoom.event);

queue()
    .defer(d3.json, 'data/fedlands-topo.json')
    .defer(d3.json, 'data/eleven_states.json')
    .defer(d3.json, 'data/countries.json')
    .defer(d3.json, 'data/borders.json')
    .defer(d3.json, 'data/usa.json')
    .defer(d3.csv, 'data/elevenwest.csv')
    .await(makeMap);

function makeMap(error, lands, states, countries, borders, usa, centers) {

    var data = [];

    centers.forEach(function(place) {
        data.push(Number(place.percent));
    });

    var min = Math.min.apply(Math, data),
        max = Math.max.apply(Math, data);

    var radius = d3.scale.sqrt()
        .domain([min, max])
        .range([29, 84.9]);

    g.append("g")
        .selectAll("path")
        .data(usa.features)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .attr("class", "usa");
    
    g.append("g")
        .selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .attr("class", "countries");
    
    g.append("g")
        .selectAll("path")
        .data(borders.features)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .attr("class", "usa");
    
    g.append("g")
        .selectAll("path")
        .data(states.features)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .attr("class", "state2");

    g.append('g')
        .selectAll('path')
        .data(topojson.feature(lands, lands.objects.fedlands).features)
        .enter()
        .append('path')
        .attr("d", geoPath)
        .attr("fill", function(d) {
            return ordinal(d.properties.ADMIN1)
        })
        .on("mousemove", function(d) {
            var html = "";
            html +=
                "<ul><ui><strong>Agency: </strong> <span style='color: #8B4513'>" + d.properties.ADMIN1 + "</span> </br> <strong>Tract: </strong> <span style='color: #8B4513'>" + d.properties.GNIS_Name1 + "</span> </br> <strong>Type: </strong> <span style='color: #8B4513'>" + d.properties.FEATURE1 + "</li> </span> </ul>";

            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "0.7");
            $("#tooltip-container").show();

            var coordinates = d3.mouse(this);

            var map_width = $('g')[0].getBoundingClientRect().width;

            if (d3.event.layerX < map_width / 100) {
                d3.select("#tooltip-container")
                    .style("top", (d3.event.pageY + 15) + "px")
                    .style("left", (d3.event.pageX + 15) + "px");
            } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                    .style("top", (d3.event.pageY + 15) + "px")
                    .style("left", (d3.event.pageX - tooltip_width - 1) + "px");
            }
        })
        .on("mouseout", function() {
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").hide();
        });

    g.append("g")
        .selectAll("path")
        .data(states.features)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .attr("class", "state");

    var propCircles = g.append("g")
        .selectAll("circle")
        .data(centers)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            d.position = projection([d.lon, d.lat])
            return d.position[0];
        })
        .attr("cy", function(d) {
            return d.position[1];
        })
        .attr("r", function(d) {
            return radius(d.percent)
        })
        .attr('class', 'centroid')
        .on("mousemove", function(d, i) {
            var html = "";
            html +=
                "<strong>State: </strong> <span style='color: #8B4513'>" + d.long + "</span></br><strong>Federally Owned: </strong><span style='color: #8B4513'>" + d.percent + "%</span> </br><strong>Total Acres: </strong><span style='color: #8B4513'>" + formatAcre(d.totalacre) + "</span></br> <p> </p> <strong>Acres by Agency:</br> BLM: </strong> <span style='color: #8B4513'>" + formatAcre(d.blm) +
                "</span> </br> <strong> DOD: </strong> <span style='color: #8B4513'>" + formatAcre(d.dod) + "</span> </br> <strong> FS: </strong> <span style='color: #8B4513'>" + formatAcre(d.fs) + " </span> </br> <strong> FWS: </strong> <span style='color: #8B4513'>" + formatAcre(d.fws) + " </span> </br><strong> NPS: </strong> <span style='color: #8B4513'>" + formatAcre(d.nps) + " </span>";

            $("#info-container").html(html);
            $(this).attr('class', 'centroidOff');
            $("#info-container").show();

            var coordinates = d3.mouse(this);

            var map_width = $('g')[0].getBoundingClientRect().width;

            if (d3.event.layerX < map_width / 1000) {
                d3.select("#info-container")
                    .style("top", (d3.event.layerY + 15) + "px")
                    .style("left", (d3.event.layerX + 15) + "px");
            } else {
                var info_width = $("#info-container").width();
                d3.select("#info-container")
                    .style("top", (d3.event.layerY + 5) + "px")
                    .style("left", (d3.event.layerX + info_width - 1) + "px");
            }
        })
        .on("mouseout", function() {
            $(this).attr('class', 'centroid');
            $("#info-container").hide();
        })

    d3.select('#toggle-circles')
        .on('click', function() {

        if (propCircles.style('visibility') === 'visible') {
            propCircles.style('visibility', 'hidden')
        } else {
            propCircles.style('visibility', 'visible')
        }
    })
}

function zoomed() {
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
}

d3.select(self.frameElement).style("height", height + "px");