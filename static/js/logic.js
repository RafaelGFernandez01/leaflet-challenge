const RADIUS_FACTOR = 5;
var _data = null;

const get_data = async () => {
    if (_data) return _data;

    const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

    _data = await d3.json(url);
    return _data;
};

const get_color = (mag) => {
    if (mag < 1) return 'rgb(255,255,178)';
    if (mag < 2) return 'rgb(255,204,92)';
    if (mag < 3) return 'rgb(255,141,60)';
    if (mag < 4) return 'rgb(255,59,32)';

    return 'rgb(255,0,38)';
}

const create_features = (earthquakeData) => {
    const on_each_feature = (feature, layer) => {
        layer.bindPopup(`
            <h2 align='capitalize'> ${feature.properties.place}</h2>
            <hr>
            <p><strong>Occurrence:</strong> ${new Date(feature.properties.time)}</p>
            <p><strong>Magnitude:</strong> ${feature.properties.mag}</p>
            
        `);
    };

    const point_to_layer = (feature, latlng) => {
        const geojsonMarkerOptions = {
            radius: RADIUS_FACTOR * feature.properties.mag,
            fillColor: get_color(feature.properties.mag),
            color: "black",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };
        return L.circleMarker(latlng, geojsonMarkerOptions);
    };

    return L.geoJSON(earthquakeData, {
        onEachFeature: on_each_feature,
        pointToLayer: point_to_layer,
    });
}

const create_map = (features) => {
    const outdoors = L.tileLayer(
        'https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}',
        {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
            id: 'mapbox.out',
            accessToken: API_KEY,
        },
    );

    const lightmap = L.tileLayer(
        'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}',
        {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
            id: 'mapbox.light',
            accessToken: API_KEY,
        },
    );

    const map = L.map("map", {
        center: [39.83, -98.58],
        zoom: 4.5,
        layers: [outdoors, features]
    });
    L.control.layers(
        { 'Outdoors': outdoors, 'Light Map': lightmap },
        { 'Earthquakes': features },
        { collapsed: false }
    ) .addTo(map);

    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 1, 2, 3, 4],
            labels = [];

        div.innerHTML += 'Magnitude<br><hr>'

        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + get_color(grades[i] + 1) + '">&nbsp&nbsp&nbsp&nbsp</i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };
    legend.addTo(map);
}

// RENDER...
(async () => {
    const data = await get_data();

    const features = create_features(data.features);
    create_map(features);
})()
    .then(() => {
        console.log('Finished rendering...');
    })
    .catch((error) => {
        console.error('ERROR', error);
    });

