<script lang="ts">
  import { onMount } from "svelte";
  import { examples } from "../router";
  import { location } from "svelte-spa-router";
  import AppSidebar from "../components/AppSidebar.svelte";
  import maplibregl, { Map, NavigationControl, type StyleSpecification } from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import style from "../assets/map/style/style?url";
  import MapLibreGlDirections, { layersFactory } from "@maplibre/maplibre-gl-directions";
  import DirectionArrowImageUrl from "../assets/map/images/arrow.png";
  import GeocodingControl from "@maptiler/geocoding-control/svelte/GeocodingControl.svelte";
  import { createMapLibreGlMapController } from "@maptiler/geocoding-control/maplibregl";
  import { writable } from "svelte/store";
  import { colors } from "src/directions/layers";

  const meta = examples.find((example) => example.path === $location)!;

  let mapRef: HTMLElement;
  let directions: MapLibreGlDirections;
  let fromLocation: [number, number] = [313123, 321321];
  let toLocation: [number, number] = [313123, 321321];
  let mapController: any;
  let steps: any = writable([]); // Store to hold the steps
  let totalDistence: any;
  let totalDuration: any;
  let totalDurationAndDistence: string;
  const apiKey = "0Gpm5NCNWHPY9J03gGTr";
  const profileColors = {
    car: colors.routeline,
    bike: colors.routelineBike,
    foot: colors.waypointFootHighlight,
  };

  onMount(() => {
    const map = new maplibregl.Map({
      container: mapRef,
      style: style,
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
        // layers,
      });

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
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  });

  async function updateRoute(travelMode: keyof typeof profileColors) {
    // Check if all coordinates are provided
    if (fromLocation.length > 0 && toLocation.length > 0) {
      const from: [number, number] = fromLocation;
      const to: [number, number] = toLocation;

      try {
        // Fetch route data based on travel mode
        const response = await fetch(
          `https://routing.openstreetmap.de/routed-${travelMode}/route/v1/driving/${from.join(",")};${to.join(",")}?overview=false&alternatives=true&steps=true`,
        );
        const data = await response.json();

        // Check if route data is available
        if (data.routes && data.routes.length > 0) {
          // Extract steps from the route
          const routeSteps = data.routes[0].legs[0].steps.map((step: any) => {
            return {
              instruction: step.maneuver.instruction,
              name: step.name,
              distance: step.distance,
              duration: step.duration,
              mode: step.mode,
              type: step.maneuver.type,
              modifier: step.maneuver.modifier,
            };
          });

          (totalDistence = data.routes[0].legs[0].distance), travelMode;
          (totalDuration = data.routes[0].legs[0].duration), travelMode;
          totalDurationAndDistence = calculateDistanceAndDuration(totalDistence, totalDuration, travelMode);
          // Update the steps store
          steps.set(routeSteps);
          directions.setWaypoints([from, to], [travelMode]);
        } else {
          console.error("No route data available for", [travelMode]);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    } else {
      // Handle the case where some coordinates are missing
      console.error("Please provide all coordinates.");
    }
  }

  const onPickFromLocation = (event: any) => {
    fromLocation = event.detail.center;
    console.log("fromLocation Picked:", fromLocation);
  };

  const onPickToLocation = (event: any) => {
    toLocation = event.detail.center;
    console.log("toLocation Picked:", toLocation);
    updateRoute("car");
  };

  function calculateDistanceAndDuration(meters: number, durationSeconds: number, transportType: string) {
    // Convert meters to kilometers
    const distanceKm = meters / 1000;

    // Calculate duration in hours and minutes
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);

    // Determine speed based on transport type
    let speed: number; // Speed in km/hr
    switch (transportType.toLowerCase()) {
      case "car":
        speed = 40; // 40 km/hr
        break;
      case "bike":
        speed = 50; // 15 km/hr (assuming average cycling speed)
        break;
      case "foot":
        speed = 5; // 5 km/hr (walking)
        break;
      default:
        throw new Error("Unknown transport type");
    }

    // Calculate time in hours and minutes
    const timeHours = Math.floor(distanceKm / speed);
    const remainingMinutes = Math.round((distanceKm / speed - timeHours) * 60);

    // Return formatted result with distance and time (hours and minutes)
    return `Distance: ${distanceKm.toFixed(2)} km, ${timeHours} h ${remainingMinutes} min`;
  }
</script>

<AppSidebar>
  <span slot="title">{meta.name}</span>

  <div class="form grid grid-cols-1 gap-4">
    <div>
      <label class="block">
        <span>From Location:</span>
        {#if mapController}
          <div class="geocoding">
            <GeocodingControl placeholder="From" {mapController} {apiKey} on:pick={onPickFromLocation} />
          </div>
        {/if}
      </label>
    </div>
    <div>
      <label class="block">
        <span>To Location:</span>
        {#if mapController}
          <div class="geocoding">
            <GeocodingControl placeholder="To" {apiKey} on:pick={onPickToLocation} />
          </div>
        {/if}
      </label>
    </div>
    {#if totalDistence != undefined && totalDuration != undefined}
      <p>{totalDurationAndDistence}</p>
    {/if}
    <div>
      <button
        type="button"
        on:click={() => updateRoute("car")}
        class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 me-2 mb-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-car"
          ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path
            d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"
          /><path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" /></svg
        >{" "}
        Car
      </button>
      <button
        type="button"
        on:click={() => updateRoute("bike")}
        class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 me-2 mb-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-bike"
          ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path
            d="M19 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"
          /><path d="M12 19l0 -4l-3 -3l5 -4l2 3l3 0" /><path d="M17 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg
        >{" "}
        Bike
      </button>
      <button
        type="button"
        on:click={() => updateRoute("foot")}
        class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 me-2 mb-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-walk"
          ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path
            d="M7 21l3 -4"
          /><path d="M16 21l-2 -4l-3 -3l1 -6" /><path d="M6 12l2 -3l4 -1l3 3l3 1" /></svg
        >{" "}
        Walk
      </button>
    </div>
  </div>
  <div>
    <h2>Route Steps:</h2>
    <ul>
      {#each $steps as step}
        <li>
          <strong>{step.type} {step.modifier ? `(${step.modifier})` : ""}</strong> - {step.name} ({step.distance} meters,
          {step.duration} seconds) via {step.mode}
        </li>
      {/each}
    </ul>
  </div>
</AppSidebar>

<div bind:this={mapRef} class="basis-full lg:basis-2/3 shadow-xl" />
