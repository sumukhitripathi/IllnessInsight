// IntelliMed Medical Facility Finder - Map JavaScript

let map;
let userLocation = null;
let markers = [];
let userMarker = null;
let facilitiesData = [];

// Initialize the map with Leaflet and OpenStreetMap
function initMap() {
    console.log('Medical Facility Finder loaded');
    
    // Initialize Leaflet map centered on New York
    map = L.map('map').setView([40.7128, -74.0060], 13);

    // Add OpenStreetMap tile layer (free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize sample data if needed
    initializeSampleDataIfNeeded();
}

// Setup event listeners
function setupEventListeners() {
    // Location buttons
    const findLocationBtn = document.getElementById('find-location-btn');
    const searchLocationBtn = document.getElementById('search-location-btn');
    const searchFacilitiesBtn = document.getElementById('search-facilities-btn');
    const manualLocationInput = document.getElementById('manual-location-input');

    if (findLocationBtn) {
        findLocationBtn.addEventListener('click', findUserLocation);
    }

    if (searchLocationBtn) {
        searchLocationBtn.addEventListener('click', searchManualLocation);
    }

    if (searchFacilitiesBtn) {
        searchFacilitiesBtn.addEventListener('click', searchNearbyFacilities);
    }

    // Enable search on Enter key for manual location input
    if (manualLocationInput) {
        manualLocationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchManualLocation();
            }
        });
    }

    // Filter change handlers
    const facilityTypeSelect = document.getElementById('facility-type-select');
    const radiusSelect = document.getElementById('radius-select');

    if (facilityTypeSelect) {
        facilityTypeSelect.addEventListener('change', function() {
            if (userLocation) {
                searchNearbyFacilities();
            }
        });
    }

    if (radiusSelect) {
        radiusSelect.addEventListener('change', function() {
            if (userLocation) {
                searchNearbyFacilities();
            }
        });
    }
}

