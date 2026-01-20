
async function fetchServices() {
    return await apiCall('/services');
}

async function fetchServiceDetails(serviceId) {
    return await apiCall(`/service/${serviceId}`);
}

/* ===== Handle Appointment submission =====
 */
async function submitAppointment(event, serviceId) {
    event.preventDefault();
    
    
    const appointmentId = 'APT-' + Math.floor(1000 + Math.random() * 9000);
    const clientId = 'CLI-' + Math.floor(1000 + Math.random() * 9000);
    
    const formData = new FormData(event.target);
    const appointmentData = {
        appointment_id: appointmentId,
        client_id: clientId,
        service_id: serviceId,
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        appointment_date: formData.get('appointment_date'),
        appointment_time: formData.get('appointment_time')
    };

    try {
        await apiCall('/appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });

        showMessage('Appointment booked successfully! ID: ' + appointmentId, 'success');
        event.target.reset();
        
       
        setTimeout(() => {
            closeModal();
        }, 2000); 
    } catch (error) {
        showMessage(error.message || 'Booking failed', 'error');
    }
}

/* ===== Render Service Cards on the Grid ===== */
function displayServices(services) {
    const grid = document.getElementById('servicesGrid');
    
    if (services.length === 0) {
        grid.innerHTML = '<div class="loading">No services found</div>';
        return;
    }

    grid.innerHTML = services.map(service => `
        <div class="event-card" onclick="openServiceModal('${service.service_id}')">
            <div class="event-banner" style="background-image: url('https://via.placeholder.com/400x200?text=${service.title}')"></div> 
            <div class="event-content">
                <div class="event-title">${service.title}</div>
                <div class="event-description">${service.description}</div>
                <div class="event-details">
                    <div class="event-detail">⏱️ ${service.duration_min} mins</div>
                </div>
            </div>
        </div>
    `).join('');
}

/* ===== Open Service Details Modal & Form ===== */
async function openServiceModal(serviceId) {
  try {
    const modal = document.getElementById('appointmentModal');
    const modalContent = document.getElementById('modalContent');

    modalContent.innerHTML = '<div class="loading">Loading details...</div>';
    modal.style.display = 'block';

    const service = await fetchServiceDetails(serviceId);

    modalContent.innerHTML = `
      <div class="modal-header">
        <h1 class="modal-title" style="color:#232F3E;">${service.title}</h1>
        <p style="color:#545b64; margin:10px 0;">${service.description}</p>
      </div>

      <div class="modal-body">
        <div class="section">
          <h2 class="section-title" style="border-bottom: 2px solid #FF9900;">Book an Appointment</h2>
          <form class="rsvp-form" onsubmit="submitAppointment(event, '${serviceId}')">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" name="full_name" required placeholder="Enter your full name">
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" name="email" required placeholder="email@example.com">
            </div>
             <div class="form-group">
              <label>Preferred Date *</label>
              <input type="date" name="appointment_date" required>
            </div>
             <div class="form-group">
              <label>Preferred Time *</label>
              <input type="time" name="appointment_time" required>
            </div>
            <button type="submit" class="submit-btn">Confirm Booking</button>
          </form>
        </div>
      </div>
    `;
  } catch (error) {
    document.getElementById('modalContent').innerHTML = `<div class="error">${error.message}</div>`;
  }
}


document.addEventListener('DOMContentLoaded', async () => {
    try {
        const services = await fetchServices();
        displayServices(services);
    } catch (err) {
        console.error('Initial load failed:', err);
    }
})

/* ===== Alert Message Function ===== */
function showMessage(message, type) {
    const existing = document.querySelector('.form-message');
    if (existing) existing.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    

    messageDiv.style.cssText = `padding:12px; margin:16px 0; border-radius:8px; font-weight:500; text-align:center;`;
    if (type === 'error') {
        messageDiv.style.backgroundColor = '#fef2f2'; 
        messageDiv.style.color = '#dc2626';
    } else {
        messageDiv.style.backgroundColor = '#f0fdf4'; 
        messageDiv.style.color = '#16a34a';
    }


    const form = document.querySelector('.rsvp-form');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
    } else {
        alert(message); 
    }

    if (type === 'success') {
        setTimeout(() => messageDiv.remove(), 5000);
    }
}
;