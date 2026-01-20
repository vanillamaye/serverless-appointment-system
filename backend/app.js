document.addEventListener('DOMContentLoaded', initServices);

async function initServices() {
    try {
        await loadServices();
    } catch (error) {
        const grid = document.getElementById('servicesGrid');
        if (grid) {
            grid.innerHTML = `<div class="error">Error loading services: ${error.message}</div>`;
        }
    }
}

async function loadServices() {
    const services = await fetchServices(); 
    displayServices(services);
}

async function fetchServices() {
    return await apiCall('/services'); 
}


function displayServices(services) {
    const grid = document.getElementById('servicesGrid');
    
    if (!grid) return;

    if (services.length === 0) {
        grid.innerHTML = '<div class="loading">No services found.</div>';
        return;
    }


    grid.innerHTML = services.map(service => `
        <div class="event-card" onclick="openServiceModal('${service.service_id}')">
            <div class="event-banner" style="background-image: url('https://via.placeholder.com/400x200?text=${service.title}')"></div> 
            <div class="event-content">
                <div class="event-title">${service.title}</div>
                <div class="event-description">${service.description || 'Professional service for you.'}</div>
                <div class="event-details">
                    <div class="event-detail">⏱️ <span>${service.duration_min} mins</span></div>
                </div>
            </div>
        </div>
    `).join('');
}