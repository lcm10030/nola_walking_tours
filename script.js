mapboxgl.accessToken = 'pk.eyJ1IjoibGNtMTAwMzAiLCJhIjoiY21uaTJ1c2lwMDh0aDJ3b2Z4bjUxMjZqciJ9.dwT1gelvqXmJmSNUpUGdnw';

const initialView = {
    center: [-90.08706, 29.95319],
    zoom: 11.8
};

const map = new mapboxgl.Map({
    container: 'map-container',
    style: 'mapbox://styles/mapbox/standard', // Use the standard style for the map
    config: {
        basemap: {
            lightPreset: "dawn",
            theme: "monochrome",
        }
    },
    projection: 'globe', // display the map as a globe
    zoom: initialView.zoom,
    center: initialView.center
});


//Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// Walking tour state
let currentStop = -1;
let tourStops = [];
let currentNeighborhood = null; // Track selected neighborhood

// Neighborhood data
const neighborhoods = {
    garden: {
        name: 'Garden District',
        description: 'The Garden District is a historic neighborhood known for its stunning Victorian architecture, oak-lined streets, and beautiful gardens. Explore the opulent mansions and learn about the history of this iconic area.',
        photos: ['https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,f_jpg,h_675,q_65,w_1200/v1/clients/neworleans/Brevard_Clapp_Rice_52f6cb6d-ebd6-4a5e-9fdc-b9970feb215c.jpg'],
        center: [-90.08441, 29.93134],
        zoom: 13,
        boundariesSource: 'garden-boundaries',
        walkSource: 'garden-walk',
        stopsSource: 'tour-stops',
        stopsFile: 'gardenstops.json'
    },
    marigny: {
        name: 'Marigny',
        description: 'The Marigny neighborhood is a vibrant area with Creole cottages, historic homes, and a mix of cultures. Discover the unique architecture and rich history of this eclectic district.',
        photos: [], // Add photos if available
        center: [-90.058, 29.967], // Approximate center for Marigny
        zoom: 13,
        boundariesSource: 'marigny-boundaries',
        walkSource: 'marigny-walk',
        stopsSource: 'marigny-stops',
        stopsFile: 'marignystops.json'
    }
};

// Get DOM elements
const startWalkBtn = document.getElementById('start-walk-btn');
const nextStopBtn = document.getElementById('next-stop-btn');
const stopPanel = document.getElementById('stop-panel');
const stopContent = document.getElementById('stop-content');
const closePanelBtn = document.getElementById('close-panel');
const welcomePanel = document.getElementById('welcome-panel');
const closeWelcomeBtn = document.getElementById('close-welcome');
const neighborhoodBtns = document.querySelectorAll('.neighborhood-btn');

