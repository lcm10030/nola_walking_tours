## New Orleans Neighborhood Walking Tour Map

For this final project, I created interactive walking tours of some of my favorite architectural and cultural neighborhoods in New Orleans, Louisiana: the Garden District, Marigny, and Bywater. To do this, I created GeoJSON line strings that guide users through what I think are some of the most interesting streets, landmarks, and architecture in each neighborhood. Along each route, I placed multiple tour stops highlighting locations with historical, cultural, or architectural significance.

I also created GeoJSON polygons representing each neighborhood's boundaries, as well as separate GeoJSON files for the tour stops and walking routes. All GeoJSON data is organized into folders by neighborhood.

The map is interactive. Users can begin by clicking a neighborhood to learn a brief background on its history, character, and significance before starting the tour. Once the tour begins, users can navigate through the stops using Next Stop and Previous Stop buttons.

At each stop, a panel on the right side of the screen displays a photo of the location along with interesting information about the site's history, architecture, and cultural importance. After completing a tour, users can continue exploring the other neighborhoods on the map.

**Files:** 
- index.html
- script.js
- styles.css
- Garden Folder:
  - gardenboundaries.json
  - gardenstops.json
  - gardenwalk.json
- Marigny Folder
  - marignyboundaries.json
  - marignystops.json
  - marignywalk.json
- Bywater Folder
  - bywaterboundaries.json
  - bywaterstops.json
  - bywaterwalk.json
 
**Technologies Used:**
- Mapbox GL JS
- HTML
- CSS
- JavaScript
- GeoJSON.io
