/*
I'll Find It!

Insert a search term and an address, and it will return a list of search items
puts them on the map and on the side menu.

This uses Bower, Knockout.js, jquery, bootstrap, Google Maps API and Yelp API.

*/

//set whole script to be strict
'use strict';

//sets cache for true so Timestamp parameter isn't added to ajax query.

$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
    if ( options.dataType == 'jsonp' || originalOptions.dataType == 'jsonp' ) {
        options.cache = true;
    }
});

//init globals
var map;
var markers = [];

//make Markers functions - clear, show, add, make

var clearMarkers = function() {
    setAllMap( null );
    markers = [];
};
var showMarkers = function() {
    setAllMap( map );
};
var setAllMap = function( map ) {
    var len = markers.length;
    for (var i = 0; i < len; i++){
        markers[i].setMap( map );
    }
};
var addMarker = function( marker ) {
    markers.push( marker );
};
var makeMarker = function( coords, info ) {
    var myLatLng = new google.maps.LatLng( coords.latitude, coords.longitude );
    var infowindow = new google.maps.InfoWindow({
        content: info
    });
    var marker = new google.maps.Marker({
        position: myLatLng,
        animation: google.maps.Animation.DROP,
    });
    google.maps.event.addListener(marker, 'mouseover', function() {
        infowindow.open(map, marker);
    });
    google.maps.event.addListener(marker, 'mouseout', function() {
        infowindow.close(map, marker);
    });
    return marker;
};
var bounce = function( marker ) {
    marker.setAnimation( google.maps.Animation.BOUNCE );
};
var stopBounce = function( marker ) {
    marker.setAnimation( null );
};


//Listing model
var Listing = function( data ) {
    this.display_phone = ko.observable( data.display_phone );
    this.image_url = ko.observable( data.image_url );
    this.location = ko.observable( data.location.address[0] );
    this.name = ko.observable( data.name );
    this.rating = ko.observable( data.rating );
    this.rating_url = ko.observable( data.rating_img_url );
    this.url = ko.observable( data.url );
    this.snippet_text = ko.observable( data.snippet_text );
    this.review_count = ko.observable( data.review_count );
    this.marker = makeMarker( data.location.coordinate, data.name + "<br>" + data.location.address[0] );
    addMarker( this.marker );
    //animates marker when mouseover Div
    this.show = function() {
        bounce(this.marker);
    };
    this.hide = function() {
        stopBounce(this.marker);
    };
};

var ViewModel = function() {
    var self = this;
    this.listings = ko.observableArray([]);
    var geocoder;
    var latlng;

    //loads map
    var initialize = function() {
        var lat = 37.779277;
        var lng = -122.41927;
        //if geolocation is avail, set map to current position
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(function(position){
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            }, function(error){
                console.log("Error: " + error.message);
            });
        }
        latlng = new google.maps.LatLng( lat, lng );//sets to San Francisco by default
        var mapOptions = {
          zoom: 12,
          center: latlng
        }
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    };
    google.maps.event.addDomListener(window, 'load', initialize);

    //search handler function
    this.search = function() {
        var address = $("#address").val();
        var terms = $("#what").val();
        moveMap(address);
        yelp(terms, address);
    };

    //moves map to location
    var moveMap = function(address) {
        geocoder = new google.maps.Geocoder();
        geocoder.geocode( { 'address': address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
          } else {
              console.log('Geocode was not successful for the following reason: ' + status);
          }
        });
    };

    //queries yelp api with term and location, returns jsonp with results
    var yelp = function(terms, location){
        var auth = {
            consumerKey : "iFcM-pODjEouTU9VWRcyhw",
            consumerSecret : "hHpPYDdXwNFdz8aKetahkx43SqA",
            accessToken : "RgQ_F1rFWl7YejBn_aaVWtZCWr7NpZKx",
            accessTokenSecret : "-yEf9Vy6WRvVP8o-fnSYblX7VbI",
            serviceProvider : {
                signatureMethod : "HMAC-SHA1"
            }
        };
        var accessor = {
            consumerSecret : auth.consumerSecret,
            tokenSecret : auth.accessTokenSecret
        };
        var parameters = [];
        parameters.push(['term', terms]);
        parameters.push(['location', location]);
        parameters.push(['callback', 'cb']);
        parameters.push(['oauth_consumer_key', auth.consumerKey]);
        parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
        parameters.push(['oauth_token', auth.accessToken]);
        parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
        var message = {
            'action' : 'https://api.yelp.com/v2/search',
            'method' : 'GET',
            'parameters' : parameters
        };
        console.log(parameters);
        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);
        var parameterMap = OAuth.getParameterMap(message.parameters);
        console.log(parameterMap);
        $.ajax({
            'url' : message.action,
            'data' : parameterMap,
            'dataType' : 'jsonp',
            'cached' : true,
            'jsonpCallback' : 'cb',
            //empties listings array, then pushes in new results
            'success' : function(data, textStats, XMLHttpRequest) {
                clearMarkers();
                self.listings.removeAll();
                console.log(data);
                var len = data.businesses.length;
                for (var i = 0; i < len; i++){
                    self.listings.push(new Listing(data.businesses[i]));
                }
                console.log(self.listings());
                showMarkers();
            }
        }).fail(function(e) {
            console.log('something went wrong: ');
            console.log(e.error());
        });
    };
};

ko.applyBindings(new ViewModel());