map.on('load', () => {
    // Sources for Garden District
    map.addSource('garden-boundaries', {
        type: 'geojson',
        data: 'gardenboundaries.json'
    });

    map.addSource('garden-walk', {
        type: 'geojson',
        data: 'gardenwalk.json'
    });

    map.addSource('tour-stops', {
        type: 'geojson',
        data: 'gardenstops.json'
    });

    // Sources for Marigny
    map.addSource('marigny-boundaries', {
        type: 'geojson',
        data: 'marignyboundaries.json'
    });

    map.addSource('marigny-walk', {
        type: 'geojson',
        data: 'marignywalk.json'
    });

    map.addSource('marigny-stops', {
        type: 'geojson',
        data: 'marignystops.json'
    });

    map.addSource('bywater-boundaries', {
        type: 'geojson',
        data: 'bywaterboundaries.json'
    });

    // Layers - initially hidden for walks and stops
    // Garden walking tour line layer
    map.addLayer({
        id: 'garden-walk',
        type: 'line',
        source: 'garden-walk',
        layout: {
            'visibility': 'none', // Hidden initially
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#e55e5e',
            'line-width': 2,
            'line-dasharray': [2, 4] // dashed line pattern
        }
    });

    // Garden tour stops point layer
    map.addLayer({
        id: 'tour-stops-points',
        type: 'circle',
        source: 'tour-stops',
        layout: {
            'visibility': 'none' // Hidden initially
        },
        paint: {
            'circle-radius': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                14,
                8
            ],
            'circle-color': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                '#16a34a',
                '#e55e5e'
            ],
            'circle-stroke-width': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                4,
                2
            ],
            'circle-stroke-color': '#ffffff',
            'circle-opacity': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                0.95,
                0.8
            ]
        }
    });

    // Garden district boundaries fill layer
    map.addLayer({
        id: 'garden-boundaries',
        type: 'fill',
        source: 'garden-boundaries',
        paint: {
            'fill-color': '#f9cc8c',
            'fill-opacity': 0.4
        }
    });

    // Marigny walking tour line layer
    map.addLayer({
        id: 'marigny-walk',
        type: 'line',
        source: 'marigny-walk',
        layout: {
            'visibility': 'none', // Hidden initially
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#e55e5e',
            'line-width': 2,
            'line-dasharray': [2, 4] // dashed line pattern
        }
    });

    // Marigny tour stops point layer
    map.addLayer({
        id: 'marigny-stops-points',
        type: 'circle',
        source: 'marigny-stops',
        layout: {
            'visibility': 'none' // Hidden initially
        },
        paint: {
            'circle-radius': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                14,
                8
            ],
            'circle-color': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                '#16a34a',
                '#e55e5e'
            ],
            'circle-stroke-width': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                4,
                2
            ],
            'circle-stroke-color': '#ffffff',
            'circle-opacity': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                0.95,
                0.8
            ]
        }
    });

    // Marigny district boundaries fill layer
    map.addLayer({
        id: 'marigny-boundaries',
        type: 'fill',
        source: 'marigny-boundaries',
        paint: {
            'fill-color': '#80b3ed',
            'fill-opacity': 0.4
        }
    });

    // Bywater district boundaries fill layer
    map.addLayer({
        id: 'bywater-boundaries',
        type: 'fill',
        source: 'bywater-boundaries',
        paint: {
            'fill-color': '#f98cb2',
            'fill-opacity': 0.4
        }
    });

    // Load Garden stops initially (or none, but for now load Garden)
    fetch('gardenstops.json')
        .then(response => response.json())
        .then(data => {
            data.features.forEach((feature, index) => {
                feature.id = index;
            });
            tourStops = data.features;
            map.getSource('tour-stops').setData(data);
        });

    // Load Marigny stops
    fetch('marignystops.json')
        .then(response => response.json())
        .then(data => {
            data.features.forEach((feature, index) => {
                feature.id = index;
            });
            map.getSource('marigny-stops').setData(data);
        });

    // Make boundaries clickable to select neighborhoods
    map.on('click', 'garden-boundaries', () => {
        selectNeighborhood('garden');
    });

    map.on('click', 'marigny-boundaries', () => {
        selectNeighborhood('marigny');
    });

    // Change cursor on hover over boundaries
    map.on('mouseenter', ['garden-boundaries', 'marigny-boundaries'], () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', ['garden-boundaries', 'marigny-boundaries'], () => {
        map.getCanvas().style.cursor = '';
    });

    // Click handlers for stop points (only when visible)
    map.on('click', 'tour-stops-points', (event) => {
        handleStopClick(event, 'tour-stops');
    });

    map.on('click', 'marigny-stops-points', (event) => {
        handleStopClick(event, 'marigny-stops');
    });

    // Pointer cursor for stops
    map.on('mouseenter', ['tour-stops-points', 'marigny-stops-points'], () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', ['tour-stops-points', 'marigny-stops-points'], () => {
        map.getCanvas().style.cursor = '';
    });
});

/**
 * Select a neighborhood: zoom to it, show its walk and stops, close welcome panel, open neighborhood panel.
 */
function selectNeighborhood(neighborhoodKey) {
    const neighborhood = neighborhoods[neighborhoodKey];
    if (!neighborhood) return;

    currentNeighborhood = neighborhoodKey;

    // Close welcome panel
    welcomePanel.classList.add('hidden');

    // Show tour controls
    document.getElementById('tour-controls').style.display = 'flex';

    // Zoom to neighborhood
    map.flyTo({
        center: neighborhood.center,
        zoom: neighborhood.zoom,
        essential: true
    });

    // Hide all walks and stops
    map.setLayoutProperty('garden-walk', 'visibility', 'none');
    map.setLayoutProperty('tour-stops-points', 'visibility', 'none');
    map.setLayoutProperty('marigny-walk', 'visibility', 'none');
    map.setLayoutProperty('marigny-stops-points', 'visibility', 'none');

    // Show selected neighborhood's walk and stops
    map.setLayoutProperty(neighborhood.walkSource, 'visibility', 'visible');
    map.setLayoutProperty(neighborhood.stopsSource + '-points', 'visibility', 'visible');

    // Load stops for the selected neighborhood
    fetch(neighborhood.stopsFile)
        .then(response => response.json())
        .then(data => {
            data.features.forEach((feature, index) => {
                feature.id = index;
            });
            tourStops = data.features;
            map.getSource(neighborhood.stopsSource).setData(data);

            // Show neighborhood info in side panel
            showNeighborhoodPanel(neighborhood, tourStops);
        });

    // Reset tour state
    updateActiveStop(-1);
    nextStopBtn.disabled = true;
    nextStopBtn.textContent = 'Next Stop';
}

/**
 * Handle clicking on a stop point.
 */
function handleStopClick(event, stopsSource) {
    const feature = event.features && event.features[0];
    if (!feature || feature.id == null) return;

    updateActiveStop(feature.id);
    const stopCoords = tourStops[feature.id].geometry.coordinates;

    map.flyTo({
        center: stopCoords,
        zoom: 16,
        essential: true
    });

    showStopPopup(tourStops[feature.id]);
    nextStopBtn.disabled = false;
    nextStopBtn.textContent = 'Next Stop';
}

/**
 * Set the active stop on the map and clear the previous active stop.
 */
