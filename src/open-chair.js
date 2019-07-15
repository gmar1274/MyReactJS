import React from 'react';
import logo from './assets/acba.png';
import './App.scss';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStore } from '@fortawesome/free-solid-svg-icons'
library.add(faStore);
class OpenBarber extends React.Component {
  constructor(props) {
    super(props);
    this.home = "";
    this.state = {
      date: new Date(),
      shops: [],// hold shop info e.g. name, stylists, time, location...
      messages: []// hold conversations between stylists and user
    };
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
    this.isLoggedIn();//check to see if user is logged in
    this.getUserLocation().then(geoLocation => {
      let self = this;
      let status = self.status;
      function success(position) {
        self.state.status.remove();
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        let loc = [longitude, latitude];
        self.setState({ userLoc: loc });
        self.initMap();
        self.fetchShops();
      }
      function error() {
        status.textContent = 'Unable to retrieve your location';
      }
      geoLocation.getCurrentPosition(success, error);
    });//async get user location to display map
    this.fetchShops().then(response => {
      this.setState({
        shops: response.shops
      });
    });
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
    this.state.map.remove();
  }
  async isLoggedIn() {
    let user = { user: { name: "Gabe" } };
    this.setState(user);
  }
  async getUserLocation() {
    const status = document.querySelector('#alert');
    this.setState({ status: status });
    if (!navigator.geolocation) {
      status.textContent = 'Geolocation is not supported by your browser';
    } else {
      status.textContent = 'Locating…';
      return navigator.geolocation;//.getCurrentPosition(success, error);
    }
  }

  tick() {
    this.setState({
      date: new Date()
    });
  }
  async initMap() {
    const spinner = document.querySelector("#spinner_map");
    spinner.remove();
    let self = this;
    var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
    mapboxgl.accessToken = 'pk.eyJ1IjoiZ21hcjEyNzQiLCJhIjoiY2p4czE4NjBmMGV6cjNocW9taWZiMmRtMCJ9.07lhwOhzB_nSEQg2sC11-A';
    let map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.state.userLoc, // starting position [lng, lat]
      zoom: 12 // starting zoom
    });
    /*
     * Add animated marker
     */
    var size = 170;
    var pulsingDot = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      onAdd: function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
      },
      render: function () {
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
    };//end animated dot
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
                "coordinates": self.state.userLoc
              },
              "properties": {
                "description": !self.state.user.name ? "Me" : self.state.user.name
              }
            }]
          }
        },
        "layout": {
          "icon-image": "pulsing-dot"
        }
      });
      //map.resize();
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
        map.flyTo({ center: e.features[0].geometry.coordinates });
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
    let response = await fetch('shops.json');
    let geojson = await response.json();
    // add markers to map
    geojson.features.forEach(function (marker) {
      let el = React.createElement("FontAwesomeIcon", { icon: { faStore }, size: "4x", className: "marker" });
      console.log(el);
      // add marker to map
      new mapboxgl.Marker(el)
        .setLngLat(marker.geometry.coordinates).setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
          .setHTML('<div class=marker-title>' + marker.properties.name + '</div><div class=marker-description>' + marker.properties.message + '</div>'))
        .addTo(map);
    });
    this.setState({ map: map });
  }
  /**
   * This method will fetch shop locations from db and plot them on the map.
   */
  async fetchShops() {
    return (<div id="shops"></div>);
  }
  renderShopsTab() {

  }
  renderLiveTab() {

  }
  renderMessagesTab() {

  }
  render() {
    return (

      <div className="container-fluid d-flex h-100 flex-column">
        <div className="row">
          <div className="col">
            <nav className="navbar navbar-expand-lg navbar-dark">
              <a className="navbar-brand" href={this.home}>
                <img src={logo} width="30" height="30" className="d-inline-block align-top App-logo " alt="logo" />
              </a>
              <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav">
                  <li className="nav-item active">
                    <a className="nav-link" href={this.home} alt="home link">Home <span className="sr-only">(current)</span></a>
                  </li>
                </ul>
              </div>
            </nav>
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item">
                <a className="nav-link active" data-toggle="tab" href="#tab-one" alt="tab one">Shops</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" data-toggle="tab" href="#tab-two" alt="tab two">Live View</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" data-toggle="tab" href="#tab-three" alt="tab three">Messages</a>
              </li>
            </ul>
          </div>
        </div>


        <div className="row bg-light flex-fill d-flex justify-content-start">
          <div className="col portlet-container portlet-dropzone">
            <div className="tab-content" id="tab-content-pane">

              <div id="tab-one" className="row tab-pane fade active">
                <div className="row" >
                  <div id="alert" className="alert alert-danger" role="alert"></div>
                </div>
                <div className="row h-100">
                  <div id="spinner_map" className="justify-content-center">
                    <div className="spinner-border text-danger" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                </div>
                <div className="row h-100">

                  <div className='sidebar pad2'>Listing</div>
                  <div id='map' className='pad2'>Map</div>

                </div>
              </div>

              <div id="tab-two" className="container-fluid tab-pane fade">
                <h3>Menu 1</h3>
                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              </div>
              <div id="tab-three" className="container-fluid tab-pane fade">
                <h3>Menu 2</h3>
                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default OpenBarber;