let map;
let trafficLayer;
let activeMarker;
let autocompleteService;
let placesService;

const searchInput = document.getElementById('custom-input');
const searchContainer = document.getElementById('search-container');
searchInput.addEventListener('focus', () => searchContainer.classList.add('focused'));
searchInput.addEventListener('blur', () => searchContainer.classList.remove('focused'));

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { PlacesService, AutocompleteService } = await google.maps.importLibrary("places");

    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').remove(), 800);
    }, 1500);

    const startPos = { lat: -21.1366, lng: -42.3683 };

    map = new Map(document.getElementById("mapa"), {
        center: startPos,
        zoom: 17,
        heading: 0,
        tilt: 55,
        mapId: "DEMO_MAP_ID",
        renderingType: "VECTOR",
        disableDefaultUI: true,
        gestureHandling: 'greedy'
    });

    map.addListener("idle", () => {
        const center = map.getCenter();
        if (center) {
            fetchWeather(center.lat(), center.lng());
        }
    });

    trafficLayer = new google.maps.TrafficLayer();
    autocompleteService = new google.maps.places.AutocompleteService();
    placesService = new google.maps.places.PlacesService(map);

    fetchWeather(startPos.lat, startPos.lng);

    setupControls(AdvancedMarkerElement);
    setupCustomSearch(AdvancedMarkerElement);
}

function setupCustomSearch(AdvancedMarkerElement) {
    const input = document.getElementById("custom-input");
    const resultsDiv = document.getElementById("search-results");

    input.addEventListener("input", (e) => {
        const query = e.target.value;
        if (!query || query.length < 3) {
            resultsDiv.style.display = "none"; return;
        }

        autocompleteService.getPlacePredictions({ input: query }, (predictions, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) return;
            renderResults(predictions, resultsDiv, AdvancedMarkerElement);
        });
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-wrapper")) resultsDiv.style.display = "none";
    });
}

function renderResults(predictions, resultsDiv, AdvancedMarkerElement) {
    resultsDiv.innerHTML = "";
    resultsDiv.style.display = "flex";

    predictions.forEach(place => {
        const item = document.createElement("div");
        item.className = "result-item";
        const mainText = place.structured_formatting.main_text;
        const subText = place.structured_formatting.secondary_text || "";

        item.innerHTML = `
            <div class="result-icon-box"><i class="fa-solid fa-location-dot"></i></div>
            <div class="result-text">
                <span class="result-main">${mainText}</span>
                <span class="result-sub">${subText}</span>
            </div>
        `;
        
        item.addEventListener("click", () => {
            goToPlace(place.place_id, AdvancedMarkerElement);
            resultsDiv.style.display = "none";
            document.getElementById("custom-input").value = mainText;
        });

        resultsDiv.appendChild(item);
    });
}

function goToPlace(placeId, AdvancedMarkerElement) {
    placesService.getDetails({ placeId: placeId }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            if (activeMarker) activeMarker.map = null;

            if (place.geometry.viewport) { map.fitBounds(place.geometry.viewport); } else { map.setCenter(place.geometry.location); map.setZoom(17); }

            activeMarker = new AdvancedMarkerElement({
                map, position: place.geometry.location,
                content: buildMarkerIcon("#ef4444", true), 
                title: place.name
            });

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            fetchWeather(lat, lng);

            showToast("Destino: " + place.name, "success");
        }
    });
}

function setupControls(AdvancedMarkerElement) {
    let trafficOn = false;
    document.getElementById("btn-traffic").addEventListener("click", (e) => {
        trafficOn = !trafficOn;
        trafficLayer.setMap(trafficOn ? map : null);
        e.currentTarget.classList.toggle("active", trafficOn);
    });

    document.getElementById("btn-locate").addEventListener("click", () => {
        if (navigator.geolocation) {
            const btn = document.getElementById("btn-locate");
            const icon = btn.querySelector("i");
            
            icon.className = "fa-solid fa-circle-notch fa-spin";
            
            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition((position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                
                map.panTo(pos); 
                map.setZoom(19);
                map.setTilt(60); 
                
                if (activeMarker) activeMarker.map = null;
                
                activeMarker = new AdvancedMarkerElement({
                    map, position: pos,
                    content: buildMarkerIcon("#2563eb", true)
                });

                fetchWeather(pos.lat, pos.lng);
                icon.className = "fa-solid fa-location-crosshairs";
                showToast("Localização encontrada", "success");
            }, (err) => {
                showToast("Sinal fraco ou permissão negada.", "error");
                icon.className = "fa-solid fa-location-crosshairs";
            }, options);
        } else {
            showToast("GPS não suportado", "error");
        }
    });

    document.getElementById("btn-tilt-down").addEventListener("click", () => map.setTilt(Math.min((map.getTilt()||0)+20, 67.5)));
    document.getElementById("btn-tilt-up").addEventListener("click", () => map.setTilt(Math.max((map.getTilt()||0)-20, 0)));
    document.getElementById("btn-rotate").addEventListener("click", () => map.setHeading((map.getHeading()||0)+45));
}

function buildMarkerIcon(color, withPulse = false) {
    const container = document.createElement('div');
    container.className = `marker-container ${withPulse ? 'marker-pulse' : ''}`;
    container.style.color = color;
    container.innerHTML = `<i class="fa-solid fa-location-dot marker-icon marker-pop"></i>`;
    return container;
}

function showToast(message, type) {
    const toast = document.getElementById("toast");
    document.getElementById("toast-msg").innerText = message;
    toast.className = "toast show";
    toast.style.borderLeftColor = type === 'success' ? '#22c55e' : '#ef4444';
    setTimeout(() => toast.classList.remove("show"), 3500);
}

async function fetchWeather(lat, lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        const weather = data.current_weather;
        
        document.getElementById('w-temp').innerText = `${Math.round(weather.temperature)}°C`;
        
        const code = weather.weathercode;
        const { desc, icon } = getWeatherDesc(code);
        
        document.getElementById('w-desc').innerText = desc;
        document.getElementById('w-icon').className = `fa-solid ${icon}`;
        
    } catch (error) {
        console.error("Erro ao carregar clima:", error);
    }
}

function getWeatherDesc(code) {
    if (code === 0) return { desc: "Céu Limpo", icon: "fa-sun" };
    if (code >= 1 && code <= 3) return { desc: "Parcialmente Nublado", icon: "fa-cloud-sun" };
    if (code >= 45 && code <= 48) return { desc: "Nevoeiro", icon: "fa-smog" };
    if (code >= 51 && code <= 67) return { desc: "Chuva Fraca", icon: "fa-cloud-rain" };
    if (code >= 80 && code <= 99) return { desc: "Chuva/Tempestade", icon: "fa-cloud-showers-heavy" };
    return { desc: "Nublado", icon: "fa-cloud" };
}