function updateActiveStop(newIndex) {
    if (currentStop >= 0 && currentNeighborhood) {
        const stopsSource = neighborhoods[currentNeighborhood].stopsSource;
        map.setFeatureState({ source: stopsSource, id: currentStop }, { active: false });
    }

    currentStop = newIndex;

    if (currentStop >= 0 && currentNeighborhood) {
        const stopsSource = neighborhoods[currentNeighborhood].stopsSource;
        map.setFeatureState({ source: stopsSource, id: currentStop }, { active: true });
    }
}

// Event listeners for neighborhood buttons
neighborhoodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const neighborhood = btn.dataset.neighborhood;
        selectNeighborhood(neighborhood);
    });
});

// Start Walk button - zooms to the start of the walk for current neighborhood
startWalkBtn.addEventListener('click', () => {
    if (!currentNeighborhood || tourStops.length === 0) return;

    currentStop = 0;
    const startCoords = tourStops[0].geometry.coordinates;

    map.flyTo({
        center: startCoords,
        zoom: 16,
        essential: true
    });

    // Enable the Next Stop button
    nextStopBtn.disabled = false;
    nextStopBtn.textContent = 'Next Stop';

    // Show stop info in side panel
    showStopPopup(tourStops[0]);
});

// Next Stop button - navigates to each subsequent stop
nextStopBtn.addEventListener('click', () => {
    if (currentStop < 0 || currentStop >= tourStops.length - 1) return;

    updateActiveStop(currentStop + 1);
    const stopCoords = tourStops[currentStop].geometry.coordinates;

    map.flyTo({
        center: stopCoords,
        zoom: 16,
        essential: true
    });

    // Show stop info in side panel
    showStopPopup(tourStops[currentStop]);

    // Update button text if at the last stop
    if (currentStop === tourStops.length - 1) {
        nextStopBtn.textContent = 'Tour Complete';
        nextStopBtn.disabled = true;
    }
});

// Function to show neighborhood information in the side panel
function showNeighborhoodPanel(neighborhood, stops) {
    let html = `<h2>${neighborhood.name}</h2>`;
    html += `<p>${neighborhood.description}</p>`;

    // Add photos
    if (neighborhood.photos && neighborhood.photos.length > 0) {
        neighborhood.photos.forEach(photo => {
            html += `<img src="${photo}" alt="${neighborhood.name} photo" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">`;
        });
    }

    // Add clickable list of stops
    if (stops && stops.length > 0) {
        html += `<h3>Stops:</h3><ul>`;
        stops.forEach((stop, index) => {
            html += `<li><button class="stop-list-btn" data-stop-id="${index}">${stop.properties.name || `Stop ${index + 1}`}</button></li>`;
        });
        html += `</ul>`;
    }

    stopContent.innerHTML = html;

    // Add event listeners for stop buttons
    const stopBtns = stopContent.querySelectorAll('.stop-list-btn');
    stopBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const stopId = parseInt(btn.dataset.stopId);
            showStopPopup(stops[stopId]);
            updateActiveStop(stopId);
            const stopCoords = stops[stopId].geometry.coordinates;
            map.flyTo({
                center: stopCoords,
                zoom: 16,
                essential: true
            });
            nextStopBtn.disabled = false;
            nextStopBtn.textContent = 'Next Stop';
        });
    });

    // Show the side panel
    stopPanel.classList.remove('hidden');
}

// Function to show stop information in the side panel
function showStopPopup(stop) {
    const props = stop.properties;
    
    // Build the HTML content for the side panel
    let html = '';
    
    // Add image if available
    if (props.image) {
        html += `<img src="${props.image}" alt="${props.name || 'Stop image'}">`;
    }
    
    // Add stop name and description
    html += `<h2>${props.name || 'Stop'}</h2>`;
    html += `<p>${props.description || ''}</p>`;
    
    // Insert content into the side panel
    stopContent.innerHTML = html;
    
    // Show the side panel (remove hidden class)
    stopPanel.classList.remove('hidden');
}

// Close the side panel and reset to initial state.
closePanelBtn.addEventListener('click', () => {
    stopPanel.classList.add('hidden');
    welcomePanel.classList.remove('hidden');
    document.getElementById('tour-controls').style.display = 'none';

    // Hide stops and walk
    map.setLayoutProperty('garden-walk', 'visibility', 'none');
    map.setLayoutProperty('tour-stops-points', 'visibility', 'none');
    map.setLayoutProperty('marigny-walk', 'visibility', 'none');
    map.setLayoutProperty('marigny-stops-points', 'visibility', 'none');

    // Reset state
    currentNeighborhood = null;
    updateActiveStop(-1);
    nextStopBtn.disabled = true;
    nextStopBtn.textContent = 'Next Stop';

    // Zoom to initial view
    map.flyTo({
        center: initialView.center,
        zoom: initialView.zoom,
        essential: true
    });
});

// Close the welcome panel
closeWelcomeBtn.addEventListener('click', () => {
    welcomePanel.classList.add('hidden');
});