// Find user's current location
function findUserLocation() {
    const locationStatus = document.getElementById('location-status');
    const locationText = document.getElementById('location-text');
    const findLocationBtn = document.getElementById('find-location-btn');
    
    if (!navigator.geolocation) {
        showLocationError('Geolocation is not supported by this browser.');
        return;
    }

    // Show loading state
    if (findLocationBtn) {
        findLocationBtn.disabled = true;
        findLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Getting Location...';
    }
    
    showLocationStatus('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Update map center
            map.setView([userLocation.lat, userLocation.lng], 15);
            
            // Clear existing markers
            clearMarkers();
            
            // Add user location marker
            addUserLocationMarker();
            
            showLocationStatus(
                `Location found: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
                'success'
            );
            
            // Enable search button
            const searchBtn = document.getElementById('search-facilities-btn');
            if (searchBtn) {
                searchBtn.disabled = false;
            }
            
            // Reset button state
            if (findLocationBtn) {
                findLocationBtn.disabled = false;
                findLocationBtn.innerHTML = '<i class="fas fa-crosshairs me-2"></i>Find My Location';
            }

            // Auto-search for nearby facilities
            searchNearbyFacilities();
        },
        (error) => {
            console.error('Geolocation error:', error);
            
            let errorMessage = 'An unknown error occurred while getting location.';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location services.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
            }
            
            showLocationError(errorMessage);
            
            // Reset button state
            if (findLocationBtn) {
                findLocationBtn.disabled = false;
                findLocationBtn.innerHTML = '<i class="fas fa-crosshairs me-2"></i>Find My Location';
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Search for location manually using address/city/zip
function searchManualLocation() {
    const locationInput = document.getElementById('manual-location-input');
    const searchQuery = locationInput ? locationInput.value.trim() : '';
    
    if (!searchQuery) {
        IntelliMed.showNotification('Please enter an address, city, or ZIP code.', 'warning');
        return;
    }
    
    const searchBtn = document.getElementById('search-location-btn');
    
    // Show loading state
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    showLocationStatus('Searching for location...', 'info');
    
    // First, try to search for hospitals with this name
    const hospitalSearchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' hospital')}&limit=5&addressdetails=1`;
    
    fetch(hospitalSearchUrl)
        .then(response => response.json())
        .then(hospitalData => {
            if (hospitalData && hospitalData.length > 0) {
                // Found hospital(s) - use the first one
                const hospital = hospitalData[0];
                userLocation = {
                    lat: parseFloat(hospital.lat),
                    lng: parseFloat(hospital.lon)
                };
                
                // Update map center
                map.setView([userLocation.lat, userLocation.lng], 16);
                
                // Clear existing markers
                clearMarkers();
                
                // Add hospital location marker
                addUserLocationMarker(true);
                
                // Enable search button
                const searchFacilitiesBtn = document.getElementById('search-facilities-btn');
                if (searchFacilitiesBtn) {
                    searchFacilitiesBtn.disabled = false;
                }
                
                showLocationStatus(`Hospital found: ${hospital.display_name}`, 'success');
                
                // Auto-search for nearby facilities
                searchNearbyFacilities();
                
            } else {
                // No hospital found, try general location search
                return searchGeneralLocation(searchQuery);
            }
        })
        .catch(error => {
            console.error('Hospital search error:', error);
            return searchGeneralLocation(searchQuery);
        })
        .finally(() => {
            if (searchBtn) {
                searchBtn.disabled = false;
                searchBtn.innerHTML = '<i class="fas fa-search"></i>';
            }
        });
}

// Search for general location
function searchGeneralLocation(searchQuery) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`;
    
    return fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const result = data[0];
                userLocation = {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                };
                
                // Update map center
                map.setView([userLocation.lat, userLocation.lng], 15);
                
                // Clear existing markers
                clearMarkers();
                
                // Add user location marker
                addUserLocationMarker();
                
                // Enable search button
                const searchBtn = document.getElementById('search-facilities-btn');
                if (searchBtn) {
                    searchBtn.disabled = false;
                }
                
                showLocationStatus(`Location found: ${result.display_name}`, 'success');
                
                // Auto-search for nearby facilities
                searchNearbyFacilities();
                
            } else {
                showLocationError('Location not found. Please try a different address or hospital name.');
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
            showLocationError('Error searching for location. Please try again.');
        });
}

// Add user location marker to map
function addUserLocationMarker(isHospital = false) {
    if (!userLocation || !map) return;

    // Remove existing user marker
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    const color = isHospital ? '#28a745' : '#007bff';
    const icon = L.divIcon({
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: 'user-location-marker'
    });

    userMarker = L.marker([userLocation.lat, userLocation.lng], { icon }).addTo(map);
    userMarker.bindPopup(isHospital ? "Selected Hospital" : "Your Location");
}

// Search for nearby medical facilities
async function searchNearbyFacilities() {
    if (!userLocation) {
        IntelliMed.showNotification('Please find your location first.', 'warning');
        return;
    }
    
    const radius = document.getElementById('radius-select')?.value || '5';
    const facilityType = document.getElementById('facility-type-select')?.value || 'all';
    const loadingSpinner = document.querySelector('.loading-spinner');
    const searchBtn = document.getElementById('search-facilities-btn');
    
    // Show loading state
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Searching...';
    }
    
    // Clear existing facility markers
    clearFacilityMarkers();
    
    // Add user location marker back
    if (userMarker) {
        userMarker.addTo(map);
    }
    
    try {
        // Fetch nearby facilities from API
        const response = await IntelliMed.api.get(
            `/api/nearby-facilities?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}&type=${facilityType}`
        );
        
        if (response.success) {
            facilitiesData = response.facilities;
            displayFacilities(facilitiesData);
            updateFacilityCount(facilitiesData.length);
            
            if (facilitiesData.length === 0) {
                IntelliMed.showNotification('No facilities found in the selected area. Try increasing the search radius.', 'info');
            }
        } else {
            throw new Error(response.error || 'Failed to fetch facilities');
        }
        
    } catch (error) {
        console.error('Facility search error:', error);
        IntelliMed.showNotification('Failed to search for facilities. Please try again.', 'danger');
        displayEmptyState();
    } finally {
        // Hide loading state
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fas fa-search me-2"></i>Search Facilities';
        }
    }
}

// Display facilities on map and list
function displayFacilities(facilities) {
    // Clear existing markers
    clearFacilityMarkers();
    
    // Add facilities to map
    facilities.forEach(facility => {
        addFacilityMarker(facility);
    });
    
    // Display facilities list
    displayFacilitiesList(facilities);
    
    // Adjust map view to show all facilities
    if (facilities.length > 0) {
        const group = new L.featureGroup([
            userMarker,
            ...markers.filter(m => m !== userMarker)
        ]);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Add facility marker to map
function addFacilityMarker(facility) {
    const color = getFacilityColor(facility.type);
    const icon = getFacilityIcon(facility.type);
    
    const marker = L.marker([facility.lat, facility.lng], {
        icon: L.divIcon({
            html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                <i class="${icon}"></i>
            </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            className: 'facility-marker'
        })
    }).addTo(map);
    
    // Create popup content
    const popupContent = createFacilityPopup(facility);
    marker.bindPopup(popupContent);
    
    // Add click handler to highlight in list
    marker.on('click', function() {
        highlightFacilityInList(facility.id);
    });
    
    markers.push(marker);
    return marker;
}

// Get facility color based on type
function getFacilityColor(type) {
    const colors = {
        hospital: '#dc3545',
        clinic: '#28a745',
        pharmacy: '#ffc107',
        urgent_care: '#fd7e14'
    };
    return colors[type] || '#007bff';
}

// Get facility icon based on type
function getFacilityIcon(type) {
    const icons = {
        hospital: 'fas fa-hospital',
        clinic: 'fas fa-clinic-medical',
        pharmacy: 'fas fa-pills',
        urgent_care: 'fas fa-ambulance'
    };
    return icons[type] || 'fas fa-map-marker-alt';
}

// Create facility popup content
function createFacilityPopup(facility) {
    const services = facility.services && facility.services.length > 0 
        ? facility.services.slice(0, 3).join(', ') 
        : 'Services available';
    
    return `
        <div class="facility-popup">
            <h6 class="mb-2">${facility.name}</h6>
            <p class="mb-1 small text-muted">${facility.address}</p>
            <p class="mb-2 small">${services}</p>
            <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-primary">${facility.distance}km away</span>
                ${facility.phone ? `<a href="tel:${facility.phone}" class="btn btn-sm btn-outline-primary">Call</a>` : ''}
            </div>
            ${facility.emergency_services ? '<div class="mt-2"><span class="badge bg-danger">Emergency Services</span></div>' : ''}
        </div>
    `;
}

// Display facilities list
function displayFacilitiesList(facilities) {
    const facilitiesList = document.getElementById('facilities-list');
    if (!facilitiesList) return;
    
    if (facilities.length === 0) {
        displayEmptyState();
        return;
    }
    
    facilitiesList.innerHTML = facilities.map(facility => 
        createFacilityListItem(facility)
    ).join('');
    
    // Add click handlers to list items
    facilities.forEach(facility => {
        const listItem = document.querySelector(`[data-facility-id="${facility.id}"]`);
        if (listItem) {
            listItem.addEventListener('click', () => {
                // Center map on facility
                map.setView([facility.lat, facility.lng], 16);
                
                // Find and open popup for this facility
                const marker = markers.find(m => 
                    m.getLatLng().lat === facility.lat && 
                    m.getLatLng().lng === facility.lng
                );
                if (marker) {
                    marker.openPopup();
                }
            });
        }
    });
}

// Create facility list item
function createFacilityListItem(facility) {
    const services = facility.services && facility.services.length > 0 
        ? facility.services.slice(0, 3).join(', ') 
        : 'Services available';
    
    return `
        <div class="list-group-item facility-card facility-type-${facility.type}" 
             data-facility-id="${facility.id}">
            <div class="d-flex w-100 justify-content-between">
                <div class="flex-grow-1">
                    <h6 class="mb-1 d-flex align-items-center">
                        <i class="${getFacilityIcon(facility.type)} me-2" style="color: ${getFacilityColor(facility.type)}"></i>
                        ${facility.name}
                    </h6>
                    <p class="mb-1 text-muted small">${facility.address}</p>
                    <p class="mb-2 small">${services}</p>
                    
                    <div class="d-flex flex-wrap gap-1 mb-2">
                        <span class="badge distance-badge">${facility.distance}km away</span>
                        <span class="badge bg-secondary">${facility.type.replace('_', ' ').toUpperCase()}</span>
                        ${facility.emergency_services ? '<span class="badge bg-danger">Emergency</span>' : ''}
                        ${facility.accepts_insurance ? '<span class="badge bg-success">Insurance</span>' : ''}
                    </div>
                </div>
                
                <div class="text-end">
                    ${facility.phone ? `
                        <a href="tel:${facility.phone}" class="btn btn-sm btn-outline-primary mb-1">
                            <i class="fas fa-phone me-1"></i>Call
                        </a>
                    ` : ''}
                    ${facility.website ? `
                        <a href="${facility.website}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-info mb-1">
                            <i class="fas fa-external-link-alt me-1"></i>Website
                        </a>
                    ` : ''}
                    <button class="btn btn-sm btn-primary" onclick="showDirections(${facility.lat}, ${facility.lng}, '${facility.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-directions me-1"></i>Directions
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Display empty state
function displayEmptyState() {
    const facilitiesList = document.getElementById('facilities-list');
    if (!facilitiesList) return;
    
    facilitiesList.innerHTML = `
        <div class="list-group-item text-center text-muted py-4">
            <i class="fas fa-map-marker-alt fs-1 mb-3 d-block"></i>
            <p class="mb-0">No healthcare facilities found in the selected area.</p>
            <small>Try increasing the search radius or changing the facility type.</small>
        </div>
    `;
}

// Highlight facility in list
function highlightFacilityInList(facilityId) {
    // Remove previous highlights
    document.querySelectorAll('.facility-card').forEach(card => {
        card.classList.remove('bg-light');
    });
    
    // Highlight selected facility
    const facilityCard = document.querySelector(`[data-facility-id="${facilityId}"]`);
    if (facilityCard) {
        facilityCard.classList.add('bg-light');
        facilityCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Show directions to facility
function showDirections(lat, lng, name) {
    if (!userLocation) {
        IntelliMed.showNotification('Your location is needed to show directions.', 'warning');
        return;
    }
    
    const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`;
    const appleMapsUrl = `https://maps.apple.com/?saddr=${userLocation.lat},${userLocation.lng}&daddr=${lat},${lng}`;
    
    // Detect if user is on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Try to open native maps app
        window.open(appleMapsUrl, '_blank');
        
        // Fallback to Google Maps after a short delay
        setTimeout(() => {
            window.open(googleMapsUrl, '_blank');
        }, 1000);
    } else {
        // Open Google Maps in new tab
        window.open(googleMapsUrl, '_blank');
    }
}

// Update facility count
function updateFacilityCount(count) {
    const countElement = document.getElementById('facility-count');
    if (countElement) {
        countElement.textContent = `${count} found`;
    }
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
    
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
}

// Clear facility markers only
function clearFacilityMarkers() {
    markers.forEach(marker => {
        if (marker !== userMarker) {
            map.removeLayer(marker);
        }
    });
    markers = markers.filter(marker => marker === userMarker);
}

// Show location status
function showLocationStatus(message, type) {
    const locationStatus = document.getElementById('location-status');
    const locationText = document.getElementById('location-text');
    
    if (locationStatus && locationText) {
        locationStatus.className = `alert alert-${type}`;
        locationStatus.classList.remove('d-none');
        locationText.textContent = message;
    }
}

// Show location error
function showLocationError(message) {
    showLocationStatus(message, 'danger');
    IntelliMed.showNotification(message, 'danger');
}

// Initialize sample data if needed
async function initializeSampleDataIfNeeded() {
    try {
        // Check if we have facilities data
        const response = await IntelliMed.api.get('/api/nearby-facilities?lat=40.7128&lng=-74.0060&radius=5&type=all');
        
        if (!response.success || response.facilities.length === 0) {
            console.log('No facilities found, may need sample data initialization');
        }
    } catch (error) {
        console.log('Could not check for existing facilities data');
    }
}

// Export functions for global use
window.mapFunctions = {
    initMap,
    findUserLocation,
    searchManualLocation,
    searchNearbyFacilities,
    showDirections
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof L !== 'undefined' && document.getElementById('map')) {
        initMap();
    }
});
