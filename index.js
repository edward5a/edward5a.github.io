
/**
 * Calculates and displays a car route from the Brandenburg Gate in the centre of Berlin
 * to Friedrichstraße Railway Station.
 *
 * A full list of available request parameters can be found in the Routing API documentation.
 * see:  http://developer.here.com/rest-apis/documentation/routing/topics/resource-calculate-route.html
 *
 * @param   {H.service.Platform} platform    A stub class to access HERE services
 */
function calculateRouteFromAtoB (platform,avoidArea,destination) {
    var router = platform.getRoutingService();
    console.log(avoidArea==null);
    if(avoidArea != null){
      var routeRequestParams = {
        mode: 'fastest;car',
        representation: 'display',
        routeattributes : 'waypoints,summary,shape,legs',
        maneuverattributes: 'direction,action',
        waypoint0: '22.3712,114.1782', // Brandenburg Gate
        //waypoint1: '22.3062049,114.21309471',  // Friedrichstraße Railway Station
        waypoint1: destination.latitude+','+destination.longitude,
        //avoidareas: '22.3572906,114.181835;22.3461169,114.1729177'
        avoidareas: avoidArea.NorthEastLat+','+avoidArea.NorthEastLng+';'+avoidArea.SouthWestLat+','+avoidArea.SouthWestLng,
      };      

    }
    else{
      var routeRequestParams = {
        mode: 'fastest;car',
        representation: 'display',
        routeattributes : 'waypoints,summary,shape,legs',
        maneuverattributes: 'direction,action',
        waypoint0: '22.3712,114.1782', // Brandenburg Gate
        //waypoint1: '22.3062049,114.21309471',  // Friedrichstraße Railway Station
        waypoint1: destination.latitude+','+destination.longitude,
        //avoidareas: '22.3572906,114.181835;22.3461169,114.1729177'
        //avoidareas: avoidArea.NorthEastLat+','+avoidArea.NorthEastLon+','+avoidArea.SouthWestLat+','+avoidArea.SouthWestLong,
      };
    }

      console.log(routeRequestParams);
  
    router.calculateRoute(
      routeRequestParams,
      onSuccess,
      onError
    );
  }
  /**
   * This function will be called once the Routing REST API provides a response
   * @param  {Object} result          A JSONP object representing the calculated route
   *
   * see: http://developer.here.com/rest-apis/documentation/routing/topics/resource-type-calculate-route.html
   */
  function onSuccess(result) {
    var route = result.response.route[0];
   /*
    * The styling of the route response on the map is entirely under the developer's control.
    * A representitive styling can be found the full JS + HTML code of this example
    * in the functions below:
    */
    clearOldSuggestions();
    addRouteShapeToMap(route);
    addManueversToMap(route);
  
    // ... etc.
  }
  
  /**
   * This function will be called if a communication error occurs during the JSON-P request
   * @param  {Object} error  The error message received.
   */
  function onError(error) {
    alert('Can\'t reach the remote server');
  }
  
  /**
   * Boilerplate map initialization code starts below:
   */
  
  // set up containers for the map  + panel
  var mapContainer = document.getElementById('map'),
    suggestionsContainer = document.getElementById('panel');
  //Step 1: initialize communication with the platform
  // In your own code, replace variable window.apikey with your own apikey
  var platform = new H.service.Platform({
      apikey: '21-Ut8gap-52oQzbj4zRisk3H6G4Xz-FwUIG6dwgd00'
  });
  
  var defaultLayers = platform.createDefaultLayers();
  
  //Step 2: initialize a map - this map is centered over Berlin
  var map = new H.Map(mapContainer,
    defaultLayers.vector.normal.map,{
    center: {lat:22.3712, lng:114.1782},
    zoom: 13,
    pixelRatio: window.devicePixelRatio || 1
  });
  // add a resize listener to make sure that the map occupies the whole container
  window.addEventListener('resize', () => map.getViewPort().resize());
  
  //Step 3: make the map interactive
  // MapEvents enables the event system
  // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
  var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  
  // Create the default UI components
  var ui = H.ui.UI.createDefault(map, defaultLayers);
  
  // Hold a reference to any infobubble opened
  var bubble;
  
  var avoidArea = null;
  var destination = null;

  /**
   * Opens/Closes a infobubble
   * @param  {H.geo.Point} position     The location on the map.
   * @param  {String} text              The contents of the infobubble.
   */
  function openBubble(position, text){
   if(!bubble){
      bubble =  new H.ui.InfoBubble(
        position,
        // The FO property holds the province name.
        {content: text});
      ui.addBubble(bubble);
    } else {
      bubble.setPosition(position);
      bubble.setContent(text);
      bubble.open();
    }
  }
  
  
  /**
   * Creates a H.map.Polyline from the shape of the route and adds it to the map.
   * @param {Object} route A route as received from the H.service.RoutingService
   */
  var polyline;
  function addRouteShapeToMap(route){
    var lineString = new H.geo.LineString(),
      routeShape = route.shape;
      //polyline;
  
    routeShape.forEach(function(point) {
      var parts = point.split(',');
      lineString.pushLatLngAlt(parts[0], parts[1]);
    });
  
    polyline = new H.map.Polyline(lineString, {
      style: {
        lineWidth: 4,
        strokeColor: 'rgba(0, 128, 255, 0.7)'
      }
    });
    // Add the polyline to the map
    map.addObject(polyline);
    // And zoom to its bounding rectangle
    map.getViewModel().setLookAtData({
      bounds: polyline.getBoundingBox()
    });
  }
  
  
  /**
   * Creates a series of H.map.Marker points from the route and adds them to the map.
   * @param {Object} route  A route as received from the H.service.RoutingService
   */
  var group = new H.map.Group();
  function addManueversToMap(route){
    var svgMarkup = '<svg width="18" height="18" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="8" cy="8" r="8" ' +
        'fill="#1b468d" stroke="white" stroke-width="1"  />' +
      '</svg>',
      dotIcon = new H.map.Icon(svgMarkup, {anchor: {x:8, y:8}}),
      //group = new  H.map.Group(),
      i,
      j;
  
    // Add a marker for each maneuver
    for (i = 0;  i < route.leg.length; i += 1) {
      for (j = 0;  j < route.leg[i].maneuver.length; j += 1) {
        // Get the next maneuver.
        maneuver = route.leg[i].maneuver[j];
        // Add a marker to the maneuvers group
        var marker =  new H.map.Marker({
          lat: maneuver.position.latitude,
          lng: maneuver.position.longitude} ,
          {icon: dotIcon});
        marker.instruction = maneuver.instruction;
        group.addObject(marker);
      }
    }
  
    group.addEventListener('tap', function (evt) {
      map.setCenter(evt.target.getGeometry());
      openBubble(
         evt.target.getGeometry(), evt.target.instruction);
    }, false);
  
    // Add the maneuvers group to the map
    map.addObject(group);
  }
  
  var GETBOUNTARY_URL = 'https://maps.googleapis.com/maps/api/geocode/json',
    ajaxRequest = new XMLHttpRequest(),
    address = '';


  function clearOldSuggestions(){
      group.removeAll ();
      if(bubble){
          bubble.close();
      }
      if(map&&polyline){
        map.removeObject(polyline);
      }
  }

  function getGeometryLocation(textBox, event){
    if (address != textBox.value){
      if (textBox.value.length >= 1){

          /**
           * A full list of available request parameters can be found in the Geocoder Autocompletion
           * API documentation.
           *
           */
          var params = '?' +
              'address=' +  encodeURIComponent(textBox.value) +   // The search text which is the basis of the query
              '&key=AIzaSyBGmGio79beBlUU1HMqPn36yuunILthoAQ';
          ajaxRequest.open('GET', GETBOUNTARY_URL + params );
          ajaxRequest.send();
      }
  }
  address = textBox.value;
  }
  
  function onAutoCompleteSuccess() {
    /*
     * The styling of the suggestions response on the map is entirely under the developer's control.
     * A representitive styling can be found the full JS + HTML code of this example
     * in the functions below:
     */
    //addSuggestionsToPanel(this.response);  // In this context, 'this' means the XMLHttpRequest itself.
    addBoundaryToPanel(this.response);
    //console.dir(this.response);
}

