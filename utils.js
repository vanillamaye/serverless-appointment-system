
const API_BASE_URL = "your url";


function formatDate(dateString) {
    if (!dateString) return 'No Date Set';
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    if (!timeString) return 'Time TBA';
  
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function closeModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) modal.style.display = 'none';
}


window.onclick = function(event) {
    const modal = document.getElementById('appointmentModal');
    if (event.target === modal) {
        closeModal();
    }
}

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            const errorMessage = data.message || `API error: ${response.status}`;
            throw new Error(errorMessage);
        }
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}