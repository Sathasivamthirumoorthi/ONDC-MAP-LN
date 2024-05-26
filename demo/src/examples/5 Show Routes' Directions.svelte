<script lang="ts">
  import { onMount } from "svelte";
  import { examples } from "../router";
  import { location } from "svelte-spa-router";
  import AppSidebar from "../components/AppSidebar.svelte";
  import maplibregl, { Map, NavigationControl }  from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import style from "../assets/map/style/style.json?url";
  import MapLibreGlDirections, { layersFactory } from "@maplibre/maplibre-gl-directions";
  import DirectionArrowImageUrl from "../assets/map/images/arrow.png?url";
  import GeocodingControl from "@maptiler/geocoding-control/svelte/GeocodingControl.svelte";
  import { createMapLibreGlMapController } from "@maptiler/geocoding-control/maplibregl";


  const meta = examples.find((example) => example.path === $location)!;

  let mapRef: HTMLElement;
  let directions: MapLibreGlDirections;
  let fromLocation :[number,number] = [313123,321321];
  let toLocation :[number,number] = [313123,321321];
  let mapController : any;
  const apiKey = '0Gpm5NCNWHPY9J03gGTr';

  function updateRoute() {
  // Check if all coordinates are provided
  if (fromLocation.length > 0 && toLocation.length > 0) {
    const from: [number, number] = fromLocation;
    const to: [number, number] = toLocation;
    directions.setWaypoints([from, to]);
  } else {
    // Handle the case where some coordinates are missing
    console.error('Please provide all coordinates.');
  }
 }

 // Event handler for GeocodingControl
 function handleGeocoding(event : any) {
    console.log(event.searchValue)
    // const { latitude, longitude, type } = event.detail;
    // if (type === 'from') {
    //   fromLat = latitude;
    //   fromLng = longitude;
    // } else if (type === 'to') {
    //   toLat = latitude;
    //   toLng = longitude;
    // }
    updateRoute();
  }

  onMount(() => {
    const map = new maplibregl.Map({
      container: mapRef,
      style,
      center: [-74.1197632, 40.6974034],
      zoom: 11,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        customAttribution: "<a href='http://project-osrm.org/' target='_blank'>&copy; OSRM</a>",
      }),
    );

    mapController = createMapLibreGlMapController(map, maplibregl);
    // load the arrow image and add it to the map
    map.loadImage(DirectionArrowImageUrl).then((image) => {
      if (image) {
        map.addImage("direction-arrow", image.data);
      }
    });

    const layers = layersFactory();
    // add a direction arrow layer
    layers.push({
      id: "maplibre-gl-directions-routeline-direction-arrow",
      type: "symbol",
      source: "maplibre-gl-directions",
      layout: {
        "symbol-placement": "line-center",
        "icon-image": "direction-arrow",
        "icon-size": ["interpolate", ["exponential", 1.5], ["zoom"], 12, 0.85, 18, 1.4],
      },
      paint: {
        "icon-opacity": 1,
      },
      filter: ["==", ["get", "route"], "SELECTED"],
    });

    map.on("load", () => {


      directions = new MapLibreGlDirections(map, {
        requestOptions: {
          alternatives: "true",
        },
        layers,
        
      });


      console.log(directions);

      directions.interactive = true;

    });


        
    // Geolocation API to get current position and update map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setCenter([longitude, latitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  });

  const onPickFromLocation = (event : any) => {
    fromLocation = event.detail.center;
    console.log('fromLocation Picked:', fromLocation);
  };

  const onPickToLocation = (event : any) => {
    toLocation = event.detail.center;
    console.log('toLocation Picked:', toLocation);
    updateRoute();
  };

</script>

<AppSidebar>
  <span slot="title">{meta.name}</span>

  <div class="form grid grid-cols-1 gap-4">
    <div>
      <label class="block">
        <span class="text-gray-700">From Location:</span>
        {#if mapController}
          <div class="geocoding">
            <GeocodingControl placeholder="From" {mapController} apiKey={apiKey} on:pick={onPickFromLocation}/>
          </div>
        {/if}
      </label>
    </div>
    <div>
      <label class="block">
        <span class="text-gray-700">To Location:</span>
        {#if mapController}
          <div class="geocoding">
            <GeocodingControl placeholder="To" apiKey={apiKey} on:pick={onPickToLocation}/>
          </div>
        {/if}
      </label>
    </div>
  </div>
  

</AppSidebar>

<div bind:this={mapRef} class="basis-full lg:basis-2/3 shadow-xl"/>