function onAutoCompleteFailed() {
  alert('Ooops!');
}

function addSuggestionsToPanel(response){
  var suggestions = document.getElementById('suggestions');
  suggestions.innerHTML = JSON.stringify(response, null, ' ');
}


function addBoundaryToPanel(response){  
  if(isAvoidArea){
    avoidArea  = 
    {NorthEastLat: response.results[0].geometry.viewport.northeast.lat,
    NorthEastLng: response.results[0].geometry.viewport.northeast.lng,
    SouthWestLat: response.results[0].geometry.viewport.southwest.lat,
    SouthWestLng: response.results[0].geometry.viewport.southwest.lng,
    };
    console.log(avoidArea);
  }
  if(isDestination){
    destination =
    {
      latitude: response.results[0].geometry.location.lat,
      longitude: response.results[0].geometry.location.lng,
    }
  }
}
/**
 * This function will be called if a communication error occurs during the XMLHttpRequest
 */

// Attach the event listeners to the XMLHttpRequest object
ajaxRequest.addEventListener("load", onAutoCompleteSuccess);
ajaxRequest.addEventListener("error", onAutoCompleteFailed);
ajaxRequest.responseType = "json";


  Number.prototype.toMMSS = function () {
    return  Math.floor(this / 60)  +' minutes '+ (this % 60)  + ' seconds.';
  }
  
  var content =  '<strong style="font-size: large;">' + 'The Location You Want to Avoid'  +'</strong></br>';
  content  += '<br/><input type="text" id="avoidArea" style="margin-left:5%; margin-right:5%; min-width:90%"  onkeyup="return getGeometryLocation(this, event);"><br/>';
  content  +=  '<strong style="font-size: large;">' + 'Destination'  +'</strong></br>';
  content  += '<br/><input type="text" id="destination" style="margin-left:5%; margin-right:5%; min-width:90%"  onkeyup="return getGeometryLocation(this, event);"><br/>';
  //content  += '<br/><strong>Response:</strong><br/>';
  //content  += '<div style="margin-left:5%; margin-right:5%;"><pre ><code  id="suggestions" style="font-size: small;">' +'{}' + '</code></pre></div>';
  suggestionsContainer.innerHTML = content;

 var isAvoidArea = new Boolean(false);
 var isDestination = new Boolean(false);

 $("#avoidArea").on("input", function() {

  if ($(this).val() == "") {
    isAvoidArea = false;
  }
  else {
    isAvoidArea = true;
  }
});

$("#destination").on("input", function() {

  if ($(this).val() == "") {
    isDestination = false;
  }
  else {
    isDestination = true;
  }
});

  // Now use the map as required...
  //calculateRouteFromAtoB (platform,avoidArea)
  
//document.getElementById("plot").onclick = calculateRouteFromAtoB (platform,avoidArea);


