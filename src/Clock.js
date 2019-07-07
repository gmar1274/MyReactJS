import React from 'react';
import logo from './assets/acba.png';
import './App.css';


class Clock extends React.Component {
    constructor(props) {
      super(props);
      this.state = {date: new Date()};
    }
   
    componentDidMount() {
      this.timerID = setInterval(
        () => this.tick(),
        1000
      );
      this.isLoggedIn();//check to see if user is logged in
      this.getUserLocation();//async get user location to display map
    }
  
    componentWillUnmount() {
      clearInterval(this.timerID);
      this.state.map.remove();
    }
    async isLoggedIn(){
      let user = {user:{name:"Gabe"}};
      this.setState(user);
    }
    async getUserLocation(){
      const status = document.querySelector('#alert');
      let obj = this;
      function success(position) {
        status.remove();
        const latitude  = position.coords.latitude;
        const longitude = position.coords.longitude;
        let loc = [longitude,latitude];

        obj.setState({userLoc: loc});
        obj.initMap();
        obj.fetchShops();
      }
      function error() {
        status.textContent = 'Unable to retrieve your location';
      }
      if (!navigator.geolocation) {
        status.textContent = 'Geolocation is not supported by your browser';
      } else {
        status.textContent = 'Locating…';
        navigator.geolocation.getCurrentPosition(success,error);
      }
    }
   
    tick() {
      this.setState({
        date: new Date()
      });
    }
    initMap(){
      const spinner = document.querySelector("#spinner_map");
      spinner.remove();
      let obj = this;
      var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
      mapboxgl.accessToken = 'pk.eyJ1IjoiZ21hcjEyNzQiLCJhIjoiY2p4czE4NjBmMGV6cjNocW9taWZiMmRtMCJ9.07lhwOhzB_nSEQg2sC11-A';
      let map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: this.state.userLoc, // starting position [lng, lat]
        zoom: 15 // starting zoom
      });
      /*
       * Add animated marker
       */
      var size = 200;
      var pulsingDot = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),
        
        onAdd: function() {
        var canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
        },
        
        render: function() {
          var duration = 1000;
          var t = (performance.now() % duration) / duration;
          
          var radius = size / 2 * 0.3;
          var outerRadius = size / 2 * 0.7 * t + radius;
          var context = this.context;
          
          // draw outer circle
          context.clearRect(0, 0, this.width, this.height);
          context.beginPath();
          context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
          context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
          context.fill();
          
          // draw inner circle
          context.beginPath();
          context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
          context.fillStyle = 'rgba(255, 100, 100, 1)';
          context.strokeStyle = 'white';
          context.lineWidth = 2 + 4 * (1 - t);
          context.fill();
          context.stroke();
          
          // update this image's data with data from the canvas
          this.data = context.getImageData(0, 0, this.width, this.height).data;
          
          // keep the map repainting
          map.triggerRepaint();
          
          // return `true` to let the map know that the image was updated
          return true;
          }
      };
      map.on('load', function () {
        map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });       
        map.addLayer({
          "id": "points",
          "type": "symbol",
          "source": {
            "type": "geojson",
            "data": {
              "type": "FeatureCollection",
              "features": [{
                "type": "Feature",
                "geometry": {
                  "type": "Point",
                  "coordinates": obj.state.userLoc
                },
                "properties":{
                  "description": !obj.state.user.name ? "Me":obj.state.user.name
                }
              }]
            }
          },
          "layout": {
          "icon-image": "pulsing-dot"
          }
        });
        ///////////////on load
        // When a click event occurs on a feature in the places layer, open a popup at the
        // location of the feature, with description HTML from its properties.
        map.on('click', 'points', function (e) {
          var coordinates = e.features[0].geometry.coordinates.slice();
          var description = e.features[0].properties.description;
          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          
          new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map);
          map.flyTo({center: e.features[0].geometry.coordinates});
        });
          
          // Change the cursor to a pointer when the mouse is over the places layer.
          map.on('mouseenter', 'points', function () {
          map.getCanvas().style.cursor = 'pointer';
          });
          
          // Change it back to a pointer when it leaves.
          map.on('mouseleave', 'points', function () {
          map.getCanvas().style.cursor = '';
          });
      });
      
      this.setState({map:map});
    }
    /**
     * This method will fetch shop locations from db and plot them on the map.
     */
    async fetchShops(){
      return(<div id="shops"></div>);
    }
    render() {
      return (
        
        <div className="container-fluid" >
          <nav className="navbar navbar-expand-lg navbar-dark">
          <a className="navbar-brand" href="" alt="link to brand">
          <img src={logo} width="30" height="30" className="d-inline-block align-top App-logo " alt=""/>
          </a>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
          <li className="nav-item active">
          <a className="nav-link" href="#">Home <span className="sr-only">(current)</span></a>
          </li>
          </ul>
          </div>
          </nav>
          <div className="row" >
              <div id="alert" className="alert alert-danger" role="alert"></div>
          </div>
            
          <h1>Hello, world!</h1>
          <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
          <div id="spinner_map" className="d-flex justify-content-center">
            <div className="spinner-border text-danger" role="status">
             <span className="sr-only">Loading...</span>
            </div>
          </div>
          <div id="map" className="map"></div>
        </div>
      );
    }
  }
  export default Clock;