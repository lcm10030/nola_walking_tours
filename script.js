mapboxgl.accessToken = 'pk.eyJ1IjoibGNtMTAwMzAiLCJhIjoiY21uaTJ1c2lwMDh0aDJ3b2Z4bjUxMjZqciJ9.dwT1gelvqXmJmSNUpUGdnw';

const initialView = {
    center: [-90.08706, 29.95319],
    zoom: 12
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
let boundaryPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

// Neighborhood data
const neighborhoods = {
    garden: {
        name: 'Garden District',
        description: 'The Garden District is a historic neighborhood known for its stunning Victorian architecture, oak-lined streets, and beautiful gardens. Explore the opulent mansions and learn about the history of this iconic area.',
        photos: ['https://www.neworleanslegendarywalkingtours.com/garden-district-trolley.webp'],
        center: [-90.08441, 29.93134],
        zoom: 14,
        boundariesSource: 'garden-boundaries',
        walkSource: 'garden-walk',
        stopsSource: 'tour-stops',
        stopsFile: 'garden/gardenstops.json'
    },
    marigny: {
        name: 'Marigny',
        description: 'The Marigny neighborhood is a vibrant area with Creole cottages, historic homes, and a mix of cultures. Discover the unique architecture and rich history of this eclectic district.',
        photos: [], // Add photos if available
        center: [-90.058, 29.967], // Approximate center for Marigny
        zoom: 14,
        boundariesSource: 'marigny-boundaries',
        walkSource: 'marigny-walk',
        stopsSource: 'marigny-stops',
        stopsFile: 'marigny/marignystops.json'
    },
    bywater: {
        name: 'Bywater',
        description: 'A dynamic and exciting neighborhood, Bywater is filled with artist housing and galleries, a plethora of eclectic eateries, and historic buildings ranging from the grand to the humble. Tucked alongside the Mississippi River between Faubourg Marigny and Holy Cross, Bywater sits atop some of the earliest land grants in the city. The largest plantation here, known as La Brasserie, featured a brewery that historians believe was one of the first manufacturing enterprises in the city. ',
        photos: ['https://www.bywater.org/wp-content/uploads/2021/03/Bywater-houses-1536x1024.jpeg'], // Added photo for Bywater
        center: [-90.03996, 29.96670], // Approximate center for Bywater
        zoom: 14,
        boundariesSource: 'bywater-boundaries',
        walkSource: 'bywater-walk',
        stopsSource: 'bywater-stops',
        stopsFile: 'bywater/bywaterstops.json'
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
        data: 'garden/gardenboundaries.json'
    });

    map.addSource('garden-walk', {
        type: 'geojson',
        data: 'garden/gardenwalk.json'
    });

    map.addSource('tour-stops', {
        type: 'geojson',
        data: 'garden/gardenstops.json'
    });

    // Sources for Marigny
    map.addSource('marigny-boundaries', {
        type: 'geojson',
        data: 'marigny/marignyboundaries.json'
    });

    map.addSource('marigny-walk', {
        type: 'geojson',
        data: 'marigny/marignywalk.json'
    });
    map.addSource('marigny-stops', {
        type: 'geojson',
        data: 'marigny/marignystops.json'
    });
    // Sources for Bywater
    map.addSource('bywater-boundaries', {
        type: 'geojson',
        data: 'bywater/bywaterboundaries.json'
    });

    map.addSource('bywater-walk', {
        type: 'geojson',
        data: 'bywater/bywaterwalk.json'
    });

    map.addSource('bywater-stops', {
        type: 'geojson',
        data: 'bywater/bywaterstops.json'
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

    // Bywater walking tour line layer - added for Bywater neighborhood
    map.addLayer({
        id: 'bywater-walk',
        type: 'line',
        source: 'bywater-walk',
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

    // Bywater tour stops point layer 
    map.addLayer({
        id: 'bywater-stops-points',
        type: 'circle',
        source: 'bywater-stops',
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

    // Ensure stop points and walk lines are above boundaries so map clicks target stops first
    // Added Bywater layers to the move list
    map.moveLayer('garden-walk');
    map.moveLayer('tour-stops-points');
    map.moveLayer('marigny-walk');
    map.moveLayer('marigny-stops-points');
    map.moveLayer('bywater-walk');
    map.moveLayer('bywater-stops-points');

    // Load Garden stops initially (or none, but for now load Garden)
    fetch('garden/gardenstops.json')
        .then(response => response.json())
        .then(data => {
            data.features.forEach((feature, index) => {
                feature.id = index;
                if (feature.properties) {
                    feature.properties.id = index;
                }
            });
            tourStops = data.features;
            map.getSource('tour-stops').setData(data);
        });

    // Load Marigny stops
    fetch('marigny/marignystops.json')
        .then(response => response.json())
        .then(data => {
            data.features.forEach((feature, index) => {
                feature.id = index;
                if (feature.properties) {
                    feature.properties.id = index;
                }
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

    // Added click handler for Bywater boundaries
    map.on('click', 'bywater-boundaries', () => {
        selectNeighborhood('bywater');
    });

    // Change cursor on hover over boundaries
    // Added bywater-boundaries to the list
    map.on('mouseenter', ['garden-boundaries', 'marigny-boundaries', 'bywater-boundaries'], () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mousemove', ['garden-boundaries', 'marigny-boundaries', 'bywater-boundaries'], (event) => {
        const feature = event.features && event.features[0];
        if (!feature) return;

        let label = '';
        if (feature.layer.id === 'garden-boundaries') label = 'Garden District';
        else if (feature.layer.id === 'marigny-boundaries') label = 'Marigny';
        else if (feature.layer.id === 'bywater-boundaries') label = 'Bywater';

        boundaryPopup
            .setLngLat(event.lngLat)
            .setHTML(`<div style="font-size:14px; color:#111; background:#fff; border:1px solid rgba(0,0,0,0.15); border-radius:8px; padding:8px 12px; box-shadow:0 4px 12px rgba(0,0,0,0.12);">${label}</div>`)
            .addTo(map);
    });

    map.on('mouseleave', ['garden-boundaries', 'marigny-boundaries', 'bywater-boundaries'], () => {
        map.getCanvas().style.cursor = '';
        boundaryPopup.remove();
    });

    // Click handlers for stop points (only when visible)
    map.on('click', 'tour-stops-points', (event) => {
        handleStopClick(event, 'tour-stops');
    });

    map.on('click', 'marigny-stops-points', (event) => {
        handleStopClick(event, 'marigny-stops');
    });

    // Added click handler for Bywater stops
    map.on('click', 'bywater-stops-points', (event) => {
        handleStopClick(event, 'bywater-stops');
    });

    // Pointer cursor for stops
    // Added bywater-stops-points to the list
    map.on('mouseenter', ['tour-stops-points', 'marigny-stops-points', 'bywater-stops-points'], () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', ['tour-stops-points', 'marigny-stops-points', 'bywater-stops-points'], () => {
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
    map.setLayoutProperty('bywater-walk', 'visibility', 'none');
    map.setLayoutProperty('bywater-stops-points', 'visibility', 'none');

    // Show selected neighborhood's walk and stops
    if (neighborhood.walkSource) {
        map.setLayoutProperty(neighborhood.walkSource, 'visibility', 'visible');
    }
    if (neighborhood.stopsSource) {
        map.setLayoutProperty(neighborhood.stopsSource + '-points', 'visibility', 'visible');
    }

    // Hide the selected neighborhood's boundary label when its tour opens
    const selectedLabel = `${neighborhoodKey}-boundary-label`;
    if (map.getLayer(selectedLabel)) {
        map.setLayoutProperty(selectedLabel, 'visibility', 'none');
    }

    // Show neighborhood info in side panel immediately
    showNeighborhoodPanel(neighborhood, []);

    // Load stops for the selected neighborhood if available
    if (neighborhood.stopsFile) {
        fetch(neighborhood.stopsFile)
            .then(response => response.json())
            .then(data => {
                data.features.forEach((feature, index) => {
                    feature.id = index;
                    if (feature.properties) {
                        feature.properties.id = index;
                    }
                });
                tourStops = data.features;
                map.getSource(neighborhood.stopsSource).setData(data);

                // Update panel with loaded stops
                showNeighborhoodPanel(neighborhood, tourStops);
            })
            .catch(() => {
                // No stops file, keep panel as is
            });
    }

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
    if (!feature) return;

    const featureId = feature.id != null ? feature.id : feature.properties?.id;
    if (featureId == null) return;

    const stop = tourStops.find(stop => stop.id == featureId || stop.properties?.id == featureId) || tourStops[Number(featureId)];
    if (!stop) return;

    updateActiveStop(Number(featureId));
    const stopCoords = stop.geometry.coordinates;

    map.flyTo({
        center: stopCoords,
        zoom: 16,
        essential: true
    });

    showStopPopup(stop);
    welcomePanel.classList.add('hidden');
    stopPanel.classList.remove('hidden');
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

    updateActiveStop(0);
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
    let html = `<h2 class="neighborhood-title">${neighborhood.name}</h2>`;
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

    // Scroll panel content to the top for a new stop
    stopPanel.scrollTop = 0;

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
    map.setLayoutProperty('bywater-walk', 'visibility', 'none');
    map.setLayoutProperty('bywater-stops-points', 'visibility', 'none');

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
