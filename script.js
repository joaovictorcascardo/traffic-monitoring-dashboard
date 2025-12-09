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
        zoom: 4,
        heading: 0,
        tilt: 0,
        mapId: "DEMO_MAP_ID",
        renderingType: "VECTOR",
        disableDefaultUI: true,
        gestureHandling: 'greedy'
    });

    trafficLayer = new google.maps.TrafficLayer();
    autocompleteService = new google.maps.places.AutocompleteService();
    placesService = new google.maps.places.PlacesService(map);

    setupControls(AdvancedMarkerElement);
    setupCustomSearch(AdvancedMarkerElement);
    
    setTimeout(() => playIntroAnimation(startPos), 1500);
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

function teleport(lat, lng, heading) {
    map.setZoom(10);
    setTimeout(() => {
        map.panTo({ lat: lat, lng: lng });
        setTimeout(() => {
            map.setZoom(17);
            map.setTilt(65);
            map.setHeading(heading);
        }, 1000);
    }, 500);
}

function playIntroAnimation(targetPos) {
    showToast("Iniciando satélite...", "info");
    setTimeout(() => {
        map.setZoom(10);
        map.panTo(targetPos);
        setTimeout(() => {
            map.setZoom(18);
            map.setTilt(65);
            map.setHeading(45);
            showToast("Bem-vindo a Muriaé", "success");
        }, 2000);
    }, 1000);
}