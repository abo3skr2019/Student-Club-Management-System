function showTab(tabId) {
    document.querySelectorAll('.content-tab').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
}
